from os import environ

from flask import render_template

from webapp import create_app
from webapp.celery import init_celery
from webapp.routes.jira import jira_blueprint
from webapp.routes.product import product_blueprint
from webapp.routes.tree import tree_blueprint
from webapp.routes.user import user_blueprint
from webapp.routes.webpage import webpage_blueprint
from webapp.routes.misc import misc_blueprint
from webapp.scheduled_tasks import init_scheduled_tasks
from webapp.sso import login_required

app = create_app()

# Initialize celery
celery_app = init_celery(app)

# Initialize scheduled tasks
init_scheduled_tasks(app)


# Server-side routes
app.register_blueprint(tree_blueprint)
app.register_blueprint(user_blueprint)
app.register_blueprint(jira_blueprint)
app.register_blueprint(product_blueprint)
app.register_blueprint(webpage_blueprint)
app.register_blueprint(misc_blueprint)


# Client-side routes
@app.route("/app")
@app.route("/app/new-webpage")
@login_required
def index():
    return render_template(
        "index.html",
        is_dev=environ.get("FLASK_ENV") == "development",
    )


@app.route("/app/<path:path>")
@login_required
def webpage(path):
    return render_template(
        "index.html",
        is_dev=environ.get("FLASK_ENV") == "development",
    )
