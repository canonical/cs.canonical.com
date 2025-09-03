import functools
import os

import flask
from django_openid_auth.teams import TeamsRequest, TeamsResponse
from flask_openid import OpenID

from webapp.helper import get_or_create_user_id, get_user_from_directory_by_key
from webapp.models import User, db

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


def init_sso(app: flask.Flask):
    open_id = OpenID(
        store_factory=lambda: None,
        safe_roots=[],
        extension_responses=[TeamsResponse],
    )

    @app.route("/login", methods=["GET", "POST"])
    @open_id.loginhandler
    def login():
        if DISABLE_SSO or "openid" in flask.session:
            return flask.redirect(open_id.get_next_url())

        teams_request = TeamsRequest(query_membership=SSO_TEAM)
        return open_id.try_login(
            SSO_LOGIN_URL, ask_for=["email"], extensions=[teams_request]
        )

    @open_id.after_login
    def after_login(resp):
        if not (set(SSO_TEAM) & set(resp.extensions["lp"].is_member)):
            flask.abort(403)

        # check if user is admin
        role = (
            "admin"
            if SSO_ADMIN_TEAM in resp.extensions["lp"].is_member
            else "user"
        )

        # find the user in database
        user = User.query.filter_by(email=resp.email).first()
        if user and user.role != role:
            user.role = role
            db.session.commit()
        if not user:
            # fetch user record from directory
            response = get_user_from_directory_by_key("email", resp.email)

            if response.status_code == 200:
                user = response.json().get("data", {}).get("employees", [])[0]
                user["role"] = role
                # save user in users table
                get_or_create_user_id(user)

        flask.session["openid"] = {
            "identity_url": resp.identity_url,
            "email": resp.email,
            "role": role,
        }

        return flask.redirect(open_id.get_next_url())

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
