import json
import logging
import shutil
from pathlib import Path

import flask
import requests
from git import Repo
from flask.app import Flask

from webapp.settings import BASE_DIR, GH_TOKEN, REPO_ORG
from webapp.site_repository import BACKGROUND_TASK_RUNNING_PREFIX

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s  [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


class Tree:
    sha: str
    url: str
    tree: list
    truncated: bool


GITHUB_API_URL = "https://api.github.com/"
MAX_RETRIES = 5


class GithubError(Exception):
    """Exception raised for errors in the GitHub class."""


class GitHub:
    logger = logger

    def __init__(self, app: Flask) -> None:
        """Initialize the Github object."""
        self.REPOSITORY_PATH = Path(BASE_DIR) / "repositories"
        token = GH_TOKEN
        self.headers = {
            "Accept": "application/vnd.github.raw+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        self.cache = app.config["CACHE"]

    def __request__(
        self,
        method: str,
        url: str,
        data: dict | None = None,
        params: dict | None = None,
        blob=False,
    ) -> bytes | dict:
        req_data = json.dumps(data) if data else data

        response = requests.request(
            method,
            GITHUB_API_URL + url,
            data=req_data,
            headers=self.headers,
            params=params,
            timeout=10,
        )

        if blob:
            return response.content

        if response.status_code == 200:
            return response.json()

        err = (
            "Failed to make a request to GitHub. Status code:"
            f" {url} {method} {data} {params}"
            f" {response.status_code}. Response: {response.text}",
        )
        raise GithubError(err)

    def clone_repository(self, repository: str):
        """Get a listing of all the files in a repository.

        Args:
            repository (str): The repository name.

        """
        tree_file_path = self.REPOSITORY_PATH / repository
        if tree_file_path.exists():
            shutil.rmtree(tree_file_path)

        # Set the lock
        self.cache.set(
            f"{BACKGROUND_TASK_RUNNING_PREFIX}-{repository}",
            1,
        )

        retries = 1
        while retries <= MAX_RETRIES:
            try:
                logger.info(
                    f"Cloning repository {repository} to {tree_file_path}, "
                    f"try {retries} of {MAX_RETRIES}"
                )
                Repo.clone_from(
                    f"{REPO_ORG}/{repository}.git",
                    tree_file_path,
                )
                logger.info(
                    f"Finished cloning {repository} in {retries} retries"
                )
                break
            except Exception as e:
                if retries > MAX_RETRIES:
                    logger.error(
                        f"Failed to clone {repository} after "
                        f"{retries} retries."
                    )
                    raise GithubError(
                        f"Failed to clone {repository} after "
                        f"{retries} retries."
                    ) from e
                retries += 1
        self.cache.set(
            f"{BACKGROUND_TASK_RUNNING_PREFIX}-{repository}",
            0,
        )


def init_github(app: flask.Flask) -> None:
    app.config["github"] = GitHub(app)
