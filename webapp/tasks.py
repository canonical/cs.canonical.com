import functools
import os
from collections.abc import Callable
from typing import Any

from celery import current_app as celery_app

from webapp.celery import register_celery_task, run_celery_task
from webapp.tasklib import register_local_task

# Default delay between runs for updating the tree
TASK_DELAY = int(os.getenv("TASK_DELAY", "5"))
# Default delay between runs for updating Jira task statuses
UPDATE_STATUS_DELAY = int(os.getenv("UPDATE_STATUS_DELAY", "5"))


def register_task(delay: int | None = None) -> Callable:
    def outerwrapper(func: Callable) -> Callable:
        if os.getenv("REDIS_HOST"):
            # Register the task as a Celery task
            register_celery_task(func, celery_app=celery_app)

        @functools.wraps(func)
        def wrapper(*args: tuple, **kwargs: dict) -> Any:
            if os.getenv("REDIS_HOST"):
                # Run the Celery task
                task = run_celery_task(
                    func,
                    delay=delay,
                    celery_app=celery_app,
                    args=args,
                    kwargs=kwargs,
                )
            else:
                # Register the task as a local task
                task = register_local_task(
                    func,
                    delay=delay,
                )

            # Start task
            return task.delay(*args, **kwargs)

        return wrapper

    return outerwrapper
