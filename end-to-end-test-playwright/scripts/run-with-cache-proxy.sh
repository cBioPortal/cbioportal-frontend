#!/usr/bin/env bash
# Inner entrypoint that runs `playwright test` behind a local caching
# MITM proxy.
#
# Started by scripts/docker-test.sh (and by the CircleCI playwright_e2e
# jobs) when PW_CACHE_PROXY=1. It:
#   1. starts mitmdump with proxy/cache_addon.py on 127.0.0.1:8888,
#   2. waits for the proxy to accept connections,
#   3. exports HTTPS_PROXY / HTTP_PROXY so Chromium (launched by
#      Playwright) routes through it,
#   4. runs `pnpm exec playwright test "$@"`,
#   5. always kills the proxy on exit so the container shutdown is clean.
#
# HTTPS_PROXY/HTTP_PROXY are the source of truth: playwright.config.ts
# reads them to set `use.proxy.server` *and* Chromium's launch-level
# `--proxy-server` flag. Keeping the env var as the toggle means the
# proxy can be enabled/disabled per-run without touching the config.
# The launch-level flag is required on top of `use.proxy` because
# chromium-headless-shell was observed to silently no-op the CDP-level
# proxy setting for HTTPS traffic (see the comment in playwright.config.ts).
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v mitmdump >/dev/null 2>&1; then
    # The canonical CI image installs mitmproxy at build time (see
    # .circleci/images/playwright/Dockerfile). On a PR whose Dockerfile
    # change hasn't reached GHCR yet — typically the first run of a
    # branch from a fork, since the image-rebuild workflow only fires
    # on the main repo — install at runtime so we can still exercise
    # the cache wiring. Once the canonical image is rebuilt this whole
    # block is skipped because mitmdump is already on PATH.
    echo "[proxy] mitmdump not present; installing via pip (one-time-per-container)..."
    if ! command -v pip3 >/dev/null 2>&1; then
        DEBIAN_FRONTEND=noninteractive apt-get update -qq \
            && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3-pip
    fi
    pip3 install --quiet --no-cache-dir 'mitmproxy>=11,<12' || {
        echo "error: pip install mitmproxy failed" >&2
        exit 1
    }
    command -v mitmdump >/dev/null 2>&1 || {
        echo "error: mitmdump still missing after pip install" >&2
        exit 1
    }
fi

PROXY_HOST="${PW_CACHE_PROXY_HOST:-127.0.0.1}"
PROXY_PORT="${PW_CACHE_PROXY_PORT:-8888}"
ADDON="$(pwd)/proxy/cache_addon.py"

# mitmproxy stores its generated CA + config in confdir. Put it under
# /tmp so it works for non-root users and disappears with the container.
MITM_CONFDIR="${MITM_CONFDIR:-/tmp/mitm-ca}"
mkdir -p "$MITM_CONFDIR"

echo "[proxy] starting mitmdump on ${PROXY_HOST}:${PROXY_PORT}"
echo "[proxy] allowlist=${PW_CACHE_HOSTS:-cbioportal.org}"

mitmdump \
    -s "$ADDON" \
    --listen-host "$PROXY_HOST" \
    --listen-port "$PROXY_PORT" \
    --set confdir="$MITM_CONFDIR" \
    --set flow_detail=0 \
    > /tmp/mitmdump.log 2>&1 &
PROXY_PID=$!

stop_proxy() {
    if kill -0 "$PROXY_PID" 2>/dev/null; then
        kill "$PROXY_PID" 2>/dev/null || true
        wait "$PROXY_PID" 2>/dev/null || true
    fi
}
# Belt-and-braces: if the script dies between starting the proxy and
# the explicit stop_proxy below, EXIT still kills it.
trap stop_proxy EXIT INT TERM

# Wait for the proxy to bind. mitmdump prints "HTTP(S) proxy listening
# at ..." once ready; we poll the TCP port instead because that's
# language-agnostic.
for _ in $(seq 1 50); do
    if (echo > "/dev/tcp/${PROXY_HOST}/${PROXY_PORT}") 2>/dev/null; then
        echo "[proxy] up"
        break
    fi
    sleep 0.2
done

if ! (echo > "/dev/tcp/${PROXY_HOST}/${PROXY_PORT}") 2>/dev/null; then
    echo "[proxy] failed to bind ${PROXY_HOST}:${PROXY_PORT}; mitmdump log:" >&2
    cat /tmp/mitmdump.log >&2 || true
    exit 1
fi

export HTTP_PROXY="http://${PROXY_HOST}:${PROXY_PORT}"
export HTTPS_PROXY="http://${PROXY_HOST}:${PROXY_PORT}"

set +e
pnpm exec playwright test "$@"
TEST_EXIT=$?
set -e

# Shut the proxy down BEFORE tailing the log: mitmproxy 11 buffers
# its addon log output and only flushes on shutdown, so reading the
# file while mitmdump is still running shows nothing.
stop_proxy

echo "[proxy] mitmdump summary + addon log lines:"
grep -E "\[cache\]|Loading|HTTP\(S\) proxy|error|Error" /tmp/mitmdump.log \
    || tail -n 30 /tmp/mitmdump.log \
    || true

exit "$TEST_EXIT"
