from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap


class TaggedField:
    """Wrapper class to hold data & tag information in memory."""
    def __init__(self, value, tag_type):
        self.value = value
        self.tag_type = tag_type


class ReleaseYamlParser:
    def __init__(self):
        self.yaml = YAML(typ="rt")
        self.yaml.constructor.add_multi_constructor(
            '',
            self._construct_custom_tag
        )

    def _construct_custom_tag(self, loader, tag_suffix, node):
        """Extacts custom tagged fields from YAML nodes."""
        tag_name = node.tag.lstrip('!')
        
        if node.id == 'scalar':
            value = loader.construct_scalar(node)
        elif node.id == 'mapping':
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
                "has_custom_tag": True
            }
        
        elif isinstance(node, dict):
            return {k: self._serialize_node(v) for k, v in node.items()}
        
        return node

    def parse_yaml(self, yaml_content):
        """Reads YAML string, parses it, and serializes to JSON."""
        data = self.yaml.load(yaml_content)
        return self._serialize_node(data)


class ReleasesService:
    def __init__(self, parser: ReleaseYamlParser):
        self.parser = parser
    
    def get_releases_data(self) -> dict:
        yaml_content = self._fetch_yaml()
        return self.parser.parse_yaml(yaml_content)
    
    def _fetch_yaml(self) -> str:
        # TODO: Replace with github api
        with open("TEMP_releases.yaml") as f:
            return f.read()
