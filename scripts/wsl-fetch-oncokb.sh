#!/usr/bin/env bash
set -eu
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"
export PATH="/mnt/c/Users/user/AppData/Roaming/npm:/mnt/c/Program Files/nodejs:${REPO}/node_modules/.bin:${PATH:-}"
yarn --ignore-engines run fetchOncoKbAPI
yarn --ignore-engines run buildOncoKbAPI
echo "OK: OncoKb API updated."
