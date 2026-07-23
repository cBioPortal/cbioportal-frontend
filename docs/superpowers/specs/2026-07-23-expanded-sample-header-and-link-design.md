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
  sample: `/patient/fusionViewer?studyId=<studyId>&sampleId=<sampleId>`.
- Built with the existing helper `getSampleViewUrlWithPathname(studyId, sampleId,
  'patient/fusionViewer')` from `shared/api/urls` (confirm exact arg order + that it
  accepts the tab-bearing pathname during planning; it wraps
  `buildCBioPortalPageUrl(pathname, { sampleId, studyId }, hash)`).
- `PatientViewPageTabs.FusionViewer` (`'fusionViewer'`) is the tab segment; use the
  enum, not a literal, so a rename stays in sync.
- `studyId = this.studyIdBySampleId.get(expandedRow.sampleId)` — the existing computed
  already maps sampleId → studyId from the raw structural variants.
- Rendered as an `<a href={url} target="_blank" rel="noopener noreferrer">`.

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
| `FusionComparisonView.tsx` (+spec) | Add the header row (sample name + gene pair + frame + link) inside the `expanded-diagram` block, above `<FusionDiagramSVG>`; import `getSampleViewUrlWithPathname` + `PatientViewPageTabs` |

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
