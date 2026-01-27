import pytest

from webapp.releases_manager import ReleaseYamlParser

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
        
        assert result["release_date"]["has_custom_tag"] is True
        assert result["release_date"]["type"] == "date"
        assert result["release_date"]["value"] == "October 2025"

    def test_parse_mapping_custom_tag(self, parser):
        """Test parsing mapping values with custom tags."""
        result = parser.parse_yaml(MAPPING_TAGS_YAML)
        
        assert result["logo"]["has_custom_tag"] is True
        assert result["logo"]["type"] == "image"
        assert result["logo"]["value"]["url"] == "https://example.com/image.png"
        assert result["logo"]["value"]["width"] == 100

    def test_parse_yaml_with_mixed_tags(self, parser):
        """Test parsing YAML with multiple different custom tags."""
        result = parser.parse_yaml(MIXED_TAGS_YAML)
        
        assert result["release_date"]["type"] == "date"
        assert result["docs_url"]["type"] == "link"
        assert result["logo"]["has_custom_tag"] is True
        assert result["logo"]["type"] == "image"
        assert result["logo"]["value"]["url"] == "https://example.com/image.png"

    def test_preserves_key_order(self, parser):
        """Test that key order from YAML is preserved."""
        result = parser.parse_yaml(ORDERED_YAML)
        keys = list(result.keys())
        
        assert keys == ["first", "second", "third", "fourth"]

