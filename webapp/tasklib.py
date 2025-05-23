import atexit
import contextlib
import functools
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
        args: tuple,
        kwargs: dict,
        delay: int | None = None,
    ) -> None:
        def _start_process(
            *fn_args: tuple,
            **fn_kwargs: dict,
        ) -> None:
            process = Process(
                target=fn,
                args=fn_args,
                kwargs=fn_kwargs,
            )
            process.start()
            task_queue.put(process.pid)
            if delay:
                p = Process(
                    target=scheduled_process,
                    args=(fn, delay, *args),
                    kwargs={**kwargs},
                )
            else:
                p = Process(
                    target=local_process,
                    args=(fn, *args),
                    kwargs=kwargs,
                )
            task_queue.put(p.pid)
            p.start()

        self.delay = functools.partial(_start_process, *args, **kwargs)
        self.s = functools.partial(_start_process, *args, **kwargs)
        self.run = functools.partial(_start_process, *args, **kwargs)


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
        if len(args) > 0 and len(kwargs) > 0:
            func(*args, **kwargs)
        elif len(args) > 0 and len(kwargs) == 0:
            func(*args)
        elif len(args) == 0 and len(kwargs) > 0:
            func(**kwargs)
        else:
            func()
        time.sleep(schedule)


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
        print(
            f"Error in local process: {func.__name__} args:{args}, "
            f"kwargs:{kwargs}",
        )
        raise


def close_background_tasks() -> None:
    """
    Close all background tasks.
    """
    print("Closing background tasks...")
    print(traceback.format_exc())
    with contextlib.suppress(Exception):
        for pid in task_queue.get(block=False):
            print(f"Task pid: {pid}")
            os.kill(pid, signal.SIGTERM)


def register_local_task(
    func: Callable,
    delay: int | None,
    args: tuple,
    kwargs: dict,
) -> Task:
    """
    Register a local task.
    """
    print("INFO  [Registered task]", func.__name__)

    return Task(
        fn=func,
        args=args,
        kwargs=kwargs,
        delay=delay,
    )


atexit.register(close_background_tasks)
