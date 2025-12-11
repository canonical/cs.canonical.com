#!/bin/bash
# Update version across all files

set -e

if [ $# -ne 1 ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.2"
    exit 1
fi

NEW_VERSION=$1

APP_VERSION=$(jq -r .version package.json)

if [ "$NEW_VERSION" = "$APP_VERSION" ]; then
  echo "No changes needed. Current app version is $APP_VERSION."
  exit 2
fi

echo "Updating version to $NEW_VERSION..."

# Update package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update rockcraft.yaml
sed -i "s/version: \".*\"/version: \"$NEW_VERSION\"/" rockcraft.yaml

# Update charm/src/charm.py
sed -i "s/VERSION = \".*\"/VERSION = \"$NEW_VERSION\"/" charm/src/charm.py

echo "✅ Version updated to $NEW_VERSION in all files:"
echo "  - package.json"
echo "  - rockcraft.yaml" 
echo "  - charm/src/charm.py"

# Verify the changes
echo ""
echo "Verification:"
echo "package.json: $(grep '"version"' package.json)"
echo "rockcraft.yaml: $(grep 'version:' rockcraft.yaml)"
echo "charm/src/charm.py: $(grep 'VERSION =' charm/src/charm.py)"