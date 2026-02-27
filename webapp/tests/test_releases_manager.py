import pytest
from unittest.mock import MagicMock, patch

from webapp.releases_manager import (
    ReleasesGitHubAPI,
    ReleaseYamlParser,
    ReleasesGitHubClient,
    ReleasesService,
)
from webapp.github import GithubError

SIMPLE_YAML = """
release:
  name: "Test"
  details:
    version: "1.0"
"""

SCALAR_TAGS_YAML = """
release_date: !date "October 2025"
"""

MAPPING_TAGS_YAML = """
logo:
  !image
  url: "https://example.com/image.png"
  width: 100
  height: 100
"""

MIXED_TAGS_YAML = """
release_date: !date "October 2025"
logo:
  !image
  url: "https://example.com/image.png"
  width: 100
  height: 100
docs_url: !link "https://docs.example.com"
"""

ORDERED_YAML = """
first: 1
second: 2
third: 3
fourth: 4
"""


@pytest.fixture
def mock_response():
    """Create a mock response with sensible defaults."""
    response = MagicMock()
    response.status_code = 200
    response.text = ""
    response.json.return_value = {}
    return response


@pytest.fixture
def mock_requests(mock_response):
    """Patch requests.request & provide access to both mock & response."""
    with patch(
        "webapp.github.requests.request", return_value=mock_response
    ) as mock:
        yield {"request": mock, "response": mock_response}


class TestReleaseYamlParser:
    """Tests for ReleaseYamlParser class."""

    @pytest.fixture
    def parser(self):
        """Create a parser instance for each test."""
        return ReleaseYamlParser()

    def test_parse_simple_yaml(self, parser):
        """Test parsing basic YAML without custom tags."""
        result = parser.parse_yaml(SIMPLE_YAML)

        assert result["release"]["name"] == "Test"
        assert result["release"]["details"]["version"] == "1.0"

    def test_parse_scalar_custom_tag(self, parser):
        """Test parsing scalar values with custom tags."""
        result = parser.parse_yaml(SCALAR_TAGS_YAML)

        assert result["release_date"]["has_custom_type"] is True
        assert result["release_date"]["type"] == "date"
        assert result["release_date"]["value"] == "October 2025"

    def test_parse_mapping_custom_tag(self, parser):
        """Test parsing mapping values with custom tags."""
        result = parser.parse_yaml(MAPPING_TAGS_YAML)

        assert result["logo"]["has_custom_type"] is True
        assert result["logo"]["type"] == "image"
        assert (
            result["logo"]["value"]["url"] == "https://example.com/image.png"
        )
        assert result["logo"]["value"]["width"] == 100

    def test_parse_yaml_with_mixed_tags(self, parser):
        """Test parsing YAML with multiple different custom tags."""
        result = parser.parse_yaml(MIXED_TAGS_YAML)

        assert result["release_date"]["type"] == "date"
        assert result["docs_url"]["type"] == "link"
        assert result["logo"]["has_custom_type"] is True
        assert result["logo"]["type"] == "image"
        assert (
            result["logo"]["value"]["url"] == "https://example.com/image.png"
        )

    def test_preserves_key_order(self, parser):
        """Test that key order from YAML is preserved."""
        result = parser.parse_yaml(ORDERED_YAML)
        keys = list(result.keys())

        assert keys == ["first", "second", "third", "fourth"]


class TestReleasesGitHubAPI:
    """Tests for ReleasesGitHubAPI class."""

    @pytest.fixture
    def github_base(self):
        """Create a ReleasesGitHubAPI instance for each test."""
        with patch("webapp.github.GH_TOKEN", "test-token"):
            return ReleasesGitHubAPI()

    def test_request_success_json(self, github_base, mock_requests):
        """Test successful JSON response."""
        mock_requests["response"].json.return_value = {"key": "value"}
        result = github_base._request("GET", "test/url")
        assert result == {"key": "value"}

    def test_request_success_raw(self, github_base, mock_requests):
        """Test successful raw text response."""
        mock_requests["response"].text = "raw content"
        result = github_base._request("GET", "test/url", raw=True)
        assert result == "raw content"

    def test_request_sets_raw_accept_header(self, github_base, mock_requests):
        """Test that raw=True sets the correct Accept header."""
        github_base._request("GET", "test/url", raw=True)
        headers = mock_requests["request"].call_args.kwargs["headers"]
        assert headers["Accept"] == "application/vnd.github.raw+json"

    def test_request_default_json_accept_header(
        self, github_base, mock_requests
    ):
        """Test that default Accept header is for JSON."""
        github_base._request("GET", "test/url")
        headers = mock_requests["request"].call_args.kwargs["headers"]
        assert headers["Accept"] == "application/vnd.github+json"

    def test_request_failure_raises_error(self, github_base, mock_requests):
        """Test that non-200 response raises GithubError."""
        mock_requests["response"].status_code = 404
        mock_requests["response"].text = "Not Found"

        with pytest.raises(GithubError) as exc_info:
            github_base._request("GET", "test/url")

        assert "404" in str(exc_info.value)
        assert "Not Found" in str(exc_info.value)

    def test_request_does_not_mutate_instance_headers(
        self, github_base, mock_requests
    ):
        """
        Test that calling _request with raw=True doesn't change
        the instance headers.
        """
        original_accept = github_base.headers["Accept"]
        github_base._request("GET", "test/url", raw=True)
        assert github_base.headers["Accept"] == original_accept


class TestReleasesGitHubClient:
    """Tests for ReleasesGitHubClient class."""

    @pytest.fixture
    def github_client(self):
        """Create a ReleasesGitHubClient instance for each test."""
        with patch("webapp.github.GH_TOKEN", "test-token"):
            return ReleasesGitHubClient()

    def test_fetch_releases_pr_returns_pr_when_exists(
        self, github_client, mock_requests
    ):
        """Test that fetch_releases_pr returns PR data when a PR exists."""
        pr_data = {"pr_id": 123, "title": "Release updates"}
        mock_requests["response"].json.return_value = [pr_data]

        result = github_client.fetch_releases_pr()

        assert result == pr_data

    def test_fetch_releases_pr_returns_none_when_no_pr(
        self, github_client, mock_requests
    ):
        """Test that fetch_releases_pr returns None when no PR exists."""
        mock_requests["response"].json.return_value = []

        result = github_client.fetch_releases_pr()

        assert result is None

    # def test_fetch_releases_pr_uses_correct_params(
    #     self, github_client, mock_requests
    # ):
    #     """Test that fetch_releases_pr uses correct query parameters."""
    #     mock_requests["response"].json.return_value = []

    #     github_client.fetch_releases_pr()

    #     params = mock_requests["request"].call_args.kwargs["params"]
    #     assert params["state"] == "open"
    #     assert "canonical:" in params["head"]

    def test_fetch_releases_branch_returns_branch_when_exists(
        self, github_client, mock_requests
    ):
        """Test that fetch_releases_branch returns branch data if it exists."""
        branch_data = {
            "pr_name": "_releases_branch",
            "commit": {"sha": "abc123"},
        }
        mock_requests["response"].json.return_value = branch_data

        result = github_client.fetch_releases_branch()

        assert result == branch_data

    def test_fetch_releases_branch_returns_none_when_not_found(
        self, github_client, mock_requests
    ):
        """Test that fetch_releases_branch returns None
        if branch doesn't exist.
        """
        mock_requests["response"].status_code = 404
        mock_requests["response"].text = "Branch not found"

        result = github_client.fetch_releases_branch()

        assert result is None

    def test_fetch_releases_branch_raises_on_other_errors(
        self, github_client, mock_requests
    ):
        """Test that fetch_releases_branch raises on non-404 errors."""
        mock_requests["response"].status_code = 500
        mock_requests["response"].text = "Internal Server Error"

        with pytest.raises(GithubError):
            github_client.fetch_releases_branch()

    def test_fetch_releases_yaml_uses_main_when_no_pr_or_branch(
        self, github_client
    ):
        """Test that fetch_releases_yaml fetches from main
        when no PR or branch exists.
        """
        with (
            patch.object(
                github_client, "fetch_releases_pr", return_value=None
            ),
            patch.object(
                github_client,
                "fetch_releases_branch",
                return_value=None,
            ),
            patch.object(
                github_client, "_request", return_value="yaml: content"
            ) as mock_request,
        ):
            github_client.fetch_releases_yaml()

            # Check that _request was called with ref="main"
            call_args = mock_request.call_args
            assert call_args.kwargs["params"]["ref"] == "main"

    def test_fetch_releases_yaml_uses_branch_when_pr_exists(
        self, github_client
    ):
        """Test that fetch_releases_yaml fetches from releases branch
        when PR exists.
        """
        pr_data = {"pr_id": 123, "title": "Release updates"}
        with (
            patch.object(
                github_client, "fetch_releases_pr", return_value=pr_data
            ),
            patch.object(
                github_client, "_request", return_value="yaml: content"
            ) as mock_request,
        ):
            yaml_content, status = github_client.fetch_releases_yaml()

            # Check that _request was called with releases branch
            call_args = mock_request.call_args
            assert call_args.kwargs["params"]["ref"] == "_releases_branch"
            assert status["pr"] == pr_data
            assert status["pr_exists"] is True

    def test_fetch_releases_yaml_uses_branch_when_branch_exists_but_no_pr(
        self, github_client
    ):
        """Test that fetch_releases_yaml fetches from releases branch
        when branch exists but no PR.
        """
        branch_data = {
            "pr_name": "_releases_branch",
            "commit": {"sha": "abc123"},
        }
        with (
            patch.object(
                github_client, "fetch_releases_pr", return_value=None
            ),
            patch.object(
                github_client,
                "fetch_releases_branch",
                return_value=branch_data,
            ),
            patch.object(
                github_client, "_request", return_value="yaml: content"
            ) as mock_request,
        ):
            yaml_content, status = github_client.fetch_releases_yaml()

            # Check that _request was called with releases branch
            call_args = mock_request.call_args
            assert call_args.kwargs["params"]["ref"] == "_releases_branch"
            assert status["pr"] is None
            assert status["pr_exists"] is False

    def test_fetch_releases_yaml_short_circuits_branch_check_when_pr_exists(
        self, github_client
    ):
        """Test that fetch_releases_yaml doesn't check branch status
        when PR exists.
        """
        pr_data = {"pr_id": 123, "title": "Release updates"}
        with (
            patch.object(
                github_client, "fetch_releases_pr", return_value=pr_data
            ),
            patch.object(
                github_client, "fetch_releases_branch"
            ) as mock_branch_status,
            patch.object(
                github_client, "_request", return_value="yaml: content"
            ),
        ):
            github_client.fetch_releases_yaml()

            mock_branch_status.assert_not_called()

    def test_fetch_releases_yaml_returns_yaml_content_and_status(
        self, github_client
    ):
        """Test that fetch_releases_yaml returns yaml content & status."""
        with (
            patch.object(
                github_client, "fetch_releases_pr", return_value=None
            ),
            patch.object(
                github_client,
                "fetch_releases_branch",
                return_value=None,
            ),
            patch.object(github_client, "_request", return_value="key: value"),
        ):
            yaml_content, status = github_client.fetch_releases_yaml()

            assert yaml_content == "key: value"
            assert "pr" in status
            assert "pr_exists" in status

    def test_merge_base_into_release_success(
        self, github_client, mock_requests
    ):
        """Test successful merge when branch exists."""
        branch_data = {
            "pr_name": "_releases_branch",
            "commit": {"sha": "abc123"},
        }
        merge_response = {
            "sha": "merge123",
            "commit": {"message": "Merge main into _releases_branch"},
        }
        mock_requests["response"].json.return_value = merge_response
        mock_requests["response"].status_code = 201

        with patch.object(
            github_client, "fetch_releases_branch", return_value=branch_data
        ):
            result = github_client.merge_base_into_release()

        assert result["success"] is True
        
        # Verify the request was made with correct parameters
        call_args = mock_requests["request"].call_args
        assert call_args.args[0] == "POST"
        assert "merges" in call_args.args[1]

    def test_merge_base_into_release_returns_none_when_no_branch(
        self, github_client
    ):
        """Test that merge returns None when branch doesn't exist."""
        with patch.object(
            github_client, "fetch_releases_branch", return_value=None
        ):
            result = github_client.merge_base_into_release()

        assert result is None

    def test_merge_base_into_release_handles_conflict(
        self, github_client, mock_requests
    ):
        """Test merge returns error dict when conflict is detected (409)."""
        branch_data = {
            "pr_name": "_releases_branch",
            "commit": {"sha": "abc123"},
        }
        mock_requests["response"].status_code = 409
        mock_requests["response"].text = "Merge conflict"

        with patch.object(
            github_client, "fetch_releases_branch", return_value=branch_data
        ):
            result = github_client.merge_base_into_release()

        assert result["success"] is False
        assert "conflict" in result["error"].lower()

    def test_merge_base_into_release_raises_on_other_errors(
        self, github_client, mock_requests
    ):
        """Test that merge raises GithubError for non-409 errors."""
        branch_data = {
            "pr_name": "_releases_branch",
            "commit": {"sha": "abc123"},
        }
        mock_requests["response"].status_code = 500
        mock_requests["response"].text = "Internal Server Error"

        with patch.object(
            github_client, "fetch_releases_branch", return_value=branch_data
        ):
            with pytest.raises(GithubError):
                github_client.merge_base_into_release()

    def test_update_releases_yaml_success_with_existing_file(
        self, github_client, mock_requests
    ):
        """Test successful update when file already exists."""
        file_sha = "existing_sha_123"
        new_content = "updated: yaml\ncontent: here"
        commit_response = {
            "content": {"sha": "new_sha_456"},
            "commit": {"message": "Update releases.yaml"},
        }
        
        # Mock two different responses for GET and PUT
        get_response = MagicMock()
        get_response.status_code = 200
        get_response.json.return_value = {"sha": file_sha}
        
        put_response = MagicMock()
        put_response.status_code = 200
        put_response.json.return_value = commit_response

        with patch.object(
            github_client,
            "_request",
            side_effect=[get_response.json.return_value, commit_response],
        ):
            result = github_client.update_releases_yaml(new_content)

        assert result == commit_response

    def test_update_releases_yaml_success_with_new_file(
        self, github_client, mock_requests
    ):
        """Test successful update when file doesn't exist (404)."""
        new_content = "new: yaml\nfile: content"
        commit_response = {
            "content": {"sha": "new_sha_789"},
            "commit": {"message": "Update releases.yaml"},
        }

        def mock_request_side_effect(method, url, **kwargs):
            if method == "GET":
                raise GithubError("Not found", 404)
            return commit_response

        with patch.object(
            github_client, "_request", side_effect=mock_request_side_effect
        ):
            result = github_client.update_releases_yaml(new_content)

        assert result == commit_response

    def test_update_releases_yaml_uses_base64_encoding(
        self, github_client, mock_requests
    ):
        """Test that content is base64 encoded before sending."""
        import base64
        
        new_content = "test: content"
        expected_encoded = base64.b64encode(
            new_content.encode()
        ).decode()

        def capture_params(method, url, **kwargs):
            if method == "PUT":
                assert kwargs["data"]["content"] == expected_encoded
            return {}

        with patch.object(
            github_client, "_request", side_effect=capture_params
        ):
            try:
                github_client.update_releases_yaml(new_content)
            except (KeyError, TypeError):
                # Expected since we're not returning proper response
                pass

    def test_update_releases_yaml_targets_releases_branch(
        self, github_client, mock_requests
    ):
        """Test that update targets the releases branch."""
        commit_response = {"commit": {"sha": "abc"}}

        def capture_params(method, url, **kwargs):
            if method == "PUT":
                assert kwargs["data"]["branch"] == "_releases_branch"
            elif method == "GET":
                assert kwargs["params"]["ref"] == "_releases_branch"
                return {"sha": "existing_sha"}
            return commit_response

        with patch.object(
            github_client, "_request", side_effect=capture_params
        ):
            github_client.update_releases_yaml("content")

    def test_update_releases_yaml_raises_on_non_404_get_error(
        self, github_client
    ):
        """Test that non-404 errors during GET are raised."""

        def mock_request_side_effect(method, url, **kwargs):
            if method == "GET":
                raise GithubError("Unauthorized", 401)
            return {}

        with patch.object(
            github_client, "_request", side_effect=mock_request_side_effect
        ):
            with pytest.raises(GithubError) as exc_info:
                github_client.update_releases_yaml("content")
            
            assert exc_info.value.status_code == 401


class TestReleasesService:
    """Tests for ReleasesService class."""

    def test_get_releases_data_integration(self):
        """Test that get_releases_data fetches & parses YAML correctly."""
        expected_releases = {
            "release_date": {
                "value": "October 2025",
                "type": "date",
                "has_custom_type": True,
            },
            "logo": {
                "value": {
                    "url": "https://example.com/image.png",
                    "width": 100,
                    "height": 100,
                },
                "type": "image",
                "has_custom_type": True,
            },
            "docs_url": {
                "value": "https://docs.example.com",
                "type": "link",
                "has_custom_type": True,
            },
        }
        mock_status = {"pr": None, "pr_exists": False}

        with patch("webapp.github.GH_TOKEN", "test-token"):
            with patch.object(
                ReleasesGitHubClient,
                "fetch_releases_yaml",
                return_value=(MIXED_TAGS_YAML, mock_status),
            ):
                service = ReleasesService()
                result = service.get_releases_data()

        assert result["releases"] == expected_releases
        assert result["status"] == mock_status

    def test_get_releases_data_calls_github_client(self):
        """Test that get_releases_data uses the github client."""
        mock_status = {"pr": None, "pr_exists": False}

        with patch("webapp.github.GH_TOKEN", "test-token"):
            with patch.object(
                ReleasesGitHubClient,
                "fetch_releases_yaml",
                return_value=("key: value", mock_status),
            ) as mock_fetch:
                service = ReleasesService()
                service.get_releases_data()

        mock_fetch.assert_called_once()

    def test_get_releases_data_includes_status_from_client(self):
        """Test that get_releases_data includes status from GitHub client."""
        pr_data = {"pr_id": 123, "title": "Release updates"}
        mock_status = {"pr": pr_data, "pr_exists": True}

        with patch("webapp.github.GH_TOKEN", "test-token"):
            with patch.object(
                ReleasesGitHubClient,
                "fetch_releases_yaml",
                return_value=("key: value", mock_status),
            ):
                service = ReleasesService()
                result = service.get_releases_data()

        assert result["status"]["pr"] == pr_data
        assert result["status"]["pr_exists"] is True
