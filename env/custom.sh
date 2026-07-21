# Dev overrides: empty string = use relative URLs so the proxy handles routing
# (avoids CORS when accessing the dev server from a remote hostname)
export CBIOPORTAL_URL=""
# Route frontend development API calls to the local cBioPortal backend.
export CBIOPORTAL_PROXY_TARGET="http://localhost:8090"
# WSI runtime mode: direct keeps the browser baseline on :8081; proxied makes
# the browser use the current origin (for the shared nginx rehearsal).
export WSI_RUNTIME_MODE="${WSI_RUNTIME_MODE:-direct}"
export WSI_AUTH_ENABLED="${WSI_AUTH_ENABLED:-false}"
# WSI_TILE_SERVER controls the rspack dev-server proxy target in proxied mode.
export WSI_TILE_SERVER="http://localhost:8081"
# Bind to all interfaces so the dev server is reachable by hostname
export HOST=0.0.0.0
