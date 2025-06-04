import os
from collections.abc import Callable
from typing import Optional

from celery import Celery, Task
from celery.app import Proxy
from celery.utils.log import get_task_logger
from flask import Flask

from .tasklib import Task as LocalTask

logger = get_task_logger(__name__)


class CeleryTask(Task, LocalTask):
    pass


def register_celery_task(
    fn: Callable | None,
    celery_app: Proxy,
) -> CeleryTask:
    """Register a celery task."""
    fn = celery_app.task()(fn)

    return fn


def run_celery_task(
    fn: Callable,
    delay: int | None,
    celery_app: Proxy,
    args: tuple,
    kwargs: dict,
) -> CeleryTask | LocalTask:
    """Run a registered celery task."""
    if delay:
        # Celery doesn't allow us to add tasks to the beat schedule
        # at runtime, so we'll use the non-celery asynchronous
        # task decorator to handle periodic tasks
        func = LocalTask(
            fn=fn,
            delay=delay,
        )
    else:
        func = register_celery_task(fn, celery_app)

    return func


def init_celery(app: Flask) -> Celery | None:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    # Use redis if available
    if os.getenv("REDIS_HOST"):
        celery_app = Celery(app.name, task_cls=FlaskTask)
        broker_url = app.config.get("REDIS_DB_CONNECT_STRING")
        app.config.from_mapping(
            CELERY={
                "broker_url": broker_url,
                "result_backend": broker_url,
                "task_ignore_result": True,
            },
        )
        celery_app.config_from_object(app.config["CELERY"])
        celery_app.set_default()
        app.extensions["celery"] = celery_app
        return celery_app

    app.logger.error(
        "No Redis host found, celery tasks will not be available.",
    )
    return None
