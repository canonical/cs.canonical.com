import atexit
import contextlib
import logging
import os
import signal
import time
from collections.abc import Callable
from multiprocessing import Process, Queue

logger = logging.getLogger(__name__)

# Create a shared process map
task_queue = Queue()


class Task:
    """Wrapper for parity with celery tasks."""

    def __init__(self, fn: Callable) -> None:
        self.delay = fn
        self.s = fn
        self.run = fn


def scheduled_process(
    func: Callable,
    schedule: int = 1,
    *args: tuple,
    **kwargs: dict,
) -> None:
    """
    Wrapper for tasks that are added to the task queue.

    Args:
        func (function): The function to be added to the queue.
    """
    while True:
        func(*args, **kwargs)
        time.sleep(schedule)


def local_process(func: Callable, *args: tuple, **kwargs: dict) -> None:
    """
    Wrapper for tasks that are added to the task queue.

    Args:
        func (function): The function to be added to the queue.
    """
    func(*args, **kwargs)


def close_background_tasks() -> None:
    """
    Close all background tasks.
    """
    print("Closing background tasks...")
    with contextlib.suppress(Exception):
        for pid in task_queue.get(block=False):
            print(f"Task pid: {pid}")
            os.kill(pid, signal.SIGTERM)


def register_local_task(
    func: Callable | None,
    delay: int | None,
    args: tuple,
    kwargs: dict,
) -> Task:
    """
    Register a local task.
    """

    def _start_task() -> None:
        if delay:
            p = Process(
                target=scheduled_process,
                args=(func, delay, *args),
                kwargs={**kwargs},
            )
        else:
            p = Process(
                target=local_process,
                args=(func, delay, *args),
                kwargs=kwargs,
            )
        task_queue.put(p.pid)
        p.start()

    return Task(fn=_start_task)


atexit.register(close_background_tasks)
