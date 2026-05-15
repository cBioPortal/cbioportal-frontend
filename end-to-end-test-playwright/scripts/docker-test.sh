#!/usr/bin/env bash
# Run the Playwright suite inside our custom Playwright CI Docker image
# (the same image CircleCI uses), pinned to the @playwright/test version
# declared in package.json. This is the *only* supported way to
# generate/update the canonical screenshot references under
# __snapshots__/ — the Docker environment pins OS, fonts, and browser
# builds so references are byte-stable across developer machines and CI.
#
# The custom image (built from .circleci/images/playwright/Dockerfile)
# is FROM mcr.microsoft.com/playwright:v<version>-jammy and adds jq,
# pnpm, and http-server. Using it locally — instead of the bare MS image
# — gives devs the exact same toolchain CI runs against.
#
# Usage:
#   ./scripts/docker-test.sh                      # run against committed baselines
#   ./scripts/docker-test.sh --update-snapshots   # regenerate baselines
#   ./scripts/docker-test.sh timeline             # run a single spec (grep)
#   CBIOPORTAL_URL=https://... ./scripts/docker-test.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
    echo "error: docker is not installed or not on PATH" >&2
    exit 1
fi

# Pin the image to the @playwright/test version declared in package.json.
# Any drift between the image and the library produces flaky comparisons,
# so this MUST stay in lockstep. The custom CI image is tagged with the
# same v<version>-jammy suffix as its MS base, so the same lookup works.
PLAYWRIGHT_VERSION=$(node -p "require('./package.json').devDependencies['@playwright/test'].replace(/^[\^~]/, '')")
IMAGE="ghcr.io/cbioportal/cbioportal-frontend-playwright-ci:v${PLAYWRIGHT_VERSION}-jammy"

echo "Playwright Docker image: ${IMAGE}"
echo "Target: ${CBIOPORTAL_URL:-https://www.cbioportal.org}"

# --ipc=host       avoids Chromium crashes from the default 64 MB shm
# --user           writes files as the host user so snapshots aren't root-owned
# -v ...:/work     mounts the suite; node_modules is reused from host
# PW_DOCKER=1      selected in playwright.config.ts to route snapshots
#                  to the tracked __snapshots__/ directory
# LOCALDEV defaults ON: this suite exists to validate locally-built
# frontend changes against a public backend. Opt out with LOCALDEV=0
# (e.g. to verify against the deployed bundle on cbioportal.org).
#
# --add-host       ensures host.docker.internal points at the host gateway
#                  so the playwright config's
#                  `--host-resolver-rules=MAP localhost host.docker.internal`
#                  can reach `yarn startSSL` on the host's port 3000. On
#                  macOS Docker Desktop this hostname exists already; on
#                  Linux the explicit mapping is required. Harmless on Mac.
LOCALDEV="${LOCALDEV:-1}"
LOCALDEV_ARGS=()
if [[ "${LOCALDEV}" != "0" ]]; then
    LOCALDEV_ARGS+=(--add-host=host.docker.internal:host-gateway)
fi

# The CI image is built for linux/amd64 only; on Apple Silicon we need
# Rosetta emulation. Passing --platform on amd64 hosts is harmless.
PLATFORM_ARGS=(--platform linux/amd64)

# When PW_CACHE_PROXY=1, route the inner command through the caching
# mitmproxy wrapper (proxy/cache_addon.py). The wrapper script starts
# mitmdump on 127.0.0.1:8888, exports HTTPS_PROXY, runs playwright,
# and cleans up. The image must have mitmproxy installed
# (.circleci/images/playwright/Dockerfile bakes it in); PW_CACHE_IMAGE
# lets developers point at a local overlay tag while waiting for that
# image to republish.
PW_CACHE_PROXY="${PW_CACHE_PROXY:-0}"
if [[ "${PW_CACHE_PROXY}" == "1" ]]; then
    IMAGE="${PW_CACHE_IMAGE:-$IMAGE}"
    INNER_CMD=(./scripts/run-with-cache-proxy.sh "$@")
    echo "Caching proxy: enabled (image=${IMAGE}, hosts=${PW_CACHE_HOSTS:-cbioportal.org})"
else
    INNER_CMD=(pnpm exec playwright test "$@")
fi

exec docker run --rm -i \
    "${PLATFORM_ARGS[@]}" \
    --ipc=host \
    --user "$(id -u):$(id -g)" \
    -v "$(pwd):/work" \
    -w /work \
    -e PW_DOCKER=1 \
    -e PW_REMAP_LOCALHOST=1 \
    -e HOME=/tmp \
    -e CBIOPORTAL_URL="${CBIOPORTAL_URL:-https://www.cbioportal.org}" \
    -e CI="${CI:-}" \
    -e LOCALDEV="${LOCALDEV}" \
    -e PW_LOCAL="${PW_LOCAL:-}" \
    -e PW_CACHE_PROXY="${PW_CACHE_PROXY}" \
    -e PW_CACHE_HOSTS="${PW_CACHE_HOSTS:-}" \
    -e PW_CACHE_STATUSES="${PW_CACHE_STATUSES:-}" \
    -e PW_CACHE_LOG="${PW_CACHE_LOG:-}" \
    ${LOCALDEV_ARGS[@]+"${LOCALDEV_ARGS[@]}"} \
    "${IMAGE}" \
    "${INNER_CMD[@]}"
