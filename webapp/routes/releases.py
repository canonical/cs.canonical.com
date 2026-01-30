import json

from flask import Blueprint, Response
from ruamel.yaml import YAMLError

from webapp.releases_manager import ReleasesService
from webapp.github import GithubError
from webapp.sso import login_required

releases_blueprint = Blueprint("releases", __name__, url_prefix="/api")


@releases_blueprint.route(
    "/get-releases",
    methods=["GET"],
)
@login_required
def get_releases_yaml():
    try:
        service = ReleasesService()
        data = service.get_releases_data()
    except (YAMLError, GithubError) as e:
        return Response(
            response=json.dumps(
                {
                    "error": "Failed to fetch releases",
                    "details": str(e.message),
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
