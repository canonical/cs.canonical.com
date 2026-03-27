import json

from flask import Blueprint, Response, jsonify
from flask_pydantic import validate
from ruamel.yaml import YAMLError

from webapp.github import GithubError
from webapp.releases_manager import MergeConflictError, ReleasesService
from webapp.schemas import UpdateReleasesRequest
from webapp.sso import login_required

releases_blueprint = Blueprint("releases", __name__, url_prefix="/api")

releases_service = ReleasesService()


@releases_blueprint.route(
    "/get-releases",
    methods=["GET"],
)
@login_required
def get_releases_yaml():
    try:
        data = releases_service.get_releases_data()
    except (YAMLError, GithubError) as e:
        return Response(
            response=json.dumps(
                {
                    "error": "Failed to fetch releases",
                    "details": str(e),
                }
            ),
            status=500,
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
@validate()
@login_required
def update_releases_yaml(body: UpdateReleasesRequest):
    try:
        result = releases_service.update_releases_workflow(
            json.dumps(body.releases), body.commit_message
        )
    except (ValueError, YAMLError) as e:
        return (
            jsonify({"message": "Invalid releases data", "details": str(e)}),
            400,
        )
    except MergeConflictError as e:
        return jsonify({"message": str(e)}), 409
    except GithubError as e:
        return (
            jsonify(
                {"message": "Failed to update releases", "details": str(e)}
            ),
            500,
        )

    return jsonify(result), 200
