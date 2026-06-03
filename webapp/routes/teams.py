from flask import Blueprint, current_app, jsonify

from webapp.helper import get_teams_from_directory
from webapp.sso import login_required

teams_blueprint = Blueprint("teams", __name__, url_prefix="/api")


@teams_blueprint.route("/get-teams", methods=["GET"])
@login_required
def get_teams():
    response = get_teams_from_directory()

    if response.status_code == 200:
        employees = response.json().get("data", {}).get("employees", [])
        teams = sorted(set(
            e["product"] for e in employees if e.get("product")
        ))
        return jsonify([{"name": t} for t in teams])
    else:
        current_app.logger.error(
            "Directory API error fetching teams: %s %s",
            response.status_code,
            response.content,
        )
        return (
            jsonify({"error": f"Failed to fetch teams\n {response.content}"}),
            response.status_code,
        )
