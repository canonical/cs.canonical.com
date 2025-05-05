import os
from pathlib import Path

import yaml

from webapp import create_app
from webapp.models import JiraTask, Project, Webpage, db
from webapp.settings import BASE_DIR
from webapp.site_repository import SiteRepository
from webapp.tasks import register_task

# Default delay between runs for updating the tree
TASK_DELAY = int(os.getenv("TASK_DELAY", "5"))
# Default delay between runs for updating Jira task statuses
UPDATE_STATUS_DELAY = int(os.getenv("UPDATE_STATUS_DELAY", "5"))


@register_task(delay=TASK_DELAY)
def load_site_trees() -> None:
    """
    Load the site trees from the queue.
    """
    app = create_app()
    with app.app_context():
        app.logger.info("Running scheduled task: load_site_trees")

        github = app.config.get("github")
        if not github:
            app.logger.error("GitHub configuration not found")
            return

        yaml_path = Path(BASE_DIR) / "data/sites.yaml"
        with yaml_path.open("r") as f:
            data = yaml.safe_load(f)
            for site in data["sites"]:
                # Enqueue the sites for setup
                site_repository = SiteRepository(site, app, db=db)
                # build the tree from GH source without using cache
                site_repository.get_tree(no_cache=True)


@register_task(delay=UPDATE_STATUS_DELAY)
def update_jira_statuses() -> None:
    """
    Get the status of a Jira task and update it if it changed.

    Args:
        app (Flask): The Flask application instance.
    """
    app = create_app()
    with app.app_context():
        app.logger.info("Running scheduled task: update_jira_statuses")

        jira = app.config.get("JIRA")
        if not jira:
            app.logger.error("JIRA configuration not found")
            return
        jira_tasks = JiraTask.query.all()
        if jira_tasks:
            project_ids = []
            for task in jira_tasks:
                response = jira.get_issue_statuses(task.jira_id)
                if task.status != response["fields"]["status"]["name"].upper():
                    task.status = response["fields"]["status"]["name"].upper()
                    # get the project id from the webpage that corresponds to
                    # the Jira task (will be needed to invalidate the cache)
                    webpage = Webpage.query.filter_by(
                        id=task.webpage_id,
                    ).first()
                    if webpage.project_id not in project_ids:
                        project_ids.append(webpage.project_id)
            db.session.commit()

            # invalidate the cache for all the project trees where Jira tasks
            # have changed status
            for project_id in project_ids:
                project = Project.query.filter_by(id=project_id).first()
                site_repository = SiteRepository(project.name, app)
                # clean the cache for a new Jira task to appgear in the tree
                site_repository.invalidate_cache()


def init_scheduled_tasks() -> None:
    load_site_trees()
    update_jira_statuses()
