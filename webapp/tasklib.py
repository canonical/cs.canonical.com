import atexit
import contextlib
import logging
import os
import signal
import time
import traceback
from collections.abc import Callable
from multiprocessing import Process, Queue

logger = logging.getLogger(__name__)

# Create a shared process map
task_queue = Queue()


class Task:
    """Wrapper for parity with celery tasks."""

    def __init__(
        self,
        fn: Callable,
        delay: int | None = None,
    ) -> None:
        def _start_process(
            *fn_args: tuple,
            **fn_kwargs: dict,
        ) -> None:
            if delay:
                p = Process(
                    target=scheduled_process,
                    args=(fn, delay, *fn_args),
                    kwargs={**fn_kwargs},
                )
            else:
                p = Process(
                    target=local_process,
                    args=(fn, *fn_args),
                    kwargs=fn_kwargs,
                )
            task_queue.put(p.pid)
            p.start()

        self.delay = _start_process
        self.s = _start_process
        self.run = _start_process


def local_process(func: Callable, *args: tuple, **kwargs: dict) -> None:
    """
    Wrapper for tasks that are added to the task queue.

    Args:
        func (function): The function to be added to the queue.
    """
    try:
        if len(args) > 0 and len(kwargs) > 0:
            func(*args, **kwargs)
        elif len(args) > 0 and len(kwargs) == 0:
            func(*args)
        elif len(args) == 0 and len(kwargs) > 0:
            func(**kwargs)
        else:
            func()
    except Exception:
        logger.info(
            f"Error in local process: {func.__name__} args:{args}, "
            f"kwargs:{kwargs}",
        )
        raise


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
        local_process(func, *args, **kwargs)
        time.sleep(schedule * 60)  # Convert to minutes


def close_background_tasks() -> None:
    """
    Close all background tasks.
    """
    logger.info("Closing background tasks...")
    final_trace = traceback.format_exc()
    if final_trace:
        logger.error(traceback.format_exc())
    with contextlib.suppress(Exception):
        for pid in task_queue.get(block=False):
            logger.info(f"Task pid: {pid}")
            os.kill(pid, signal.SIGTERM)


def register_local_task(
    func: Callable,
    delay: int | None,
) -> Task:
    """Register a local task."""
    msg = f"INFO  [Registered task] {func.__name__}"
    logger.info(msg)

    return Task(
        fn=func,
        delay=delay,
    )


atexit.register(close_background_tasks)
