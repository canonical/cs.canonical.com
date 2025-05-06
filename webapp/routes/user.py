from flask import Blueprint, current_app, jsonify, request, session
import os

from webapp.helper import get_or_create_user_id, get_user_from_directory_by_key
from webapp.models import (
    Project,
    Reviewer,
    User,
    Webpage,
    db,
    get_or_create,
)
from webapp.site_repository import SiteRepository
from webapp.sso import login_required

DISABLE_SSO = os.environ.get("DISABLE_SSO") or os.environ.get(
    "FLASK_DISABLE_SSO"
)

user_blueprint = Blueprint("user", __name__, url_prefix="/api")


@user_blueprint.route("/get-users", methods=["GET"])
@user_blueprint.route("/get-users/<username>", methods=["GET"])
@login_required
def get_users(username: str = None):
    if not username:
        response = get_user_from_directory_by_key("", "")
    else:
        response = get_user_from_directory_by_key("name", username)

    if response.status_code == 200:
        users = response.json().get("data", {}).get("employees", [])
        return jsonify(list(users))
    else:
        return (
            jsonify({"error": f"Failed to fetch users\n {response.content}"}),
            response.status_code,
        )


@user_blueprint.route("/set-reviewers", methods=["POST"])
@login_required
def set_reviewers():
    data = request.get_json()

    users = data.get("user_structs")
    webpage_id = data.get("webpage_id")

    user_ids = []
    for user in users:
        user_ids.append(get_or_create_user_id(user))

    # Remove all existing reviewers for the webpage
    existing_reviewers = Reviewer.query.filter_by(webpage_id=webpage_id).all()
    for reviewer in existing_reviewers:
        db.session.delete(reviewer)
    db.session.commit()

    # Create new reviewer rows
    for user_id in user_ids:
        get_or_create(
            db.session, Reviewer, user_id=user_id, webpage_id=webpage_id
        )

    webpage = Webpage.query.filter_by(id=webpage_id).first()
    project = Project.query.filter_by(id=webpage.project_id).first()
    site_repository = SiteRepository(project.name, current_app)
    # clean the cache for a the new reviewers to appear in the tree
    site_repository.invalidate_cache()

    return jsonify({"message": "Successfully set reviewers"}), 200


@user_blueprint.route("/set-owner", methods=["POST"])
@login_required
def set_owner():
    data = request.get_json()

    user = data.get("user_struct")
    webpage_id = data.get("webpage_id")
    user_id = get_or_create_user_id(user)

    # Set owner_id of the webpage to the user_id
    webpage = Webpage.query.filter_by(id=webpage_id).first()
    if webpage:
        webpage.owner_id = user_id
        db.session.commit()

        project = Project.query.filter_by(id=webpage.project_id).first()
        site_repository = SiteRepository(project.name, current_app)
        # clean the cache for a new owner to appear in the tree
        site_repository.invalidate_cache()

    return jsonify({"message": "Successfully set owner"}), 200


@user_blueprint.route("/current-user", methods=["GET"])
@login_required
def current_user():
    if DISABLE_SSO:
        return (jsonify({}), 200)
    user = User.query.filter_by(email=session["openid"]["email"]).first()
    if not user:
        return jsonify({"error": "Currently logged in user not found"}), 404
    return (
        jsonify(
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "team": user.team,
                "department": user.department,
                "jobTitle": user.job_title,
            }
        ),
        200,
    )
