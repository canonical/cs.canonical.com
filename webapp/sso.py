import functools
import os

import flask
from authlib.integrations.flask_client import OAuth

from webapp.helper import get_or_create_user_id, get_user_from_directory_by_key
from webapp.models import User, db
import requests

SSO_LOGIN_URL = "https://login.ubuntu.com"
# private teams like canonical are not returned in response atm
# so temporarily need to add multiple subset public teams

SSO_ADMIN_TEAM = "content-system-admins"
SSO_TEAM = (
    "canonical",
    "canonical-content-people",
    "pga-admins",
    "canonical-webmonkeys",
    SSO_ADMIN_TEAM,
)
DISABLE_SSO = os.environ.get("DISABLE_SSO") or os.environ.get(
    "FLASK_DISABLE_SSO"
)
LAUNCHPAD_API_URL = "https://api.launchpad.net/1.0"


def init_sso(app: flask.Flask):

    oauth = OAuth(app)

    oauth.register(
        "canonical",
        client_id=app.config["SSO_CLIENT_ID"],
        client_secret=app.config["SSO_CLIENT_SECRET"],
        server_metadata_url=app.config["OIDC_PROVIDER"],
        client_kwargs={
            "token_endpoint_auth_method": "client_secret_post",
            "scope": "openid profile email",
        },
    )

    @app.route("/login")
    def login():
        if DISABLE_SSO or "openid" in flask.session:
            return flask.redirect(flask.request.args.get("next") or "/app")

        redirect_uri = flask.url_for("oauth_callback", _external=True)
        return oauth.canonical.authorize_redirect(redirect_uri)

    @app.route("/auth/callback")
    def oauth_callback():
        token = oauth.canonical.authorize_access_token()
        user = User.query.filter_by(email=token["userinfo"]["email"]).first()

        if not user or not user.launchpad_id:
            # fetch user record from directory
            response = get_user_from_directory_by_key(
                "email", token["userinfo"]["email"]
            )
            if response.status_code != 200:
                flask.abort(404, description="User not found in directory.")
            user_data = response.json().get("data", {}).get("employees", [])[0]
            user = get_or_create_user_id(user_data, return_obj=True)

            if not user.launchpad_id:
                user.launchpad_id = user_data.get("launchpadId")
                db.session.commit()

        response = requests.get(
            f"{LAUNCHPAD_API_URL}/~{user.launchpad_id}/super_teams",
        )

        if response.status_code != 200:
            flask.abort(
                403, description="Failed to fetch Launchpad team memberships."
            )

        memberships = response.json().get("entries", [])
        teams = [team["name"] for team in memberships]
        if not (set(SSO_TEAM) & set(teams)):
            flask.abort(
                403, description="User is not a member of the required team."
            )

        # check if user is admin
        role = "admin" if SSO_ADMIN_TEAM in teams else "user"

        # update user
        if user and user.role != role:
            user.role = role
            db.session.commit()

        flask.session["openid"] = {
            "identity_url": token["userinfo"]["iss"],
            "email": token["userinfo"]["email"],
            "fullname": token["userinfo"]["name"],
            "role": role,
            "id": user.id,
        }

        return flask.redirect(flask.request.args.get("next") or "/app")

    @app.route("/logout")
    def logout():
        if "openid" in flask.session:
            flask.session.pop("openid")

        return flask.redirect("/login_page")

    @app.route("/")
    @app.route("/login_page")
    def login_page():
        next = flask.request.args.get("next", "/app")
        if "openid" in flask.session:
            return flask.redirect(next)
        return flask.render_template("login.html", next=next)


def login_required(func):
    """
    Decorator that checks if a user is logged in, and redirects
    to login page if not.
    """

    @functools.wraps(func)
    def is_user_logged_in(*args, **kwargs):
        if "openid" in flask.session:
            return func(*args, **kwargs)

        # Return if the sso is explicitly disabled.
        # Useful for non interactive testing.
        if DISABLE_SSO:
            flask.current_app.logger.info(
                "SSO Disabled. Session has no openid."
            )
            return func(*args, **kwargs)

        return flask.redirect("/login_page?next=" + flask.request.path)

    return is_user_logged_in


def is_admin(func):
    """
    Decorator that checks if a user is an admin user
    """

    @functools.wraps(func)
    def is_admin_user(*args, **kwargs):
        if (
            "openid" in flask.session
            and flask.session.get("openid")["role"] == "admin"
        ):
            return func(*args, **kwargs)

        return (
            flask.jsonify(
                {"error": "This operation requires admin privileges"}
            ),
            403,
        )

    return is_admin_user
