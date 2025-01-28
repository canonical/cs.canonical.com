import os

import yaml
from celery import Celery, Task, shared_task
from celery.schedules import crontab
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

from webapp.models import db
from webapp.site_repository import SiteRepository

app = Celery()


@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Calls load_site_trees() every 10 minutes.
    sender.add_periodic_task(
        crontab(minute=10),
        load_site_trees_cron.s(app, db),
        name="add every 10",
    )


@shared_task
def load_site_trees_cron(app: Flask, database: SQLAlchemy):
    """
    Load the site trees from the queue.
    """
    app.logger.info("Running scheduled task: load_site_trees")
    with open(app.config["BASE_DIR"] + "/data/sites.yaml") as f:
        data = yaml.safe_load(f)
        for site in data["sites"]:
            # Enqueue the sites for setup
            site_repository = SiteRepository(site, app, db=database)
            # build the tree from GH source without using cache
            site_repository.get_tree(no_cache=True)


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
        broker_url = "sqla" + os.environ.get("SQLALCHEMY_DATABASE_URI", "")

    app.config.from_mapping(
        CELERY=dict(
            broker_url=broker_url,
            result_backend=broker_url,
            task_ignore_result=True,
        ),
    )
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app
