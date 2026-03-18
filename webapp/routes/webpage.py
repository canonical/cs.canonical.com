from flask import Blueprint, current_app, jsonify, request
import yaml
from flask_pydantic import validate
from pathlib import Path

from webapp.helper import get_or_create_user_id
from webapp.models import (
    Asset,
    Project,
    Reviewer,
    Webpage,
    WebpageAsset,
    db,
    get_or_create,
)
from webapp.schemas import GetWebpageAssetsModel, UpdatePageDetailsModel
from webapp.site_repository import SiteRepository
from webapp.settings import BASE_DIR
from webapp.sso import login_required

webpage_blueprint = Blueprint("webpage", __name__, url_prefix="/api")

with open(Path(BASE_DIR) / "data/sites.yaml", "r") as f:
    sites = yaml.safe_load(f).get("sites", [])


@webpage_blueprint.route("/update-page-details", methods=["POST"])
@login_required
@validate()
def update_page_details(body: UpdatePageDetailsModel):
    webpage = Webpage.query.filter_by(id=body.webpage_id).first()

    if not webpage:
        return jsonify({"error": "Webpage not found"}), 404

    if body.owner is not None:
        user_id = get_or_create_user_id(body.owner.model_dump())
        webpage.owner_id = user_id

    if body.reviewers is not None:
        existing_reviewers = Reviewer.query.filter_by(
            webpage_id=body.webpage_id).all()
        for reviewer in existing_reviewers:
            db.session.delete(reviewer)
        db.session.flush()

        for reviewer in body.reviewers:
            user_id = get_or_create_user_id(reviewer.model_dump())
            get_or_create(
                db.session,
                Reviewer,
                user_id=user_id,
                webpage_id=body.webpage_id,
            )

    if body.copy_doc_link is not None:
        webpage.copy_doc_link = body.copy_doc_link

    if body.figma_link is not None:
        webpage.figma_link = body.figma_link

    db.session.commit()

    project = Project.query.filter_by(id=webpage.project_id).first()
    site_repository = SiteRepository(project.name, current_app)
    site_repository.invalidate_cache()

    return jsonify({"message": "Successfully updated page details"}), 200


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
        url=webpage_url, project_id=project.id).first()

    if not webpage:
        return jsonify({"error": "Webpage not found"}), 404

    page = request.values.get("page", type=int, default=1)
    per_page = request.values.get("per_page", type=int, default=12)

    query = (
        db.session.query(Asset)
        .join(WebpageAsset, WebpageAsset.asset_id == Asset.id)
        .filter(WebpageAsset.webpage_id == webpage.id)
        .order_by(Asset.id)  # Optional, but good for consistent pagination
        .distinct()  # If join might cause duplicate Asset rows
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


@webpage_blueprint.route("/get-webpage-stats", methods=["GET"])
@login_required
def get_page_stats():
    project_name = request.args.get(
        "project", type=str, default="").strip().lower()
    if not project_name or project_name not in sites:
        return jsonify({"error": "Please provide a valid project"}), 400

    project = Project.query.filter_by(name=project_name).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    webpage_url = request.args.get("url", type=str, default="").strip().lower()
    if not webpage_url or webpage_url == "/":
        webpage_url = ""

    webpage = Webpage.query.filter_by(
        url=webpage_url, project_id=project.id).first()
    if not webpage:
        return jsonify({"error": "Webpage not found"}), 404

    stats = current_app.config["CACHE"].get("PAGE_STATS_CACHE") or {}
    stats_data = stats.get(project_name, {})
    page_stats = stats_data.get(
        f"https://{project_name}{webpage_url or '/'}", {})

    stats = {
        "last_updated": page_stats.get(
            current_app.config["STATS_SCHEMA"]["last_updated"], "N/A"
        ),
        "readability_score": page_stats.get(
            current_app.config["STATS_SCHEMA"]["readability_score"], "N/A"
        ),
        "accessibility_score": page_stats.get(
            current_app.config["STATS_SCHEMA"]["accessibility_score"], "N/A"
        ),
        "link_count": page_stats.get(
            current_app.config["STATS_SCHEMA"]["link_count"], "N/A"
        ),
        "copy_errors": page_stats.get(
            current_app.config["STATS_SCHEMA"]["copy_errors"], "N/A"
        ),
        "prohibited_words": page_stats.get(
            current_app.config["STATS_SCHEMA"]["prohibited_words"], "N/A"
        ).split(", "),
    }

    return jsonify(stats), 200
