# Fusion Cohort — Side-by-Side Event Comparison (Design)

**Date:** 2026-06-24
**Branch:** `feat/fusion-cohort-builder`
**Status:** Design approved (visual direction); pending spec review

## Overview

Extend the single-sample fusion visualizer into a **multi-sample, side-by-side
event comparison**. The center of gravity is *comparison of fusion events*, not a
recurrence dashboard: take the high-quality single-fusion diagram and stack N
samples' fusions, aligned on a shared **anchor**, so structural differences
(breakpoint position, retained exons, retained Pfam domains, frame) pop out.

It surfaces in two places on **studyView**: a **data-adaptive table widget on the
Summary page** (top recurrent fusions, or top SV gene pairs when no fusion
annotation exists) for picking a gene pair, and a **dedicated studyView tab next
to CN Segments** that hosts the full two-tier comparison for the selected anchor.

Two anchoring modes, which are the same idea with one knob — *pin an anchor,
stack the variants, align on the anchor*:

- **Same pair, across samples** — both genes fixed (e.g. `TMPRSS2::ERG` in N
  samples). Reveals breakpoint heterogeneity and frame conservation.
- **Shared driver, many partners** — one driver gene fixed on the 5′ side
  (e.g. `KMT2A`), partner varies per row. Reveals driver promiscuity.

A working visual mock lives at
`scratchpad/fusion-compare-mock.html` (faithful to the fusionViewer color/shape
constants). This spec describes turning that into a real cBioPortal tab.

## Layout: two tiers

### Tier 1 — Anchor GeneTrack + breakpoint lollipops (clustering)

The anchor gene is drawn **once** as a real `GeneTrack` (exons `rx:1`, intron
line, direction chevrons, IGV-style TSS bent-arrow, `TRANSCRIBED ▶` pill, 5′/3′
caps, colored strand label). Each sample is a **lollipop** placed at its
breakpoint on the anchor:

- Stem = the breakpoint convention from `GeneTrack`: dashed line in
  `COLOR_BREAKPOINT` (`#FF6B6B`, dash `4 3`).
- Lollipops sharing a breakpoint **stack vertically**, so recurrent hotspots
  (e.g. `TMPRSS2` E1) and outliers read at a glance.
- Head fill encodes frame status (in-frame green, out-of-frame gray, unknown
  hollow), reusing `frameStatusStyle`.

Tier 1 scales to hundreds of samples (lollipops are cheap) and is where
breakpoint scatter is read.

### Tier 2 — Condensed FusionProduct strips (retained structure)

One ~50px row per sample, each a **condensed `FusionProduct`**: retained 5′
exons (`COLOR_5PRIME` `#5A73B3`) → junction → retained 3′ exons
(`COLOR_3PRIME` `#60187D`), to-scale, half-height 5′UTR (per
`splitExonByFivePrimeUtr`), with **Pfam-colored rounded domain bars** (`rx:4`,
`generatePfamDomainColorMap`) in a lane above the 3′ exons. Frame pill + read
count at right.

- Hovering a row shows the red dashed **`DRIVING FUSION`** active outline
  (`#e03131`, dash `5 3`) — the existing active-chrome treatment — signalling
  **click → expand to the full single-fusion `FusionDiagramSVG`**.

## Design decisions (resolved)

1. **Anchor alignment — user-toggleable.** Default **junction-aligned** (junction
   at a fixed x for every row; retained 5′/3′ structure lines up column-wise for
   easy exon/domain comparison). A toggle switches to **anchor-coordinate
   aligned** (shared genomic axis, junction floats) for reading true breakpoint
   positions in Tier 2. Tier 1 is always coordinate-based.

2. **Row sort — breakpoint by default, frame as a filter.** Default order is by
   5′ breakpoint position along the anchor, so rows cluster the same way Tier-1
   lollipops stack. The user can additionally **filter by frame status**
   (in-frame / out-of-frame / unknown) via the existing facet pattern.

3. **Entry point — studyView summary table widget + a studyView tab.** All on the
   **studyView** page (`src/pages/studyView/`), not Results View or patient view:
   - **Summary-page table widget** — a `TableChart`-style widget in the summary
     chart grid, **data-adaptive**:
     - Annotated fusion calls → **top recurrent fusions** (pairs/drivers by sample
       count, frame-colored via `frameStatusStyle`).
     - SVs only (no fusion annotation) → **top SV gene pairs** by sample count.

     Each row is a gene pair; selecting a row sets the active anchor.
   - **studyView comparison tab** — a new `StudyViewPageTabKeyEnum` entry (e.g.
     `FUSION_COMPARISON`) rendered in the tab bar **next to `CN_SEGMENTS`**
     (`StudyViewPage.tsx`). It hosts the full two-tier `FusionComparisonView` for
     the selected anchor. Selecting a row in the summary table routes to this tab
     (via `urlWrapper.setTab`, anchor carried in URL/store). The tab also offers
     the `FusionRecurrenceTable` as an in-tab anchor switcher.

4. **Scale ceiling — virtualized scroll.** Tier 1 renders all samples. Tier 2
   strips render in a **windowed/virtualized scrolling list** so 200+ rows stay
   performant; nothing is hidden or truncated.

## Components

New components (in `src/pages/.../fusionViewer/` or a new `resultsView`
sibling, TBD in plan):

| Component | Purpose | Reuses |
|---|---|---|
| `FusionSummaryTableWidget` | studyView summary widget: table of top fusions (or top SV pairs fallback), frame-colored; row → set anchor + route to tab | `FusionCohortStore`, `frameStatusStyle` |
| `FusionComparisonView` | studyView tab contents: anchor switcher + mode toggle + two tiers | `FusionCohortStore` |
| `AnchorGeneTrackRuler` | Tier 1: anchor GeneTrack + lollipops | `GeneTrack` helpers (`genomicToSvgX`, range/extension), `frameStatusStyle` |
| `FusionProductStrip` | Tier 2: one condensed product row | `fusionProductHelpers` (`computeFusionExonLayout`, `retainedExonsInOrder`), `pfamColors` |
| `FusionStripList` | Virtualized scroll container for strips | — |
| Alignment + frame-filter controls | toggle + facet | existing filter-bar patterns |

Store: extend **`FusionCohortStore`** (already on branch) with:
- `@observable anchor: { mode: 'pair' | 'driver'; key: string }`
- `@observable alignment: 'junction' | 'coordinate'` (default `'junction'`)
- `@observable frameFilter` (already present as `filter.inFrame`)
- `@computed comparisonRows` — carrier events for the anchor, sorted by
  breakpoint, frame-filtered.
- Transcript fetching **deduped by gene** (anchor fetched once; partners
  fetched per distinct partner gene) to avoid N×2 Genome Nexus calls.

## Data flow

```
studyView ─ Summary tab (chart grid)        studyView ─ Comparison tab (next to CN Segments)
  FusionSummaryTableWidget                      FusionComparisonView
   ├ top fusions  (annotated) ─┐                  │ FusionCohortStore: anchor, alignment, frameFilter
   └ top SV pairs (fallback) ──┘ frame-colored    ┌──────────┴───────────────┐
        │ select row → set anchor                 ▼                          ▼
        └── urlWrapper.setTab ───────────▶ AnchorGeneTrackRuler       FusionStripList (virtualized)
                                           (all carriers, Tier 1)      └ FusionProductStrip × visible (Tier 2)
                                                                            │ click
                                                                            ▼
                                                                       FusionDiagramSVG (full expand)
```

## Data-availability degradation

The widget and comparison degrade gracefully with the depth of available data:

| Available data | Widget | Comparison |
|---|---|---|
| Annotated fusions (transcripts, exons, frame) | Table of top recurrent fusions, frame-colored | Full two tiers |
| SVs only (breakpoints, partner genes; no transcript/exon detail) | Table of top SV gene pairs by sample count | **Tier 1 lollipops only** (breakpoint clustering); Tier-2 product strips need exon/transcript data, so collapse to a breakpoint/partner summary line per sample until transcripts are fetched |

Tier-1 needs only breakpoint coordinates; Tier-2 product strips require the
FORTE/Genome-Nexus transcript+exon data the single-fusion viewer already fetches.

## Reuse / refactor

- Lift shared geometry (`genomicToSvgX`, `computeGeneTrackRange`,
  `applyUpstreamExtension`, `computeFusionExonLayout`, `retainedExonsInOrder`)
  as-is — they are already pure and exported.
- The temporary demo mount in `PatientViewPageTabs.tsx` (commit `f43fcf93c`) is
  replaced by the real studyView summary widget; revert the demo commit when the
  real data path is wired.

## Testing

- **Unit (`*.spec.ts`):** breakpoint→x mapping reuse; comparison-row sorting by
  breakpoint; frame filtering; junction vs coordinate alignment math; transcript
  dedup-by-gene.
- **DOM (`*.spec.tsx`):** lollipops stack at shared breakpoints; strip renders
  retained 5′/3′ exons with correct colors and half-height UTR; hover reveals
  active outline; click invokes expand callback.
- **Screenshot:** only the assembled tab at a fixed synthetic cohort (per repo
  guidance, keep small). Use `demoCohortSample.ts` as the fixture.

## Open questions

1. **Routing vs. inline:** selecting a summary-table row routes to the comparison
   tab (current plan) vs. expanding inline on the summary page. (Routing keeps the
   summary grid uncluttered.)
2. **In-tab anchor switcher:** reuse `FusionRecurrenceTable` as-is, or a compact
   dropdown once an anchor is chosen?
3. **Driver-mode 3′ alignment:** partners differ — align partner exons left-from-
   junction (current mock) or by partner-gene coordinate? (Likely left-from-
   junction; confirm during implementation.)
4. **SV-only Tier-2:** confirm the breakpoint/partner summary-line fallback is
   acceptable vs. fetching transcripts on-demand to render full product strips.

## Out of scope (YAGNI)

- Cross-pair "compare tray" / cherry-pick selection (deferred; recurrence-table
  selection covers the primary path).
- OncoPrint / group-comparison integration.
- Persisting/exporting a built cohort.
