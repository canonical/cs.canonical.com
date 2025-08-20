from flask import Blueprint, jsonify, request
from flask_pydantic import validate

from webapp.models import Asset, Project, Webpage, WebpageAsset, db
from webapp.schemas import GetWebpageAssetsModel
from webapp.sso import login_required


webpage_blueprint = Blueprint("webpage", __name__, url_prefix="/api")


@webpage_blueprint.route("/get-webpage-assets", methods=["POST"])
@login_required
@validate()
def get_webpage_assets(body: GetWebpageAssetsModel):
    webpage_url = body.webpage_url
    project_name = body.project_name

    project = Project.query.filter_by(name=project_name).first()

    if not project:
        return jsonify({"error": "Project not found"}), 404

    webpage = Webpage.query.filter_by(
        url=webpage_url,
        project_id=project.id
    ).first()

    if not webpage:
        return jsonify({"error": "Webpage not found"}), 404

    page = request.values.get("page", type=int, default=1)
    per_page = request.values.get("per_page", type=int, default=12)

    query = (
        db.session.query(Asset)
        .join(WebpageAsset, WebpageAsset.asset_id == Asset.id)
        .filter(WebpageAsset.webpage_id == webpage.id)
        .order_by(Asset.id)  # Optional, but good for consistent pagination
    )

    total = query.count()
    assets = query.offset((page - 1) * per_page).limit(per_page).all()

    return (
        jsonify(
            {
                "assets": [asset.to_dict() for asset in assets],
                "page": page,
                "page_size": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
            }
        ),
        200,
    )
