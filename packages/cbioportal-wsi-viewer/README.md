# cbioportal-wsi-viewer

The cBioPortal whole-slide image (WSI) viewer. It lists a patient's pathology slides by specimen and shows the selected one with OpenSeadragon. Tiles and thumbnails come from the cBioPortal tile server.

The package holds the viewer only. It never imports cBioPortal app code: the host injects portal services at startup, and puts the viewer inside its own pages, such as the patient Pathology Slides tab or the standalone `/wsi/patient/:id` route.

## Entries

| Import | Contents | Load |
| --- | --- | --- |
| `cbioportal-wsi-viewer` | Types, `configureWsiViewerRuntime`, `fetchWsiPatientHierarchy` (loads a patient's hierarchy through the viewer's cache, e.g. to decide whether to show a slides tab), `#wsi:` URL-state helpers, the theme (`WSI_THEME`, widths, section-title and list styles) and the panel chrome (`WsiPanelHideButton`, `WsiCollapsedRail`, stored panel flags) | Static, and small |
| `cbioportal-wsi-viewer/viewer` | The React viewer (default export, also `WsiViewer`) | Lazily, e.g. with `React.lazy` |

OpenSeadragon is not in either entry. The viewer loads it on the first slide open as its own async chunk (`wsi-openseadragon`), so pages without slides never download it. In the app, `pnpm run checkWsiBundle` (`scripts/assert_wsi_osd_bundle.js`) checks this on a production build; CI runs it after the build.

## Using it in a host

1. **Configure the runtime once, at startup, before any viewer renders:**

   ```ts
   import { configureWsiViewerRuntime } from 'cbioportal-wsi-viewer';

   configureWsiViewerRuntime({
       buildApiUrl: path => buildCBioPortalAPIUrl(path), // adds the portal's context path
       buildPageUrl: (path, query) => buildCBioPortalPageUrl(path, query), // optional: sidebar patient/sample links (default: root-relative)
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
           tileServerUrl="/wsi"        // same-origin with the portal
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
| `tileServerUrl` | Tile-server base URL, the portal's `wsi_tile_server_url`. It must be same-origin with the portal, e.g. `/wsi` on the portal host (see [Portal contract](#portal-contract)). A trailing slash is optional |
| `authScope` | Subject used to isolate protected in-memory caches, normally the user name |
| `height` | Viewer height in pixels |
| `requestedSlideKey` | Slide to open, as from a `slideKey` viewer link. A `#wsi:` hash with a viewport takes precedence |
| `initialStainFilter`, `initialMatchFilter`, `preferredSampleId`, `pathologyFilter` | Initial slide-list filters and selection, e.g. from a table link |
| `clinicalRows` | Rows for the sidebar's Clinical section, in display order. A row with a `sampleId` shows only for that sample's slides. Unset hides the section |
| `navCollapsed` / `metadataCollapsed` (+ change callbacks) | Control the hideable slide list and details sidebar. Unset, the viewer remembers the user's choice in `localStorage` |
| `showDownload`, `renderLoading` | Show the download-view control; a custom loading indicator |
| `hidden` | The host hides the viewer without unmounting it, e.g. in an inactive tab. The panel shortcuts are off and OpenSeadragon ignores the collapsed container's size meanwhile |

## Portal contract

The viewer talks to the cBioPortal backend and tile server only:

| Request | Use |
| --- | --- |
| `POST {api}/api/resource-table/query/fetch` (`WSI_SAMPLE`, `WSI_PATIENT`) | The patient's slide rows. The viewer groups them into samples → parts → blocks → slides; no rows means no slides |
| `{tileServerUrl}/tiles/zxy/{z}/{x}/{y}?studyId=…&key=…&enc=…` | One tile of a slide |
| `{tileServerUrl}/thumbnails?studyId=…&key=…&enc=…&width=…&height=…` | A slide's thumbnail, at most `width`×`height`; the tile server sizes it from the stored one |

Slides are rows of the `WSI_SAMPLE`/`WSI_PATIENT` resources, one per slide, written by the data provider's pipeline. A row's `metadata` carries the slide's fields and, for a slide that can serve tiles, `serving` with its key (`serving.key`, equal to `slide_key`), sealed source (`serving.sealed_source`) and tile metadata (`serving.tile_metadata_json`). Tile and thumbnail requests name the slide by `studyId`, `key` and `enc` (the sealed source), all URL-encoded; the viewer never sends the source image id, and never displays the sealed source. Only the tile server can open the sealed source.

Access is checked in front of the tile server, not by the viewer: tile and thumbnail requests carry the portal session cookie, and the ingress allows them only if that session can read the study (`GET {api}/api/studies/{studyId}`). No token or `Authorization` header is sent.

So `wsi_tile_server_url` must be same-origin with the portal, such as `/wsi` on the portal host. Thumbnails are fetched with `credentials: 'same-origin'` and tiles with OpenSeadragon's XHR without credentials, so a cross-origin tile server never receives the cookie and the ingress refuses every request. The viewer logs a `console.error` once when the configured URL is cross-origin.

Only the ingress answers 401/403, meaning the session expired or lacks access to the study; the tile server answers its own refusals (a source it will not open, an `enc` that does not match the `key`) with 404. A tile answered 401/403 puts the viewer in its error state, asking the user to reload or sign in again. A failed thumbnail never fails the slide: the slide list retries or hides it, and the slide opens without its preview.

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
