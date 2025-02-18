import os

import yaml
from celery import Celery, Task, shared_task
from celery.schedules import crontab
from flask import Flask

from webapp import app
from webapp.models import JiraTask, Project, Webpage, db
from webapp.site_repository import SiteRepository

c_app = Celery()

# Default delay between runs for updating the tree
TASK_DELAY = int(os.getenv("TASK_DELAY", 5))
# Default delay between runs for updating Jira task statuses
UPDATE_STATUS_DELAY = int(os.getenv("UPDATE_STATUS_DELAY", 5))


@c_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    print("Setting up periodic tasks")
    # Calls fn() every x minutes.
    sender.add_periodic_task(
        crontab(minute=TASK_DELAY),
        load_site_trees_cron.s(),
        name=f"load_site_trees every {TASK_DELAY}",
    )

    sender.add_periodic_task(
        crontab(minute=UPDATE_STATUS_DELAY),
        update_jira_statuses.s(),
        name=f"update_jira_statuses every {UPDATE_STATUS_DELAY}",
    )


@shared_task
def load_site_trees_cron():
    """
    Load the site trees from the queue.
    """
    app.logger.info("Running scheduled task: load_site_trees")
    with open(app.config["BASE_DIR"] + "/data/sites.yaml") as f:
        data = yaml.safe_load(f)
        for site in data["sites"]:
            # Enqueue the sites for setup
            site_repository = SiteRepository(site, app, db=db)
            # build the tree from GH source without using cache
            site_repository.get_tree(no_cache=True)


@shared_task
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
            # clean the cache for a new Jira task to appear in the tree
            site_repository.invalidate_cache()


def init_celery(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    # Use redis if available
    if redis_url := os.environ.get("REDIS_DB_CONNECT_STRING"):
        broker_url = redis_url
    else:
        broker_url = "amqp://guest@localhost:5672/"

    app.config.from_mapping(
        CELERY=dict(
            broker_url=broker_url,
            result_backend="db+" + os.environ.get("DATABASE_URL", ""),
            task_ignore_result=True,
        ),
    )
    celery_app.set_default()
    celery_app.on_after_configure.connect(setup_periodic_tasks)
    app.extensions["celery"] = celery_app
    return celery_app
