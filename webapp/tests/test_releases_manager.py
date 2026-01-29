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
    """Patch requests.request and provide access to both mock and response."""
    with patch(
        "webapp.releases_manager.requests.request", return_value=mock_response
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

    def test_fetch_releases_yaml_builds_correct_url(
        self, github_client, mock_requests
    ):
        """Test that fetch_releases_yaml calls _request with correct URL."""
        mock_requests["response"].text = "yaml: content"
        github_client.fetch_releases_yaml()

        url = mock_requests["request"].call_args.args[1]
        assert (
            f"repos/{github_client.repo}/contents/{github_client.file_path}"
            in url
        )

    def test_fetch_releases_yaml_uses_ref_param(
        self, github_client, mock_requests
    ):
        """Test that fetch_releases_yaml passes ref parameter."""
        mock_requests["response"].text = "yaml: content"
        github_client.fetch_releases_yaml(ref="test-ref")

        params = mock_requests["request"].call_args.kwargs["params"]
        assert params["ref"] == "test-ref"

    def test_fetch_releases_yaml_requests_raw_content(
        self, github_client, mock_requests
    ):
        """Test that fetch_releases_yaml requests raw content."""
        mock_requests["response"].text = "yaml: content"
        github_client.fetch_releases_yaml()

        headers = mock_requests["request"].call_args.kwargs["headers"]
        assert "raw" in headers["Accept"]


class TestReleasesService:
    """Tests for ReleasesService class."""

    def test_get_releases_data_integration(self):
        """Test that get_releases_data fetches and parses YAML correctly."""
        expected_result = {
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

        with patch("webapp.github.GH_TOKEN", "test-token"):
            with patch.object(
                ReleasesGitHubClient,
                "fetch_releases_yaml",
                return_value=MIXED_TAGS_YAML,
            ):
                service = ReleasesService()
                result = service.get_releases_data()

        assert result == expected_result

    def test_get_releases_data_calls_github_client(self):
        """Test that get_releases_data uses the github client."""
        with patch("webapp.github.GH_TOKEN", "test-token"):
            with patch.object(
                ReleasesGitHubClient,
                "fetch_releases_yaml",
                return_value="key: value",
            ) as mock_fetch:
                service = ReleasesService()
                service.get_releases_data()

        mock_fetch.assert_called_once()
