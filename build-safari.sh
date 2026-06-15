#!/bin/bash
set -e

RESOURCES="/Users/lukaskessler/Documents/Crew Calendar/Crew Calendar/Shared (Extension)/Resources"

echo "Building extension..."
npm run build

echo "Copying to Safari project..."
rm -rf "$RESOURCES"
mkdir -p "$RESOURCES"
cp -r .output/chrome-mv3/. "$RESOURCES/"

echo "Done! Now press Run in Xcode to update Safari."
