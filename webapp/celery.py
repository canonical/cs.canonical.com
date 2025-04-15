from collections.abc import Callable

from celery import Celery, Task
from celery.schedules import crontab
from celery.utils.log import get_task_logger
from flask import Flask

from webapp.settings import REDIS_DB_CONNECT_STRING
from webapp.tasklib import Task as LocalTask

logger = get_task_logger(__name__)
celery_app = Celery()


class CeleryTask(Task, LocalTask):
    pass


def register_celery_task(
    fn: Callable | None,
    delay: int | None,
    args: tuple,
    kwargs: dict,
) -> CeleryTask:
    """
    Register a celery task.
    """
    fn = celery_app.task(fn)

    def _setup_periodic_tasks(sender, **snkwargs):
        sender.add_periodic_task(
            crontab(minute=delay),
            fn.s(*args, **kwargs),
            name=f"{fn.__name__} every {delay}",
            **snkwargs,
        )

    if delay:
        celery_app.on_after_configure.connect(_setup_periodic_tasks)

    return fn


def init_celery(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    # Use RabbitMQ if available
    if url := app.config.get("RABBITMQ_URI"):
        broker_url = url
    # Use redis if available
    elif app.config.get("CACHE").KIND == "RedisCache":
        broker_url = REDIS_DB_CONNECT_STRING
    # Otherwise, skip setup
    else:
        return None

    app.config.from_mapping(
        CELERY=dict(
            broker_url=broker_url,
            ignore_result=True,
        ),
    )
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app
