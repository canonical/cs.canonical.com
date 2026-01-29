import json
import requests

from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap

from webapp.github import ReleasesGitHubAPI

GITHUB_API_URL = "https://api.github.com/"
RELEASES_REPO = "canonical/ubuntu.com"
# RELEASES_FILE_PATH = "releases.yaml"
RELEASES_FILE_PATH = "_TEST_releases.yaml"  # Temporary for testing


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

    def _construct_custom_tag(self, loader, tag_suffix, node):
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

    def _serialize_node(self, node):
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

    def parse_yaml(self, yaml_content):
        """Reads YAML string, parses it, and serializes to JSON."""
        data = self.yaml.load(yaml_content)
        return self._serialize_node(data)


class ReleasesGitHubClient(ReleasesGitHubAPI):
    """GitHub Client for releases.yaml related operations"""

    def __init__(self):
        super().__init__()
        self.repo = RELEASES_REPO
        self.file_path = RELEASES_FILE_PATH

    def fetch_releases_yaml(self, ref: str = "main") -> str:
        """Fetches the releases.yaml file from GitHub.

        Args:
            ref: Branch, tag, or commit SHA to fetch from.
        Returns:
            The raw YAML content as a string.
        """
        url = f"repos/{self.repo}/contents/{self.file_path}"
        return self._request("GET", url, params={"ref": ref}, raw=True)


class ReleasesService:
    def __init__(self):
        self.parser = ReleaseYamlParser()
        self.github_client = ReleasesGitHubClient()

    def _fetch_yaml(self) -> str:
        return self.github_client.fetch_releases_yaml()

    def get_releases_data(self) -> dict:
        yaml_content = self._fetch_yaml()
        return self.parser.parse_yaml(yaml_content)
