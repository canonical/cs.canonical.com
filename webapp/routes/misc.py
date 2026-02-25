import json
from flask import abort, Blueprint, current_app, request
from flask_pydantic import validate
from webapp.helper import get_or_create_user_id, get_user_from_directory_by_key
import requests
from webapp.models import db, User
from webapp.schemas import NotifyBAUModel

misc_blueprint = Blueprint("misc", __name__, url_prefix="/api")


@misc_blueprint.route("/notify-bau", methods=["POST"])
@validate()
def notify_bau(body: NotifyBAUModel):
    """Trigger MM bot to notify the assignee of a BAU task on MM.

    Args:
        body (NotifyBAUModel): The request body containing the Jira task ID.
    """

    auth_header = request.headers.get("Authorization")
    auth_token = f"token {current_app.config['CS_AUTH_TOKEN']}"
    if not auth_header or auth_header != auth_token:
        abort(401, description="Unauthorized")

    assignee = current_app.config["JIRA"].get_issue_assignee(body.jira_task_id)
    if not assignee:
        abort(404, description="JIRA task not found or has no assignee")

    assignee_email = (
        assignee.get("fields", {}).get("assignee", {}).get("emailAddress")
    )

    # find user from database first
    user = User.query.filter_by(email=assignee_email).first()
    if not user or not user.mattermost:
        response = get_user_from_directory_by_key("email", assignee_email)
        if response.status_code != 200:
            abort(404, description="User not found")
        user_data = response.json().get("data", {}).get("employees", [])[0]
        user = get_or_create_user_id(user_data, return_obj=True)

        if not user.mattermost:
            user.mattermost = user_data.get("mattermost")
            db.session.commit()

    jira_base = current_app.config["JIRA_URL"]
    task_id = body.jira_task_id
    task_url = f"{jira_base}/browse/{task_id}"

    response = requests.request(
        "POST",
        current_app.config["BAU_BOT_WEBHOOK_URL"],
        data=json.dumps(
            {
                "text": (
                    f"Hi {user.name},\n"
                    f"You have been assigned a BAU task [{task_id}]"
                    f"({task_url}).\n"
                    f"Please check the task details "
                    f"and take necessary actions."
                ),
                "channel": f"@{user.mattermost}",
            }
        ),
    )

    if response.status_code != 200:
        abort(
            response.status_code,
            description=f"BAU notification failed: {response.text}",
        )

    return "OK", 200
