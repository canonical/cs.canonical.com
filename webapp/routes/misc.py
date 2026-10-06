import json
from flask import abort, Blueprint, current_app, request
from flask_pydantic import validate
from webapp.helper import get_or_create_user_id, get_user_from_directory_by_key
import requests
from webapp.models import db, User
from webapp.schemas import NotifyBauerModel, NotifyBAUModel

misc_blueprint = Blueprint("misc", __name__, url_prefix="/api")


def _check_cs_auth():
    auth_header = request.headers.get("Authorization")
    auth_token = f"token {current_app.config['CS_AUTH_TOKEN']}"
    if not auth_header or auth_header != auth_token:
        abort(401, description="Unauthorized")


def _resolve_assignee_and_user(jira_task_id):
    """Look up a Jira issue's assignee fields and matching app User."""
    assignee = current_app.config["JIRA"].get_issue_assignee(jira_task_id)
    if not assignee:
        abort(404, description="JIRA task not found or has no assignee")

    assignee_fields = assignee.get("fields", {}).get("assignee", {})
    assignee_email = assignee_fields.get("emailAddress")

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

    return assignee_fields, user


def _send_mattermost_message(text, mattermost_handle):
    response = requests.request(
        "POST",
        current_app.config["BAU_BOT_WEBHOOK_URL"],
        data=json.dumps(
            {
                "text": text,
                "channel": f"@{mattermost_handle}",
            }
        ),
    )

    if response.status_code != 200:
        abort(
            response.status_code,
            description=f"MM notification failed: {response.text}",
        )


@misc_blueprint.route("/notify-bau", methods=["POST"])
@validate()
def notify_bau(body: NotifyBAUModel):
    """Trigger MM bot to notify the assignee of a BAU task on MM.

    Args:
        body (NotifyBAUModel): The request body containing the Jira task ID.
    """

    _check_cs_auth()

    _, user = _resolve_assignee_and_user(body.jira_task_id)

    jira_base = current_app.config["JIRA_URL"]
    task_id = body.jira_task_id
    task_url = f"{jira_base}/browse/{task_id}"

    _send_mattermost_message(
        (
            f"Hi {user.name},\n"
            f"You have been assigned a BAU task [{task_id}]"
            f"({task_url}).\n"
            f"Please check the task details "
            f"and take necessary actions."
        ),
        user.mattermost,
    )

    return "OK", 200


@misc_blueprint.route("/notify-bauer", methods=["POST"])
@validate()
def notify_bauer(body: NotifyBauerModel):
    """Trigger MM bot to notify the assignee that Bauer opened a GitHub issue.

    Args:
        body (NotifyBauerModel): The request body containing the Jira task
            ID and the Bauer-created GitHub issue URL.
    """

    _check_cs_auth()

    assignee_fields, user = _resolve_assignee_and_user(body.jira_task_id)
    display_name = assignee_fields.get("displayName")

    _send_mattermost_message(
        (
            f"Hi {display_name},\n\n"
            f"Bauer has created a GitHub issue to apply the doc "
            f"suggestions for {body.jira_task_id}:\n\n"
            f"{body.bauer_issue_url}\n\n"
            f"GitHub Copilot has been assigned and will open a pull "
            f"request against this issue shortly.\n\n"
            f"Watch the issue above for the linked PR once it's ready "
            f"for review."
        ),
        user.mattermost,
    )

    return "OK", 200
