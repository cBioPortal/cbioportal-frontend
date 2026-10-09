# cbioportal-wsi-viewer

The cBioPortal whole-slide image (WSI) viewer. It lists a patient's pathology slides by specimen and shows the selected one with OpenSeadragon. Tiles and thumbnails come from the cBioPortal tile server.

The package holds the viewer only. It never imports cBioPortal app code: the host injects portal services at startup, and puts the viewer inside its own pages, such as the patient Pathology Slides tab or the standalone `/wsi/patient/:id` route.

## Entries

| Import | Contents | Load |
| --- | --- | --- |
| `cbioportal-wsi-viewer` | Types, `configureWsiViewerRuntime`, `fetchWsiPatientHierarchy` (loads a patient's hierarchy through the viewer's cache, e.g. to decide whether to show a slides tab), `#wsi:` URL-state helpers, the theme (`WSI_THEME`, widths, section-title and list styles) and the panel chrome (`WsiPanelHideButton`, `WsiCollapsedRail`, stored panel flags) | Static, and small |
| `cbioportal-wsi-viewer/viewer` | The React viewer (default export, also `WsiViewer`) | Lazily, e.g. with `React.lazy` |

OpenSeadragon is not in either entry. The viewer loads it on the first slide open as its own async chunk (`wsi-openseadragon`), so pages without slides never download it. In the app, `scripts/assert_wsi_osd_bundle.js` checks this after a production build.

## Using it in a host

1. **Configure the runtime once, at startup, before any viewer renders:**

   ```ts
   import { configureWsiViewerRuntime } from 'cbioportal-wsi-viewer';

   configureWsiViewerRuntime({
       buildApiUrl: path => buildCBioPortalAPIUrl(path), // adds the portal's context path
       osdPrefixUrl: '/reactapp/osd-images/', // optional: OpenSeadragon button images
       // fetchImpl: …                  // optional (default: the global fetch)
   });
   ```

2. **Render the viewer lazily:**

   ```tsx
   const WsiViewer = React.lazy(() => import('cbioportal-wsi-viewer/viewer'));

   <React.Suspense fallback={<Loading />}>
       <WsiViewer
           studyId="mskimpact"
           patientId="P-0000689"
           tileServerUrl="https://portal.example.org/wsi"
           authScope={userName}        // isolates the in-memory caches per user
           height={720}
       />
   </React.Suspense>
   ```

The cBioPortal app does both in `src/shared/components/wsiViewer/wsiAppConfig.tsx` (`buildWsiViewerConfig`, `AppWsiViewer`). `src/appBootstrapper.tsx` installs the runtime.

### Main props (`WsiViewerProps`)

| Prop | Purpose |
| --- | --- |
| `studyId`, `patientId` | The patient whose slides are shown. Changing `patientId` reloads the viewer in place |
| `tileServerUrl` | Tile-server base URL (e.g. the portal's `msk.wsi.tile_server.url`) |
| `authScope` | Subject used to isolate protected in-memory caches, normally the user name |
| `height` | Viewer height in pixels |
| `requestedSlideKey` | Slide to open, as from a `slideKey` viewer link. A `#wsi:` hash with a viewport takes precedence |
| `initialStainFilter`, `initialMatchFilter`, `preferredSampleId`, `pathologyFilter` | Initial slide-list filters and selection, e.g. from a table link |
| `on…Change`, `onClearFilters` | Report filter changes back to the host, e.g. to keep them in the page URL |
| `clinicalRows` | Rows for the sidebar's Clinical section, in display order. A row with a `sampleId` shows only for that sample's slides. Unset hides the section |
| `navCollapsed` / `metadataCollapsed` (+ change callbacks) | Control the hideable slide list and details sidebar. Unset, the viewer remembers the user's choice in `localStorage` |
| `showDownload`, `renderLoading` | Show the download-view control; a custom loading indicator |
| `hidden` | The host hides the viewer without unmounting it, e.g. in an inactive tab. Token refresh pauses meanwhile |

## Portal contract

The viewer talks to the cBioPortal backend and tile server only:

| Request | Use |
| --- | --- |
| `GET {api}/api/wsi/v2/hierarchy/{studyId}/{patientId}` | The patient's samples → parts → blocks → slides. An empty hierarchy means no slides; 404 means an unknown study or patient |
| `GET {api}/api/wsi/v2/resources/{studyId}/{patientId}/access?slideKey=…` | Short-lived access for one slide: a signed token and the tile metadata (no source location) |
| `{tileServerUrl}/tiles/zxy/{level}/{x}/{y}`, `{tileServerUrl}/thumbnails` | Tiles and thumbnails, authorized with the access token |

On the backend, slides are `resource_data` rows of the `WSI_SAMPLE`/`WSI_PATIENT` resources (`TYPE=WHOLE_SLIDE_IMAGE`). Their private serving metadata stays on the server, and the viewer sees only the hierarchy and per-slide access responses.

The viewer stores the selected slide and viewport in the URL hash (`#wsi:slide=…&x=…&y=…&z=…`) so a view can be shared.

## Development

```sh
pnpm --filter cbioportal-wsi-viewer run build   # rollup: dist/ (CJS) and dist/es/ (ESM), one file per module
pnpm --filter cbioportal-wsi-viewer run watch
pnpm --filter cbioportal-wsi-viewer run test    # Jest (jsdom)
```

From the repository root, `pnpm run buildModules` builds every package, and the app resolves this one from `dist/`. So rebuild after changing the package, before running the app's typecheck, tests or build.

`viewer.js` at the package root re-exports `dist/viewer.js`, for resolvers that ignore `package.json` `exports`, such as Jest 27.

Rules for changes:

- Keep the package free of app imports (`config/…`, `shared/…`, `pages/…`). Anything portal-specific goes through `WsiViewerConfig` or a prop.
- Keep `openseadragon` behind the dynamic import in `wsiOpenSeadragonLoader.ts`.
- Export from the light entry only what hosts import statically. Components and anything heavy belong in `viewer`.
