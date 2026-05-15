# Custom Playwright CI image for cbioportal-frontend
#
# Based on the official Microsoft Playwright image and pre-bakes the extra
# tooling that the playwright_e2e_shards CircleCI job (and the local
# scripts/docker-test.sh wrapper) would otherwise install at runtime:
#
#   • jq            – used by scripts/env_vars.sh to parse GitHub API responses
#   • pnpm          – activated by corepack so `pnpm` works without a network
#                     download on first use; matches the rest of the repo
#   • http-server   – used by scripts/serve_dist.sh via ./node_modules/http-server/…
#
# Build image tag: ghcr.io/cbioportal/cbioportal-frontend-playwright-ci:v1.59.1-jammy
# Rebuilt automatically by .github/workflows/build-playwright-ci-image.yml when
# this Dockerfile changes.
#
# Used by:
#   • CircleCI: remote_e2e_shards + remote_e2e jobs (.circleci/config.yml)
#   • Local dev: scripts/docker-test.sh (the canonical screenshot lane)

FROM mcr.microsoft.com/playwright:v1.59.1-jammy

# Install jq (used by scripts/env_vars.sh to parse the GitHub API response
# when resolving the PR's base branch) and mitmproxy via pip (used by
# end-to-end-test-playwright/scripts/run-with-cache-proxy.sh to cache repeat
# requests to *.cbioportal.org during a single test run; see that script's
# header for the wiring).
#
# Why pip rather than apt: Ubuntu jammy ships mitmproxy 6.0.2, which has
# unreliable HTTP/2 + addon-hook firing on modern Chromium TLS. The pip
# release (11.x at time of writing) has a working request/response hook
# pipeline. DEBIAN_FRONTEND=noninteractive prevents tzdata (pulled in
# transitively by python3-pip) from blocking on its interactive prompt.
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends jq python3-pip \
    && pip3 install --no-cache-dir 'mitmproxy>=11,<12' \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack so the `pnpm` shim is on PATH, then pre-fetch and activate
# the exact pnpm version used by the rest of the repo. Without `prepare`,
# corepack downloads pnpm on first use, costing a few seconds × 12 shards
# per run AND requiring network at install time.
#
# COREPACK_HOME is moved to /opt/corepack (out of the build user's $HOME)
# and chmod'd world-readable+writable so that:
#   • CircleCI shards run as root and Just Work.
#   • scripts/docker-test.sh runs the container as `--user $(id -u):$(id -g)`
#     (host uid, NOT root). Without this, /root/.cache/node/corepack is
#     unreadable by the host user and `pnpm` would fail with EACCES.
#   • Drift case (root `packageManager` bumped without rebuilding this
#     image) falls back to corepack's runtime download — slower, but
#     functional, because /opt/corepack is writable.
# ENV persists into runtime, so neither CI nor the wrapper has to
# re-export COREPACK_HOME.
#
# The version is hardcoded rather than read from /package.json because the
# build context is just .circleci/images/playwright/ — the root manifest
# isn't reachable. When bumping the root `packageManager` pnpm version,
# update the line below and the build workflow will rebuild the image
# on push.
ENV COREPACK_HOME=/opt/corepack
RUN corepack enable \
    && corepack prepare pnpm@10.33.0 --activate \
    && chmod -R a+rwX /opt/corepack

# Pre-install http-server@0.11.1 in a fixed location.
# scripts/serve_dist.sh calls ./node_modules/http-server/bin/http-server
# (relative to the repo root); at runtime the CI step creates a single symlink:
#   ln -sfn /opt/serve-deps/node_modules /tmp/repo/cbioportal-frontend/node_modules
# so the hardcoded path resolves without any network download on each shard.
RUN mkdir -p /opt/serve-deps \
    && cd /opt/serve-deps \
    && echo '{"name":"_serve","version":"0.0.0","private":true}' > package.json \
    && npm install --no-save --no-package-lock --no-audit http-server@0.11.1 \
    && npm cache clean --force \
    && rm package.json

