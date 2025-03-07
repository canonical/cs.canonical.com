import atexit
import contextlib
import functools
import logging
import os
import signal
import time
from multiprocessing import Process, Queue

logger = logging.getLogger(__name__)

# Create a shared process map
task_queue = Queue()


class Task:
    """Wrapper for parity with celery tasks."""

    def __init__(self, fn):
        self.delay = fn


def scheduled_process(func, schedule=1, *args, **kwargs):
    """
    Wrapper for tasks that are added to the task queue.

    Args:
        func (function): The function to be added to the queue.
    """
    while True:
        func(*args, **kwargs)
        time.sleep(schedule)


def local_process(func, *args, **kwargs):
    """
    Wrapper for tasks that are added to the task queue.

    Args:
        func (function): The function to be added to the queue.
    """
    func(*args, **kwargs)


def async_task(schedule=None):
    """
    Decorator for an async task, with optional scheduling.

    Args:
        schedule (int): How often to run the task in seconds.
    """

    def outerwrapper(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if schedule:
                p = Process(
                    target=scheduled_process,
                    args=(func, *args),
                    kwargs={**kwargs, "schedule": schedule},
                )
            else:
                p = Process(
                    target=local_process,
                    args=(func, *args),
                    kwargs=kwargs,
                )
            task_queue.put(p.pid)
            p.start()

        return Task(fn=wrapper)

    return outerwrapper


def close_background_tasks():
    """
    Close all background tasks.
    """
    print("Closing background tasks...")
    with contextlib.suppress(Exception):
        for pid in task_queue.get(block=False):
            print(f"Task pid: {pid}")
            os.kill(pid, signal.SIGTERM)


def register_local_task(fn=None, delay=None):
    """
    Register a local task.
    """
    return async_task(delay)(fn)


atexit.register(close_background_tasks)
