import json

from flask import Blueprint, Response, jsonify
from flask_pydantic import validate
from ruamel.yaml import YAMLError

from webapp.github import GithubError
from webapp.releases_manager import MergeConflictError, ReleasesService
from webapp.schemas import UpdateReleasesRequest
from webapp.sso import SSO_RELEASE_TEAM, login_required, requires_team

releases_blueprint = Blueprint("releases", __name__, url_prefix="/api")

releases_service = ReleasesService()


@releases_blueprint.route(
    "/get-releases",
    methods=["GET"],
)
@login_required
@requires_team(SSO_RELEASE_TEAM)
def get_releases_yaml():
    try:
        data = releases_service.get_releases_data()
    except (YAMLError, GithubError) as e:
        return Response(
            response=json.dumps(
                {
                    "type": "about:blank",
                    "title": "Failed to fetch releases",
                    "detail": str(e),
                    "status": 500,
                }
            ),
            status=500,
            mimetype="application/json",
        )

    response = Response(
        response=json.dumps(data, sort_keys=False, indent=4),
        status=200,
        mimetype="application/json",
    )
    response.cache_control.no_store = True
    return response


@releases_blueprint.route(
    "/update-releases",
    methods=["POST"],
)
@login_required
@requires_team(SSO_RELEASE_TEAM)
@validate()
def update_releases_yaml(body: UpdateReleasesRequest):
    try:
        result = releases_service.update_releases_workflow(
            json.dumps(body.releases), body.commit_message
        )
    except (ValueError, YAMLError) as e:
        return (
            jsonify(
                {
                    "type": "about:blank",
                    "title": "Invalid releases data",
                    "detail": str(e),
                    "status": 400,
                }
            ),
            400,
        )
    except MergeConflictError as e:
        return (
            jsonify(
                {
                    "type": "about:blank",
                    "title": "Merge conflict",
                    "detail": str(e),
                    "status": 409,
                }
            ),
            409,
        )
    except GithubError as e:
        return (
            jsonify(
                {
                    "type": "about:blank",
                    "title": "Failed to update releases",
                    "detail": str(e),
                    "status": 500,
                }
            ),
            500,
        )

    return jsonify(result), 200
