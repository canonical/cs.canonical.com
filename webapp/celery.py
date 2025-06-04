import os
from collections.abc import Callable
from typing import Optional

from celery import Celery, Task
from celery.app import Proxy
from celery.schedules import crontab
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
    """
    Register a celery task.
    """
    fn = celery_app.task()(fn)

    return fn


def run_celery_task(
    fn: Callable | None,
    delay: int | None,
    celery_app: Proxy,
    args: tuple,
    kwargs: dict,
) -> CeleryTask:
    """
    Run a registered celery task.
    """
    fn = register_celery_task(fn, celery_app)

    def _setup_periodic_tasks(sender: Celery, **snkwargs: dict) -> None:
        sender.add_periodic_task(
            crontab(minute=str(delay)),
            fn.s(*args, **kwargs),
            name=f"{fn.__name__} every {delay}",
            **snkwargs,
        )

    if delay:
        celery_app.on_after_configure.connect(_setup_periodic_tasks)

    return fn


def init_celery(app: Flask) -> Optional[Celery]:
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
