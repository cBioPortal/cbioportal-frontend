# Design: Histogram transcript selector + junction exon labels on strips

**Branch:** `feat/fusion-transcript-exon` (worktree off `feat/fusion-cohort-builder`)
**Date:** 2026-07-22
**Status:** DESIGN — approved in brainstorming, pending spec review

Two independent, low-risk additions to the fusion cohort builder
(`src/pages/patientView/fusionViewer/`), driven by user feedback:

1. Let the user choose which transcript the breakpoint **histogram** bins against.
2. Label the **junction exons** flanking the breakpoint seam on the sample / dense / collapsed strips.

Both build on data and patterns that already exist — neither changes the data model.

---

## Feature 1 — Histogram transcript selector

### Problem
The breakpoint histogram (`components/AnchorGeneTrackRuler.tsx`) is hard-wired to bin
against the **MSK-canonical** isoform of each gene, via
`FusionComparisonView.anchorTranscript` → `transcriptForGene(gene)` (the `transcriptId=''`
canonical key). There is no way to view the breakpoint distribution against a different
transcript's exon/intron structure.

Note: **FORTE selects transcripts per-sample, not per-cohort**, so there is no single
cohort-level "FORTE transcript." The cohort histogram reference is the canonical isoform,
and the picker simply exposes every Genome Nexus transcript for the gene.

### Behavior
- A **single-select** transcript picker per gene, rendered near that gene's histogram
  (beside the existing `trackMode` feature/genomic toggle).
- Options: **every Genome Nexus transcript for the gene**, with the **MSK-canonical
  transcript as the default** (tagged `(canonical)` in its label, matching existing display naming).
- Selecting a transcript re-bins **that gene's** histogram (both `feature` and `genomic`
  track modes) against the chosen transcript's exons/introns and relabels the exon axis.
- **Scope:** histogram only. The strips and collapse grouping are unaffected — they remain
  driven by each sample's own caller isoform (`transcriptForRow`), which is the biologically
  correct per-sample product. The two systems stay independent.

### Why it's low-risk
- `assignBreakpointsToFeatures` (AnchorGeneTrackRuler) is transcript-agnostic — it bins
  genomic breakpoint coordinates against whatever transcript's intervals it is given.
- Breakpoints are genomic coordinates snapped to the anchor gene, independent of the
  reference transcript, so swapping the reference is purely a re-binning of existing points.
- Any transcript isoform can already be fetched — `FusionComparisonView.transcriptRequests`
  requests transcripts by id through `data/genomeNexusTranscriptService.ts`.

### Components / changes
- **`FusionCohortStore.ts`**
  - `@observable histogramTranscriptIdByGene = observable.map<string, string>()`
    (gene HUGO symbol → chosen Ensembl transcript id; absent/empty ⇒ canonical).
  - `@action setHistogramTranscript(geneSymbol, transcriptId)`.
- **`FusionComparisonView.tsx`**
  - `anchorTranscript` / `partnerTranscript` computeds resolve the override:
    if `histogramTranscriptIdByGene` has an entry for the gene, return that isoform from
    `transcriptsByKey` (fetching it via the existing `transcriptRequests` reaction if not
    yet loaded); otherwise fall back to canonical (current behavior).
  - Ensure the chosen isoform is included in the set of transcripts requested for the gene.
  - Render a per-gene `<select>` above/beside each `AnchorGeneTrackRuler`. Populate from the
    gene's full transcript list (same source the single-patient `FusionInfoBar`
    `TranscriptCheckboxList` uses); canonical selected by default.
- **No change** to `AnchorGeneTrackRuler.tsx` binning logic — it already accepts a transcript.

### Edge cases
- Chosen isoform still loading ⇒ histogram keeps rendering against canonical until the
  fetch resolves, then recomputes (standard `remoteData`/computed behavior).
- Gene with a single transcript ⇒ picker shows one option (canonical), effectively a no-op.
- Switching gene anchor/orientation ⇒ overrides are keyed by gene symbol, so they persist
  correctly per gene.

---

## Feature 2 — Junction exon labels on strips

### Problem
Strips (`components/FusionProductStrip.tsx`) draw one `<rect>` per retained exon but carry
**no exon-number labels**, unlike the histogram and `GeneTrack`. Users can't tell which
exons flank the fusion junction without opening the full per-sample diagram.

### Behavior
Label the **two exons flanking the red breakpoint seam**:
- last retained **5′** exon and first retained **3′** exon, e.g. `E7 | E2`.
- Applies to **all three strip modes**: `sample`, `dense`, and `collapsed`.

The retained exon arrays (`retained5p` / `retained3p`) are already computed for every strip
via `retainedExonsInOrder(transcript, breakpoint, is5Prime)` and each `Exon` carries
`.number`, so this is pure labeling — no data-model change. Ordering is already
strand/orientation-aware, so "last retained 5′" and "first retained 3′" are well-defined
(they are the exons adjacent to the junction seam in draw order).

### Three switchable placement strategies
A `junctionLabelMode` toggle renders one of three strategies so the user can compare live
and choose:

1. **`inline-tooltip`** (default)
   - `sample`: small `E7|E2` text rendered at the seam.
   - `dense`: no inline text (7px rows can't fit it); folded into the existing hover
     `<title>` (e.g. `E7→E2 · in-frame · 42 reads`).
   - `collapsed`: inline `E7|E2` at the seam on the representative row.
2. **`inline-both`**
   - `sample` / `collapsed`: inline at seam (same as above).
   - `dense`: a tiny label floated just above the seam line.
3. **`gutter`**
   - All modes: a thin `E7|E2` text column in the right gutter. In `dense`/`collapsed` this
     sits alongside (or in place of) the existing frame cell.

### Components / changes
- **`FusionProductStrip.tsx`**
  - Compute `junctionExons = { fivePrime: last(retained5p)?.number, threePrime: first(retained3p)?.number }`
    from the arrays already in scope.
  - Render per active `junctionLabelMode` and current strip mode (`compact`/`countLabel`
    flags already distinguish sample/dense/collapsed).
  - Extend the hover `<title>` to include `E7→E2` when in `inline-tooltip` dense.
- **`FusionCohortStore.ts`**
  - `@observable junctionLabelMode: 'inline-tooltip' | 'inline-both' | 'gutter' = 'inline-tooltip'`
    + `@action setJunctionLabelMode`.
- **`FusionComparisonView.tsx`**
  - A segmented control (cBioPortal `ButtonGroup`, matching the strip-mode toggle) near the
    existing strip-mode / histogram toggles; pass `junctionLabelMode` down through
    `FusionStripList` → `FusionProductStrip`.

### Edge cases
- **Single-gene / intragenic event** (no 3′ partner) ⇒ show just `E7` (omit the `| E2`).
- **Breakpoint inside an exon vs an intron** ⇒ already resolved by `retainedExonsInOrder`;
  the last/first retained exon is well-defined either way.
- **Empty retained array** (e.g. transcript not yet loaded) ⇒ omit that side's label; no crash.
- **Label collision in `gutter` mode with the frame cell** ⇒ decide at review time whether
  to sit alongside or replace the frame cell; default alongside for `sample`, replace-or-shrink
  for `dense` where width is tight.

---

## Testing

Follow existing TDD patterns (pure helpers first, then component specs).

**Feature 1**
- `FusionCohortStore`: `setHistogramTranscript` updates the map; absent entry ⇒ canonical.
- `FusionComparisonView`: `anchorTranscript` returns the override when set, canonical otherwise;
  histogram receives the chosen transcript.

**Feature 2**
- Pure junction-exon derivation: given `retained5p`/`retained3p`, returns correct
  `{fivePrime, threePrime}`; single-gene ⇒ only `fivePrime`; empty ⇒ omit.
- `FusionProductStrip.spec`: each `junctionLabelMode` renders the expected DOM
  (inline `<text>` at seam / gutter column / `<title>` content) for sample, dense, collapsed.
- `FusionCohortStore`: `junctionLabelMode` toggle updates state.

## Files touched
| File | Feature | Change |
|---|---|---|
| `FusionCohortStore.ts` | 1, 2 | `histogramTranscriptIdByGene` + setter; `junctionLabelMode` + setter |
| `FusionComparisonView.tsx` | 1, 2 | transcript override in `anchorTranscript`/`partnerTranscript`; per-gene tx `<select>`; `junctionLabelMode` control + prop pass-through |
| `components/FusionStripList.tsx` | 2 | thread `junctionLabelMode` prop |
| `components/FusionProductStrip.tsx` (+spec) | 2 | junction-exon derivation + 3 placement renderers + tooltip extension |
| (pure helper for junction derivation, +spec) | 2 | last-5′ / first-3′ retained exon extraction |

## Out of scope
- Overlaying multiple transcripts on the histogram (only single-select swap).
- Per-rect exon numbering on every strip exon (only the two junction exons).
- Changing which isoform the strips/collapse grouping use (stays per-sample caller isoform).
