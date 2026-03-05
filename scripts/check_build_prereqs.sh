#!/usr/bin/env bash
# Ensures DLL and package builds exist before starting the dev server.
# Run automatically via prestart/prestartSSL hooks in package.json.

if [ ! -f common-dist/common-manifest.json ]; then
    echo "common-dist/common-manifest.json not found, running buildDLL:dev..."
    yarn run buildDLL:dev
fi

if ! ls packages/*/dist/index.js > /dev/null 2>&1; then
    echo "Package builds not found, running buildModules..."
    yarn run buildModules
fi
