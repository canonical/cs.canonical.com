import json

from flask import Blueprint, Response
from ruamel.yaml import YAMLError

from webapp.releases_manager import ReleaseYamlParser, ReleasesService
from webapp.sso import login_required

releases_blueprint = Blueprint("releases", __name__, url_prefix="/api")


@releases_blueprint.route(
    "/get-releases",
    methods=["GET"],
)
@login_required
def get_releases_yaml():
    try:
        service = ReleasesService(ReleaseYamlParser())
        data = service.get_releases_data()
    except YAMLError as e:
        return Response(
            response=json.dumps(
                {"error": "Failed to parse releases YAML", "details": str(e)}
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
