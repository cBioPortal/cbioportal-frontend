# failures-viewer

Static single-page app that reads a Playwright JSON report and renders
every failure with links to error-context, trace, screenshots, plus an
opacity-slider overlay that superimposes `actual` on `expected` (default
50%) for subpixel-diff investigation. A toolbar button toggles every
overlay open or closed at once, and a filter box narrows the list by
test name or file.

## Generating a report

The Playwright config emits `test-results/report.json` on every run
(alongside `list` and `html` reporters). To force a fresh JSON from an
ad-hoc run:

```bash
npx playwright test --reporter=json > test-results/report.json
```

## Viewing

Serve from the Playwright project root so both `report.json` and the
attachment files (under `test-results/…/`) are reachable:

```bash
cd end-to-end-test-playwright
python3 -m http.server 9323 --bind 0.0.0.0
# open http://<host>:9323/scripts/failures-viewer/
```

Override the report or the attachment base via query string:

```
.../failures-viewer/?report=/some/other/report.json&base=/absolute/prefix/
```

`base` is prepended to any non-absolute attachment path, and to the
portion of absolute paths after `/test-results/`.

## Filesystem-scan fallback

`build.sh` is a legacy bash builder that scans `test-results/` directly
(no JSON required). It's kept as a fallback for runs where the JSON
reporter wasn't active (e.g. older stability-run logs that forced
`--reporter=line`). Output drops at `/tmp/failures-index/index.html`.
