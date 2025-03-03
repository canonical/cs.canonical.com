from os import environ
from flask import redirect, render_template, request
import urllib

from webapp import create_app
from webapp.models import Webpage
from webapp.sso import login_required
from webapp.routes.tree import tree_blueprint
from webapp.routes.user import user_blueprint
from webapp.routes.jira import jira_blueprint
from webapp.routes.product import product_blueprint

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
    copydoc = request.args.get("copydoc")
    if copydoc:
        copydoc = urllib.parse.unquote(copydoc)
        webpage = Webpage.query.filter(
            Webpage.copy_doc_link.ilike(f"%{copydoc}%")
        ).first()
        if webpage:
            return redirect(
                f"/app/webpage/{webpage.project.name}{webpage.url}"
            )
    return render_template(
        "index.html", is_dev=environ.get("FLASK_ENV") == "development"
    )


@app.route("/app/webpage/<path:path>")
@login_required
def webpage(path):
    return render_template(
        "index.html", is_dev=environ.get("FLASK_ENV") == "development"
    )
