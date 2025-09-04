import logging

from flask import Blueprint, current_app, jsonify
from flask_pydantic import validate
from slugify import slugify

from webapp.sso import is_admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from webapp.models import (
    Product,
    Project,
    Webpage,
    WebpageProduct,
    db,
    get_or_create,
)
from webapp.schemas import SetProductsModel, AddProductModel
from webapp.site_repository import SiteRepository
from webapp.sso import login_required

product_blueprint = Blueprint("product", __name__, url_prefix="/api")


# Returns all products
@product_blueprint.route("/get-products", methods=["GET"])
@login_required
def get_products():
    products = Product.query.all()
    product_list = []
    for product in products:
        product_list.append({"id": product.id, "name": product.name})
    return jsonify(product_list)


# Sets a product(s) on a specific webpage
@product_blueprint.route("/set-product", methods=["POST"])
@validate()
@login_required
def set_product(body: SetProductsModel):
    webpage_id = body.webpage_id
    product_ids = body.product_ids

    webpage = Webpage.query.filter_by(id=webpage_id).first()

    if webpage:
        # Remove previous products that were set for the webpage
        existing_products = WebpageProduct.query.filter_by(webpage_id=webpage_id)
        for p in existing_products:
            db.session.delete(p)
        db.session.commit()

        # Set new products for the webpage
        for product_id in product_ids:
            get_or_create(
                db.session,
                WebpageProduct,
                webpage_id=webpage_id,
                product_id=product_id,
            )

        project = Project.query.filter_by(id=webpage.project_id).first()
        site_repository = SiteRepository(project.name, current_app)
        # clean the cache for a new product to appear in the tree
        site_repository.invalidate_cache()

    return jsonify({"message": "Successfully set product"}), 200


# Add a product
@product_blueprint.route("/product", methods=["POST"])
@validate()
# @is_admin
# @login_required
def add_product(body: AddProductModel):
    product_slug = slugify(body.name, separator="_")
    print("work is going on", product_slug)
    if not product_slug:
        return jsonify({"error": "Invalid product name"}), 400

    if Product.query.filter_by(slug=product_slug).first():
        return jsonify({"error": "Product with this name already exists"}), 400

    product = Product(name=body.name.strip(), slug=product_slug)

    try:
        db.session.add(product)
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Product added successfully",
                    "product": {
                        "id": product.id,
                        "name": product.name,
                    },
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        logger.exception("Error adding product")
        return jsonify({"error": "Internal Server Error"}), 500


# Edit a product
@product_blueprint.route("/product/<int:product_id>", methods=["PUT"])
@validate()
# @is_admin
# @login_required
def edit_product(product_id: int, body: AddProductModel):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    new_slug = slugify(body.name, separator="-")

    if Product.query.filter(Product.slug == new_slug, Product.id != product_id).first():
        return jsonify({"error": "Another product with this name already exists"}), 400

    product.name = body.name.strip()
    product.slug = new_slug

    try:
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Product updated successfully",
                    "product": {
                        "id": product.id,
                        "name": product.name,
                    },
                }
            ),
            200,
        )
    except Exception as e:
        db.session.rollback()
        logger.exception("Error updating product")
        return jsonify({"error": "Internal Server Error"}), 500


# delete a product
@product_blueprint.route("/product/<int:product_id>", methods=["DELETE"])
# @is_admin
# @login_required
def delete_product(product_id: int):
    product = Product.query.filter_by(id=product_id).first()

    if not product:
        return jsonify({"error": "Product not found"}), 404

    try:
        db.session.delete(product)
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Product deleted successfully",
                    "product": {
                        "id": product.id,
                        "name": product.name,
                    },
                }
            ),
            200,
        )
    except Exception as e:
        db.session.rollback()
        logger.error("Error occurred while deleting product: %s", str(e))
        return jsonify({"error": "Internal Server Error"}), 500
