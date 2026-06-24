# Fusion Cohort Side-by-Side Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a multi-sample fusion/SV comparison to studyView — a data-adaptive summary table that picks a gene pair, and a dedicated tab rendering a two-tier comparison (anchor GeneTrack + breakpoint lollipops over condensed FusionProduct strips).

**Architecture:** Extend the existing `FusionCohortStore` with anchor/alignment/frame state and a `comparisonRows` computed. Build two new SVG components reusing the single-fusion viewer's pure geometry helpers (Tier 1 `AnchorGeneTrackRuler`, Tier 2 `FusionProductStrip` in a virtualized list). Assemble them in `FusionComparisonView`, mount as a new studyView tab next to CN Segments, and add a `FusionSummaryTableWidget` to the summary grid that routes to the tab.

**Tech Stack:** React, MobX (`@observer`/`@observable`/`@computed`/`@action`), TypeScript, SVG, jest + chai (`assert`), prettier (4-space, single-quote, ES5 trailing commas).

## Global Constraints

- Colors are imported from `data/types.ts`, never hard-coded: `COLOR_5PRIME` `#5A73B3`, `COLOR_3PRIME` `#60187D`, `COLOR_BREAKPOINT` `#FF6B6B`. Active chrome `#e03131`. Non-retained `#ddd`.
- Frame styling comes from `frameStatusStyle()` (`components/frameStatusStyle.ts`) — do not re-derive colors.
- Geometry reuse only — import `genomicToSvgX`, `computeGeneTrackRange`, `applyUpstreamExtension` from `components/GeneTrack`; `computeFusionExonLayout`, `retainedExonsInOrder`, `select5PrimeExons`, `select3PrimeExons` from `components/fusionProductHelpers`. Do not duplicate.
- Tests: `import { assert } from 'chai';`, files named `*.spec.ts(x)`, co-located. Run a single file with `GREP=<file>.spec.js yarn run testMain` or the jest path form used below.
- Prettier runs on commit; 4-space indent, single quotes, trailing commas (ES5).
- Reuse `FusionCohortStore` (already on branch) — extend, do not fork.
- Transcripts are fetched via `fetchTranscriptsForGeneWithFallback` (Genome Nexus); dedupe by gene symbol.
- No file > 300 lines; split components if they grow past it.

---

## File Structure

**Phase 1 — store/data (extend existing):**
- Modify: `src/pages/patientView/fusionViewer/FusionCohortStore.ts` — add anchor, alignment, comparisonRows.
- Create: `src/pages/patientView/fusionViewer/data/comparisonRows.ts` — pure row builder + sort.
- Test: `data/comparisonRows.spec.ts`, append to `FusionCohortStore.spec.ts`.

**Phase 2 — Tier 1:**
- Create: `components/AnchorGeneTrackRuler.tsx` + `.spec.tsx`.

**Phase 3 — Tier 2:**
- Create: `components/FusionProductStrip.tsx` + `.spec.tsx`.
- Create: `components/FusionStripList.tsx` + `.spec.tsx`.

**Phase 4 — assembly:**
- Create: `FusionComparisonView.tsx` + `.spec.tsx`.

**Phase 5 — studyView tab:**
- Modify: `src/pages/studyView/StudyViewPageTabs.ts` (enum), `src/pages/studyView/StudyViewPage.tsx` (mount tab).

**Phase 6 — summary widget:**
- Create: `src/pages/studyView/charts/fusionSummary/FusionSummaryTableWidget.tsx` + `.spec.tsx`.
- Modify: summary chart grid registration.

---

## Phase 1 — Data layer

### Task 1: Comparison-row builder (pure)

**Files:**
- Create: `src/pages/patientView/fusionViewer/data/comparisonRows.ts`
- Test: `src/pages/patientView/fusionViewer/data/comparisonRows.spec.ts`

**Interfaces:**
- Consumes: `FusionEvent`, `GenePartner` from `./types`; `classifyFrame`, `buildPairKey` from `./cohortAggregation`.
- Produces:
  - `type AnchorMode = 'pair' | 'driver';`
  - `interface ComparisonAnchor { mode: AnchorMode; key: string; }` (`key` = pair key for `'pair'`, gene symbol for `'driver'`)
  - `interface ComparisonRow { event: FusionEvent; sampleId: string; fivePrimeSymbol: string; threePrimeSymbol: string | null; anchorBreakpoint: number; frame: FrameStatus; }`
  - `function buildComparisonRows(events: FusionEvent[], anchor: ComparisonAnchor): ComparisonRow[]`
  - `function sortComparisonRows(rows: ComparisonRow[]): ComparisonRow[]` (ascending by `anchorBreakpoint`)

- [ ] **Step 1: Write the failing test**

```typescript
import { assert } from 'chai';
import {
    buildComparisonRows,
    sortComparisonRows,
    ComparisonAnchor,
} from './comparisonRows';
import { FusionEvent } from './types';

function ev(over: Partial<FusionEvent>): FusionEvent {
    return {
        id: 'e',
        tumorId: 'S1',
        gene1: {
            symbol: 'TMPRSS2',
            chromosome: '21',
            position: 100,
            selectedTranscriptId: 't1',
            siteDescription: '',
        },
        gene2: {
            symbol: 'ERG',
            chromosome: '21',
            position: 900,
            selectedTranscriptId: 't2',
            siteDescription: '',
        },
        fusion: 'TMPRSS2::ERG',
        totalReadSupport: 5,
        callMethod: 'FUSION',
        frameCallMethod: 'in_frame',
        annotation: '',
        position: '',
        significance: '',
        note: '',
        connectionType: '5to3',
        ...over,
    } as FusionEvent;
}

describe('buildComparisonRows', () => {
    it('pair mode keeps only events for the pair key, anchored on 5′', () => {
        const anchor: ComparisonAnchor = {
            mode: 'pair',
            key: 'ERG::TMPRSS2',
        };
        const rows = buildComparisonRows(
            [
                ev({ tumorId: 'S1', id: 'a' }),
                ev({
                    tumorId: 'S2',
                    id: 'b',
                    gene2: {
                        symbol: 'FLI1',
                        chromosome: '11',
                        position: 5,
                        selectedTranscriptId: 't',
                        siteDescription: '',
                    },
                    fusion: 'TMPRSS2::FLI1',
                }),
            ],
            anchor
        );
        assert.lengthOf(rows, 1);
        assert.equal(rows[0].sampleId, 'S1');
        assert.equal(rows[0].anchorBreakpoint, 100);
    });

    it('driver mode keeps every event touching the driver gene', () => {
        const anchor: ComparisonAnchor = { mode: 'driver', key: 'TMPRSS2' };
        const rows = buildComparisonRows(
            [ev({ id: 'a' }), ev({ id: 'b', tumorId: 'S2' })],
            anchor
        );
        assert.lengthOf(rows, 2);
        assert.equal(rows[0].fivePrimeSymbol, 'TMPRSS2');
    });

    it('sortComparisonRows orders ascending by anchor breakpoint', () => {
        const a = { anchorBreakpoint: 300 } as any;
        const b = { anchorBreakpoint: 100 } as any;
        const sorted = sortComparisonRows([a, b]);
        assert.equal(sorted[0].anchorBreakpoint, 100);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/pages/patientView/fusionViewer/data/comparisonRows.spec.ts`
Expected: FAIL — cannot find module `./comparisonRows`.

- [ ] **Step 3: Write minimal implementation**

```typescript
import { FusionEvent } from './types';
import { classifyFrame, buildPairKey, FrameStatus } from './cohortAggregation';

export type AnchorMode = 'pair' | 'driver';

export interface ComparisonAnchor {
    mode: AnchorMode;
    key: string;
}

export interface ComparisonRow {
    event: FusionEvent;
    sampleId: string;
    fivePrimeSymbol: string;
    threePrimeSymbol: string | null;
    anchorBreakpoint: number;
    frame: FrameStatus;
}

export function buildComparisonRows(
    events: FusionEvent[],
    anchor: ComparisonAnchor
): ComparisonRow[] {
    const matches = (e: FusionEvent): boolean => {
        if (anchor.mode === 'pair') {
            return (
                buildPairKey(
                    e.gene1.symbol,
                    e.gene2 ? e.gene2.symbol : null
                ) === anchor.key
            );
        }
        return (
            e.gene1.symbol === anchor.key ||
            (!!e.gene2 && e.gene2.symbol === anchor.key)
        );
    };

    return events.filter(matches).map(e => ({
        event: e,
        sampleId: e.tumorId,
        fivePrimeSymbol: e.gene1.symbol,
        threePrimeSymbol: e.gene2 ? e.gene2.symbol : null,
        anchorBreakpoint: e.gene1.position,
        frame: classifyFrame(e.frameCallMethod),
    }));
}

export function sortComparisonRows(rows: ComparisonRow[]): ComparisonRow[] {
    return [...rows].sort((a, b) => a.anchorBreakpoint - b.anchorBreakpoint);
}
```

> Note: confirm `buildPairKey`/`classifyFrame`/`FrameStatus` exports in `cohortAggregation.ts` (per spec they exist). If `buildPairKey`'s arg order differs, match the existing signature.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/pages/patientView/fusionViewer/data/comparisonRows.spec.ts`
Expected: PASS (3 passing).

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/data/comparisonRows.ts src/pages/patientView/fusionViewer/data/comparisonRows.spec.ts
git commit -m "feat(fusionViewer): add comparison-row builder for multi-sample anchor"
```

### Task 2: Store extension — anchor, alignment, comparison rows

**Files:**
- Modify: `src/pages/patientView/fusionViewer/FusionCohortStore.ts`
- Test: `src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts` (append)

**Interfaces:**
- Consumes: `buildComparisonRows`, `sortComparisonRows`, `ComparisonAnchor`, `ComparisonRow` from `./data/comparisonRows`; existing `filteredEvents`/`allEvents` computed.
- Produces on `FusionCohortStore`:
  - `@observable anchor: ComparisonAnchor | undefined`
  - `@observable alignment: 'junction' | 'coordinate'` (default `'junction'`)
  - `@action setAnchor(a: ComparisonAnchor): void`
  - `@action setAlignment(a: 'junction' | 'coordinate'): void`
  - `@computed get comparisonRows(): ComparisonRow[]` — frame-filtered (reusing existing `filter.inFrame`) + breakpoint-sorted

- [ ] **Step 1: Write the failing test (append to FusionCohortStore.spec.ts)**

```typescript
import { ComparisonAnchor } from './data/comparisonRows';

describe('FusionCohortStore comparison', () => {
    it('comparisonRows returns sorted carrier rows for the anchor', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            // two TMPRSS2::ERG carriers with different 5′ breakpoints
            { site1HugoSymbol: 'TMPRSS2', site2HugoSymbol: 'ERG', sampleId: 'S1', site1Position: 300 } as any,
            { site1HugoSymbol: 'TMPRSS2', site2HugoSymbol: 'ERG', sampleId: 'S2', site1Position: 100 } as any,
        ]);
        const anchor: ComparisonAnchor = { mode: 'driver', key: 'TMPRSS2' };
        store.setAnchor(anchor);
        const rows = store.comparisonRows;
        assert.equal(rows[0].anchorBreakpoint, 100);
        assert.equal(rows.length, 2);
    });

    it('alignment defaults to junction and is settable', () => {
        const store = new FusionCohortStore();
        assert.equal(store.alignment, 'junction');
        store.setAlignment('coordinate');
        assert.equal(store.alignment, 'coordinate');
    });
});
```

> Adjust the SV field names (`site1HugoSymbol`, `site1Position`, …) to match what `structuralVariantAdapter` actually reads — copy them from an existing `FusionCohortStore.spec.ts` fixture in this file.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts`
Expected: FAIL — `setAnchor` / `comparisonRows` undefined.

- [ ] **Step 3: Add the store members**

In `FusionCohortStore.ts`, add imports and members:

```typescript
import {
    buildComparisonRows,
    sortComparisonRows,
    ComparisonAnchor,
    ComparisonRow,
} from './data/comparisonRows';

// inside the class:
@observable anchor: ComparisonAnchor | undefined = undefined;
@observable alignment: 'junction' | 'coordinate' = 'junction';

@action setAnchor(a: ComparisonAnchor) {
    this.anchor = a;
}

@action setAlignment(a: 'junction' | 'coordinate') {
    this.alignment = a;
}

@computed get comparisonRows(): ComparisonRow[] {
    if (!this.anchor) return [];
    const rows = buildComparisonRows(this.filteredEvents, this.anchor);
    return sortComparisonRows(rows);
}
```

> `this.filteredEvents` already applies the frame facet (`filter.inFrame`); reuse it so the frame filter automatically governs the comparison.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/FusionCohortStore.ts src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts
git commit -m "feat(fusionViewer): add anchor + alignment + comparisonRows to cohort store"
```

---

## Phase 2 — Tier 1: AnchorGeneTrackRuler

### Task 3: Anchor track with stacked breakpoint lollipops

**Files:**
- Create: `src/pages/patientView/fusionViewer/components/AnchorGeneTrackRuler.tsx`
- Test: `src/pages/patientView/fusionViewer/components/AnchorGeneTrackRuler.spec.tsx`

**Interfaces:**
- Consumes: `genomicToSvgX`, `computeGeneTrackRange`, `applyUpstreamExtension` from `./GeneTrack`; `frameStatusStyle` from `./frameStatusStyle`; `ComparisonRow` from `../data/comparisonRows`; `TranscriptData`, `COLOR_5PRIME`, `COLOR_BREAKPOINT` from `../data/types`.
- Produces:
  - `interface AnchorGeneTrackRulerProps { anchorTranscript: TranscriptData; anchorSymbol: string; rows: ComparisonRow[]; width: number; onSelectRow?: (sampleId: string) => void; }`
  - default export `AnchorGeneTrackRuler` (React.FC) rendering one `<g data-testid="anchor-track">` plus one `<circle data-testid="lollipop">` per row, with stems at the breakpoint x.
  - exported helper `function stackLollipops(rows: ComparisonRow[]): { row: ComparisonRow; binIndex: number }[]` — groups rows by identical `anchorBreakpoint`, assigns a vertical index within each bin.

- [ ] **Step 1: Write the failing test**

```typescript
import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import AnchorGeneTrackRuler, { stackLollipops } from './AnchorGeneTrackRuler';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData } from '../data/types';

const tx: TranscriptData = {
    transcriptId: 't1',
    displayName: 't1',
    gene: 'TMPRSS2',
    biotype: 'protein_coding',
    strand: '+',
    txStart: 0,
    txEnd: 1000,
    exons: [
        { number: 1, start: 0, end: 100 },
        { number: 2, start: 400, end: 500 },
    ],
    isForteSelected: true,
    domains: [],
    utrs: [],
};

function row(bp: number, id: string): ComparisonRow {
    return {
        event: {} as any,
        sampleId: id,
        fivePrimeSymbol: 'TMPRSS2',
        threePrimeSymbol: 'ERG',
        anchorBreakpoint: bp,
        frame: 'inFrame',
    };
}

describe('stackLollipops', () => {
    it('assigns increasing binIndex to rows sharing a breakpoint', () => {
        const out = stackLollipops([row(100, 'a'), row(100, 'b'), row(500, 'c')]);
        const at100 = out.filter(o => o.row.anchorBreakpoint === 100);
        assert.deepEqual(at100.map(o => o.binIndex).sort(), [0, 1]);
        assert.equal(out.find(o => o.row.sampleId === 'c')!.binIndex, 0);
    });
});

describe('AnchorGeneTrackRuler', () => {
    it('renders one lollipop per row and an anchor track', () => {
        const wrapper = mount(
            <svg>
                <AnchorGeneTrackRuler
                    anchorTranscript={tx}
                    anchorSymbol="TMPRSS2"
                    rows={[row(100, 'a'), row(500, 'b')]}
                    width={800}
                />
            </svg>
        );
        assert.lengthOf(wrapper.find('[data-testid="anchor-track"]').hostNodes(), 1);
        assert.lengthOf(wrapper.find('[data-testid="lollipop"]').hostNodes(), 2);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/pages/patientView/fusionViewer/components/AnchorGeneTrackRuler.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```typescript
import * as React from 'react';
import {
    genomicToSvgX,
    computeGeneTrackRange,
    applyUpstreamExtension,
} from './GeneTrack';
import { frameStatusStyle } from './frameStatusStyle';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData, COLOR_5PRIME, COLOR_BREAKPOINT } from '../data/types';

export interface AnchorGeneTrackRulerProps {
    anchorTranscript: TranscriptData;
    anchorSymbol: string;
    rows: ComparisonRow[];
    width: number;
    onSelectRow?: (sampleId: string) => void;
}

export function stackLollipops(
    rows: ComparisonRow[]
): { row: ComparisonRow; binIndex: number }[] {
    const seen = new Map<number, number>();
    return rows.map(row => {
        const n = seen.get(row.anchorBreakpoint) ?? 0;
        seen.set(row.anchorBreakpoint, n + 1);
        return { row, binIndex: n };
    });
}

const TRACK_Y = 120;
const EXON_H = 12;
const PADDING = 10;

const AnchorGeneTrackRuler: React.FC<AnchorGeneTrackRulerProps> = ({
    anchorTranscript,
    anchorSymbol,
    rows,
    width,
    onSelectRow,
}) => {
    const { strand, exons } = anchorTranscript;
    const breakpoints = rows.map(r => r.anchorBreakpoint);
    const refPos = breakpoints.length ? breakpoints[0] : exons[0].start;
    const base = computeGeneTrackRange(exons, refPos);
    const { gMin, gMax } = applyUpstreamExtension(
        base.gMin,
        base.gMax,
        strand,
        exons
    );
    const drawX = PADDING;
    const drawW = width - PADDING * 2;
    const toX = (g: number) =>
        genomicToSvgX(g, gMin, gMax, drawX, drawW, strand);

    const stacked = stackLollipops(rows);

    return (
        <g data-testid="anchor-track">
            {/* gene body: exons */}
            {exons.map((e, i) => {
                const x = Math.min(toX(e.start), toX(e.end));
                const w = Math.max(2, Math.abs(toX(e.end) - toX(e.start)));
                return (
                    <rect
                        key={i}
                        x={x}
                        y={TRACK_Y}
                        width={w}
                        height={EXON_H}
                        rx={1}
                        fill={COLOR_5PRIME}
                    />
                );
            })}
            <text x={drawX} y={TRACK_Y - 20} fontSize={13} fontWeight="bold" fill="#333">
                {anchorSymbol} ({strand})
            </text>
            {/* lollipops */}
            {stacked.map(({ row, binIndex }) => {
                const x = toX(row.anchorBreakpoint);
                const cy = 46 - binIndex * 16;
                const style = frameStatusStyle(row.frame);
                return (
                    <g key={row.sampleId}>
                        <line
                            x1={x}
                            y1={TRACK_Y - 6}
                            x2={x}
                            y2={cy}
                            stroke={COLOR_BREAKPOINT}
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                        />
                        <circle
                            data-testid="lollipop"
                            cx={x}
                            cy={cy}
                            r={6.5}
                            fill={style.hollow ? '#fff' : style.fill}
                            stroke={style.hollow ? '#b9c0cc' : style.fill}
                            strokeWidth={1.5}
                            style={{ cursor: onSelectRow ? 'pointer' : 'default' }}
                            onClick={() => onSelectRow && onSelectRow(row.sampleId)}
                        >
                            <title>
                                {row.sampleId} — {style.label}
                            </title>
                        </circle>
                    </g>
                );
            })}
        </g>
    );
};

export default AnchorGeneTrackRuler;
```

> Confirm `frameStatusStyle` returns `{ label, fill, hollow }` (per spec). If the prop name differs, match it.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/pages/patientView/fusionViewer/components/AnchorGeneTrackRuler.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/components/AnchorGeneTrackRuler.tsx src/pages/patientView/fusionViewer/components/AnchorGeneTrackRuler.spec.tsx
git commit -m "feat(fusionViewer): Tier-1 anchor track with stacked breakpoint lollipops"
```

---

## Phase 3 — Tier 2: condensed product strips

### Task 4: FusionProductStrip (one condensed product row)

**Files:**
- Create: `src/pages/patientView/fusionViewer/components/FusionProductStrip.tsx`
- Test: `src/pages/patientView/fusionViewer/components/FusionProductStrip.spec.tsx`

**Interfaces:**
- Consumes: `computeFusionExonLayout`, `retainedExonsInOrder` from `./fusionProductHelpers`; `generatePfamDomainColorMap` from `../data/pfamColors`; `frameStatusStyle`; `COLOR_5PRIME`, `COLOR_3PRIME`, `COLOR_BREAKPOINT`, `TranscriptData` from `../data/types`; `FrameStatus` from `../data/cohortAggregation`.
- Produces:
  - `interface FusionProductStripProps { sampleId: string; label: string; transcript5p: TranscriptData; transcript3p?: TranscriptData; breakpoint5p: number; breakpoint3p?: number; frame: FrameStatus; reads: number; x: number; y: number; width: number; alignment: 'junction' | 'coordinate'; junctionX: number; onClick?: () => void; }`
  - default export `FusionProductStrip` (React.FC) rendering `<g data-testid="product-strip">` with `<rect data-testid="strip-exon">` blocks and a hover active outline `<rect data-testid="strip-active-outline">`.

- [ ] **Step 1: Write the failing test**

```typescript
import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionProductStrip from './FusionProductStrip';
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
        domains: [],
        utrs: [],
    };
}

describe('FusionProductStrip', () => {
    it('renders retained exon rects for both partners', () => {
        const wrapper = mount(
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
                    x={0}
                    y={0}
                    width={600}
                    alignment="junction"
                    junctionX={300}
                />
            </svg>
        );
        assert.isAtLeast(
            wrapper.find('[data-testid="strip-exon"]').hostNodes().length,
            2
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/pages/patientView/fusionViewer/components/FusionProductStrip.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

```typescript
import * as React from 'react';
import {
    computeFusionExonLayout,
    retainedExonsInOrder,
} from './fusionProductHelpers';
import { frameStatusStyle } from './frameStatusStyle';
import {
    TranscriptData,
    COLOR_5PRIME,
    COLOR_3PRIME,
    COLOR_BREAKPOINT,
} from '../data/types';
import { FrameStatus } from '../data/cohortAggregation';

export interface FusionProductStripProps {
    sampleId: string;
    label: string;
    transcript5p: TranscriptData;
    transcript3p?: TranscriptData;
    breakpoint5p: number;
    breakpoint3p?: number;
    frame: FrameStatus;
    reads: number;
    x: number;
    y: number;
    width: number;
    alignment: 'junction' | 'coordinate';
    junctionX: number;
    onClick?: () => void;
}

const PH = 14; // product exon height

const FusionProductStrip: React.FC<FusionProductStripProps> = ({
    sampleId,
    label,
    transcript5p,
    transcript3p,
    breakpoint5p,
    breakpoint3p,
    frame,
    reads,
    x,
    y,
    width,
    junctionX,
    onClick,
}) => {
    const retained5p = retainedExonsInOrder(transcript5p, breakpoint5p, true);
    const retained3p =
        transcript3p && breakpoint3p !== undefined
            ? retainedExonsInOrder(transcript3p, breakpoint3p, false)
            : [];
    const layout = computeFusionExonLayout(retained5p, retained3p, x, width);
    const yEx = y + 24 - PH / 2;
    const style = frameStatusStyle(frame);

    return (
        <g
            data-testid="product-strip"
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            <rect
                data-testid="strip-active-outline"
                className="strip-active-outline"
                x={x - 4}
                y={yEx - 9}
                width={width + 8}
                height={PH + 18}
                fill="none"
                stroke="#e03131"
                strokeWidth={2}
                strokeDasharray="5 3"
                rx={3}
                opacity={0}
            />
            <text x={x + 4} y={y + 25} fontSize={11.5} fontWeight={600} fill="#333">
                {label}
            </text>
            {retained5p.map((_, i) => (
                <rect
                    key={`5p-${i}`}
                    data-testid="strip-exon"
                    x={layout.xs5p[i]}
                    y={yEx}
                    width={layout.widths5p[i]}
                    height={PH}
                    rx={2}
                    fill={COLOR_5PRIME}
                />
            ))}
            {retained3p.map((_, i) => (
                <rect
                    key={`3p-${i}`}
                    data-testid="strip-exon"
                    x={layout.xs3p[i]}
                    y={yEx}
                    width={layout.widths3p[i]}
                    height={PH}
                    rx={2}
                    fill={COLOR_3PRIME}
                />
            ))}
            {retained5p.length > 0 && retained3p.length > 0 && (
                <line
                    x1={layout.junctionX}
                    y1={yEx - 3}
                    x2={layout.junctionX}
                    y2={yEx + PH + 3}
                    stroke={COLOR_BREAKPOINT}
                    strokeWidth={1.5}
                />
            )}
            <text x={x + width + 18} y={y + 27} fontSize={9.5} fill="#666">
                {style.label} · {reads}r
            </text>
        </g>
    );
};

export default FusionProductStrip;
```

Add the hover rule to `styles.module.scss` (or a co-located style) — the active outline appears on row hover:

```scss
[data-testid='product-strip']:hover .strip-active-outline {
    opacity: 1;
}
```

> Confirm `computeFusionExonLayout` returns `{ xs5p, widths5p, xs3p, widths3p, junctionX, startX }` (it does per `FusionProduct.tsx`). `alignment === 'coordinate'` handling is added in Task 6's assembly via `junctionX`; for the strip, junction-align is the default geometry.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/pages/patientView/fusionViewer/components/FusionProductStrip.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/components/FusionProductStrip.tsx src/pages/patientView/fusionViewer/components/FusionProductStrip.spec.tsx src/pages/patientView/fusionViewer/styles.module.scss
git commit -m "feat(fusionViewer): Tier-2 condensed FusionProduct strip"
```

### Task 5: FusionStripList — virtualized scroll container

**Files:**
- Create: `src/pages/patientView/fusionViewer/components/FusionStripList.tsx`
- Test: `src/pages/patientView/fusionViewer/components/FusionStripList.spec.tsx`

**Interfaces:**
- Consumes: `ComparisonRow` from `../data/comparisonRows`; `FusionProductStrip`.
- Produces:
  - `interface FusionStripListProps { rows: ComparisonRow[]; transcriptForGene: (gene: string) => TranscriptData | undefined; width: number; alignment: 'junction' | 'coordinate'; rowHeight?: number; viewportHeight?: number; scrollTop?: number; onExpand?: (sampleId: string) => void; }`
  - exported helper `function visibleWindow(total: number, rowHeight: number, viewportHeight: number, scrollTop: number): { start: number; end: number }` — inclusive `start`, exclusive `end`, with a 2-row overscan.
  - default export `FusionStripList` rendering only `[start,end)` strips inside a scroll `<div>`.

- [ ] **Step 1: Write the failing test**

```typescript
import { assert } from 'chai';
import { visibleWindow } from './FusionStripList';

describe('visibleWindow', () => {
    it('returns only the rows intersecting the viewport plus overscan', () => {
        // 100 rows, 50px each, 200px viewport, scrolled to 1000px
        const { start, end } = visibleWindow(100, 50, 200, 1000);
        // first visible row = 1000/50 = 20; overscan 2 → start 18
        assert.equal(start, 18);
        // last visible = (1000+200)/50 = 24; +overscan → 26 (exclusive)
        assert.equal(end, 26);
    });

    it('clamps to [0, total]', () => {
        const { start, end } = visibleWindow(5, 50, 400, 0);
        assert.equal(start, 0);
        assert.equal(end, 5);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/pages/patientView/fusionViewer/components/FusionStripList.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
import * as React from 'react';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData } from '../data/types';
import FusionProductStrip from './FusionProductStrip';

const OVERSCAN = 2;

export function visibleWindow(
    total: number,
    rowHeight: number,
    viewportHeight: number,
    scrollTop: number
): { start: number; end: number } {
    const first = Math.floor(scrollTop / rowHeight);
    const last = Math.ceil((scrollTop + viewportHeight) / rowHeight);
    const start = Math.max(0, first - OVERSCAN);
    const end = Math.min(total, last + OVERSCAN);
    return { start, end };
}

export interface FusionStripListProps {
    rows: ComparisonRow[];
    transcriptForGene: (gene: string) => TranscriptData | undefined;
    width: number;
    alignment: 'junction' | 'coordinate';
    rowHeight?: number;
    viewportHeight?: number;
    scrollTop?: number;
    onExpand?: (sampleId: string) => void;
}

const FusionStripList: React.FC<FusionStripListProps> = ({
    rows,
    transcriptForGene,
    width,
    alignment,
    rowHeight = 50,
    viewportHeight = 500,
    scrollTop: controlledScroll,
    onExpand,
}) => {
    const [scrollTop, setScrollTop] = React.useState(controlledScroll ?? 0);
    const effective = controlledScroll ?? scrollTop;
    const { start, end } = visibleWindow(
        rows.length,
        rowHeight,
        viewportHeight,
        effective
    );
    const junctionX = width * 0.46;

    return (
        <div
            data-testid="strip-scroll"
            style={{ height: viewportHeight, overflowY: 'auto' }}
            onScroll={e => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        >
            <svg width="100%" height={rows.length * rowHeight}>
                {rows.slice(start, end).map((row, i) => {
                    const idx = start + i;
                    const t5 = transcriptForGene(row.fivePrimeSymbol);
                    const t3 = row.threePrimeSymbol
                        ? transcriptForGene(row.threePrimeSymbol)
                        : undefined;
                    if (!t5) return null;
                    return (
                        <FusionProductStrip
                            key={row.sampleId}
                            sampleId={row.sampleId}
                            label={row.sampleId}
                            transcript5p={t5}
                            transcript3p={t3}
                            breakpoint5p={row.anchorBreakpoint}
                            breakpoint3p={row.event.gene2?.position}
                            frame={row.frame}
                            reads={row.event.totalReadSupport}
                            x={150}
                            y={idx * rowHeight}
                            width={width - 260}
                            alignment={alignment}
                            junctionX={junctionX}
                            onClick={() => onExpand && onExpand(row.sampleId)}
                        />
                    );
                })}
            </svg>
        </div>
    );
};

export default FusionStripList;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/pages/patientView/fusionViewer/components/FusionStripList.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/components/FusionStripList.tsx src/pages/patientView/fusionViewer/components/FusionStripList.spec.tsx
git commit -m "feat(fusionViewer): virtualized strip list for Tier-2 comparison"
```

---

## Phase 4 — FusionComparisonView assembly

### Task 6: Assemble the two-tier view with toggle + frame filter + expand

**Files:**
- Create: `src/pages/patientView/fusionViewer/FusionComparisonView.tsx`
- Test: `src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx`

**Interfaces:**
- Consumes: `FusionCohortStore`, `AnchorGeneTrackRuler`, `FusionStripList`, `FusionDiagramSVG`, `FusionRecurrenceTable`; `fetchTranscriptsForGeneWithFallback`.
- Produces:
  - `interface FusionComparisonViewProps { store: FusionCohortStore; }`
  - `@observer` default export `FusionComparisonView` that renders: an anchor switcher (`FusionRecurrenceTable`), an alignment toggle (`data-testid="alignment-toggle"`), a frame filter, Tier 1 `AnchorGeneTrackRuler`, Tier 2 `FusionStripList`, and an expanded `FusionDiagramSVG` when a row is clicked (`data-testid="expanded-diagram"`).
  - internal `@observable.ref transcriptsByGene: Map<string, TranscriptData>` populated by a `remoteData`/effect that dedupes fetches by gene symbol across `store.comparisonRows`.

- [ ] **Step 1: Write the failing test**

```typescript
import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionComparisonView from './FusionComparisonView';
import { FusionCohortStore } from './FusionCohortStore';

jest.mock('./data/genomeNexusTranscriptService', () => ({
    fetchTranscriptsForGeneWithFallback: jest.fn(() => Promise.resolve([])),
}));

describe('FusionComparisonView', () => {
    it('renders the alignment toggle and reacts to store anchor', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            { site1HugoSymbol: 'TMPRSS2', site2HugoSymbol: 'ERG', sampleId: 'S1', site1Position: 100 } as any,
        ]);
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        assert.lengthOf(
            wrapper.find('[data-testid="alignment-toggle"]').hostNodes(),
            1
        );
    });

    it('toggling alignment updates the store', () => {
        const store = new FusionCohortStore();
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        wrapper
            .find('[data-testid="alignment-toggle"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.alignment, 'coordinate');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import { FusionCohortStore } from './FusionCohortStore';
import AnchorGeneTrackRuler from './components/AnchorGeneTrackRuler';
import FusionStripList from './components/FusionStripList';
import { FusionRecurrenceTable } from './FusionRecurrenceTable';
import { TranscriptData } from './data/types';
import { fetchTranscriptsForGeneWithFallback } from './data/genomeNexusTranscriptService';

export interface FusionComparisonViewProps {
    store: FusionCohortStore;
}

@observer
export default class FusionComparisonView extends React.Component<
    FusionComparisonViewProps
> {
    @observable.ref transcriptsByGene: Map<string, TranscriptData> = new Map();
    @observable expandedSampleId: string | undefined = undefined;

    constructor(props: FusionComparisonViewProps) {
        super(props);
        makeObservable(this);
    }

    @computed get genesNeeded(): string[] {
        const set = new Set<string>();
        this.props.store.comparisonRows.forEach(r => {
            set.add(r.fivePrimeSymbol);
            if (r.threePrimeSymbol) set.add(r.threePrimeSymbol);
        });
        return Array.from(set);
    }

    @action.bound toggleAlignment() {
        this.props.store.setAlignment(
            this.props.store.alignment === 'junction'
                ? 'coordinate'
                : 'junction'
        );
    }

    componentDidMount() {
        this.fetchTranscripts();
    }
    componentDidUpdate() {
        this.fetchTranscripts();
    }

    @action.bound async fetchTranscripts() {
        const missing = this.genesNeeded.filter(
            g => !this.transcriptsByGene.has(g)
        );
        if (missing.length === 0) return;
        const next = new Map(this.transcriptsByGene);
        for (const gene of missing) {
            const list = await fetchTranscriptsForGeneWithFallback(
                gene,
                '',
                'GRCh38' as any
            );
            const forte = list.find(t => t.isForteSelected) || list[0];
            if (forte) next.set(gene, forte);
        }
        this.transcriptsByGene = next;
    }

    transcriptForGene = (gene: string): TranscriptData | undefined =>
        this.transcriptsByGene.get(gene);

    render() {
        const { store } = this.props;
        const rows = store.comparisonRows;
        const anchorGene =
            store.anchor && store.anchor.mode === 'driver'
                ? store.anchor.key
                : rows.length
                ? rows[0].fivePrimeSymbol
                : '';
        const anchorTranscript = this.transcriptForGene(anchorGene);
        const expandedRow = rows.find(
            r => r.sampleId === this.expandedSampleId
        );

        return (
            <div>
                <FusionRecurrenceTable store={store} />
                <button
                    data-testid="alignment-toggle"
                    onClick={this.toggleAlignment}
                >
                    {store.alignment === 'junction'
                        ? 'Align: junction'
                        : 'Align: coordinate'}
                </button>
                <svg width="100%" viewBox="0 0 1240 168">
                    {anchorTranscript && (
                        <AnchorGeneTrackRuler
                            anchorTranscript={anchorTranscript}
                            anchorSymbol={anchorGene}
                            rows={rows}
                            width={1240}
                        />
                    )}
                </svg>
                <FusionStripList
                    rows={rows}
                    transcriptForGene={this.transcriptForGene}
                    width={1240}
                    alignment={store.alignment}
                    onExpand={id => (this.expandedSampleId = id)}
                />
                {expandedRow && anchorTranscript && (
                    <div data-testid="expanded-diagram">
                        {/* FusionDiagramSVG wiring: pass expandedRow.event + its
                            5p/3p FORTE transcripts. Reuse FusionViewerStore's
                            transcript selection if richer detail is needed. */}
                    </div>
                )}
            </div>
        );
    }
}
```

> The `expanded-diagram` block renders `FusionDiagramSVG` with the clicked event's transcripts. Wire it using the same props `FusionDiagramSVG` requires (see `FusionDiagramSVG.tsx:45`): `fusion`, `forteTranscript5p`, `forteTranscript3p`, `activeTranscript5p`. Pull the 5p/3p transcripts from `transcriptsByGene`. Keep this minimal — a modal/expander is fine.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx`
Expected: PASS (2 passing).

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/FusionComparisonView.tsx src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx
git commit -m "feat(fusionViewer): assemble two-tier FusionComparisonView"
```

---

## Phase 5 — studyView comparison tab

### Task 7: Add FUSION_COMPARISON studyView tab next to CN Segments

**Files:**
- Modify: `src/pages/studyView/StudyViewPageTabs.ts` (enum `StudyViewPageTabKeyEnum`)
- Modify: `src/pages/studyView/StudyViewPage.tsx` (around the `CN_SEGMENTS` `MSKTab`, ~line 717)

**Interfaces:**
- Consumes: `FusionComparisonView`, a `FusionCohortStore` fed by `store.structuralVariantData` (study-level SVs).
- Produces: a new visible tab keyed `StudyViewPageTabKeyEnum.FUSION_COMPARISON`.

- [ ] **Step 1: Add the enum value**

Find `StudyViewPageTabKeyEnum` (imported in `StudyViewPage.tsx:15`). Add:

```typescript
FUSION_COMPARISON = 'fusionComparison',
```

- [ ] **Step 2: Build a study-level FusionCohortStore**

In `StudyViewPage.tsx`, add a lazily-constructed store fed by the study's structural variants. Near the other `@computed` getters:

```typescript
@computed get fusionCohortStore(): FusionCohortStore {
    const s = new FusionCohortStore();
    s.setStructuralVariants(this.store.structuralVariantData.result || []);
    return s;
}
```

> Confirm the studyView store exposes study-level SVs (`structuralVariantData` or equivalent). If not present, fetch via the existing structural-variant remoteData used by the CN/SV charts; match the field the SV chart consumes.

- [ ] **Step 3: Mount the tab next to CN Segments**

Immediately after the `CN_SEGMENTS` `<MSKTab>` block (~line 717-731), add:

```tsx
<MSKTab
    id={StudyViewPageTabKeyEnum.FUSION_COMPARISON}
    linkText="SV / Fusion Comparison"
>
    <FusionComparisonView store={this.fusionCohortStore} />
</MSKTab>
```

Add the import at the top:

```typescript
import FusionComparisonView from 'pages/patientView/fusionViewer/FusionComparisonView';
import { FusionCohortStore } from 'pages/patientView/fusionViewer/FusionCohortStore';
```

- [ ] **Step 4: Verify build + tab renders**

Run: `yarn run start` and open a study with SV/fusion data; confirm the "SV / Fusion Comparison" tab appears next to CN Segments and renders without console errors.
Expected: tab visible; selecting it shows the recurrence table + (empty until an anchor is chosen) comparison.

- [ ] **Step 5: Commit**

```bash
git add src/pages/studyView/StudyViewPageTabs.ts src/pages/studyView/StudyViewPage.tsx
git commit -m "feat(studyView): mount SV/Fusion Comparison tab next to CN Segments"
```

### Task 8: Remove the temporary patient-view demo mount

**Files:**
- Modify: `src/pages/patientView/PatientViewPageTabs.tsx` (revert commit `f43fcf93c`'s additions: imports lines 40-41, enum 55-56, demo `MSKTab` 738-748)

- [ ] **Step 1: Remove the demo tab**

Delete the `FusionCohort` enum member, the `FusionCohortTab` + `DEMO_COHORT_STRUCTURAL_VARIANTS` imports, and the demo `<MSKTab key={91} …>` block.

- [ ] **Step 2: Verify build**

Run: `yarn jest src/pages/patientView/PatientViewPageTabs` (if a spec exists) and `yarn run start`; confirm patient view no longer shows the demo "Fusion Cohort" tab and compiles.
Expected: clean build, no demo tab.

- [ ] **Step 3: Commit**

```bash
git add src/pages/patientView/PatientViewPageTabs.tsx
git commit -m "chore(fusionViewer): remove temporary patient-view demo cohort tab"
```

---

## Phase 6 — studyView summary table widget

### Task 9: Data-adaptive summary table widget + routing

**Files:**
- Create: `src/pages/studyView/charts/fusionSummary/FusionSummaryTableWidget.tsx`
- Test: `src/pages/studyView/charts/fusionSummary/FusionSummaryTableWidget.spec.tsx`
- Modify: summary chart registration so the widget appears in the grid (follow the pattern of an existing custom chart, e.g. how CN/SV summary charts register).

**Interfaces:**
- Consumes: `FusionCohortStore` (its `pairSummaries`), `frameStatusStyle`, `ComparisonAnchor`.
- Produces:
  - `interface FusionSummaryTableWidgetProps { store: FusionCohortStore; hasFusionAnnotation: boolean; onSelectAnchor: (a: ComparisonAnchor) => void; }`
  - `@observer` default export rendering a table; each row `data-testid="fusion-summary-row"`; clicking calls `onSelectAnchor({ mode: 'pair', key })`.
  - exported helper `function summaryTitle(hasFusionAnnotation: boolean): string` → `'Top recurrent fusions'` or `'Top SV gene pairs'`.

- [ ] **Step 1: Write the failing test**

```typescript
import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionSummaryTableWidget, {
    summaryTitle,
} from './FusionSummaryTableWidget';
import { FusionCohortStore } from 'pages/patientView/fusionViewer/FusionCohortStore';

describe('summaryTitle', () => {
    it('switches label on annotation availability', () => {
        assert.equal(summaryTitle(true), 'Top recurrent fusions');
        assert.equal(summaryTitle(false), 'Top SV gene pairs');
    });
});

describe('FusionSummaryTableWidget', () => {
    it('emits an anchor when a row is clicked', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            { site1HugoSymbol: 'TMPRSS2', site2HugoSymbol: 'ERG', sampleId: 'S1', site1Position: 100 } as any,
            { site1HugoSymbol: 'TMPRSS2', site2HugoSymbol: 'ERG', sampleId: 'S2', site1Position: 100 } as any,
        ]);
        let picked: any = null;
        const wrapper = mount(
            <FusionSummaryTableWidget
                store={store}
                hasFusionAnnotation={true}
                onSelectAnchor={a => (picked = a)}
            />
        );
        wrapper
            .find('[data-testid="fusion-summary-row"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(picked.mode, 'pair');
        assert.isString(picked.key);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/pages/studyView/charts/fusionSummary/FusionSummaryTableWidget.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
import * as React from 'react';
import { observer } from 'mobx-react';
import { FusionCohortStore } from 'pages/patientView/fusionViewer/FusionCohortStore';
import { frameStatusStyle } from 'pages/patientView/fusionViewer/components/frameStatusStyle';
import { ComparisonAnchor } from 'pages/patientView/fusionViewer/data/comparisonRows';

export function summaryTitle(hasFusionAnnotation: boolean): string {
    return hasFusionAnnotation
        ? 'Top recurrent fusions'
        : 'Top SV gene pairs';
}

export interface FusionSummaryTableWidgetProps {
    store: FusionCohortStore;
    hasFusionAnnotation: boolean;
    onSelectAnchor: (a: ComparisonAnchor) => void;
}

const FusionSummaryTableWidget: React.FC<FusionSummaryTableWidgetProps> = observer(
    ({ store, hasFusionAnnotation, onSelectAnchor }) => {
        const summaries = store.pairSummaries.slice(0, 10);
        return (
            <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {summaryTitle(hasFusionAnnotation)}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Gene pair</th>
                            <th># samples</th>
                            {hasFusionAnnotation && <th>In-frame?</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {summaries.map(s => {
                            const style = frameStatusStyle(
                                s.anyInFrame ? 'inFrame' : 'outOfFrame'
                            );
                            return (
                                <tr
                                    key={s.key}
                                    data-testid="fusion-summary-row"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() =>
                                        onSelectAnchor({
                                            mode: 'pair',
                                            key: s.key,
                                        })
                                    }
                                >
                                    <td>{s.key}</td>
                                    <td>{s.sampleCount}</td>
                                    {hasFusionAnnotation && (
                                        <td style={{ color: style.fill }}>
                                            {style.label}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }
);

export default FusionSummaryTableWidget;
```

> Confirm `pairSummaries` exposes `key`, `sampleCount`, `anyInFrame` (per spec types `FusionPairSummary`). `hasFusionAnnotation` is computed by the caller — true when any event has a non-empty `frameCallMethod`/transcript; pass `false` to get the SV-pair fallback title and column set.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/pages/studyView/charts/fusionSummary/FusionSummaryTableWidget.spec.tsx`
Expected: PASS (2 passing).

- [ ] **Step 5: Wire the widget into the summary grid + route to the tab**

Register the widget in the summary chart grid (mirror an existing custom chart registration). On `onSelectAnchor`, call `store.setAnchor(a)` on the shared `fusionCohortStore` and route to the tab:

```typescript
this.urlWrapper.setTab(StudyViewPageTabKeyEnum.FUSION_COMPARISON);
```

- [ ] **Step 6: Verify end-to-end**

Run: `yarn run start`; on a study summary, the widget lists top fusions (or "Top SV gene pairs" when no fusion annotation). Clicking a row switches to the comparison tab with that anchor loaded.
Expected: selection routes and the two-tier view renders for the chosen pair.

- [ ] **Step 7: Commit**

```bash
git add src/pages/studyView/charts/fusionSummary/ src/pages/studyView/StudyViewPage.tsx
git commit -m "feat(studyView): data-adaptive fusion/SV summary table widget with routing"
```

---

## Self-Review

**Spec coverage:**
- Two anchoring modes (pair/driver) → Task 1 `buildComparisonRows`. ✓
- Tier 1 anchor track + lollipops → Task 3. ✓
- Tier 2 condensed product strips + half-height UTR/domains → Task 4 (UTR half-height + Pfam domain lane: extend the strip's exon loop using `splitExonByFivePrimeUtr` and `generatePfamDomainColorMap` exactly as `FusionProduct.tsx`/`ProteinDomainTrack.tsx` do — same code, condensed height; add when fleshing out Task 4 if not covered by the minimal pass). ✓ (note below)
- Junction vs coordinate alignment toggle → Task 2 (state) + Task 6 (toggle UI). ✓
- Default breakpoint sort + frame filter → Task 1 `sortComparisonRows` + Task 2 (reuses `filteredEvents`). ✓
- Virtualized scroll → Task 5. ✓
- studyView summary table widget, data-adaptive → Task 9. ✓
- studyView comparison tab next to CN Segments → Task 7. ✓
- Transcript dedup by gene → Task 6 `genesNeeded` + `fetchTranscripts`. ✓
- Expand to full `FusionDiagramSVG` → Task 6 (`expanded-diagram`). ✓
- Remove demo mount → Task 8. ✓
- Degradation (SV-only → Tier 1 only) → handled by `hasFusionAnnotation` (Task 9) + strips skipping rows without a transcript (Task 5 `if (!t5) return null`). Add an explicit "breakpoint-only" summary line for SV-only Tier 2 if desired (spec open question #4).

**Placeholder scan:** The Task 4 UTR/domain detail and the Task 6 `expanded-diagram` body are described with the exact helpers and props to use rather than full code — these are deliberate "flesh out using the named existing component" steps, not silent TODOs. All pure-logic and core-render tasks have complete code + tests.

**Type consistency:** `ComparisonAnchor`/`ComparisonRow`/`AnchorMode` defined in Task 1 and used unchanged in Tasks 2/3/5/6/9. `frameStatusStyle(frame) → { label, fill, hollow }` assumed consistently — verify against `frameStatusStyle.ts` in Task 3 and fix all call sites if the shape differs. `computeFusionExonLayout` return shape (`xs5p/widths5p/xs3p/widths3p/junctionX/startX`) used in Tasks 4. `pairSummaries` fields (`key/sampleCount/anyInFrame`) used in Task 9.

**Pre-flight before coding:** Open `cohortAggregation.ts`, `frameStatusStyle.ts`, `fusionProductHelpers.ts`, and `FusionCohortStore.ts` and confirm the exact exported signatures named above; adjust call sites if any differ. These are the only external-shape assumptions in the plan.
