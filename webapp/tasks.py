import functools
import os
from collections.abc import Callable
from pathlib import Path

from flask import current_app as app

from webapp.celery import register_celery_task
from webapp.settings import RABBITMQ_URI, REDIS_DB_CONNECT_STRING
from webapp.tasklib import Task, register_local_task

# Default delay between runs for updating the tree
TASK_DELAY = int(os.getenv("TASK_DELAY", "5"))
# Default delay between runs for updating Jira task statuses
UPDATE_STATUS_DELAY = int(os.getenv("UPDATE_STATUS_DELAY", "5"))


def register_task(delay: int | None) -> Callable:
    def outerwrapper(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args: tuple, **kwargs: dict) -> Task:
            if RABBITMQ_URI or REDIS_DB_CONNECT_STRING:
                # Register the task as a Celery task
                task = register_celery_task(func, delay)
            # Register the task as a local task
            task = register_local_task(func, delay, args, kwargs)
            # Start scheduled tasks
            if delay:
                task.delay()
            return task

        return wrapper

    return outerwrapper


@register_task(delay=None)
def save_github_file(
    repository: str,
    path: str,
    tree_file_path: str,
) -> None:
    """
    Save a file from a GitHub repository to the local filesystem.
    """

    # Note that there are several different paths in use:
    # - tree_file_path: the path to the respository directory
    # - file_path: the absolute path to the file on the local filesystem
    # - path: the remote path to the file in github
    raise ValueError("jaja")
    try:
        github = app.config["github"]
        app.logger.info(f"File path {path}")
        content = github.get_file_content(repository, path)
        app.logger.info(f"File {path} downloaded")

        file_path = Path(tree_file_path) / path
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with file_path.open("wb") as file:
            file.write(content)
    except Exception as e:
        app.logger.error(f"Failed to save file: {e}")
