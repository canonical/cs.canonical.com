import os
import time
from collections.abc import Iterator
from contextlib import contextmanager
from hashlib import md5
from multiprocessing import shared_memory
from urllib.parse import unquote, urlparse, urlunparse

from flask import current_app, redirect, request
from werkzeug.routing import BaseConverter


def versioned_static(filename):
    """
    Template function for generating URLs to static assets:
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
    """
    Remove trailing slashes from all routes
    We like our URLs without slashes
    """

    parsed_url = urlparse(unquote(request.url))
    path = parsed_url.path

    if path != "/" and path.endswith("/"):
        new_uri = urlunparse(parsed_url._replace(path=path[:-1]))

        return redirect(new_uri)


@contextmanager
def shared_memory_lock() -> Iterator:
    """
    Context manager for acquiring a generic lock using a shared memory
    buffer.
    """
    try:
        shm = shared_memory.SharedMemory(
            create=False,
            name="cscanonicalshmlock",
        )
    except FileNotFoundError:
        shm = shared_memory.SharedMemory(
            create=True,
            size=1,
            name="cscanonicalshmlock",
        )

    buffer = shm.buf

    try:
        if buffer[0] == 0:
            buffer[0] = 1
            yield
    finally:
        buffer[0] = 0
        shm.close()
        shm.unlink()


class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]
