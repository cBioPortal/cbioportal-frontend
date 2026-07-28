# Full Exon Ladder View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `Exons: [Retained | Full transcript]` mode to the fusion cohort strip list that draws every exon of both partner transcripts and greys out the ones the fusion excludes.

**Architecture:** The existing `computeJunctionAlignedLayout` already right-aligns the 5′ exon list to `junctionX` and left-aligns the 3′ list from it. Passing it *all* exons instead of the retained subset produces the correct geometry with no new layout function — because `pxPerBp` is already derived from the reference transcript's full exon length, a complete ladder fills its region exactly. The change is therefore *which exon list goes in* plus *one boolean per exon* driving the fill colour, and a breakpoint tick located with the existing `genomicToExonX`.

**Tech Stack:** TypeScript, React (function components), MobX (`@observable`/`@computed`/`@action`), SVG rendering, Jest + enzyme `mount` + chai `assert`, Prettier (4-space, single quotes, ES5 trailing commas).

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-07-28-full-exon-ladder-view-design.md`. Read it before starting.
- Branch: `feat/fusion-cohort-builder`.
- `Retained` remains the default everywhere. **No existing rendering may change.** Every task's test run must keep the existing fusion specs green.
- The patient-view `FusionProduct` diagram is out of scope except for the DRY refactor in Task 1.
- Lost-exon colour is exactly `#dee2e6`, the same grey on both the 5′ and 3′ sides.
- Never wrap individual exon `<rect>`s in `DefaultTooltip` — full mode puts ~2,500 rects in the viewport at dense row heights. Hover uses one shared overlay.
- Run Prettier before committing; the pre-commit hook does this automatically.
- Test command shape: `yarn run testMain GREP=<basename>.spec.js` (note `.js`, not `.tsx`).

---

### Task 1: Pure exon helpers

Three pure helpers in the existing helpers module, plus one DRY refactor. These carry the real correctness risk (strand handling), so they land first with no UI attached.

**Files:**
- Modify: `src/pages/patientView/fusionViewer/components/fusionProductHelpers.ts`
- Modify: `src/pages/patientView/fusionViewer/components/FusionProduct.tsx:88-111` (replace inline `buildDisplayMap`)
- Test: `src/pages/patientView/fusionViewer/components/fusionProductHelpers.spec.ts`

**Interfaces:**
- Consumes: existing `select5PrimeExons`, `select3PrimeExons`, `Exon`, `TranscriptData`.
- Produces:
  - `exonsInOrder(transcript: TranscriptData): Exon[]`
  - `exonRetentionFlags(transcript: TranscriptData, breakpointPos: number, is5Prime: boolean): boolean[]`
  - `exonDisplayNumbers(transcript: TranscriptData): Map<string, number>` — keyed `` `${start}-${end}` ``

- [ ] **Step 1: Write the failing tests**

Append to `src/pages/patientView/fusionViewer/components/fusionProductHelpers.spec.ts`. Add the imports to the existing import block at the top of the file rather than writing a second import statement.

```typescript
import {
    exonsInOrder,
    exonRetentionFlags,
    exonDisplayNumbers,
} from './fusionProductHelpers';
import { TranscriptData } from '../data/types';

function ladderTx(strand: '+' | '-'): TranscriptData {
    return {
        transcriptId: 'T1',
        displayName: 'T1',
        gene: 'G1',
        biotype: 'protein_coding',
        strand,
        txStart: 0,
        txEnd: 1000,
        exons: [
            { number: 1, start: 0, end: 100 },
            { number: 2, start: 200, end: 300 },
            { number: 3, start: 400, end: 500 },
        ],
        isForteSelected: true,
        isCallerSelected: true,
        isCanonical: true,
        domains: [],
        utrs: [],
    };
}

describe('exonsInOrder', () => {
    it('sorts ascending on the plus strand', () => {
        assert.deepEqual(
            exonsInOrder(ladderTx('+')).map(e => e.start),
            [0, 200, 400]
        );
    });

    it('sorts descending on the minus strand (transcription order)', () => {
        assert.deepEqual(
            exonsInOrder(ladderTx('-')).map(e => e.start),
            [400, 200, 0]
        );
    });
});

describe('exonRetentionFlags', () => {
    it('is index-aligned with exonsInOrder', () => {
        const t = ladderTx('+');
        assert.equal(
            exonRetentionFlags(t, 250, true).length,
            exonsInOrder(t).length
        );
    });

    it('flags 5-prime retention on the plus strand', () => {
        // breakpoint 250: exons starting at or below 250 are retained.
        assert.deepEqual(exonRetentionFlags(ladderTx('+'), 250, true), [
            true,
            true,
            false,
        ]);
    });

    it('flags 5-prime retention on the minus strand', () => {
        // Transcription order is [400-500, 200-300, 0-100]; minus-strand 5'
        // retention keeps exons whose end is at or above the breakpoint.
        assert.deepEqual(exonRetentionFlags(ladderTx('-'), 250, true), [
            true,
            true,
            false,
        ]);
    });

    it('flags 3-prime retention on the plus strand', () => {
        // breakpoint 250: exons ending at or above 250 are retained.
        assert.deepEqual(exonRetentionFlags(ladderTx('+'), 250, false), [
            false,
            true,
            true,
        ]);
    });

    it('handles a breakpoint inside an intron', () => {
        // 150 sits between exon 1 (ends 100) and exon 2 (starts 200).
        assert.deepEqual(exonRetentionFlags(ladderTx('+'), 150, true), [
            true,
            false,
            false,
        ]);
    });

    it('retains nothing when the breakpoint precedes exon 1', () => {
        assert.deepEqual(exonRetentionFlags(ladderTx('+'), -50, true), [
            false,
            false,
            false,
        ]);
    });

    it('retains everything when the breakpoint follows the last exon', () => {
        assert.deepEqual(exonRetentionFlags(ladderTx('+'), 9999, true), [
            true,
            true,
            true,
        ]);
    });
});

describe('exonDisplayNumbers', () => {
    it('numbers ascending by start on the plus strand', () => {
        const m = exonDisplayNumbers(ladderTx('+'));
        assert.equal(m.get('0-100'), 1);
        assert.equal(m.get('400-500'), 3);
    });

    it('numbers descending by start on the minus strand', () => {
        const m = exonDisplayNumbers(ladderTx('-'));
        assert.equal(m.get('0-100'), 3);
        assert.equal(m.get('400-500'), 1);
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn run testMain GREP=fusionProductHelpers.spec.js`
Expected: FAIL — TypeScript cannot resolve `exonsInOrder`, `exonRetentionFlags`, `exonDisplayNumbers` from `./fusionProductHelpers`.

- [ ] **Step 3: Add the three helpers**

In `fusionProductHelpers.ts`, replace the existing `retainedExonsInOrder` function with the block below. `exonsInOrder` is the sort that was inlined in it, factored out; `retainedExonsInOrder` keeps its exact current behaviour and signature.

```typescript
/**
 * All exons of a transcript in transcription order (5′→3′). On the minus strand
 * that is descending genomic start. This is the ordering every layout and flag
 * helper in this module assumes.
 */
export function exonsInOrder(transcript: TranscriptData): Exon[] {
    return [...transcript.exons].sort((a, b) =>
        transcript.strand === '-' ? b.start - a.start : a.start - b.start
    );
}

/**
 * Retained exons for one partner, sorted into transcription order (5′→3′) —
 * the same order the fusion product lays them out left-to-right. Sharing this
 * helper keeps FusionProduct and ProteinDomainTrack on an identical exon
 * sequence so domains can be aligned under the exons that encode them.
 */
export function retainedExonsInOrder(
    transcript: TranscriptData,
    breakpointPos: number,
    is5Prime: boolean
): Exon[] {
    const sorted = exonsInOrder(transcript);
    return is5Prime
        ? select5PrimeExons(sorted, breakpointPos, transcript.strand)
        : select3PrimeExons(sorted, breakpointPos, transcript.strand);
}

/**
 * Per-exon retained/lost flags, index-parallel to {@link exonsInOrder}. Lets the
 * full-ladder strip render every exon while colouring only the retained ones —
 * layout index i and flag i always describe the same exon.
 */
export function exonRetentionFlags(
    transcript: TranscriptData,
    breakpointPos: number,
    is5Prime: boolean
): boolean[] {
    const ordered = exonsInOrder(transcript);
    const retained = is5Prime
        ? select5PrimeExons(ordered, breakpointPos, transcript.strand)
        : select3PrimeExons(ordered, breakpointPos, transcript.strand);
    const keys = new Set(retained.map(e => `${e.start}-${e.end}`));
    return ordered.map(e => keys.has(`${e.start}-${e.end}`));
}

/**
 * Display exon numbers keyed by `${start}-${end}`. Derived from genomic order
 * (inverted on the minus strand) rather than trusting `Exon.number`, which is
 * unreliable in the Genome Nexus payload. Shared by the fusion product diagram,
 * the cohort exon ruler and the exon hover readout so they cannot drift.
 */
export function exonDisplayNumbers(
    transcript: TranscriptData
): Map<string, number> {
    const sortedByStart = [...transcript.exons].sort(
        (a, b) => a.start - b.start
    );
    const total = sortedByStart.length;
    const map = new Map<string, number>();
    sortedByStart.forEach((e, idx) => {
        map.set(
            `${e.start}-${e.end}`,
            transcript.strand === '-' ? total - idx : idx + 1
        );
    });
    return map;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn run testMain GREP=fusionProductHelpers.spec.js`
Expected: PASS — all existing tests in the file plus the 12 new ones.

- [ ] **Step 5: Replace the duplicate numbering logic in FusionProduct.tsx**

In `FusionProduct.tsx`, add `exonDisplayNumbers` to the existing import from `./fusionProductHelpers`:

```typescript
import {
    PRODUCT_HEIGHT,
    computeFusionExonLayout,
    retainedExonsInOrder,
    exonDisplayNumbers,
} from './fusionProductHelpers';
```

Then inside `computeLayout`, delete the whole local `buildDisplayMap` function (currently lines 88-102) and replace the two calls that follow it:

```typescript
    const displayNum5p = exonDisplayNumbers(forteTranscript5p);
    const displayNum3p = exonDisplayNumbers(forteTranscript3p);
```

Leave everything below unchanged — the `displayNum5p.get(...)` / `displayNum3p.get(...)` lookups already use the same `` `${start}-${end}` `` key.

- [ ] **Step 6: Run the FusionProduct tests to verify nothing regressed**

Run: `yarn run testMain GREP=FusionProduct.spec.js`
Expected: PASS with no change in behaviour — `exonDisplayNumbers` is a verbatim extraction of `buildDisplayMap`.

- [ ] **Step 7: Type-check**

Run: `yarn run tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/patientView/fusionViewer/components/fusionProductHelpers.ts \
        src/pages/patientView/fusionViewer/components/fusionProductHelpers.spec.ts \
        src/pages/patientView/fusionViewer/components/FusionProduct.tsx
git commit -m "feat(fusionViewer): add exon ladder helpers (exonsInOrder, retention flags, display numbers)"
```

---

### Task 2: Full-ladder rendering in FusionProductStrip

Teach the strip to draw every exon with grey lost blocks and per-side breakpoint ticks. Purely additive: with `exonMode` unset the component renders byte-identically to today.

**Files:**
- Modify: `src/pages/patientView/fusionViewer/data/types.ts:126` (add one colour constant)
- Modify: `src/pages/patientView/fusionViewer/components/FusionProductStrip.tsx`
- Test: `src/pages/patientView/fusionViewer/components/FusionProductStrip.spec.tsx`

**Interfaces:**
- Consumes: `exonsInOrder`, `exonRetentionFlags` (Task 1); existing `computeJunctionAlignedLayout`, `genomicToExonX`, `stripExonIsAllUtr`.
- Produces:
  - `COLOR_EXON_LOST = '#dee2e6'` exported from `data/types.ts`
  - New optional props on `FusionProductStripProps`:
    - `exonMode?: 'retained' | 'full'` (default `'retained'`)
    - `onExonHover?: (info: ExonHoverInfo | null) => void`
  - `export interface ExonHoverInfo { gene: string; exonNumber: number; retained: boolean; sizeBp: number; clientX: number; clientY: number; }`
- DOM contract later tasks and tests rely on: every exon rect keeps `data-testid="strip-exon"`; lost ones additionally carry `data-lost="true"`; breakpoint ticks carry `data-testid="strip-breakpoint-tick"`.

- [ ] **Step 1: Write the failing tests**

Append to `src/pages/patientView/fusionViewer/components/FusionProductStrip.spec.tsx`, reusing the file's existing `tx()` fixture (3 exons at 0-100, 200-300, 400-500).

```typescript
describe('FusionProductStrip full exon mode', () => {
    function mountFull(props: any = {}) {
        return mount(
            <svg>
                <FusionProductStrip
                    sampleId="S1"
                    label="S1"
                    transcript5p={tx('TMPRSS2')}
                    transcript3p={tx('ERG')}
                    breakpoint5p={250}
                    breakpoint3p={250}
                    frame="inFrame"
                    reads={12}
                    y={0}
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
                    exonMode="full"
                    {...props}
                />
            </svg>
        );
    }

    it('renders every exon of both transcripts', () => {
        // 3 exons per side, all drawn regardless of the breakpoint.
        assert.equal(
            mountFull()
                .find('[data-testid="strip-exon"]')
                .hostNodes().length,
            6
        );
    });

    it('marks the excluded exons as lost', () => {
        // 5' breakpoint 250 loses exon 3; 3' breakpoint 250 loses exon 1.
        assert.equal(
            mountFull()
                .find('[data-lost="true"]')
                .hostNodes().length,
            2
        );
    });

    it('fills lost exons with the neutral grey', () => {
        const lost = mountFull()
            .find('[data-lost="true"]')
            .hostNodes()
            .first();
        assert.equal(lost.prop('fill'), '#dee2e6');
    });

    it('draws a breakpoint tick per side instead of the junction seam', () => {
        assert.equal(
            mountFull()
                .find('[data-testid="strip-breakpoint-tick"]')
                .hostNodes().length,
            2
        );
    });

    it('retained mode is unchanged: only retained exons, no ticks', () => {
        const wrapper = mountFull({ exonMode: 'retained' });
        // breakpoint 250 retains 2 of 3 exons on each side.
        assert.equal(
            wrapper.find('[data-testid="strip-exon"]').hostNodes().length,
            4
        );
        assert.equal(wrapper.find('[data-lost="true"]').hostNodes().length, 0);
        assert.equal(
            wrapper
                .find('[data-testid="strip-breakpoint-tick"]')
                .hostNodes().length,
            0
        );
    });

    it('reports exon identity on hover', () => {
        let seen: any = null;
        const wrapper = mountFull({ onExonHover: (i: any) => (seen = i) });
        wrapper
            .find('[data-testid="strip-exon"]')
            .hostNodes()
            .first()
            .simulate('mouseenter', { clientX: 10, clientY: 20 });
        assert.equal(seen.gene, 'TMPRSS2');
        assert.equal(seen.exonNumber, 1);
        assert.equal(seen.retained, true);
        assert.equal(seen.sizeBp, 101);
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn run testMain GREP=FusionProductStrip.spec.js`
Expected: FAIL — `exonMode` is not a valid prop; no `data-lost` or `strip-breakpoint-tick` nodes exist.

- [ ] **Step 3: Add the lost-exon colour constant**

In `src/pages/patientView/fusionViewer/data/types.ts`, immediately after `COLOR_ACTIVE_OUTLINE`:

```typescript
/** Fill for exons excluded from the fusion product in full-ladder mode. */
export const COLOR_EXON_LOST = '#dee2e6';
```

- [ ] **Step 4: Implement full mode in FusionProductStrip**

Update the imports at the top of `FusionProductStrip.tsx`:

```typescript
import {
    computeJunctionAlignedLayout,
    retainedExonsInOrder,
    exonsInOrder,
    exonRetentionFlags,
    exonDisplayNumbers,
    genomicToExonX,
} from './fusionProductHelpers';
import { frameStatusStyle } from './frameStatusStyle';
import {
    TranscriptData,
    COLOR_5PRIME,
    COLOR_3PRIME,
    COLOR_BREAKPOINT,
    COLOR_ACTIVE_OUTLINE,
    COLOR_EXON_LOST,
    FrameStatus,
} from '../data/types';
```

Add the hover payload type just above `FusionProductStripProps`:

```typescript
/** Payload for the shared exon hover overlay owned by FusionStripList. */
export interface ExonHoverInfo {
    gene: string;
    exonNumber: number;
    retained: boolean;
    sizeBp: number;
    clientX: number;
    clientY: number;
}
```

Add these two props to `FusionProductStripProps`:

```typescript
    // Exon rendering mode. 'retained' (default) draws only the exons kept by
    // the fusion; 'full' draws the complete transcript ladder with the excluded
    // exons greyed and a breakpoint tick per side.
    exonMode?: 'retained' | 'full';
    // Per-exon hover readout. Omitted in dense mode, where the row-level
    // <title> owns the hover instead.
    onExonHover?: (info: ExonHoverInfo | null) => void;
```

Destructure them in the component signature alongside the others:

```typescript
    exonMode = 'retained',
    onExonHover,
```

Replace the exon-selection block (currently the `retained5p` / `retained3p` / `layout` consts) with:

```typescript
    const full = exonMode === 'full';
    const has3p = !!transcript3p && breakpoint3p !== undefined;
    const exons5p = full
        ? exonsInOrder(transcript5p)
        : retainedExonsInOrder(transcript5p, breakpoint5p, true);
    const exons3p = has3p
        ? full
            ? exonsInOrder(transcript3p!)
            : retainedExonsInOrder(transcript3p!, breakpoint3p!, false)
        : [];
    const flags5p = full
        ? exonRetentionFlags(transcript5p, breakpoint5p, true)
        : exons5p.map(() => true);
    const flags3p =
        has3p && full
            ? exonRetentionFlags(transcript3p!, breakpoint3p!, false)
            : exons3p.map(() => true);
    const nums5p = exonDisplayNumbers(transcript5p);
    const nums3p = transcript3p ? exonDisplayNumbers(transcript3p) : undefined;
    const layout = computeJunctionAlignedLayout(
        exons5p,
        exons3p,
        leftX,
        junctionX,
        rightX,
        pxPerBp5p,
        pxPerBp3p
    );
```

Add a hover-handler factory just below the `style` const:

```typescript
    // One handler per rect, but no tooltip component per rect — the overlay is
    // owned by FusionStripList. See the perf note in the design spec.
    const hoverProps = (
        gene: string,
        exon: { start: number; end: number },
        exonNumber: number,
        retained: boolean
    ) =>
        onExonHover
            ? {
                  onMouseEnter: (e: React.MouseEvent) =>
                      onExonHover({
                          gene,
                          exonNumber,
                          retained,
                          sizeBp: Math.abs(exon.end - exon.start) + 1,
                          clientX: e.clientX,
                          clientY: e.clientY,
                      }),
                  onMouseLeave: () => onExonHover(null),
              }
            : {};
```

Replace the 5′ exon map with (note `retained5p` → `exons5p`):

```typescript
            {exons5p.map((exon, i) => {
                const isAllUtr = stripExonIsAllUtr(exon, transcript5p.utrs);
                const h = isAllUtr ? ph / 2 : ph;
                const yRect = isAllUtr ? yEx + ph / 4 : yEx;
                const retained = flags5p[i];
                const n =
                    nums5p.get(`${exon.start}-${exon.end}`) ?? exon.number;
                return (
                    <rect
                        key={`5p-${i}`}
                        data-testid="strip-exon"
                        data-lost={retained ? undefined : 'true'}
                        x={layout.xs5p[i]}
                        y={yRect}
                        width={layout.widths5p[i]}
                        height={h}
                        rx={2}
                        fill={retained ? COLOR_5PRIME : COLOR_EXON_LOST}
                        {...hoverProps(transcript5p.gene, exon, n, retained)}
                    />
                );
            })}
```

Replace the 3′ exon map — it now needs the exon itself, so take both parameters:

```typescript
            {/* Half-height UTR treatment is intentionally 5′-only; 3′ retained exons start after the breakpoint and are not purely 5′UTR. */}
            {exons3p.map((exon, i) => {
                const retained = flags3p[i];
                const n =
                    nums3p?.get(`${exon.start}-${exon.end}`) ?? exon.number;
                return (
                    <rect
                        key={`3p-${i}`}
                        data-testid="strip-exon"
                        data-lost={retained ? undefined : 'true'}
                        x={layout.xs3p[i]}
                        y={yEx}
                        width={layout.widths3p[i]}
                        height={ph}
                        rx={2}
                        fill={retained ? COLOR_3PRIME : COLOR_EXON_LOST}
                        {...hoverProps(
                            transcript3p!.gene,
                            exon,
                            n,
                            retained
                        )}
                    />
                );
            })}
```

Replace the junction-seam `<line>` block with the mode-aware version. `genomicToExonX` already clamps an intronic breakpoint to the preceding exon edge, which is the semantics we want:

```typescript
            {full ? (
                <>
                    {exons5p.length > 0 && (
                        <line
                            data-testid="strip-breakpoint-tick"
                            x1={genomicToExonX(
                                breakpoint5p,
                                exons5p,
                                layout.xs5p,
                                layout.widths5p,
                                transcript5p.strand
                            )}
                            y1={yEx - 3}
                            x2={genomicToExonX(
                                breakpoint5p,
                                exons5p,
                                layout.xs5p,
                                layout.widths5p,
                                transcript5p.strand
                            )}
                            y2={yEx + ph + 3}
                            stroke={COLOR_BREAKPOINT}
                            strokeWidth={1.5}
                        />
                    )}
                    {has3p && exons3p.length > 0 && (
                        <line
                            data-testid="strip-breakpoint-tick"
                            x1={genomicToExonX(
                                breakpoint3p!,
                                exons3p,
                                layout.xs3p,
                                layout.widths3p,
                                transcript3p!.strand
                            )}
                            y1={yEx - 3}
                            x2={genomicToExonX(
                                breakpoint3p!,
                                exons3p,
                                layout.xs3p,
                                layout.widths3p,
                                transcript3p!.strand
                            )}
                            y2={yEx + ph + 3}
                            stroke={COLOR_BREAKPOINT}
                            strokeWidth={1.5}
                        />
                    )}
                </>
            ) : (
                exons5p.length > 0 &&
                exons3p.length > 0 && (
                    <line
                        x1={layout.junctionX}
                        y1={yEx - 3}
                        x2={layout.junctionX}
                        y2={yEx + ph + 3}
                        stroke={COLOR_BREAKPOINT}
                        strokeWidth={1.5}
                    />
                )
            )}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn run testMain GREP=FusionProductStrip.spec.js`
Expected: PASS — the new suite plus every pre-existing test in the file (the retained path is untouched).

- [ ] **Step 6: Type-check**

Run: `yarn run tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/patientView/fusionViewer/data/types.ts \
        src/pages/patientView/fusionViewer/components/FusionProductStrip.tsx \
        src/pages/patientView/fusionViewer/components/FusionProductStrip.spec.tsx
git commit -m "feat(fusionViewer): draw full exon ladder with greyed lost exons in strips"
```

---

### Task 3: Ladder transcript selection and the shared hover overlay

Wire the mode through `FusionStripList`: pick which transcript supplies each side's ladder, and own the single hover overlay.

**Files:**
- Modify: `src/pages/patientView/fusionViewer/components/FusionStripList.tsx`
- Test: `src/pages/patientView/fusionViewer/components/FusionStripList.spec.tsx` (create if absent)

**Interfaces:**
- Consumes: `ExonHoverInfo`, `exonMode` prop (Task 2).
- Produces:
  - `export function ladderTranscript(rowTranscript: TranscriptData | undefined, referenceTranscript: TranscriptData | undefined, useReference: boolean): TranscriptData | undefined`
  - New optional props on `FusionStripListProps`:
    - `exonMode?: 'retained' | 'full'` (default `'retained'`)
    - `ladderMode?: 'reference' | 'perRow'` (default `'reference'`)
    - `referenceTranscript5p?: TranscriptData`
    - `referenceTranscript3p?: TranscriptData`

- [ ] **Step 1: Write the failing tests**

Create `src/pages/patientView/fusionViewer/components/FusionStripList.spec.tsx` if it does not exist; otherwise append the `describe` block.

```typescript
import { assert } from 'chai';
import { ladderTranscript } from './FusionStripList';
import { TranscriptData } from '../data/types';

function t(gene: string): TranscriptData {
    return {
        transcriptId: gene,
        displayName: gene,
        gene,
        biotype: 'protein_coding',
        strand: '+',
        txStart: 0,
        txEnd: 1000,
        exons: [{ number: 1, start: 0, end: 100 }],
        isForteSelected: true,
        isCallerSelected: true,
        isCanonical: true,
        domains: [],
        utrs: [],
    };
}

describe('ladderTranscript', () => {
    it('uses the row transcript when not in reference mode', () => {
        assert.equal(
            ladderTranscript(t('ERG'), t('ETV1'), false)!.gene,
            'ERG'
        );
    });

    it('uses the reference transcript when the genes match', () => {
        const ref = t('ERG');
        assert.strictEqual(ladderTranscript(t('ERG'), ref, true), ref);
    });

    it('falls back to the row transcript for an off-reference partner', () => {
        // Driver-anchor mode: this row's partner is not the dominant partner,
        // so drawing it against the reference ladder would be wrong.
        assert.equal(ladderTranscript(t('FLI1'), t('ERG'), true)!.gene, 'FLI1');
    });

    it('returns the row transcript when there is no reference', () => {
        assert.equal(
            ladderTranscript(t('ERG'), undefined, true)!.gene,
            'ERG'
        );
    });

    it('returns undefined when the row has no transcript', () => {
        assert.isUndefined(ladderTranscript(undefined, undefined, true));
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn run testMain GREP=FusionStripList.spec.js`
Expected: FAIL — `ladderTranscript` is not exported from `./FusionStripList`.

- [ ] **Step 3: Add the ladderTranscript helper**

In `FusionStripList.tsx`, below the `visibleWindow` function:

```typescript
/**
 * Which transcript supplies a side's exon ladder. In reference mode every row
 * shares the canonical isoform so exon columns align across the whole list —
 * except when the row's gene differs from the reference (driver-anchor rows
 * with an off-reference partner), where the row's own transcript wins. Drawing
 * one gene's breakpoint against another gene's ladder would be wrong.
 */
export function ladderTranscript(
    rowTranscript: TranscriptData | undefined,
    referenceTranscript: TranscriptData | undefined,
    useReference: boolean
): TranscriptData | undefined {
    if (!useReference || !referenceTranscript) return rowTranscript;
    if (rowTranscript && rowTranscript.gene !== referenceTranscript.gene) {
        return rowTranscript;
    }
    return referenceTranscript;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn run testMain GREP=FusionStripList.spec.js`
Expected: PASS.

- [ ] **Step 5: Wire the new props and the hover overlay**

Add to the imports in `FusionStripList.tsx`:

```typescript
import FusionProductStrip, { ExonHoverInfo } from './FusionProductStrip';
```

Add to `FusionStripListProps`:

```typescript
    // Exon rendering mode, orthogonal to `mode`. 'full' draws every exon with
    // the excluded ones greyed.
    exonMode?: 'retained' | 'full';
    // Which transcript supplies each side's ladder in full mode. 'reference'
    // shares the canonical isoform so columns align; 'perRow' is faithful to
    // each sample's caller-selected isoform but ragged.
    ladderMode?: 'reference' | 'perRow';
    referenceTranscript5p?: TranscriptData;
    referenceTranscript3p?: TranscriptData;
```

Destructure them in the component signature:

```typescript
    exonMode = 'retained',
    ladderMode = 'reference',
    referenceTranscript5p,
    referenceTranscript3p,
```

Add the hover state next to the existing `scrollTop` state:

```typescript
    const [hoveredExon, setHoveredExon] = React.useState<ExonHoverInfo | null>(
        null
    );
```

Replace the `const t5 = ...` / `const t3 = ...` lines inside the row map with:

```typescript
                    const useReference =
                        exonMode === 'full' && ladderMode === 'reference';
                    const t5 = ladderTranscript(
                        transcriptForRow(row, true),
                        referenceTranscript5p,
                        useReference
                    );
                    const t3 = ladderTranscript(
                        transcriptForRow(row, false),
                        referenceTranscript3p,
                        useReference
                    );
```

Add two props to the `<FusionProductStrip>` element. Dense mode is excluded from per-exon hover — at `DENSE_ROW_HEIGHT` (7px) an exon target is ~3px tall and fights the row-level `<title>`:

```typescript
                            exonMode={exonMode}
                            onExonHover={
                                exonMode === 'full' && mode !== 'dense'
                                    ? setHoveredExon
                                    : undefined
                            }
```

Finally render one overlay for the whole list. Wrap the existing return in a fragment and append the overlay after the scroll `<div>`. `position: fixed` against the mouse's client coordinates means no scroll-offset maths:

```typescript
            {hoveredExon && (
                <div
                    data-testid="exon-hover-readout"
                    style={{
                        position: 'fixed',
                        left: hoveredExon.clientX + 12,
                        top: hoveredExon.clientY + 12,
                        zIndex: 1000,
                        pointerEvents: 'none',
                        background: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: 3,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        padding: '3px 6px',
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                    }}
                >
                    <strong>{hoveredExon.gene}</strong> Exon{' '}
                    {hoveredExon.exonNumber}
                    <br />
                    <span style={{ color: '#666' }}>
                        {hoveredExon.retained ? 'retained' : 'lost'} ·{' '}
                        {hoveredExon.sizeBp.toLocaleString()} bp
                    </span>
                </div>
            )}
```

- [ ] **Step 6: Run the full fusion suite to verify nothing regressed**

Run: `yarn run testMain GREP=Fusion`
Expected: PASS — all pre-existing fusion specs stay green (`exonMode` defaults to `'retained'`, so `FusionStripList` renders exactly as before).

- [ ] **Step 7: Type-check**

Run: `yarn run tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/patientView/fusionViewer/components/FusionStripList.tsx \
        src/pages/patientView/fusionViewer/components/FusionStripList.spec.tsx
git commit -m "feat(fusionViewer): ladder transcript selection and shared exon hover overlay"
```

---

### Task 4: Exon number ruler

A numbered header above the strip list. It needs no CSS stickiness: the strip list scrolls inside its own fixed-height `overflow-y: auto` container, so anything rendered above that container stays put on its own.

**Files:**
- Create: `src/pages/patientView/fusionViewer/components/ExonRuler.tsx`
- Test: `src/pages/patientView/fusionViewer/components/ExonRuler.spec.tsx`

**Interfaces:**
- Consumes: `exonsInOrder`, `exonDisplayNumbers` (Task 1); existing `computeJunctionAlignedLayout`.
- Produces: default-exported `ExonRuler` with
  ```typescript
  export interface ExonRulerProps {
      transcript5p: TranscriptData;
      transcript3p?: TranscriptData;
      width: number;
      leftX: number;
      junctionX: number;
      rightX: number;
      pxPerBp5p: number;
      pxPerBp3p: number;
  }
  ```
- DOM contract: each label carries `data-testid="ruler-exon-label"`.

- [ ] **Step 1: Write the failing tests**

Create `src/pages/patientView/fusionViewer/components/ExonRuler.spec.tsx`:

```typescript
import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import ExonRuler from './ExonRuler';
import { TranscriptData } from '../data/types';

function tx(gene: string, strand: '+' | '-' = '+'): TranscriptData {
    return {
        transcriptId: gene,
        displayName: gene,
        gene,
        biotype: 'protein_coding',
        strand,
        txStart: 0,
        txEnd: 1000,
        exons: [
            { number: 1, start: 0, end: 100 },
            { number: 2, start: 200, end: 300 },
            { number: 3, start: 400, end: 500 },
        ],
        isForteSelected: true,
        isCallerSelected: true,
        isCanonical: true,
        domains: [],
        utrs: [],
    };
}

function render(t5: TranscriptData, t3?: TranscriptData) {
    return mount(
        <ExonRuler
            transcript5p={t5}
            transcript3p={t3}
            width={800}
            leftX={170}
            junctionX={400}
            rightX={700}
            pxPerBp5p={0.5}
            pxPerBp3p={0.5}
        />
    );
}

describe('ExonRuler', () => {
    it('labels every exon of both transcripts', () => {
        assert.equal(
            render(tx('TMPRSS2'), tx('ERG'))
                .find('[data-testid="ruler-exon-label"]')
                .hostNodes().length,
            6
        );
    });

    it('numbers ascending on the plus strand', () => {
        const labels = render(tx('TMPRSS2'))
            .find('[data-testid="ruler-exon-label"]')
            .hostNodes()
            .map(n => n.text());
        assert.deepEqual(labels, ['E1', 'E2', 'E3']);
    });

    it('numbers descending on the minus strand', () => {
        // Transcription order runs right-to-left in genomic coordinates, so the
        // leftmost drawn block is the highest-numbered exon.
        const labels = render(tx('TMPRSS2', '-'))
            .find('[data-testid="ruler-exon-label"]')
            .hostNodes()
            .map(n => n.text());
        assert.deepEqual(labels, ['E3', 'E2', 'E1']);
    });

    it('renders without a 3-prime transcript', () => {
        assert.equal(
            render(tx('TMPRSS2'))
                .find('[data-testid="ruler-exon-label"]')
                .hostNodes().length,
            3
        );
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn run testMain GREP=ExonRuler.spec.js`
Expected: FAIL — `./ExonRuler` does not exist.

- [ ] **Step 3: Implement the ruler**

Create `src/pages/patientView/fusionViewer/components/ExonRuler.tsx`:

```typescript
import * as React from 'react';
import { TranscriptData } from '../data/types';
import {
    computeJunctionAlignedLayout,
    exonsInOrder,
    exonDisplayNumbers,
} from './fusionProductHelpers';

const RULER_HEIGHT = 16;
// Below this drawn block width the label would collide with its neighbour, so
// the exon goes unlabelled rather than unreadable.
const MIN_LABEL_W = 10;

export interface ExonRulerProps {
    transcript5p: TranscriptData;
    transcript3p?: TranscriptData;
    width: number;
    leftX: number;
    junctionX: number;
    rightX: number;
    pxPerBp5p: number;
    pxPerBp3p: number;
}

/**
 * Exon-number header for the full-ladder strip view. Runs the same layout the
 * strips do over the same reference transcripts, so a label sits exactly above
 * its column. Only meaningful in reference-ladder mode — per-row ladders are
 * ragged, so there is no shared ladder to number.
 *
 * Needs no CSS stickiness: the strip list scrolls inside its own fixed-height
 * container, so a sibling rendered above it never scrolls away.
 */
const ExonRuler: React.FC<ExonRulerProps> = ({
    transcript5p,
    transcript3p,
    width,
    leftX,
    junctionX,
    rightX,
    pxPerBp5p,
    pxPerBp3p,
}) => {
    const exons5p = exonsInOrder(transcript5p);
    const exons3p = transcript3p ? exonsInOrder(transcript3p) : [];
    const nums5p = exonDisplayNumbers(transcript5p);
    const nums3p = transcript3p ? exonDisplayNumbers(transcript3p) : undefined;
    const layout = computeJunctionAlignedLayout(
        exons5p,
        exons3p,
        leftX,
        junctionX,
        rightX,
        pxPerBp5p,
        pxPerBp3p
    );

    const label = (
        key: string,
        exon: { start: number; end: number; number: number },
        x: number,
        w: number,
        nums: Map<string, number> | undefined
    ): JSX.Element | null => {
        if (w < MIN_LABEL_W) return null;
        const n = nums?.get(`${exon.start}-${exon.end}`) ?? exon.number;
        return (
            <text
                key={key}
                data-testid="ruler-exon-label"
                x={x + w / 2}
                y={RULER_HEIGHT - 4}
                textAnchor="middle"
                fontSize={9}
                fill="#6c757d"
            >
                E{n}
            </text>
        );
    };

    return (
        <svg width={width} height={RULER_HEIGHT}>
            {exons5p.map((e, i) =>
                label(`5p-${i}`, e, layout.xs5p[i], layout.widths5p[i], nums5p)
            )}
            {exons3p.map((e, i) =>
                label(`3p-${i}`, e, layout.xs3p[i], layout.widths3p[i], nums3p)
            )}
        </svg>
    );
};

export default ExonRuler;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn run testMain GREP=ExonRuler.spec.js`
Expected: PASS.

- [ ] **Step 5: Type-check**

Run: `yarn run tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/patientView/fusionViewer/components/ExonRuler.tsx \
        src/pages/patientView/fusionViewer/components/ExonRuler.spec.tsx
git commit -m "feat(fusionViewer): add exon number ruler for the full ladder view"
```

---

### Task 5: Store state, toolbar toggles and view wiring

Expose the feature: two observables, two segmented controls, and the props that connect them to Tasks 3 and 4.

**Files:**
- Modify: `src/pages/patientView/fusionViewer/FusionCohortStore.ts` (observables near `stripMode:73`, actions near `setStripMode:248`)
- Modify: `src/pages/patientView/fusionViewer/FusionComparisonView.tsx` (toolbar `:661`, header caption `:842`, `<FusionStripList>` `:862`)
- Test: `src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts`
- Test: `src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx`

**Interfaces:**
- Consumes: `ExonRuler` (Task 4); `exonMode` / `ladderMode` / `referenceTranscript5p` / `referenceTranscript3p` props on `FusionStripList` (Task 3); existing `anchorTranscript` and `partnerTranscript` computeds.
- Produces on `FusionCohortStore`:
  - `@observable exonMode: 'retained' | 'full'` (default `'retained'`)
  - `@observable ladderMode: 'reference' | 'perRow'` (default `'reference'`)
  - `@action setExonMode(m: 'retained' | 'full'): void`
  - `@action setLadderMode(m: 'reference' | 'perRow'): void`
- DOM contract: toggle buttons carry `data-testid` values `exonmode-retained`, `exonmode-full`, `laddermode-reference`, `laddermode-perRow`.

- [ ] **Step 1: Write the failing store test**

Append to `src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts`, using whatever store-construction helper that file already uses:

```typescript
describe('FusionCohortStore exon ladder modes', () => {
    it('defaults to retained exons and the reference ladder', () => {
        const store = new FusionCohortStore();
        assert.equal(store.exonMode, 'retained');
        assert.equal(store.ladderMode, 'reference');
    });

    it('setExonMode and setLadderMode update the observables', () => {
        const store = new FusionCohortStore();
        store.setExonMode('full');
        store.setLadderMode('perRow');
        assert.equal(store.exonMode, 'full');
        assert.equal(store.ladderMode, 'perRow');
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn run testMain GREP=FusionCohortStore.spec.js`
Expected: FAIL — `exonMode` / `ladderMode` do not exist on the store.

- [ ] **Step 3: Add the store state**

In `FusionCohortStore.ts`, immediately after the `collapseKindOverride` observable:

```typescript
    /**
     * Exon rendering mode for the strips, orthogonal to `stripMode`:
     *  - 'retained' → only the exons kept by the fusion (default).
     *  - 'full'     → the complete transcript ladder, excluded exons greyed.
     */
    @observable public exonMode: 'retained' | 'full' = 'retained';

    /**
     * Which transcript supplies each side's ladder in `exonMode === 'full'`:
     *  - 'reference' → the canonical isoform, shared by every row, so exon
     *                  columns align down the list (default).
     *  - 'perRow'    → each sample's caller-selected isoform: faithful, ragged.
     * Ignored when `exonMode === 'retained'`.
     */
    @observable public ladderMode: 'reference' | 'perRow' = 'reference';
```

And after `setCollapseKindOverride`:

```typescript
    @action
    public setExonMode(m: 'retained' | 'full'): void {
        this.exonMode = m;
    }

    @action
    public setLadderMode(m: 'reference' | 'perRow'): void {
        this.ladderMode = m;
    }
```

- [ ] **Step 4: Run the store test to verify it passes**

Run: `yarn run testMain GREP=FusionCohortStore.spec.js`
Expected: PASS.

- [ ] **Step 5: Write the failing view test**

Append to `src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx`, reusing that file's existing mount helper and store fixture:

```typescript
describe('FusionComparisonView exon ladder controls', () => {
    it('the exon mode toggle writes to the store', () => {
        const { wrapper, store } = mountView();
        wrapper
            .find('[data-testid="exonmode-full"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.exonMode, 'full');
    });

    it('hides the ladder toggle while exonMode is retained', () => {
        const { wrapper } = mountView();
        assert.equal(
            wrapper
                .find('[data-testid="laddermode-reference"]')
                .hostNodes().length,
            0
        );
    });

    it('shows the ladder toggle once full transcript is selected', () => {
        const { wrapper, store } = mountView();
        store.setExonMode('full');
        wrapper.update();
        assert.isAbove(
            wrapper
                .find('[data-testid="laddermode-reference"]')
                .hostNodes().length,
            0
        );
    });

    it('renders the exon ruler only for the reference ladder', () => {
        const { wrapper, store } = mountView();
        store.setExonMode('full');
        wrapper.update();
        assert.isAbove(wrapper.find('ExonRuler').length, 0);
        store.setLadderMode('perRow');
        wrapper.update();
        assert.equal(wrapper.find('ExonRuler').length, 0);
    });
});
```

If the file has no `mountView()` helper, write one that mounts `FusionComparisonView` with the same store fixture the neighbouring tests build, and returns `{ wrapper, store }`.

- [ ] **Step 6: Run the view test to verify it fails**

Run: `yarn run testMain GREP=FusionComparisonView.spec.js`
Expected: FAIL — no `exonmode-full` node exists.

- [ ] **Step 7: Add the toolbar controls**

In `FusionComparisonView.tsx`, add the import:

```typescript
import ExonRuler from './components/ExonRuler';
```

Insert this block inside the toolbar `<div>`, immediately after the `Rows` `</ButtonGroup>` and *before* the `{store.stripMode === 'collapsed' && (` block:

```typescript
                    <span
                        style={{
                            fontSize: 11,
                            color: '#6c757d',
                            marginLeft: 12,
                        }}
                    >
                        Exons
                    </span>
                    <ButtonGroup>
                        {this.segmentButton(
                            store.exonMode === 'retained',
                            'exonmode-retained',
                            'Retained',
                            'Draw only the exons kept by the fusion',
                            () => store.setExonMode('retained')
                        )}
                        {this.segmentButton(
                            store.exonMode === 'full',
                            'exonmode-full',
                            'Full transcript',
                            'Draw every exon of both partners, greying out the ones the fusion excludes',
                            () => store.setExonMode('full')
                        )}
                    </ButtonGroup>
                    {store.exonMode === 'full' && (
                        <>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: '#6c757d',
                                    marginLeft: 12,
                                }}
                            >
                                Ladder
                            </span>
                            <ButtonGroup>
                                {this.segmentButton(
                                    store.ladderMode === 'reference',
                                    'laddermode-reference',
                                    'Reference',
                                    'Use the canonical isoform for every row so exon columns align down the list',
                                    () => store.setLadderMode('reference')
                                )}
                                {this.segmentButton(
                                    store.ladderMode === 'perRow',
                                    'laddermode-perRow',
                                    'Per-row',
                                    "Use each sample's own caller-selected isoform — faithful per sample, ragged across rows",
                                    () => store.setLadderMode('perRow')
                                )}
                            </ButtonGroup>
                        </>
                    )}
```

- [ ] **Step 8: Wire the strip list and the ruler**

Still in `FusionComparisonView.tsx`, update the header caption so it stops claiming "retained exons" in full mode. Replace the caption text at `:842`:

```typescript
                            {store.exonMode === 'full'
                                ? 'Fusion product (5′ → 3′ full transcripts, lost exons greyed)'
                                : 'Fusion product (5′ → 3′ retained exons)'}
```

Insert the ruler immediately before `<FusionStripList`:

```typescript
                    {store.exonMode === 'full' &&
                        store.ladderMode === 'reference' &&
                        anchorTranscript && (
                            <ExonRuler
                                transcript5p={anchorTranscript}
                                transcript3p={this.partnerTranscript}
                                width={contentWidth}
                                leftX={frame.leftX}
                                junctionX={frame.junctionX}
                                rightX={frame.rightX}
                                pxPerBp5p={pxPerBp5p}
                                pxPerBp3p={pxPerBp3p}
                            />
                        )}
```

Add four props to `<FusionStripList>`:

```typescript
                        exonMode={store.exonMode}
                        ladderMode={store.ladderMode}
                        referenceTranscript5p={anchorTranscript}
                        referenceTranscript3p={this.partnerTranscript}
```

- [ ] **Step 9: Run the view test to verify it passes**

Run: `yarn run testMain GREP=FusionComparisonView.spec.js`
Expected: PASS.

- [ ] **Step 10: Run the whole fusion suite**

Run: `yarn run testMain GREP=Fusion`
Expected: PASS — all pre-existing fusion specs green.

- [ ] **Step 11: Type-check and format**

Run: `yarn run tsc --noEmit -p tsconfig.json`
Expected: no errors.

Run: `yarn run prettierFixLocal`
Expected: formats the touched files with no further diff.

- [ ] **Step 12: Commit**

```bash
git add src/pages/patientView/fusionViewer/FusionCohortStore.ts \
        src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts \
        src/pages/patientView/fusionViewer/FusionComparisonView.tsx \
        src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx
git commit -m "feat(fusionViewer): add Exons and Ladder toggles for the full exon ladder view"
```

---

## Manual verification

After Task 5, run `yarn run start`, open the SV/Fusion Comparison tab and confirm:

1. `Exons: Retained` is selected by default and the view looks exactly as it did before.
2. Switching to `Full transcript` shows complete ladders with grey excluded exons and a red breakpoint tick per side.
3. In `Reference` ladder mode the exon columns line up down the whole list, and the numbered ruler stays put while the strips scroll.
4. Hovering an exon shows gene · exon number · retained/lost · bp; the readout does **not** appear in Dense mode.
5. `Per-row` ladder hides the ruler and rows go ragged where isoforms differ.
6. Full transcript works in all three `Rows` modes.
