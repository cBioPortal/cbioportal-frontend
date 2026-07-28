# Full exon ladder view for the fusion cohort strips

**Date:** 2026-07-28 · **Branch:** `feat/fusion-cohort-builder` · **Status:** design approved, not implemented

## Goal

Add an alternate rendering to the SV/Fusion Comparison strip list: draw **every** exon of both
partner transcripts in every row and grey out the ones the fusion excludes, instead of drawing only
the retained exons.

Today `FusionProductStrip` filters exons at the breakpoint (`retainedExonsInOrder`) and
`computeJunctionAlignedLayout` packs the survivors against a shared `junctionX`. The retained set is
all you see, so you cannot tell how much of each gene was lost, and you cannot compare breakpoint
positions between samples except indirectly through block widths.

## What you see

A new `Exons: [Retained | Full transcript]` toggle beside the existing `Rows` control. In
**Full transcript** mode each row becomes two complete gene ladders:

```
      E1   E2   E3   E4   E5  │  E1   E2   E3   E4
     ─────────────────────────────────────────────   ← sticky ruler
S-01  ██   ██   ██▕ ░░   ░░   │  ░░ ▕ ██   ██   ██
S-02  ██ ▕ ░░   ░░   ░░   ░░  │  ░░   ░░ ▕ ██   ██
S-03  ██   ██   ██   ██▕ ░░   │ ▕██   ██   ██   ██
```

- Left region = the whole 5′ transcript, right region = the whole 3′ transcript.
  **`junctionX` stops meaning "fusion seam" and becomes the gene boundary.**
- Retained exons keep `COLOR_5PRIME` / `COLOR_3PRIME`. Lost exons are flat `#dee2e6` on both sides.
- `▕` is the breakpoint tick inside each ladder. Scanning that column down the list is the point of
  the view.
- A sticky exon-number ruler sits above the strip list.
- Hovering an exon shows gene · exon number · retained/lost · bp length.

Orthogonal to the existing `Rows: [Per sample | Dense | Collapsed]` control — Full transcript works
in all three modes.

### Ladder source

`Ladder: [Reference | Per-row]`, shown **only** when Full transcript is selected (same pattern as the
existing `Group by` control, which appears only in Collapsed mode).

- **Reference** (default) — the ladder comes from `anchorTranscript` / `partnerTranscript`, the
  canonical isoform. Every row draws the identical ladder, so exon columns align across the whole
  list and only the colour boundary moves.
- **Per-row** — the ladder comes from `transcriptForRow`, each sample's caller-selected isoform.
  Faithful per sample, ragged across rows. No ruler in this mode (there is no shared ladder to
  number).

### Carve-outs

- **Dense mode keeps its row-level `<title>`** (sample · frame · reads) rather than per-exon hover.
  At `DENSE_ROW_HEIGHT` (7px) an exon hover target is ~3px tall and would fight the row tooltip.
- **Off-reference partner rows.** In driver-anchor mode a row's 3′ partner may not be the dominant
  `partnerGene`. Such a row falls back to its own 3′ transcript even in Reference mode: its 3′ side
  goes ragged while its 5′ anchor column still aligns. Drawing one gene's breakpoints against another
  gene's ladder would be wrong, so this fallback is not optional.

## Architecture

### The layout math is unchanged

`computeJunctionAlignedLayout` already right-aligns the 5′ exon list to the seam and left-aligns the
3′ list from it. Feeding it *all* exons instead of the retained subset gives the correct geometry
with no new layout function.

`pxPerBp5p` / `pxPerBp3p` derive from `maxRetainedBp`, which is already the **full** exon length of
the reference transcript — so a complete ladder fills its region exactly, and the `EXON_GAP`
overshoot is absorbed by the function's existing uniform-shrink branch. In Reference mode every row
therefore produces identical `xs`/`widths` arrays: **columns align by construction, not by a second
alignment pass.**

The change reduces to *which exon list goes in*, plus *one boolean per exon* for the fill.

### New pure helpers (`components/fusionProductHelpers.ts`)

- `exonsInOrder(transcript): Exon[]` — the transcription-order sort currently inlined in
  `retainedExonsInOrder`, factored out. `retainedExonsInOrder` becomes
  `select{5,3}PrimeExons(exonsInOrder(t), …)`.
- `exonRetentionFlags(transcript, breakpoint, is5Prime): boolean[]` — index-parallel to
  `exonsInOrder`, so layout index *i* maps to flag *i*.
- `exonDisplayNumbers(transcript): Map<string, number>` — lifted from `FusionProduct`'s inline
  `buildDisplayMap` (sort by start, invert on minus strand). `Exon.number` is unreliable and that
  code already works around it; sharing the helper keeps the ruler, the tooltip, and the patient
  diagram from drifting.

Breakpoint tick x comes from the existing `genomicToExonX`, which already clamps an intronic
breakpoint to the preceding exon edge — the semantics this view wants.

### Store (`FusionCohortStore.ts`)

`@observable exonMode: 'retained' | 'full' = 'retained'` and
`@observable ladderMode: 'reference' | 'perRow' = 'reference'`, plus `@action` setters. Same shape as
the existing `stripMode`.

### Tooltip

A single hover state plus one positioned overlay owned by `FusionStripList` — **not** a
`DefaultTooltip` per rect. Full mode multiplies rect count per row (~4 retained → ~25 total); at
dense row heights that is roughly 2,500 live rects in the viewport, and a tooltip component around
each is what would make this feel slow. `ExonTooltip`'s overlay body is reused as the content.

### Files

| File | Change |
|---|---|
| `FusionCohortStore.ts` | `exonMode`, `ladderMode` + setters |
| `components/fusionProductHelpers.ts` | `exonsInOrder`, `exonRetentionFlags`, `exonDisplayNumbers` |
| `components/FusionProductStrip.tsx` | ladder transcripts + `exonMode`; grey fill, breakpoint ticks, exon hover callbacks |
| `components/FusionStripList.tsx` | prop pass-through; shared hover state + overlay |
| `components/ExonRuler.tsx` *(new)* | sticky numbered header |
| `FusionComparisonView.tsx` | two toggles; ladder-transcript resolution incl. off-reference-partner fallback; render ruler |

## TDD order

Pure helpers first — they carry the real risk.

1. `fusionProductHelpers.spec` — `exonRetentionFlags` on `+` and `−` strands; breakpoint in an
   intron; breakpoint before exon 1; breakpoint past the last exon; flags stay index-aligned with
   `exonsInOrder`. `exonDisplayNumbers` descends on minus strand.
2. `FusionProductStrip.spec` — full mode renders every exon; lost exons carry the grey fill; tick x
   matches `genomicToExonX`; **retained mode output is unchanged from today** (regression guard).
3. `ExonRuler.spec` — minus-strand numbering descends; label positions match the strip layout.
4. `FusionComparisonView.spec` — toggles write to the store; `Ladder` control hidden unless Full is
   selected; an off-reference-partner row falls back to its own 3′ transcript.

## Edge cases

- **UTR half-height** (`stripExonIsAllUtr`) applies to any all-5′UTR exon, retained or lost — not
  just retained ones as today.
- **Collapsed mode** — the group's representative row supplies the breakpoints for the ticks. The
  collapse key (retained exon structure) is unchanged; Full transcript is presentation only.
- **Transcript not loaded** — no ladder available, so the row falls back to today's retained-only
  rendering until transcripts arrive.
- **Per-row isoform longer than the reference** — overflows its region and is clamped by
  `computeJunctionAlignedLayout`'s existing shrink, as it already is today.

## Out of scope

- The patient-view `FusionProduct` diagram is unchanged.
- `Retained` stays the default, so nothing about the current view moves.
