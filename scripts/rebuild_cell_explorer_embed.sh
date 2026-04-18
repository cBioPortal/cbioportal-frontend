#!/usr/bin/env bash
# Rebuild the cbioportal-cell-explorer embed bundle and copy it into this repo's
# vendored bundle dir. Run this after making changes to cell-explorer that need
# to show up in cbioportal-frontend.
#
# Assumes the two repos sit as siblings on disk, as set up by the
# cell-explorer-integration orchestrator:
#   ~/projects/cell-explorer-integration/cbioportal-frontend
#   ~/projects/cell-explorer-integration/cbioportal-cell-explorer
#
# Override CCE_DIR to point elsewhere.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$HERE/.." && pwd)"
CCE_DIR="${CCE_DIR:-$(cd "$FRONTEND_DIR/../cbioportal-cell-explorer" && pwd)}"
VENDOR_DIR="$FRONTEND_DIR/src/shared/components/cellExplorerEmbed/vendor"

echo "[cce-embed] building in: $CCE_DIR/packages/app"
(cd "$CCE_DIR/packages/app" && pnpm run build:embed)

echo "[cce-embed] copying to: $VENDOR_DIR"
cp "$CCE_DIR/packages/app/dist-embed/embed.js" "$VENDOR_DIR/embed.js"
cp "$CCE_DIR/packages/app/dist-embed/app.css" "$VENDOR_DIR/app.css"

echo "[cce-embed] done."
ls -lh "$VENDOR_DIR"
