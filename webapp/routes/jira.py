import re
from flask import Blueprint, current_app, jsonify, abort, request, g
from flask_pydantic import validate
import os

from webapp.enums import JiraStatusTransitionCodes
from webapp.helper import (
    convert_webpage_to_dict,
    create_copy_doc,
    create_jira_task,
    get_or_create_user_id,
    get_project_id,
    get_webpage_id,
)
from webapp.models import (
    JiraTask,
    JIRATaskStatus,
    JiraTaskType,
    Project,
    Reviewer,
    User,
    Webpage,
    WebpageProduct,
    WebpageStatus,
    db,
    get_or_create,
)
from webapp.schemas import (
    AttachJiraWithWebpageReq,
    ChangesRequestModel,
    CreatePageModel,
    FindWebpageByCopydoc,
    PlaywrightCleanupReqBody,
    RemoveWebpageModel,
    ReportBugModel,
    RequestFeatureModel,
)
from webapp.site_repository import SiteRepository
from webapp.sso import login_required

jira_blueprint = Blueprint("jira", __name__, url_prefix="/api")


@jira_blueprint.before_request
def skip_csrf_for_playwright_cleanup():
    """Skip CSRF validation for playwright-cleanup endpoint"""
    if request.endpoint == "jira.playwright_cleanup":
        g._csrf_disabled = True


@jira_blueprint.route("/request-changes", methods=["POST"])
@login_required
@validate()
def request_changes(body: ChangesRequestModel):
    # Make a request to JIRA to create a task
    try:
        params = body.model_dump()
        task = create_jira_task(current_app, params)

        # clean the cache for a new Jira task to appear in the tree
        webpage = Webpage.query.filter_by(id=params["webpage_id"]).first()
        invalidate_cache(webpage)
    except Exception as e:
        return jsonify(str(e)), 500

    return (
        jsonify(
            {
                "message": "Task created successfully",
                "jira_task_id": task.jira_id,
            }
        ),
        200,
    )


@jira_blueprint.route("/get-jira-tasks/<webpage_id>", methods=["GET"])
def get_jira_tasks(webpage_id: int):
    jira_tasks = (
        JiraTask.query.filter_by(webpage_id=webpage_id)
        .order_by(JiraTask.created_at)
        .all()
    )
    if jira_tasks:
        tasks = []
        for task in jira_tasks:
            tasks.append(
                {
                    "id": task.id,
                    "jira_id": task.jira_id,
                    "status": task.status,
                    "webpage_id": task.webpage_id,
                    "user_id": task.user_id,
                    "created_at": task.created_at,
                }
            )
        return jsonify(tasks), 200
    else:
        return jsonify({"error": "Failed to fetch Jira tasks"}), 500


@jira_blueprint.route("/request-removal", methods=["POST"])
@validate()
@login_required
def remove_webpage(body: RemoveWebpageModel):
    """
    Remove a webpage based on its status.
    This function handles removal of a webpage from the system.
    If the webpage is new and not in the codebase,
    it deletes the webpage and associated
    reviewer records from the database.
    If the webpage pre-exists, it creates Jira task to remove
    the webpage from code repository and updates the webpage
    status to "TO_DELETE".
    Args:
        body (RemoveWebpageModel): The model containing
            the details of the webpage to be removed.
    Returns:
        Response: A JSON response indicating the result
                of the operation.
        - If the webpage is not found, returns a 404 error
            with a message.
        - If the webpage is successfully deleted or a task
            is created,returns a 200 status with
            a success message.
        - If there is an error during deletion,
            returns a 500 error with a message.
    """
    try:
        webpage_id = body.webpage_id

        webpage = Webpage.query.filter(Webpage.id == webpage_id).one_or_none()
        if webpage is None:
            return jsonify({"error": "webpage not found"}), 404

        reporter_id = get_or_create_user_id(body.reporter_struct)

        if webpage.status == WebpageStatus.NEW:
            try:
                jira_tasks = JiraTask.query.filter_by(
                    webpage_id=webpage_id
                ).all()
                if jira_tasks:
                    for task in jira_tasks:
                        status_change = current_app.config[
                            "JIRA"
                        ].change_issue_status(
                            issue_id=task.jira_id,
                            transition_id=(
                                JiraStatusTransitionCodes.REJECTED.value
                            ),
                        )
                        if status_change["status_code"] != 204:
                            return (
                                jsonify(
                                    {
                                        "error": f"failed to change status of Jira task {task.jira_id}"  # noqa
                                    }
                                ),
                                500,
                            )
                        JiraTask.query.filter_by(id=task.id).delete()

                Reviewer.query.filter_by(webpage_id=webpage_id).delete()
                db.session.delete(webpage)
                db.session.commit()

            except Exception as e:
                current_app.logger.info(
                    e, "Error deleting webpage from the database"
                )
                return jsonify({"error": "unable to delete the webpage"}), 500

            # clean the cache for a page to be removed from the tree
            invalidate_cache(webpage)

            return (
                jsonify({"message": "Webpage has been removed successfully"}),
                200,
            )

        if webpage.status in [
            WebpageStatus.AVAILABLE,
            WebpageStatus.TO_DELETE,
        ]:
            # check if there's already a pending removal request
            jira_task = (
                JiraTask.query.filter_by(
                    webpage_id=webpage_id,
                    request_type=JiraTaskType.PAGE_REMOVAL,
                )
                .filter(JiraTask.status != JIRATaskStatus.REJECTED)
                .one_or_none()
            )
            if jira_task:
                return (
                    jsonify(
                        {
                            "error": "Jira task already exists",
                            "description": (
                                "Please reject or complete the existing task "
                                "before creating a new one"
                            ),
                        }
                    ),
                    400,
                )

            if not (
                reporter_id
                and User.query.filter_by(id=reporter_id).one_or_none()
            ):
                return (
                    jsonify({"error": "provided parameters are incorrect"}),
                    400,
                )
            task_details = {
                "webpage_id": webpage_id,
                "due_date": body.due_date,
                "reporter_struct": body.reporter_struct,
                "description": body.description,
                "type": None,
                "summary": (
                    f"Remove {webpage.name} webpage from code repository"
                ),
                "request_type": body.request_type,
            }
            if body.redirect_url:
                task_details[
                    "summary"
                ] += f" and redirect to {body.redirect_url}"
            task = create_jira_task(current_app, task_details)
            Webpage.query.filter_by(id=webpage_id).update(
                {"status": WebpageStatus.TO_DELETE.value}
            )
            db.session.commit()

        # clean the cache for a page to be removed from the tree
        invalidate_cache(webpage)

        return (
            jsonify(
                {
                    "message": (
                        f"removal of {webpage.name} processed successfully"
                    ),
                    "jira_task_id": task.jira_id,
                }
            ),
            200,
        )
    except Exception as error:
        current_app.logger.info(f"Unable to remove webpage: {error}")
        return (
            jsonify(
                {
                    "error": f"removal of {webpage.name} failed",
                    "description": str(error),
                }
            ),
            400,
        )


@jira_blueprint.route("/create-page", methods=["POST"])
@login_required
@validate()
def create_page(body: CreatePageModel):
    data = body.model_dump()

    owner_id = (
        get_or_create_user_id(data["owner"]) if data["owner"] else 1
    )  # ID of default user

    product_ids = data["product_ids"]

    # Create new webpage
    project_id = get_project_id(data["project"])
    new_webpage = get_or_create(
        db.session,
        Webpage,
        True,
        project_id=project_id,
        name=data["name"],
        url=data["name"],
        parent_id=get_webpage_id(data["parent"], project_id),
        owner_id=owner_id,
        status=WebpageStatus.NEW,
        content_jira_id=data["content_jira_id"],
        copy_doc_link=data["copy_doc_link"],
    )

    # Create new reviewer rows
    for reviewer in data["reviewers"]:
        reviewer_id = get_or_create_user_id(reviewer)
        get_or_create(
            db.session,
            Reviewer,
            user_id=reviewer_id,
            webpage_id=new_webpage[0].id,
        )

    copy_doc = data["copy_doc_link"]
    if not copy_doc:
        copy_doc = create_copy_doc(current_app, new_webpage[0])
        new_webpage[0].copy_doc_link = copy_doc
        db.session.commit()

    # Set products for the webpage
    for product_id in product_ids:
        get_or_create(
            db.session,
            WebpageProduct,
            webpage_id=new_webpage[0].id,
            product_id=product_id,
        )

    if data["content_jira_id"]:
        jira = current_app.config["JIRA"]
        jira.link_copydoc_with_content_page(copy_doc, data["content_jira_id"])

    invalidate_cache(new_webpage[0])
    return (
        jsonify(
            {
                "webpage": convert_webpage_to_dict(
                    new_webpage[0],
                    new_webpage[0].owner,
                    new_webpage[0].project,
                )
            }
        ),
        201,
    )


def invalidate_cache(webpage: Webpage):
    project = Project.query.filter_by(id=webpage.project_id).first()
    site_repository = SiteRepository(project.name, current_app)
    # clean the cache for a page changes to be reflected
    site_repository.invalidate_cache()
    return True


@jira_blueprint.route("/playwright-cleanup", methods=["POST"])
@login_required
@validate()
def playwright_cleanup(body: PlaywrightCleanupReqBody):
    # Only allow this endpoint in debug/test mode
    if not os.getenv("FLASK_DEBUG"):
        abort(404)

    jira = current_app.config["JIRA"]
    jira_tasks = body.jira_tasks

    payload = {
        "bulkTransitionInputs": [
            {
                "selectedIssueIdsOrKeys": jira_tasks,
                "transitionId": JiraStatusTransitionCodes.REJECTED.value,
            }
        ],
        "sendBulkNotification": False,
    }

    bulk_reject = jira.bulk_change_issue_status(payload)
    if bulk_reject:
        for jira_task_id in jira_tasks:
            jira.unlink_parent_issue(jira_task_id)
            task = JiraTask.query.filter_by(jira_id=jira_task_id).one_or_none()
            if task:
                JiraTask.query.filter_by(id=task.id).delete()
                webpage = Webpage.query.filter_by(id=task.webpage_id).first()
                if webpage:
                    invalidate_cache(webpage)

    db.session.commit()
    return jsonify({"message": "Tasks cleaned up successfully"}), 200


@jira_blueprint.route("/attach-jira-with-webpage", methods=["POST"])
@validate()
def attach_jira_with_webpage(body: AttachJiraWithWebpageReq):
    """
    Attach a JIRA task to a webpage.
    This function creates a new entry in jira_tasks table with the provided
    copy_doc_link, jira_id and associated webpage.
    Args:
        body (dict): The request body containing the copy_doc_link, jira_id
        and summary.
    Returns:
        Response: A JSON response indicating the result of the operation.
        - If successful, returns a 200 status with a success message.
        - If there is an error, returns a 500 error with a message.
    """
    try:
        copy_doc_link = body.copy_doc_link
        jira_id = body.jira_id
        summary = body.summary

        webpage, error, status_code = find_webpage_by_copydoc(copy_doc_link)

        if error:
            return jsonify({"error": error}), status_code

        # Create jira task in the database
        jira_task, _ = get_or_create(
            db.session,
            JiraTask,
            jira_id=jira_id,
            webpage_id=webpage.id,
            user_id=webpage.owner_id,
            summary=summary,
        )

        # clean the cache for a new Jira task to appear in the tree
        invalidate_cache(webpage)

        return jsonify({"message": "Jira task attached successfully"}), 200
    except Exception as e:
        current_app.logger.error(
            f"Error attaching JIRA task with webpage: {e}"
        )
        return jsonify({"error": "Failed to attach JIRA task"}), 500


@jira_blueprint.route("/find-page-by-copydoc", methods=["POST"])
@validate()
def find_page_by_copydoc(body: FindWebpageByCopydoc):
    """
    Find a webpage by its copy doc link.
    Args:
        body (dict): The request body containing the copy_doc_link.
    Returns:
        Response: A JSON response with the found webpage or an error message.
    """
    copy_doc_link = body.copy_doc_link
    webpage, error, status_code = find_webpage_by_copydoc(copy_doc_link)

    if error:
        return jsonify({"error": error}), status_code

    return ({"webpage": webpage.name}, status_code)


def find_webpage_by_copydoc(copy_doc_link: str):
    """
    Extracts the Google Doc ID from a copy doc link and finds the associated
    webpage.

    Args:
        copy_doc_link (str): The link to the Google Doc.

    Returns:
        tuple: (webpage object or None, error message or None, status code of
        400, 404 or 200)
    """
    match = re.search(r"/d/([a-zA-Z0-9_-]+)", copy_doc_link)
    google_doc_id = match.group(1) if match else None

    if not google_doc_id:
        return None, "Please provide a valid copydoc link", 400

    webpage = Webpage.query.filter(
        Webpage.copy_doc_link.ilike(f"%/d/{google_doc_id}%")
    ).first()

    if not webpage:
        return None, "Webpage by given copydoc not found", 404

    return webpage, None, 200


@jira_blueprint.route("/report-bug", methods=["POST"])
@validate()
def report_bug(body: ReportBugModel):
    """Create a bug task on Jira

    Args:
        body (ReportBugModel): The model containing the details of
            the bug to be reported.

    Returns:
        Response: A JSON response indicating the result of the operation.
    """
    try:
        jira = current_app.config["JIRA"]
        user_id = get_or_create_user_id(body.reporter_struct)
        reporter_jira_id = jira.get_reporter_jira_id(user_id)
        issue = jira.create_task(
            due_date=body.due_date,
            reporter_jira_id=reporter_jira_id,
            issue_type=jira.BUG,
            description=body.description,
            summary=f"{body.website} - {body.summary}",
            parent=jira.sites_maintenance_epic,
            labels=current_app.config["SITES_MAINTENANCE_LABELS"].split(","),
        )

        return jsonify({"issue": issue}), 200
    except Exception as error:
        current_app.logger.info(f"Failed to report a bug: {error}")
        return (
            jsonify(
                {
                    "error": "Bug report failed",
                    "description": str(error),
                }
            ),
            400,
        )


@jira_blueprint.route("/request-feature", methods=["POST"])
@validate()
def request_feature(body: RequestFeatureModel):
    """Create a feature request epic on Jira

    Args:
        body (RequestFeatureModel): The model containing the details of
            the feature request to be submitted.

    Returns:
        Response: A JSON response indicating the result of the operation.
    """
    try:
        jira = current_app.config["JIRA"]
        user_id = get_or_create_user_id(body.reporter_struct)
        reporter_jira_id = jira.get_reporter_jira_id(user_id)
        issue = jira.create_task(
            summary=body.summary,
            issue_type=jira.EPIC,
            description=body.description,
            due_date=body.due_date,
            reporter_jira_id=reporter_jira_id,
            labels=current_app.config["SITES_NEW_FEATURES_LABELS"].split(","),
            parent=None,
            custom_fields={
                # Acceptance criteria field
                "customfield_10614": {
                    "content": [
                        {
                            "content": [
                                {
                                    "text": body.objective,
                                    "type": "text",
                                }
                            ],
                            "type": "paragraph",
                        }
                    ],
                    "type": "doc",
                    "version": 1,
                },
            },
        )

        return jsonify({"issue": issue}), 200
    except Exception as error:
        current_app.logger.info(f"Failed to submit feature request: {error}")
        return (
            jsonify(
                {
                    "error": "Feature request failed",
                    "description": str(error),
                }
            ),
            400,
        )
