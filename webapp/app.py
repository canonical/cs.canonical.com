from os import environ

from flask import render_template

from webapp import create_app
from webapp.routes.jira import jira_blueprint
from webapp.routes.product import product_blueprint
from webapp.routes.tree import tree_blueprint
from webapp.routes.user import user_blueprint
from webapp.sso import login_required

app = create_app()

# Server-side routes
app.register_blueprint(tree_blueprint)
app.register_blueprint(user_blueprint)
app.register_blueprint(jira_blueprint)
app.register_blueprint(product_blueprint)


# Client-side routes
@app.route("/app")
@app.route("/app/new-webpage")
@login_required
def index():
    return render_template(
        "index.html", is_dev=environ.get("FLASK_ENV") == "development"
    )


@app.route("/app/webpage/<path:path>")
@login_required
def webpage(path):
    return render_template(
        "index.html", is_dev=environ.get("FLASK_ENV") == "development"
    )
