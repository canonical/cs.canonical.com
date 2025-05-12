import json
import logging
import time
from pathlib import Path

import flask
import requests
from flask.app import Flask

from webapp.settings import BASE_DIR, GH_TOKEN
from webapp.site_repository import BACKGROUND_TASK_RUNNING_PREFIX
from webapp.tasks import register_task

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

    def get_file_content(self, repository: str, path: str) -> bytes:
        """Get the raw content of a file in a repository.

        Args:
            repository (str): The repository name.
            path (str): The path to the file, from the repository root.

        Returns:
            bytes: The raw content of the file.

        """
        res = self.__request__(
            "GET",
            f"repos/canonical/{repository}/contents/{path}",
            blob=True,
        )
        return res

    def get_repository_tree(self, repository: str, branch: str = "main"):
        """Get a listing of all the files in a repository.

        Args:
            repository (str): The repository name.
            branch (str): The branch to get the tree from.

        """
        tree_file_path = self.REPOSITORY_PATH / repository
        tree_file_path.mkdir(parents=True, exist_ok=True)

        try:
            # Set the lock
            self.cache.set(
                f"{BACKGROUND_TASK_RUNNING_PREFIX}-{repository}",
                1,
            )
            data = self.__request__(
                "GET",
                f"repos/canonical/{repository}/git/trees/{branch}?recursive=1",
            )
            for item in data["tree"]:
                if item["type"] == "blob" and item["path"].startswith(
                    "templates",
                ):
                    async_save_file(
                        tree_file_path=str(tree_file_path),
                        repository=repository,
                        path=item["path"],
                    )
        except Exception as e:
            print(f"Failed to get repository tree: {e}")
            raise
        finally:
            # Release the lock after a short delay, as downloads are async
            # and may not be finished yet.
            time.sleep(5)
            self.cache.set(
                f"{BACKGROUND_TASK_RUNNING_PREFIX}-{repository}",
                0,
            )


@register_task()
def async_save_file(
    repository: str = "",
    path: str = "",
    tree_file_path: str = "",
) -> None:
    """Download a file to a given repository.

    Args:
        repository (str): The repository name.
        path (str): The remote path to the file inside the repository.
        tree_file_path (str): The local path where the file will be saved.

    """
    with flask.current_app.app_context():
        github = GitHub(flask.current_app)
        content = github.get_file_content(repository, path)

        file_path = Path(tree_file_path) / path
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with file_path.open("wb") as file:
            file.write(content)


def init_github(app: flask.Flask) -> None:
    app.config["github"] = GitHub(app)
