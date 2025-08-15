from flask import Blueprint, jsonify
from flask_pydantic import validate

from webapp.models import Project, Webpage
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
        url=webpage_url, project_id=project.id
    ).first()

    if not webpage:
        return jsonify({"error": "Webpage not found"}), 404

    webpage_assets = webpage.assets

    return (
        jsonify({"assets": [asset.to_dict() for asset in webpage_assets]}),
        200,
    )
