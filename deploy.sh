#!/bin/bash

echo "Building project..."
npm run build

VERSION=$(date +%Y%m%d%H%M%S)
echo "{\"version\": \"$VERSION\"}" > ./dist/version.json
echo "Generated version.json with version: $VERSION"

echo "Deploying files to server..."
scp -r ./dist/* web@84.54.29.68:/var/www/wbozalweb

echo "Done! Сайт обновлен."