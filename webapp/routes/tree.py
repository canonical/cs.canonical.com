from flask import Blueprint, current_app, jsonify

from webapp.site_repository import SiteRepository
from webapp.sso import login_required

tree_blueprint = Blueprint("tree", __name__, url_prefix="/api")


@tree_blueprint.route(
    "/get-tree/<string:uri>",
    methods=["GET"],
)
@tree_blueprint.route(
    "/get-tree/<string:uri>/<string:no_cache>",
    methods=["GET"],
)
@login_required
def get_tree(uri: str, no_cache: bool = False):
    site_repository = SiteRepository(uri, current_app)
    # Getting the site tree here ensures that both the cache and db are updated
    tree = site_repository.get_tree_sync(no_cache)

    response = jsonify(
        {
            "name": uri,
            "templates": tree,
        }
    )

    # Disable caching for this response
    response.cache_control.no_store = True

    return response
