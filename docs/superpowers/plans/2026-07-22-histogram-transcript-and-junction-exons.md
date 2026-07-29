# Histogram Transcript Selector + Junction Exon Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users (1) choose which transcript the breakpoint histogram bins against, and (2) see junction exon numbers on the sample/dense/collapsed strips, with three switchable label placements to compare.

**Architecture:** Both features build on the existing fusion cohort builder (`src/pages/patientView/fusionViewer/`). Feature 1 adds a per-gene transcript override on `FusionCohortStore`, captures the full transcript list already fetched for the canonical isoform, and feeds *separate* histogram-transcript computeds into the two `AnchorGeneTrackRuler` instances — leaving the strip coordinate system (which snaps to the canonical `anchorTranscript`) untouched. Feature 2 adds a pure junction-exon helper and renders labels in `FusionProductStrip`, driven by a `junctionLabelMode` store flag threaded through `FusionStripList`.

**Tech Stack:** React + TypeScript, MobX (`@observable`/`@computed`/`@action`), enzyme + chai + mocha (`.spec.tsx`), Genome Nexus transcript service.

## Global Constraints

- Prettier: 4-space tab width, single quotes, ES5 trailing commas. Pre-commit hook runs Prettier; in the worktree the hook may fail on missing `node_modules` — use `git commit --no-verify` for doc/plan commits only, never to skip Prettier on `.ts`/`.tsx` (run `yarn run prettierFixLocal` if unsure).
- TypeScript strict: no implicit `any`, respect strict null checks.
- MobX: use `@observable`/`@computed`/`@action`; never mix React state with MobX state for these stores.
- Run a single spec file with: `yarn run testMain GREP=<File.spec>` (or the repo's existing single-file invocation). Verify each test fails before implementing.
- FORTE selects transcripts **per-sample, not per-cohort** — there is no cohort-level FORTE transcript. The histogram picker lists every Genome Nexus transcript for the gene; the **MSK-canonical** isoform (its `displayName` contains `(canonical)`) is the default.
- Feature 1 must NOT change what the strips or collapse grouping bin against — those stay on each sample's caller isoform (`transcriptForRow`) and on the canonical `anchorTranscript` for snapping.

---

## File Structure

| File | Responsibility | Feature |
|---|---|---|
| `data/types.ts` | add shared `JunctionLabelMode` type | 2 |
| `components/fusionProductHelpers.ts` (+`.spec.ts`) | add pure `junctionExonNumbers` | 2 |
| `FusionCohortStore.ts` (+`.spec.ts`) | `junctionLabelMode` + setter; `histogramTranscriptIdByGene` map + setter | 1, 2 |
| `components/FusionProductStrip.tsx` (+`.spec.tsx`) | render junction labels in 3 placement modes | 2 |
| `components/FusionStripList.tsx` (+`.spec.tsx`) | thread `junctionLabelMode` prop | 2 |
| `FusionComparisonView.tsx` (+`.spec.tsx`) | junction-mode segmented control; capture transcript option lists; `histogramAnchor/PartnerTranscript` computeds; per-gene tx `<select>` pickers | 1, 2 |

Feature 2 (Tasks 1–5) is self-contained and lands first (pure helper → store → component → wiring). Feature 1 (Tasks 6–8) follows.

---

## Task 1: Pure junction-exon helper

**Files:**
- Modify: `src/pages/patientView/fusionViewer/components/fusionProductHelpers.ts` (append near `retainedExonsInOrder`, ~line 308)
- Test: `src/pages/patientView/fusionViewer/components/fusionProductHelpers.spec.ts`

**Interfaces:**
- Consumes: `Exon` (from `../data/types`, shape `{ number: number; start: number; end: number }`), already imported in this file.
- Produces: `export function junctionExonNumbers(retained5p: Exon[], retained3p: Exon[]): { fivePrime?: number; threePrime?: number }` — the junction-adjacent exon numbers. `retainedExonsInOrder` returns exons in 5′→3′ transcription order, so the 5′ exon at the seam is the LAST of `retained5p` and the 3′ exon at the seam is the FIRST of `retained3p`.

- [ ] **Step 1: Write the failing test**

Add to `fusionProductHelpers.spec.ts` (add `junctionExonNumbers` to the existing import from `'./fusionProductHelpers'`):

```typescript
describe('junctionExonNumbers', () => {
    const ex = (number: number) => ({ number, start: number * 100, end: number * 100 + 50 });

    it('returns last retained 5′ exon and first retained 3′ exon', () => {
        const result = junctionExonNumbers([ex(1), ex(2), ex(3)], [ex(7), ex(8)]);
        assert.deepEqual(result, { fivePrime: 3, threePrime: 7 });
    });

    it('omits threePrime when there is no 3′ partner', () => {
        const result = junctionExonNumbers([ex(1), ex(2)], []);
        assert.deepEqual(result, { fivePrime: 2, threePrime: undefined });
    });

    it('omits fivePrime when the 5′ side is empty', () => {
        const result = junctionExonNumbers([], [ex(4), ex(5)]);
        assert.deepEqual(result, { fivePrime: undefined, threePrime: 4 });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn run testMain GREP=fusionProductHelpers.spec`
Expected: FAIL — `junctionExonNumbers is not a function` / not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `fusionProductHelpers.ts`:

```typescript
/**
 * The exon numbers flanking the fusion junction: the last retained 5′ exon and
 * the first retained 3′ exon. Inputs must be in 5′→3′ transcription order (the
 * order `retainedExonsInOrder` returns), so the seam sits between the last 5′
 * element and the first 3′ element. Either side may be empty (single-gene
 * event, or transcript not yet loaded) — the corresponding field is undefined.
 */
export function junctionExonNumbers(
    retained5p: Exon[],
    retained3p: Exon[]
): { fivePrime?: number; threePrime?: number } {
    return {
        fivePrime:
            retained5p.length > 0
                ? retained5p[retained5p.length - 1].number
                : undefined,
        threePrime: retained3p.length > 0 ? retained3p[0].number : undefined,
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn run testMain GREP=fusionProductHelpers.spec`
Expected: PASS (all three new cases, existing cases still green).

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/components/fusionProductHelpers.ts src/pages/patientView/fusionViewer/components/fusionProductHelpers.spec.ts
git commit -m "feat(fusion): junctionExonNumbers helper for strip junction labels"
```

---

## Task 2: `junctionLabelMode` store state + shared type

**Files:**
- Modify: `src/pages/patientView/fusionViewer/data/types.ts` (add type export)
- Modify: `src/pages/patientView/fusionViewer/FusionCohortStore.ts` (observable + action, near `stripMode` ~line 73 and `setStripMode` ~line 249)
- Test: `src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts`

**Interfaces:**
- Produces: `export type JunctionLabelMode = 'inline-tooltip' | 'inline-both' | 'gutter'` in `data/types.ts`.
- Produces on store: `@observable junctionLabelMode: JunctionLabelMode` (default `'inline-tooltip'`); `@action setJunctionLabelMode(m: JunctionLabelMode): void`.

- [ ] **Step 1: Write the failing test**

Add to `FusionCohortStore.spec.ts` (inside the existing top-level `describe`):

```typescript
describe('junctionLabelMode', () => {
    it('defaults to inline-tooltip and updates via setter', () => {
        const store = new FusionCohortStore();
        assert.equal(store.junctionLabelMode, 'inline-tooltip');
        store.setJunctionLabelMode('gutter');
        assert.equal(store.junctionLabelMode, 'gutter');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn run testMain GREP=FusionCohortStore.spec`
Expected: FAIL — `setJunctionLabelMode` not a function / property missing.

- [ ] **Step 3: Write minimal implementation**

In `data/types.ts`, add:

```typescript
/** Placement strategy for the junction exon labels on fusion-product strips. */
export type JunctionLabelMode = 'inline-tooltip' | 'inline-both' | 'gutter';
```

In `FusionCohortStore.ts`, add to the imports from `./data/types` (the existing `import { ... } from './data/types'` block) `JunctionLabelMode`. Add the observable after `stripMode` (~line 74):

```typescript
    /**
     * Placement strategy for junction exon labels on the strips (feature 2).
     * Three options so the user can compare and choose:
     *  - 'inline-tooltip' → text at the seam in sample/collapsed; dense folds it
     *    into the hover <title>.
     *  - 'inline-both'    → text at the seam in every mode (dense floats it above).
     *  - 'gutter'         → a thin label in the right gutter in every mode.
     */
    @observable public junctionLabelMode: JunctionLabelMode = 'inline-tooltip';
```

Add the action after `setStripMode` (~line 251):

```typescript
    @action
    public setJunctionLabelMode(m: JunctionLabelMode): void {
        this.junctionLabelMode = m;
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn run testMain GREP=FusionCohortStore.spec`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/data/types.ts src/pages/patientView/fusionViewer/FusionCohortStore.ts src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts
git commit -m "feat(fusion): junctionLabelMode store state + JunctionLabelMode type"
```

---

## Task 3: Render junction labels in `FusionProductStrip`

**Files:**
- Modify: `src/pages/patientView/fusionViewer/components/FusionProductStrip.tsx`
- Test: `src/pages/patientView/fusionViewer/components/FusionProductStrip.spec.tsx`

**Interfaces:**
- Consumes: `junctionExonNumbers` (Task 1); `JunctionLabelMode` (Task 2, from `../data/types`); existing `retained5p`/`retained3p` arrays already computed in the component body (lines 110–114); existing `COLOR_BREAKPOINT`.
- Produces: new optional prop `junctionLabelMode?: JunctionLabelMode` (default `'inline-tooltip'`). Renders:
  - `data-testid="junction-label"` — inline `<text>` at the seam (sample/collapsed always; dense only when mode is `inline-both`).
  - `data-testid="junction-gutter"` — `<text>` in the right gutter (mode `gutter`, all row types).
  - dense hover `<title>` includes `E{5}→E{3}` when mode is `inline-tooltip`.

- [ ] **Step 1: Write the failing test**

Add to `FusionProductStrip.spec.tsx` a describe block (reuse the file's existing `tx()` builder — its exons are numbered 1,2,3, so a 5′ breakpoint at 250 retains exons 1–2 → last 5′ = 2, and a 3′ breakpoint at 250 retains exons 2–3 → first 3′ = 2, giving label `E2|E2`):

```typescript
describe('junction exon labels', () => {
    function renderStrip(junctionLabelMode: any, compact = false) {
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
                    compact={compact}
                    junctionLabelMode={junctionLabelMode}
                />
            </svg>
        );
    }

    it('inline-tooltip: draws an inline seam label in per-sample mode', () => {
        const w = renderStrip('inline-tooltip', false);
        const label = w.find('[data-testid="junction-label"]').hostNodes();
        assert.equal(label.length, 1);
        assert.equal(label.text(), 'E2|E2');
    });

    it('inline-tooltip: no inline label in dense mode (folds into title)', () => {
        const w = renderStrip('inline-tooltip', true);
        assert.equal(
            w.find('[data-testid="junction-label"]').hostNodes().length,
            0
        );
        assert.include(w.find('title').text(), 'E2→E2');
    });

    it('inline-both: draws the inline seam label even in dense mode', () => {
        const w = renderStrip('inline-both', true);
        assert.equal(
            w.find('[data-testid="junction-label"]').hostNodes().length,
            1
        );
    });

    it('gutter: draws the label in the right gutter, not at the seam', () => {
        const w = renderStrip('gutter', false);
        assert.equal(
            w.find('[data-testid="junction-gutter"]').hostNodes().length,
            1
        );
        assert.equal(
            w.find('[data-testid="junction-label"]').hostNodes().length,
            0
        );
    });

    it('single-gene event shows only the 5′ exon', () => {
        const w = mount(
            <svg>
                <FusionProductStrip
                    sampleId="S1"
                    label="S1"
                    transcript5p={tx('TMPRSS2')}
                    breakpoint5p={250}
                    frame="unknown"
                    reads={3}
                    y={0}
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
                    junctionLabelMode="inline-tooltip"
                />
            </svg>
        );
        assert.equal(
            w.find('[data-testid="junction-label"]').hostNodes().text(),
            'E2'
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn run testMain GREP=FusionProductStrip.spec`
Expected: FAIL — no `junction-label` node; `junctionLabelMode` not a prop.

- [ ] **Step 3: Write minimal implementation**

In `FusionProductStrip.tsx`:

Add `JunctionLabelMode` to the `../data/types` import, and `junctionExonNumbers` to the `./fusionProductHelpers` import:

```typescript
import {
    computeJunctionAlignedLayout,
    retainedExonsInOrder,
    junctionExonNumbers,
} from './fusionProductHelpers';
```
```typescript
import {
    TranscriptData,
    COLOR_5PRIME,
    COLOR_3PRIME,
    COLOR_BREAKPOINT,
    COLOR_ACTIVE_OUTLINE,
    FrameStatus,
    JunctionLabelMode,
} from '../data/types';
```

Add the prop to `FusionProductStripProps` (after `frameSummary`, ~line 68):

```typescript
    // Junction exon label placement (feature 2). Defaults to 'inline-tooltip'.
    junctionLabelMode?: JunctionLabelMode;
```

Destructure it with a default in the component signature (after `frameSummary,` ~line 107):

```typescript
    junctionLabelMode = 'inline-tooltip',
```

After the `layout` computation and `style` line (~line 128), derive the label strings:

```typescript
    const junction = junctionExonNumbers(retained5p, retained3p);
    const junctionText =
        junction.fivePrime !== undefined && junction.threePrime !== undefined
            ? `E${junction.fivePrime}|E${junction.threePrime}`
            : junction.fivePrime !== undefined
            ? `E${junction.fivePrime}`
            : junction.threePrime !== undefined
            ? `E${junction.threePrime}`
            : '';
    const junctionArrow =
        junction.fivePrime !== undefined && junction.threePrime !== undefined
            ? `E${junction.fivePrime}→E${junction.threePrime}`
            : junctionText;
    // Inline seam label shows in sample/collapsed always; in dense only when the
    // user picked 'inline-both' (dense 'inline-tooltip' uses the hover <title>).
    const showInlineJunction =
        junctionLabelMode !== 'gutter' &&
        !!junctionText &&
        (!compact || junctionLabelMode === 'inline-both');
```

Update the dense `<title>` (lines 138–142) to fold in the junction for `inline-tooltip`:

```typescript
            {compact && (
                <title>
                    {label}
                    {junctionLabelMode === 'inline-tooltip' && junctionArrow
                        ? ` · ${junctionArrow}`
                        : ''}{' '}
                    · {style.label} · {reads}r
                </title>
            )}
```

Add the inline seam label immediately after the breakpoint `<line>` block (after line 211, before the right-gutter block):

```typescript
            {showInlineJunction && (
                <text
                    data-testid="junction-label"
                    x={layout.junctionX}
                    y={yEx - (compact ? 1.5 : 5)}
                    textAnchor="middle"
                    fontSize={compact ? 5 : 9}
                    fontWeight={600}
                    fill={COLOR_BREAKPOINT}
                >
                    {junctionText}
                </text>
            )}
            {junctionLabelMode === 'gutter' && junctionText && (
                <text
                    data-testid="junction-gutter"
                    x={rightX + 8}
                    y={compact ? centerY + 2 : textBaseline + 9}
                    fontSize={compact ? 6 : 9}
                    fontWeight={600}
                    fill={COLOR_BREAKPOINT}
                >
                    {junctionText}
                </text>
            )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn run testMain GREP=FusionProductStrip.spec`
Expected: PASS. If a pre-existing dense-`<title>` test asserts the exact string `S1 · In-frame · 12r`, update that assertion to `assert.include(...)` or to the new string (the default `inline-tooltip` mode now appends ` · E…→E…`). This is an expected, correct change — the strip now surfaces the junction in the dense tooltip.

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/components/FusionProductStrip.tsx src/pages/patientView/fusionViewer/components/FusionProductStrip.spec.tsx
git commit -m "feat(fusion): junction exon labels on strips with 3 placement modes"
```

---

## Task 4: Thread `junctionLabelMode` through `FusionStripList`

**Files:**
- Modify: `src/pages/patientView/fusionViewer/components/FusionStripList.tsx`
- Test: `src/pages/patientView/fusionViewer/components/FusionStripList.spec.tsx`

**Interfaces:**
- Consumes: `JunctionLabelMode` (from `../data/types`); `FusionProductStrip`'s `junctionLabelMode` prop (Task 3).
- Produces: new optional prop `junctionLabelMode?: JunctionLabelMode` on `FusionStripListProps`, forwarded to every `FusionProductStrip`.

- [ ] **Step 1: Write the failing test**

Add to `FusionStripList.spec.tsx` (reuse the file's existing row/transcript fixtures — match how the current tests build `rows` and `transcriptForRow`; the assertion is that the prop is forwarded):

```typescript
it('forwards junctionLabelMode to the product strips', () => {
    const wrapper = mount(
        <FusionStripList
            rows={rows}
            transcriptForRow={transcriptForRow}
            width={900}
            pxPerBp5p={0.5}
            pxPerBp3p={0.5}
            alignment="junction"
            mode="sample"
            junctionLabelMode="gutter"
        />
    );
    assert.isAbove(
        wrapper.find('[data-testid="junction-gutter"]').hostNodes().length,
        0
    );
});
```

> If the existing spec has no shared `rows`/`transcriptForRow` fixtures at file scope, build them inline in this test the same way the sibling tests in the file do (copy their fixture construction).

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn run testMain GREP=FusionStripList.spec`
Expected: FAIL — no `junction-gutter` nodes (prop not forwarded / not accepted).

- [ ] **Step 3: Write minimal implementation**

In `FusionStripList.tsx`:

Add `JunctionLabelMode` to the `../data/types` import:

```typescript
import { TranscriptData, JunctionLabelMode } from '../data/types';
```

Add to `FusionStripListProps` (after `onExpand?`, ~line 50):

```typescript
    // Junction exon label placement, forwarded to each strip (feature 2).
    junctionLabelMode?: JunctionLabelMode;
```

Destructure it in the component signature (after `onExpand,` ~line 65):

```typescript
    junctionLabelMode,
```

Forward it on the `<FusionProductStrip>` (add alongside the existing props, ~line 121):

```typescript
                            junctionLabelMode={junctionLabelMode}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn run testMain GREP=FusionStripList.spec`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/components/FusionStripList.tsx src/pages/patientView/fusionViewer/components/FusionStripList.spec.tsx
git commit -m "feat(fusion): thread junctionLabelMode through FusionStripList"
```

---

## Task 5: Junction-mode segmented control + wire to strips in `FusionComparisonView`

**Files:**
- Modify: `src/pages/patientView/fusionViewer/FusionComparisonView.tsx`
- Test: `src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx`

**Interfaces:**
- Consumes: `store.junctionLabelMode` / `store.setJunctionLabelMode` (Task 2); the existing `segmentButton(active, testId, label, tooltip, onClick)` helper (lines 181–210); `FusionStripList`'s `junctionLabelMode` prop (Task 4).
- Produces: three buttons `data-testid="junctionmode-inline-tooltip" | "junctionmode-inline-both" | "junctionmode-gutter"`; passes `junctionLabelMode={store.junctionLabelMode}` to `<FusionStripList>`.

- [ ] **Step 1: Write the failing test**

Add to `FusionComparisonView.spec.tsx` (follow the file's existing mount/fixture setup — a store seeded with structural variants; copy the existing "renders strip mode toggle" style test if present):

```typescript
it('junction-mode buttons update store.junctionLabelMode', () => {
    // `store` built via the same fixture the other tests in this file use.
    const wrapper = mount(
        <FusionComparisonView store={store} />
    );
    wrapper
        .find('[data-testid="junctionmode-gutter"]')
        .hostNodes()
        .first()
        .simulate('click');
    assert.equal(store.junctionLabelMode, 'gutter');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn run testMain GREP=FusionComparisonView.spec`
Expected: FAIL — no `junctionmode-gutter` button.

- [ ] **Step 3: Write minimal implementation**

In `FusionComparisonView.tsx`, add a "Junction labels" segmented control to the toolbar, immediately after the closing `</ButtonGroup>` of the Rows control and before the `{store.stripMode === 'collapsed' && (` block (~line 660):

```typescript
                    <span
                        style={{
                            fontSize: 11,
                            color: '#6c757d',
                            marginLeft: 12,
                        }}
                    >
                        Junction labels
                    </span>
                    <ButtonGroup>
                        {this.segmentButton(
                            store.junctionLabelMode === 'inline-tooltip',
                            'junctionmode-inline-tooltip',
                            'Inline + tip',
                            'Exon label at the seam; dense mode shows it in the hover tooltip',
                            () => store.setJunctionLabelMode('inline-tooltip')
                        )}
                        {this.segmentButton(
                            store.junctionLabelMode === 'inline-both',
                            'junctionmode-inline-both',
                            'Inline',
                            'Exon label at the seam in every row mode (dense floats it above)',
                            () => store.setJunctionLabelMode('inline-both')
                        )}
                        {this.segmentButton(
                            store.junctionLabelMode === 'gutter',
                            'junctionmode-gutter',
                            'Gutter',
                            'Exon label in the right gutter in every row mode',
                            () => store.setJunctionLabelMode('gutter')
                        )}
                    </ButtonGroup>
```

Pass the mode to `<FusionStripList>` (add to its props, ~line 870, alongside `mode={store.stripMode}`):

```typescript
                        junctionLabelMode={store.junctionLabelMode}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn run testMain GREP=FusionComparisonView.spec`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/FusionComparisonView.tsx src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx
git commit -m "feat(fusion): junction-label mode toggle wired to strips"
```

---

## Task 6: `histogramTranscriptIdByGene` store state

**Files:**
- Modify: `src/pages/patientView/fusionViewer/FusionCohortStore.ts`
- Test: `src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts`

**Interfaces:**
- Produces on store: `@observable histogramTranscriptIdByGene: ObservableMap<string, string>` (gene HUGO symbol → chosen Ensembl transcript id; absent/empty ⇒ canonical); `@action setHistogramTranscript(geneSymbol: string, transcriptId: string): void`.

- [ ] **Step 1: Write the failing test**

Add to `FusionCohortStore.spec.ts`:

```typescript
describe('histogramTranscriptIdByGene', () => {
    it('is empty by default and records a per-gene override', () => {
        const store = new FusionCohortStore();
        assert.equal(store.histogramTranscriptIdByGene.size, 0);
        store.setHistogramTranscript('TMPRSS2', 'ENST00000332149');
        assert.equal(
            store.histogramTranscriptIdByGene.get('TMPRSS2'),
            'ENST00000332149'
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn run testMain GREP=FusionCohortStore.spec`
Expected: FAIL — `setHistogramTranscript` not a function.

- [ ] **Step 3: Write minimal implementation**

In `FusionCohortStore.ts`, extend the top mobx import to include `ObservableMap`:

```typescript
import { action, computed, makeObservable, observable, ObservableMap } from 'mobx';
```

Add the observable after `collapseKindOverride` (~line 83):

```typescript
    /**
     * Per-gene override for the transcript the breakpoint histogram bins
     * against (feature 1). Keyed by gene HUGO symbol → Ensembl transcript id.
     * Absent/empty ⇒ the gene's MSK-canonical isoform (the default). Scoped to
     * the histogram only; the strips still use each sample's caller isoform.
     */
    @observable public histogramTranscriptIdByGene: ObservableMap<
        string,
        string
    > = observable.map<string, string>();
```

Add the action after `setCollapseKindOverride` (~line 256):

```typescript
    @action
    public setHistogramTranscript(
        geneSymbol: string,
        transcriptId: string
    ): void {
        this.histogramTranscriptIdByGene.set(geneSymbol, transcriptId);
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn run testMain GREP=FusionCohortStore.spec`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/FusionCohortStore.ts src/pages/patientView/fusionViewer/FusionCohortStore.spec.ts
git commit -m "feat(fusion): histogramTranscriptIdByGene store state"
```

---

## Task 7: Capture transcript option lists + histogram-transcript computeds

**Files:**
- Modify: `src/pages/patientView/fusionViewer/FusionComparisonView.tsx`
- Test: `src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx`

**Interfaces:**
- Consumes: `store.histogramTranscriptIdByGene` (Task 6); the existing `fetchTranscripts()` loop (lines 275–318) which already calls `fetchTranscriptsForGeneWithFallback(symbol, transcriptId, build)` — for a canonical request (`transcriptId === ''`) that call returns the FULL transcript list for the gene; today only the chosen isoform is kept.
- Produces:
  - `@observable.ref transcriptOptionsByGene: Map<string, TranscriptData[]>` — keyed by `${build}|${symbol}`, holding every transcript returned for the gene's canonical fetch.
  - `histogramTranscriptForGene(gene: string): TranscriptData | undefined` — the override transcript if one is set and present in the options, else undefined.
  - `@computed histogramAnchorTranscript: TranscriptData | undefined` = override for `anchorGene`, else `this.anchorTranscript`.
  - `@computed histogramPartnerTranscript: TranscriptData | undefined` = override for `partnerGene`, else `this.partnerTranscript`.

> **Critical:** do NOT modify `anchorTranscript`/`partnerTranscript` or `orientedRows`. Those drive `snapBreakpointsToAnchorGene` and the strips, which must stay on the canonical isoform. Only the two `<AnchorGeneTrackRuler>` `transcript=` props change (Task 7 Step 3 + Task 8).

- [ ] **Step 1: Write the failing test**

Add to `FusionComparisonView.spec.tsx`:

```typescript
it('histogramTranscriptForGene returns the override when set and loaded', () => {
    const store = new FusionCohortStore();
    const view = new FusionComparisonView({ store } as any);
    const canonical = {
        transcriptId: 'ENST_CANON',
        displayName: 'ENST_CANON (canonical)',
    } as any;
    const alt = { transcriptId: 'ENST_ALT', displayName: 'ENST_ALT' } as any;
    view.transcriptOptionsByGene = new Map([
        [`${store.genomeBuild}|TMPRSS2`, [canonical, alt]],
    ]);
    // No override → undefined (caller falls back to canonical anchorTranscript).
    assert.isUndefined(view.histogramTranscriptForGene('TMPRSS2'));
    store.setHistogramTranscript('TMPRSS2', 'ENST_ALT');
    assert.equal(view.histogramTranscriptForGene('TMPRSS2'), alt);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn run testMain GREP=FusionComparisonView.spec`
Expected: FAIL — `histogramTranscriptForGene` / `transcriptOptionsByGene` not defined.

- [ ] **Step 3: Write minimal implementation**

In `FusionComparisonView.tsx`:

Add the observable next to `transcriptsByKey` (~line 104):

```typescript
    // Full transcript list per gene (feature 1 histogram picker), keyed by
    // `${build}|${symbol}`. Populated from the canonical fetch, which returns
    // every transcript for the gene. Only the histogram picker reads this.
    @observable.ref transcriptOptionsByGene: Map<
        string,
        TranscriptData[]
    > = new Map();
```

In `fetchTranscripts()`, capture the full list on canonical requests. Add a collector before the loop (after `const fetched: [...] = [];` ~line 285):

```typescript
        const fetchedOptions: [string, TranscriptData[]][] = [];
```

Inside the loop, after `const chosen = list.find(...) || list[0];` (~line 295), add:

```typescript
                if (transcriptId === '' && list.length > 0) {
                    fetchedOptions.push([txKey(build, symbol, ''), list]);
                }
```

> Note: `txKey(build, symbol, '')` yields `${build}|${symbol}|` (trailing pipe). To key options as `${build}|${symbol}`, use `` `${build}|${symbol}` `` explicitly instead:
> ```typescript
>                 if (transcriptId === '' && list.length > 0) {
>                     fetchedOptions.push([`${build}|${symbol}`, list]);
>                 }
> ```
> Use this explicit form (not `txKey`) so lookups in `histogramTranscriptForGene` match.

Extend the merge block (the `if (fetched.length > 0 && ...)` at ~line 311) to also merge options:

```typescript
        if (
            (fetched.length > 0 || fetchedOptions.length > 0) &&
            this.props.store.genomeBuild === build
        ) {
            runInAction(() => {
                if (fetched.length > 0) {
                    const merged = new Map(this.transcriptsByKey);
                    fetched.forEach(([k, v]) => merged.set(k, v));
                    this.transcriptsByKey = merged;
                }
                if (fetchedOptions.length > 0) {
                    const mergedOpts = new Map(this.transcriptOptionsByGene);
                    fetchedOptions.forEach(([g, l]) => mergedOpts.set(g, l));
                    this.transcriptOptionsByGene = mergedOpts;
                }
            });
        }
```

Add the lookup method after `transcriptForRow` (~line 348):

```typescript
    // The user-chosen histogram transcript for a gene, if set and loaded.
    // Returns undefined when no override is set (caller falls back to canonical).
    histogramTranscriptForGene = (
        gene: string
    ): TranscriptData | undefined => {
        const id = this.props.store.histogramTranscriptIdByGene.get(gene);
        if (!id) return undefined;
        const opts = this.transcriptOptionsByGene.get(
            `${this.props.store.genomeBuild}|${gene}`
        );
        return opts?.find(t => t.transcriptId === id);
    };
```

Add the two computeds after `anchorTranscript` (~line 383) and `partnerTranscript` (~line 420) — place both after `partnerTranscript`:

```typescript
    // Histogram-only transcript overrides. Default to the canonical anchor /
    // partner transcript (unchanged snapping + strips); swap only what the two
    // AnchorGeneTrackRuler instances bin against.
    @computed get histogramAnchorTranscript(): TranscriptData | undefined {
        return (
            this.histogramTranscriptForGene(this.anchorGene) ??
            this.anchorTranscript
        );
    }

    @computed get histogramPartnerTranscript(): TranscriptData | undefined {
        return this.partnerGene
            ? this.histogramTranscriptForGene(this.partnerGene) ??
                  this.partnerTranscript
            : this.partnerTranscript;
    }
```

Wire the rulers to the new computeds. In `render()`, capture them near the other locals (~line 570):

```typescript
        const histogramAnchorTranscript = this.histogramAnchorTranscript;
        const histogramPartnerTranscript = this.histogramPartnerTranscript;
```

Change the first ruler's `transcript={anchorTranscript}` (line 740) to:

```typescript
                                transcript={
                                    histogramAnchorTranscript || anchorTranscript
                                }
```

Change the second ruler's `transcript={partnerTranscript}` (line 764) to:

```typescript
                                    transcript={
                                        histogramPartnerTranscript ||
                                        partnerTranscript
                                    }
```

Leave the `{partnerTranscript && (` guard (line 762) and every other use of `anchorTranscript`/`partnerTranscript` unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn run testMain GREP=FusionComparisonView.spec`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/FusionComparisonView.tsx src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx
git commit -m "feat(fusion): histogram-transcript override computeds + option capture"
```

---

## Task 8: Per-gene transcript picker UI

**Files:**
- Modify: `src/pages/patientView/fusionViewer/FusionComparisonView.tsx`
- Test: `src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx`

**Interfaces:**
- Consumes: `transcriptOptionsByGene` + `store.histogramTranscriptIdByGene` + `store.setHistogramTranscript` (Tasks 6–7).
- Produces: `renderTranscriptPicker(gene: string): JSX.Element | null` — a `<select data-testid="histogram-tx-${gene}">` listing every transcript for the gene (canonical default). Renders `null` when the gene has ≤1 transcript loaded.

- [ ] **Step 1: Write the failing test**

Add to `FusionComparisonView.spec.tsx`:

```typescript
it('renderTranscriptPicker changes the histogram transcript override', () => {
    const store = new FusionCohortStore();
    const view = new FusionComparisonView({ store } as any);
    const canonical = {
        transcriptId: 'ENST_CANON',
        displayName: 'ENST_CANON (canonical)',
    } as any;
    const alt = { transcriptId: 'ENST_ALT', displayName: 'ENST_ALT' } as any;
    view.transcriptOptionsByGene = new Map([
        [`${store.genomeBuild}|TMPRSS2`, [canonical, alt]],
    ]);
    const picker = mount(<svg>{view.renderTranscriptPicker('TMPRSS2')}</svg>);
    picker
        .find('[data-testid="histogram-tx-TMPRSS2"]')
        .hostNodes()
        .simulate('change', { target: { value: 'ENST_ALT' } });
    assert.equal(
        store.histogramTranscriptIdByGene.get('TMPRSS2'),
        'ENST_ALT'
    );
});

it('renderTranscriptPicker returns null for a single-transcript gene', () => {
    const store = new FusionCohortStore();
    const view = new FusionComparisonView({ store } as any);
    view.transcriptOptionsByGene = new Map([
        [`${store.genomeBuild}|SOLO`, [{ transcriptId: 'X', displayName: 'X' } as any]],
    ]);
    assert.isNull(view.renderTranscriptPicker('SOLO'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn run testMain GREP=FusionComparisonView.spec`
Expected: FAIL — `renderTranscriptPicker` not a function.

- [ ] **Step 3: Write minimal implementation**

Add the method after `histogramTranscriptForGene` (~line 358):

```typescript
    // Per-gene histogram transcript picker. Lists every Genome Nexus transcript
    // for the gene; the MSK-canonical isoform is the default. Hidden when the
    // gene has ≤1 transcript (nothing to choose).
    renderTranscriptPicker(gene: string): JSX.Element | null {
        if (!gene) return null;
        const opts = this.transcriptOptionsByGene.get(
            `${this.props.store.genomeBuild}|${gene}`
        );
        if (!opts || opts.length <= 1) return null;
        const canonical =
            opts.find(t => t.displayName.includes('(canonical)')) || opts[0];
        const value =
            this.props.store.histogramTranscriptIdByGene.get(gene) ??
            canonical.transcriptId;
        return (
            <select
                data-testid={`histogram-tx-${gene}`}
                value={value}
                onChange={e =>
                    this.props.store.setHistogramTranscript(
                        gene,
                        e.target.value
                    )
                }
                style={{ fontSize: 11 }}
            >
                {opts.map(t => (
                    <option key={t.transcriptId} value={t.transcriptId}>
                        {t.displayName}
                    </option>
                ))}
            </select>
        );
    }
```

Render the pickers under the fusion-direction label. After the `{anchorTranscript && partnerGene && (...)}` direction-label block (closes ~line 713), before `<div style={{ width: contentWidth }}>` (line 714), add:

```typescript
                {anchorTranscript && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            margin: '2px 0 4px',
                            fontSize: 11,
                            color: '#6c757d',
                        }}
                    >
                        <span>Histogram transcript:</span>
                        <span>{anchorGene}</span>
                        {this.renderTranscriptPicker(anchorGene)}
                        {partnerGene && (
                            <>
                                <span style={{ marginLeft: 8 }}>
                                    {partnerGene}
                                </span>
                                {this.renderTranscriptPicker(partnerGene)}
                            </>
                        )}
                    </div>
                )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn run testMain GREP=FusionComparisonView.spec`
Expected: PASS (both new cases).

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/FusionComparisonView.tsx src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx
git commit -m "feat(fusion): per-gene histogram transcript picker UI"
```

---

## Final verification

- [ ] Run the full fusion viewer suite:

Run: `yarn run testMain GREP=fusionViewer` (or run each `*.spec` touched above).
Expected: all green.

- [ ] TypeScript compiles: `yarn run tscNoEmit` (or the repo's type-check script). Expected: no errors.

- [ ] Prettier: `yarn run prettierFixLocal` then confirm no diff. Expected: clean.

- [ ] Manual smoke (optional, `yarn run start`): open the fusion cohort tab — the histogram transcript `<select>` appears per gene and re-bins the histogram on change; the strips are unchanged by that swap; the "Junction labels" toggle switches between inline / inline-both / gutter across sample, dense, and collapsed modes.

---

## Self-review notes

- **Spec coverage:** Feature 1 (swap binning transcript, canonical default, every GN transcript, histogram-only scope) → Tasks 6–8. Feature 2 (junction exons, sample+dense+collapsed, 3 switchable placements) → Tasks 1–5. Both "collapsed too" and "all three placements switchable" requirements covered.
- **Coupling guard:** Task 7 explicitly keeps `anchorTranscript`/`orientedRows`/snapping on canonical; only the ruler `transcript=` props change — satisfies "histogram swap must not disturb strips."
- **Edge cases:** single-gene (no 3′) junction label → Task 3 test; ≤1 transcript picker hidden → Task 8 test; override not yet loaded → `histogramTranscriptForGene` returns undefined → falls back to canonical (Task 7).
- **Type consistency:** `JunctionLabelMode` defined once in `data/types.ts` (Task 2), imported by store, strip, strip-list. `junctionExonNumbers` signature identical across Tasks 1/3. Option map key `${build}|${symbol}` used identically in Tasks 7 and 8.
- **Known follow-up (out of scope):** breakpoints are snapped to the canonical `anchorTranscript` window before feature-binning; when the histogram transcript differs, binning uses the chosen isoform's exons against canonical-snapped coordinates. Isoforms of one gene overlap and `assignBreakpointsToFeatures` has 20 kb slop, so this is acceptable; revisit only if a chosen isoform's range diverges materially from canonical.
