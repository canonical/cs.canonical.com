import json
import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

import redis
from flask import Flask
from redis import exceptions as redis_exceptions


class Cache(ABC):
    """Abstract Cache class"""

    KIND = "Cache"
    CACHE_PREFIX = "WEBSITES_CONTENT_SYSTEM"

    @abstractmethod
    def get(self, key: str):
        """Get a value from the cache"""

    @abstractmethod
    def set(self, key: str, value: Any):
        """Set a value in the cache"""

    @abstractmethod
    def delete(self, key: str):
        """Delete a value from the cache"""

    @abstractmethod
    def is_available(self):
        """Check if the cache is available"""


class RedisCache(Cache):
    """Cache interface"""

    KIND = "RedisCache"

    def __init__(self, app: Flask):
        self.logger = app.logger
        self.instance = self.connect(app)

    def connect(self, app):
        """
        Return an instance of the redis cache. If not available, throw a
        ConnectionError.
        """
        self.logger.info("Connecting to Redis cache.")
        if url := os.environ.get("REDIS_DB_CONNECT_STRING"):
            r = redis.from_url(url)
        else:
            host = app.config["REDIS_HOST"]
            port = app.config["REDIS_PORT"]
            r = redis.Redis(host=host, port=port, db=0)
        r.ping()
        return r

    def __get_prefixed_key__(self, key: str):
        return f"{self.CACHE_PREFIX}_{key}"

    def __serialize__(self, value: Any):
        """Save files to the cache as JSON"""
        return json.dumps(value)

    def __deserialize__(self, value: str):
        """Deserialize cached JSON"""
        try:
            return json.loads(value)
        except TypeError:
            return value

    def get(self, key: str):
        value = self.instance.get(self.__get_prefixed_key__(key))
        return self.__deserialize__(value)

    def set(self, key: str, value: str):
        value = self.__serialize__(value)
        return self.instance.set(self.__get_prefixed_key__(key), value)

    def delete(self, key: str):
        return self.instance.delete(key)

    def is_available(self):
        try:
            self.instance.ping()
            return True
        except redis_exceptions.ConnectionError:
            return False
        except Exception as e:
            raise e


class FileCacheError(Exception):
    """
    Exception raised for errors in the FileCache class.
    """


class FileCache(Cache):
    """Cache interface"""

    KIND = "FileCache"
    CACHE_DIR = "tree-cache"

    def __init__(self, app: Flask):
        self.cache_path = app.config["BASE_DIR"] + "/" + self.CACHE_DIR
        self.logger = app.logger
        # Create directory
        Path(self.cache_path).mkdir(parents=True, exist_ok=True)
        self.connect()

    def is_available(self):
        return os.path.exists(self.cache_path)

    def connect(self):
        """
        Check if the cache directory exists, and is writable.
        """
        self.logger.info(f"Connecting to FileCache at {self.cache_path}")

        path_exists = Path(self.cache_path).exists()
        path_writable = Path(self.cache_path).is_dir() and os.access(
            self.cache_path,
            os.W_OK,
        )
        if not path_exists and path_writable:
            raise ConnectionError("Cache directory is not writable")

    def save_to_file(self, key: str, value: Any):
        """
        Dump the python object to JSON and save it to a file.
        """
        data = json.dumps(value)
        # Delete the file if it exists
        if Path(self.cache_path + "/" + key).exists():
            try:
                os.remove(self.cache_path + "/" + key)
            except FileNotFoundError:
                # We catch this as due to different processes potentially
                # accessing this method, deleting a file could face a race
                # condition.
                self.logger.info("File already removed")
        # Create base directory if it does not exist
        if not Path(self.cache_path).exists():
            Path(self.cache_path).mkdir(parents=True, exist_ok=True)
        with open(self.cache_path + "/" + key, "w") as f:
            f.write(data)

    def load_from_file(self, key: str):
        """
        Load the JSON data from a file and return the python object.
        """
        # Check if the file exists
        if not Path(self.cache_path + "/" + key).exists():
            return None
        with open(self.cache_path + "/" + key) as f:
            data = f.read()
        return json.loads(data)

    def __get_prefixed_key__(self, key: str):
        return f"{self.CACHE_PREFIX}_{key}"

    def get(self, key: str):
        return self.load_from_file(self.__get_prefixed_key__(key))

    def set(self, key: str, value: Any):
        return self.save_to_file(self.__get_prefixed_key__(key), value)

    def delete(self, key: str):
        """
        Delete the file from the cache directory.
        """

        def onerror(*args, **kwargs):
            os.chmod(self.cache_path + "/" + key, 0o777)

        return shutil.rmtree(self.cache_path + "/" + key, onerror=onerror)


def init_cache(app: Flask) -> Cache:
    try:
        cache = RedisCache(app)
    except Exception as e:
        cache = FileCache(app)
        msg = f"Error: {e} Redis cache is not available."
        " Using FileCache instead."
        app.logger.info(msg)
    app.config["CACHE"] = cache
    return cache
