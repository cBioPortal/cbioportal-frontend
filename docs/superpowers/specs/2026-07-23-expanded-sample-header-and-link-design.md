# Design: Sample header + fusion-viewer link on the expanded strip panel

**Branch:** `feat/fusion-transcript-exon` (worktree off `feat/fusion-cohort-builder`)
**Date:** 2026-07-23
**Status:** DESIGN — approved in brainstorming, pending spec review

## Problem
In the fusion cohort builder, clicking a sample strip expands that sample's full
`FusionDiagramSVG` at the bottom of the view (the `data-testid="expanded-diagram"`
block in `FusionComparisonView.tsx`). Today that block renders **only** the diagram
in a bare `<div>` — there is no sample label and no way to jump to that sample's
real single-patient fusion viewer.

## Behavior
Add a small header row **above** the existing `<FusionDiagramSVG>` in the expanded
block, showing, left to right:

1. **Sample name** — `expandedRow.sampleId`, bold.
2. **Gene pair** — `${fivePrimeSymbol} → ${threePrimeSymbol}` (5′ → 3′). For a
   single-gene event (`threePrimeSymbol` null) show just `fivePrimeSymbol`.
3. **Frame** — the human-readable frame label via the existing
   `frameStatusStyle(expandedRow.frame).label` helper (same wording the strips use).
4. **Link** — `Open in fusion viewer ↗`, opening the sample's single-patient fusion
   viewer **tab** in a **new browser tab**.

## Link construction
- Deep link target: the patient view opened on the fusion viewer tab, scoped to the
  sample: path segment `patient/fusionViewer` with a `sampleId` query param. The tab is
  selected by the **path segment** (`activeTabId = pathName.split('/').pop()`), NOT a
  `tab=` query; the sample is loaded via the `sampleId` query param (which puts the
  patient page in `'sample'` mode). Built with `getSampleViewUrlWithPathname(studyId,
  sampleId, 'patient/fusionViewer')` from `shared/api/urls` (confirmed signature:
  `(studyId, sampleId, pathname='patient', navIds?)`; wraps
  `buildCBioPortalPageUrl(pathname, { sampleId, studyId })`).
- **Reuse (and fix) the existing shared helper.** `data/cohortLinks.ts` already exports
  `sampleFusionViewerHref(studyId, sampleId)` — used live by the cohort matrix
  (`FusionCohortMatrix.tsx:55`) — but it is **broken**: it emits `tab=fusionViewer` (a
  query param the router ignores → always lands on Summary) and puts `sampleId` into
  `caseId` (loaded as a patientId → wrong case). This design **rewrites
  `sampleFusionViewerHref` to delegate to `getSampleViewUrlWithPathname(studyId,
  sampleId, 'patient/fusionViewer')`**, fixing the matrix's sample links for free, and
  the new expanded-panel link reuses the corrected helper (one link-builder, DRY). The
  `'fusionViewer'` literal stays in the pathname string (with the existing comment)
  rather than importing `PatientViewPageTabs`, preserving the original circular-import
  avoidance.
- `studyId = this.studyIdBySampleId.get(expandedRow.sampleId)` — the existing computed
  already maps sampleId → studyId from the raw structural variants.
- Rendered as an `<a href={sampleFusionViewerHref(studyId, sampleId)} target="_blank"
  rel="noopener noreferrer">`.

## Scope decisions
- **Sample-scoped, not patient-scoped:** we have `sampleId` + `studyId` directly, so
  a sample-scoped URL lands on the exact sample and needs no `patientId` lookup (no new
  `patientIdBySampleId` computed).
- **No fusion pre-selection (deferred):** the URL only selects a tab; there is no
  param to auto-select a specific gene pair, and adding one would require changes to
  `PatientViewUrlWrapper` / `FusionViewerStore` on the patient-view side. Out of scope
  here. The link opens the sample's fusion tab; the user picks the fusion from the
  sidebar. A follow-up can add pre-selection if desired.
- **New tab:** `target="_blank"` so the cohort view + current strip selection stay put.

## Edge cases
- **studyId missing** (sample not found in `studyIdBySampleId`): render the sample
  name + gene pair + frame, but omit the link (nothing to link to). Do not render a
  dead/`#` link.
- **Single-gene event:** gene pair shows only `fivePrimeSymbol` (no arrow).
- The header must not disturb the existing `orientedEvent` / `FusionDiagramSVG` render
  logic already in the block — it is added as a sibling above the diagram.

## Files touched
| File | Change |
|---|---|
| `data/cohortLinks.ts` (+spec) | Rewrite `sampleFusionViewerHref` to delegate to `getSampleViewUrlWithPathname(studyId, sampleId, 'patient/fusionViewer')` (path-based tab + `sampleId` param); update `cohortLinks.spec.ts` to assert the corrected format. Fixes the matrix links for free. |
| `FusionComparisonView.tsx` (+spec) | Add the header row (sample name + gene pair + frame + link) inside the `expanded-diagram` block, above `<FusionDiagramSVG>`; import `sampleFusionViewerHref` from `./data/cohortLinks` and `frameStatusStyle` from `./components/frameStatusStyle` |

## Testing
- Header renders the sample id, the `GENE → GENE` pair, and the frame label for an
  expanded row.
- Link href equals `getSampleViewUrlWithPathname(studyId, sampleId, 'patient/fusionViewer')`
  and has `target="_blank"` when studyId resolves.
- Link is omitted when `studyIdBySampleId` has no entry for the sample.
- Single-gene event shows only the 5′ symbol (no arrow).

## Out of scope
- Auto-selecting the specific fusion in the opened viewer (deferred; patient-view-side change).
- Patient-scoped linking / `patientIdBySampleId`.
