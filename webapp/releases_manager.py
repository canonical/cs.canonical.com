from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap

from webapp.github import ReleasesGitHubAPI, GithubError

RELEASES_REPO = "canonical/ubuntu.com"
# RELEASES_FILE_PATH = "releases.yaml"
RELEASES_FILE_PATH = "_TEST_releases.yaml"  # Temporary for testing
RELEASES_BRANCH_NAME = "_releases_branch"


class TaggedField:
    """Wrapper class to hold data & tag information in memory."""

    def __init__(self, value, tag_type):
        self.value = value
        self.tag_type = tag_type


class ReleaseYamlParser:
    """Parser for releases.yaml with custom tag handling."""

    def __init__(self):
        self.yaml = YAML(typ="rt")
        self.yaml.constructor.add_multi_constructor(
            "", self._construct_custom_tag
        )

    def _construct_custom_tag(self, loader, tag_suffix, node) -> TaggedField:
        """Extracts custom tagged fields from YAML nodes."""
        tag_name = node.tag.lstrip("!")

        if node.id == "scalar":
            value = loader.construct_scalar(node)
        elif node.id == "mapping":
            maptyp = CommentedMap()
            loader.construct_mapping(node, maptyp, deep=True)
            value = dict(maptyp)
        else:
            value = None

        return TaggedField(value, tag_name)

    def _serialize_node(self, node) -> dict:
        """Transforms Python dicts into JSON compatible format recursively."""
        if isinstance(node, TaggedField):
            return {
                "value": self._serialize_node(node.value),
                "type": node.tag_type,
                "has_custom_type": True,
            }

        elif isinstance(node, dict):
            return {k: self._serialize_node(v) for k, v in node.items()}

        return node

    def parse_yaml(self, yaml_content) -> dict:
        """Reads YAML string, parses it, and serializes to JSON."""
        data = self.yaml.load(yaml_content)
        return self._serialize_node(data)


class ReleasesGitHubClient(ReleasesGitHubAPI):
    """GitHub Client for releases.yaml related operations"""

    def __init__(self):
        super().__init__()
        self.repo = RELEASES_REPO
        self.file_path = RELEASES_FILE_PATH

    def fetch_releases_yaml(self) -> tuple[str, dict]:
        """Fetches the releases.yaml file from GitHub.
        Ensures to pull from the releases branch if it exists.

        Returns (tuple):
            - yaml_content: The raw YAML content as a string
            - status:
                - pr: The PR data if it exists, None otherwise
                - pr_exists: Boolean indicating if a PR exists
        """
        url = f"repos/{self.repo}/contents/{self.file_path}"
        pr = self.fetch_releases_pr()
        ref = "main"

        branch_exists = pr or self.fetch_releases_branch()
        if branch_exists:
            ref = RELEASES_BRANCH_NAME
            if not pr:
                # TODO: Create a PR for the orphaned branch
                # https://warthogs.atlassian.net/browse/WD-32397
                pass

        yaml_content = self._request("GET", url, params={"ref": ref}, raw=True)
        status = {"pr": pr, "pr_exists": pr is not None, "branch": ref}
        return yaml_content, status

    def fetch_releases_pr(self) -> dict | None:
        """Fetches the status of the releases pull request.
        When fetching PR it returns a list of matching PRs.
        If there are none it is an empty list.

        Returns:
            dict: The PR status data as a dictionary.
            None: If no matching PR exists.
        """
        url = f"repos/{self.repo}/pulls"
        params = {"head": f"canonical:{RELEASES_BRANCH_NAME}", "state": "open"}
        response = self._request("GET", url, params=params)

        if response:
            return response[0]  # Return the first matching PR

    def fetch_releases_branch(self) -> dict | None:
        """Fetches the status of the releases branch.

        Returns:
            dict: The branch status data if the branch exists.
            None: If the branch does not exist (404).
        """
        url = f"repos/{self.repo}/branches/{RELEASES_BRANCH_NAME}"
        try:
            response = self._request("GET", url)
            return response
        except GithubError as e:
            if e.status_code == 404:
                return None
            raise


class ReleasesService:
    def __init__(self):
        self.parser = ReleaseYamlParser()
        self.github_client = ReleasesGitHubClient()

    def get_releases_data(self) -> dict:
        """Fetch and parse releases data with status.

        Returns:
            A dictionary with:
            - releases: The parsed YAML data
            - status: PR status information
        """
        yaml_content, status = self.github_client.fetch_releases_yaml()

        return {
            "releases": self.parser.parse_yaml(yaml_content),
            "status": status,
        }
