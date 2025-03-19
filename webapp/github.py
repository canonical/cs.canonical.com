import json
from pathlib import Path

import flask
import requests

from webapp.tasks import save_github_file


class Tree:
    sha: str
    url: str
    tree: list
    truncated: bool


GITHUB_API_URL = "https://api.github.com/"


class GithubError(Exception):
    """
    Exception raised for errors in the GitHub class.
    """


class GitHub:
    def __init__(
        self,
        app: flask.Flask = None,
    ):
        """
        Initialize the Github object.

        Args:
            app (Flask): The Flask application instance.
        """
        self.REPOSITORY_PATH = Path(app.config["BASE_DIR"]) / "repositories"
        token = app.config["GH_TOKEN"]
        self.headers = {
            "Accept": "application/vnd.github.raw+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def __request__(
        self,
        method: str,
        url: str,
        data: dict = {},
        params: dict = {},
        blob=False,
    ):
        if data:
            data = json.dumps(data)
        response = requests.request(
            method,
            GITHUB_API_URL + url,
            data=data,
            headers=self.headers,
            params=params,
        )

        if blob:
            return response.content

        if response.status_code == 200:
            return response.json()

        raise GithubError(
            "Failed to make a request to GitHub. Status code:"
            f" {url} {method} {data} {params}"
            f" {response.status_code}. Response: {response.text}"
        )

    def _url_path(self, url: str):
        return url.split(self.URL)[-1]

    def get_file_content(self, repository: str, path: str) -> bytes:
        """
        Get the raw content of a file in a repository.

        Args:
            repository (str): The repository name.
            path (str): The path to the file, from the repository root.

        Returns:
            bytes: The raw content of the file.
        """
        return self.__request__(
            "GET",
            f"repos/canonical/{repository}/contents/{path}",
            blob=True,
        )

    def get_repository_tree(self, repository: str, branch: str = "main"):
        """
        Get a listing of all the files in a repository.

        Args:
            repository (str): The repository name.
            branch (str): The branch to get the tree from.
        """
        tree_file_path = Path(self.REPOSITORY_PATH) / repository
        tree_file_path.mkdir(parents=True, exist_ok=True)
        data = self.__request__(
            "GET",
            f"repos/canonical/{repository}/git/trees/{branch}?recursive=1",
        )
        for item in data["tree"]:
            if item["type"] == "blob" and item["path"].startswith("templates"):
                save_github_file.delay(
                    repository=repository,
                    path=tree_file_path / item["path"],
                )


def init_github(app: flask.Flask) -> None:
    app.config["github"] = GitHub(app=app)
