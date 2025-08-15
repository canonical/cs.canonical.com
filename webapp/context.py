import os
from collections.abc import Generator
from contextlib import contextmanager
from hashlib import md5
from time import sleep
from urllib.parse import unquote, urlparse, urlunparse

from flask import current_app, redirect, request
from werkzeug.routing import BaseConverter

from webapp.cache import init_cache


def versioned_static(filename):
    """Template function for generating URLs to static assets:
    Given the path for a static file, output a url path
    with a hex hash as a query string for versioning
    """
    static_path = current_app.static_folder
    static_url = current_app.static_url_path

    file_path = os.path.join(static_path, filename)
    if not os.path.isfile(file_path):
        # File is missing, simply return the string so we don't break anything
        return f"{static_url}/{filename}?v=file-not-found"

    # Use MD5 as we care about speed a lot
    # and not security in this case
    file_hash = md5()
    with open(file_path, "rb") as file_contents:
        for chunk in iter(lambda: file_contents.read(4096), b""):
            file_hash.update(chunk)

    return f"{static_url}/{filename}?v={file_hash.hexdigest()[:7]}"


def base_context():
    return dict(versioned_static=versioned_static)


def clear_trailing_slash():
    """Remove trailing slashes from all routes
    We like our URLs without slashes
    """
    parsed_url = urlparse(unquote(request.url))
    path = parsed_url.path

    if path != "/" and path.endswith("/"):
        new_uri = urlunparse(parsed_url._replace(path=path[:-1]))

        return redirect(new_uri)


DB_LOCK_NAME = "db_lock"


@contextmanager
def database_lock() -> Generator:
    """A context manager for acquiring a lock to control access
    to a shared db.

    This function creates a distributed lock using the available Cache to
    ensure only one process can access a protected resource at a time. If the
    lock is already acquired by another process, this will poll every 2 seconds
    until the lock is released.

    Yields:
        The current lock status from the cache

    Example:
        with database_lock():
            . . .

    """
    cache = init_cache(current_app)
    locked = cache.get(DB_LOCK_NAME)
    while locked:
        sleep(2)
    try:
        cache.set(DB_LOCK_NAME, 1)
        yield cache.get(DB_LOCK_NAME)
    finally:
        cache.set(DB_LOCK_NAME, 0)


class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]
