# Dev overrides: empty string = use relative URLs so the proxy handles routing
# (avoids CORS when accessing the dev server from a remote hostname)
export CBIOPORTAL_URL=""
# WSI tile server — enables the H&E Slides tab and sets up the dev proxy
export WSI_TILE_SERVER=""
# Bind to all interfaces so the dev server is reachable by hostname
export HOST=0.0.0.0
