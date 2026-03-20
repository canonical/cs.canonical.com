import io
import json
import base64

from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap
from ruamel.yaml.scalarstring import (
    DoubleQuotedScalarString,
    SingleQuotedScalarString,
)

from webapp.github import ReleasesGitHubAPI, GithubError

RELEASES_REPO = "canonical/ubuntu.com"
# RELEASES_FILE_PATH = "releases.yaml"
RELEASES_FILE_PATH = "_TEST_releases.yaml"  # Temporary for testing
RELEASES_BRANCH_NAME = "_releases_branch"
BASE_BRANCH_NAME = "main"


class TaggedField:
    """Wrapper class to hold data & tag information in memory."""

    def __init__(self, value, tag_type, style=None):
        self.value = value
        self.tag_type = tag_type
        self.style = style  # Scalar quote style: '"', "'", or None (plain)


class ReleaseYamlParser:
    """Parser for releases.yaml with custom tag handling."""

    def __init__(self):
        self.yaml = YAML(typ="rt")
        self.yaml.preserve_quotes = True
        self.yaml.constructor.add_multi_constructor(
            "", self._construct_custom_tag
        )
        self.yaml.representer.add_representer(
            TaggedField, self._represent_tagged_field
        )

    def _construct_custom_tag(self, loader, tag_suffix, node) -> TaggedField:
        """Extracts custom tagged fields from YAML nodes."""
        tag_name = node.tag.lstrip("!")
        style = None

        if node.id == "scalar":
            value = loader.construct_scalar(node)
            style = node.style
        elif node.id == "mapping":
            maptyp = CommentedMap()
            loader.construct_mapping(node, maptyp, deep=True)
            value = maptyp
        else:
            value = None

        return TaggedField(value, tag_name, style=style)

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

    def _represent_tagged_field(self, dumper, data: TaggedField):
        """Representer for TaggedField: emits
        custom YAML tags (!date, !link, !image)."""

        tag = f"!{data.tag_type}"
        if isinstance(data.value, dict):
            return dumper.represent_mapping(tag, data.value)
        return dumper.represent_scalar(tag, str(data.value), style=data.style)

    def _validate_yaml_structure(self, original_data: dict, yaml_str: str):
        """Validates generated YAML by round-tripping it through parse_yaml
        and comparing against the original data.

        Raises:
            ValueError: If the round-tripped data does not match the original.
            YAMLError: If the generated YAML cannot be parsed.
        """
        roundtrip = self.parse_yaml(yaml_str)
        if roundtrip != original_data:
            raise ValueError(
                "YAML round-trip validation failed: "
                "generated YAML does not match the input data."
            )

    def _is_dynamic_scalar_map(self, d):
        """True if all keys and values
        are plain scalars (no nested structures).

        Used to identify checksum data
        """
        return bool(d) and all(
            not isinstance(k, (dict, TaggedField, CommentedMap))
            and not isinstance(v, (dict, TaggedField, CommentedMap))
            for k, v in d.items()
        )

    def _deep_merge(self, original, json_node: dict):
        """Merges json_node changes onto a RT-loaded CommentedMap in place.

        Leaf dicts (where all values are scalars, e.g. checksum sections) are
        replaced wholesale — keys can be added, removed, or updated.
        """

        for key, original_value in original.items():
            if key not in json_node:
                continue

            updated_value = json_node[key]

            if isinstance(original_value, TaggedField):
                if isinstance(original_value.value, (dict, TaggedField)):
                    self._deep_merge(
                        original_value.value, updated_value["value"]
                    )
                else:
                    original_value.value = type(original_value.value)(
                        updated_value["value"]
                    )

            elif isinstance(original_value, dict):
                if self._is_dynamic_scalar_map(original_value):
                    old_key_types = {str(k): type(k) for k in original_value}
                    old_val_types = {
                        str(k): type(v) for k, v in original_value.items()
                    }
                    original_value.clear()
                    for k, v in updated_value.items():
                        key_type = old_key_types.get(
                            k, DoubleQuotedScalarString
                        )
                        val_type = old_val_types.get(
                            k, DoubleQuotedScalarString
                        )
                        original_value[key_type(k)] = val_type(v)
                else:
                    self._deep_merge(original_value, updated_value)

            elif isinstance(
                original_value,
                (DoubleQuotedScalarString, SingleQuotedScalarString, str, int),
            ):
                original[key] = type(original_value)(updated_value)

    def merge_and_dump(self, original_yaml: str, json_content: str) -> str:
        """
        Merges changes from JSON content onto the original YAML structure
        to preserve formatting and style

        Raises:
            ValueError: If round-trip validation fails.
            YAMLError: If the generated YAML cannot
            be parsed during validation.
        """
        data = json.loads(json_content)
        original = self.yaml.load(original_yaml)
        self._deep_merge(original, data)
        stream = io.StringIO()
        self.yaml.dump(original, stream)
        yaml_str = stream.getvalue()
        self._validate_yaml_structure(data, yaml_str)
        return yaml_str


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
        ref = BASE_BRANCH_NAME

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

    def merge_base_into_release(self) -> dict | None:
        """Merge base branch into the release branch if there are no conflicts.

        Returns:
            dict: Result of merge operation.
            None: If the branch does not exist.

        Raises:
            GithubError: If the merge operation fails for other reasons.
        """
        if not self.fetch_releases_branch():
            return None

        url = f"repos/{self.repo}/merges"
        payload = {
            "base": RELEASES_BRANCH_NAME,
            "head": BASE_BRANCH_NAME,
            "commit_message": f"Merge {BASE_BRANCH_NAME}"
            f" into {RELEASES_BRANCH_NAME}",
        }

        try:
            response = self._request("POST", url, data=payload, raw=True)
            return {"success": True, "merge": response}
        except GithubError as e:
            if e.status_code == 409:
                return {
                    "success": False,
                    "error": "Merge conflict detected."
                    " Please resolve conflicts manually.",
                }
            raise

    def update_releases_yaml(
        self, new_content: str, commit_message: str = "Update releases.yaml"
    ) -> dict:
        """Update the releases.yaml file on the release branch
        and create a commit.

        Args:
            new_content: The new YAML content as a string.
            commit_message: The commit message for the update.
            Defaults to "Update releases.yaml".

        Returns:
            dict: The commit response data.

        Raises:
            GithubError: If the update operation fails.
        """

        url = f"repos/{self.repo}/contents/{self.file_path}"

        # Get the current file to obtain its SHA (required for updates)
        try:
            current_file = self._request(
                "GET", url, params={"ref": RELEASES_BRANCH_NAME}
            )
            file_sha = current_file["sha"]
        except GithubError as e:
            if e.status_code == 404:
                file_sha = None
            else:
                raise

        # Encode the new content in base64
        encoded_content = base64.b64encode(new_content.encode()).decode()

        payload = {
            "message": commit_message,
            "content": encoded_content,
            "branch": RELEASES_BRANCH_NAME,
        }

        if file_sha:
            payload["sha"] = file_sha

        # Update the file
        response = self._request("PUT", url, data=payload)
        return response


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

    def update_releases_workflow(
        self, json_content: str, commit_message: str = "Update releases.yaml"
    ) -> dict:
        """Update the releases.yaml file in GitHub with new content.

        Args:
            json_content: The new JSON content as a string.
            commit_message: The commit message for the update.

        Returns:
            A dictionary with the update status and any relevant information.
        """

        original_yaml, _ = self.github_client.fetch_releases_yaml()
        yaml_content = self.parser.merge_and_dump(original_yaml, json_content)

        with open("debug_merged.yaml", "w") as f:
            f.write(yaml_content)

        try:
            branch = self.github_client.fetch_releases_branch()
            if not branch:
                # TODO: Create the branch from base branch if it doesn't exist
                # https://warthogs.atlassian.net/browse/WD-30487
                return {
                    "success": False,
                    "error": "Release branch does not exist. "
                    "Please create it first.",
                }

            # Merge base branch into release branch to ensure it's up to date
            merge_result = self.github_client.merge_base_into_release()
            if not merge_result.get("success"):
                return merge_result

            update_result = self.github_client.update_releases_yaml(
                yaml_content, commit_message
            )

            # Check if PR exists
            pr = self.github_client.fetch_releases_pr()

            if not pr:
                # TODO: Create PR automatically
                # https://warthogs.atlassian.net/browse/WD-30487
                return {
                    "success": True,
                    "message": "File updated successfully. "
                    "Please create a PR manually.",
                    "commit": update_result,
                    "branch": RELEASES_BRANCH_NAME,
                }

            return {
                "success": True,
                "message": "releases.yaml updated successfully.",
                "commit": update_result,
                "pr": {
                    "number": pr.get("number"),
                    "url": pr.get("html_url"),
                    "title": pr.get("title"),
                },
            }

        except GithubError as e:
            return {
                "success": False,
                "error": str(e),
                "status_code": e.status_code,
            }
