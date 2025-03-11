from flask import Blueprint, current_app, jsonify
from flask_pydantic import validate

from webapp.models import (
    Product,
    Project,
    Webpage,
    WebpageProduct,
    db,
    get_or_create,
)
from webapp.schemas import SetProductsModel
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
        product_list.append({
            "id": product.id,
            "name": product.name
        })
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
        existing_products = WebpageProduct.query.filter_by(
            webpage_id=webpage_id
        )
        for p in existing_products:
            db.session.delete(p)
        db.session.commit()

        # Set new products for the webpage
        for product_id in product_ids:
            get_or_create(
                db.session,
                WebpageProduct,
                webpage_id=webpage_id,
                product_id=product_id
            )

        project = Project.query.filter_by(id=webpage.project_id).first()
        site_repository = SiteRepository(project.name, current_app)
        # clean the cache for a new product to appear in the tree
        site_repository.invalidate_cache()

    return jsonify({"message": "Successfully set product"}), 200
