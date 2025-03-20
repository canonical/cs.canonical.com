import os
from pathlib import Path
from typing import Any

import yaml
from flask.app import current_app as app

from webapp.celery import celery_app, register_celery_task
from webapp.models import JiraTask, Project, Webpage, db
from webapp.settings import BASE_DIR, RABBITMQ_URI, REDIS_DB_CONNECT_STRING
from webapp.site_repository import SiteRepository
from webapp.tasklib import register_local_task

# Default delay between runs for updating the tree
TASK_DELAY = int(os.getenv("TASK_DELAY", 5))
# Default delay between runs for updating Jira task statuses
UPDATE_STATUS_DELAY = int(os.getenv("UPDATE_STATUS_DELAY", 5))


def register_task(fn=None, delay=None):
    if RABBITMQ_URI or REDIS_DB_CONNECT_STRING:
        # Register the task as a Celery task
        return register_celery_task(fn, delay)
    else:
        # Register the task as a local task
        return register_local_task(fn, delay)


def load_site_trees_cron():
    """
    Load the site trees from the queue.
    """
    celery_app.logger.info("Running scheduled task: load_site_trees")
    with open(BASE_DIR + "/data/sites.yaml") as f:
        data = yaml.safe_load(f)
        for site in data["sites"]:
            # Enqueue the sites for setup
            site_repository = SiteRepository(site, app, db=db)
            # build the tree from GH source without using cache
            site_repository.get_tree(no_cache=True)


def update_jira_statuses():
    """
    Get the status of a Jira task and update it if it changed.

    Args:
        app (Flask): The Flask application instance.
    """
    app.logger.info("Running scheduled task: update_jira_statuses")
    jira = app.config["JIRA"]
    jira_tasks = JiraTask.query.all()
    if jira_tasks:
        project_ids = []
        for task in jira_tasks:
            response = jira.get_issue_statuses(task.jira_id)
            if task.status != response["fields"]["status"]["name"].upper():
                task.status = response["fields"]["status"]["name"].upper()
                # get the project id from the webpage that corresponds to
                # the Jira task (will be needed to invalidate the cache)
                webpage = Webpage.query.filter_by(id=task.webpage_id).first()
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


def save_github_file(
    repository: str,
    path: str,
    tree_file_path: str,
) -> Any:
    """
    Save a file from a GitHub repository to the local filesystem.
    """

    # Note that there are several different paths in use:
    # - tree_file_path: the path to the respository directory
    # - file_path: the absolute path to the file on the local filesystem
    # - path: the remote path to the file in github
    try:
        github = app.config["github"]
        app.logger.info(f"File path {path}")
        content = github.get_file_content(repository, path)
        app.logger.info(f"File {path} downloaded")

        file_path = Path(tree_file_path) / path
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "wb") as file:
            file.write(content)
    except Exception as e:
        app.logger.error(f"Failed to save file: {e}")


# Register the tasks


load_site_trees_cron = register_task(load_site_trees_cron, delay=TASK_DELAY)
update_jira_statuses = register_task(
    update_jira_statuses, delay=UPDATE_STATUS_DELAY
)
save_github_file = register_task(save_github_file)
