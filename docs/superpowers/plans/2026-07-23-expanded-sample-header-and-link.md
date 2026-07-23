# Expanded-Sample Header + Fusion-Viewer Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the fusion cohort builder, the expanded-sample panel (bottom of `FusionComparisonView`) shows a header — sample name · gene pair · frame — plus an "Open in fusion viewer ↗" link that opens that sample's single-patient fusion viewer tab in a new browser tab.

**Architecture:** Two changes. (1) Fix the shared, currently-broken `sampleFusionViewerHref` helper in `data/cohortLinks.ts` to emit the correct path-based deep link via `getSampleViewUrlWithPathname` — this also repairs the cohort matrix's sample links, which already use it. (2) Add a header row above `<FusionDiagramSVG>` in the `expanded-diagram` block, reusing the corrected helper for the link.

**Tech Stack:** React + TypeScript, MobX, enzyme + chai + mocha (`.spec.ts`/`.spec.tsx`).

## Global Constraints

- Prettier: 4-space tabs, single quotes, ES5 trailing commas. Do NOT use `--no-verify` on `.ts`/`.tsx` commits; run `yarn run prettierFixLocal` if unsure.
- TypeScript strict (no implicit any).
- Run a single spec with: `yarn run testMain GREP=<File.spec>`.
- **Correct deep-link format** (verified against the router): the fusion-viewer tab is selected by the URL **path segment** `patient/fusionViewer` (`activeTabId = pathName.split('/').pop()`), NOT a `tab=` query param; the sample is loaded via the **`sampleId`** query param (which puts the patient page in `'sample'` mode). Canonical builder: `getSampleViewUrlWithPathname(studyId, sampleId, 'patient/fusionViewer')` from `shared/api/urls` — signature `(studyId, sampleId, pathname='patient', navIds?)`.
- Keep the `'fusionViewer'` string as a literal inside the pathname (with the existing explanatory comment) — do NOT import `PatientViewPageTabs` into the fusion data layer (avoids the known circular dependency).
- Link opens in a new tab: `target="_blank" rel="noopener noreferrer"`.

---

## File Structure

| File | Responsibility |
|---|---|
| `data/cohortLinks.ts` (+`.spec.ts`) | `sampleFusionViewerHref(studyId, sampleId)` → correct path-based deep link |
| `FusionComparisonView.tsx` (+`.spec.tsx`) | Header row (sample name + gene pair + frame + link) in the `expanded-diagram` block |

Task 1 fixes the shared helper (and its spec, and by extension the matrix links). Task 2 consumes it. Independent reviewer gates.

---

## Task 1: Fix `sampleFusionViewerHref` to the correct deep-link format

**Files:**
- Modify: `src/pages/patientView/fusionViewer/data/cohortLinks.ts`
- Test: `src/pages/patientView/fusionViewer/data/cohortLinks.spec.ts`

**Interfaces:**
- Consumes: `getSampleViewUrlWithPathname(studyId: string, sampleId: string, pathname?: string, navIds?): string` from `shared/api/urls`.
- Produces (unchanged signature): `sampleFusionViewerHref(studyId: string, sampleId: string): string` — now returns a path-based URL containing `patient/fusionViewer`, `sampleId=<sampleId>`, `studyId=<studyId>`, and NO `caseId=` / `tab=fusionViewer`.

**Context — why:** the current helper emits `#/patient?studyId=…&caseId=<sampleId>&tab=fusionViewer`. The router ignores `tab=` (tab comes from the path → always Summary) and treats `caseId` as a patientId (wrong case loads). `getSampleViewUrl*` is exercised under jest in `TooltipUtils.spec.ts`, so `buildCBioPortalPageUrl` runs fine in the test env.

- [ ] **Step 1: Rewrite the failing test**

Replace the body of `cohortLinks.spec.ts` with:

```typescript
import { assert } from 'chai';
import { sampleFusionViewerHref } from './cohortLinks';

describe('sampleFusionViewerHref', () => {
    it('deep-links to the fusion viewer tab via the path segment and sampleId', () => {
        const href = sampleFusionViewerHref('demo_cohort', 'SAMPLE_001');
        // Tab is selected by the path segment, not a tab= query.
        assert.include(href, 'patient/fusionViewer');
        // Sample loaded via sampleId (sample mode), study via studyId.
        assert.include(href, 'sampleId=SAMPLE_001');
        assert.include(href, 'studyId=demo_cohort');
        // The old broken shape must be gone.
        assert.notInclude(href, 'caseId=');
        assert.notInclude(href, 'tab=fusionViewer');
    });

    it('url-encodes ids', () => {
        const href = sampleFusionViewerHref('a b', 'c/d');
        assert.include(href, 'studyId=a%20b');
        assert.include(href, 'sampleId=c%2Fd');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn run testMain GREP=cohortLinks.spec`
Expected: FAIL — current helper emits `caseId=`/`tab=fusionViewer` and no `patient/fusionViewer` path/`sampleId=`.

- [ ] **Step 3: Rewrite the implementation**

Replace the entire contents of `cohortLinks.ts` with:

```typescript
import { getSampleViewUrlWithPathname } from 'shared/api/urls';

// 'fusionViewer' is the PatientViewPageTabs.FusionViewer enum value, hardcoded
// in the pathname (rather than imported) to avoid a circular dependency between
// the page tabs module and the fusion-viewer data layer.
const FUSION_VIEWER_PATHNAME = 'patient/fusionViewer';

/**
 * Build an href to a sample's patient page, deep-linked to the Fusion Viewer
 * tab and scoped to that sample. The tab is selected by the URL path segment
 * (`patient/fusionViewer`) and the sample by the `sampleId` query param — the
 * shape the router actually honors. Uses only the sample/study ids the cohort
 * already holds; no new identifiers are introduced.
 */
export function sampleFusionViewerHref(
    studyId: string,
    sampleId: string
): string {
    return getSampleViewUrlWithPathname(
        studyId,
        sampleId,
        FUSION_VIEWER_PATHNAME
    );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn run testMain GREP=cohortLinks.spec`
Expected: PASS.

- [ ] **Step 5: Verify the matrix consumer still passes (it gets the fix for free)**

Run: `yarn run testMain GREP=FusionCohortMatrix.spec`
Expected: PASS. `FusionCohortMatrix.tsx` calls `sampleFusionViewerHref` for each sample link; it renders under jest, and the rewritten helper invokes `buildCBioPortalPageUrl` (proven safe in jsdom via `TooltipUtils.spec`). If any matrix test asserted the OLD href shape (`caseId=`/`tab=`), update that assertion to the corrected shape (`patient/fusionViewer`, `sampleId=`) — this is a correct fix, not a regression.

- [ ] **Step 6: Commit**

```bash
git add src/pages/patientView/fusionViewer/data/cohortLinks.ts src/pages/patientView/fusionViewer/data/cohortLinks.spec.ts
git commit -m "fix(fusion): correct sampleFusionViewerHref to path-based fusion-viewer deep link"
```

---

## Task 2: Header row (sample name · gene pair · frame · link) in the expanded panel

**Files:**
- Modify: `src/pages/patientView/fusionViewer/FusionComparisonView.tsx`
- Test: `src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx`

**Interfaces:**
- Consumes: `sampleFusionViewerHref(studyId, sampleId)` (Task 1, from `./data/cohortLinks`); `frameStatusStyle(status): { label: string; ... }` (from `./components/frameStatusStyle`); the existing `this.studyIdBySampleId` computed (`Map<string,string>`); `expandedRow` (`{ sampleId, fivePrimeSymbol, threePrimeSymbol, frame, event, ... }`) already in scope in `render()`.
- Produces: a `data-testid="expanded-header"` row above the existing `<FusionDiagramSVG>` inside the `data-testid="expanded-diagram"` block, containing the sample id, the `5′ → 3′` gene pair (single-gene → just the 5′ symbol), the frame label, and an `data-testid="expanded-fusion-link"` anchor (rendered only when studyId resolves).

- [ ] **Step 1: Write the failing test**

Add to `FusionComparisonView.spec.tsx`. Reuse the file's existing store fixture + mount pattern (a store seeded with structural variants and an anchor set). Before the assertions, set the expanded sample and re-render. Use a sampleId that exists in the fixture's rows — read the sibling tests to get a valid one; the placeholder `<FIXTURE_SAMPLE_ID>` / `<FIXTURE_STUDY_ID>` / `<FIXTURE_5P>` / `<FIXTURE_3P>` below must be replaced with the fixture's actual values.

```typescript
import { runInAction } from 'mobx';
import { sampleFusionViewerHref } from './data/cohortLinks';

it('expanded panel shows a header with sample name, gene pair, frame, and a fusion-viewer link', () => {
    // `store` built via the same fixture the other tests in this file use,
    // with an anchor set so orientedRows is non-empty.
    const wrapper = mount(<FusionComparisonView store={store} />);
    const view = wrapper.instance() as any;
    runInAction(() => {
        view.expandedSampleId = '<FIXTURE_SAMPLE_ID>';
    });
    wrapper.update();

    const header = wrapper.find('[data-testid="expanded-header"]').hostNodes();
    assert.equal(header.length, 1);
    assert.include(header.text(), '<FIXTURE_SAMPLE_ID>');
    assert.include(header.text(), '<FIXTURE_5P>'); // gene pair 5′ symbol

    const link = wrapper
        .find('[data-testid="expanded-fusion-link"]')
        .hostNodes();
    assert.equal(link.length, 1);
    assert.equal(link.prop('target'), '_blank');
    assert.equal(
        link.prop('href'),
        sampleFusionViewerHref('<FIXTURE_STUDY_ID>', '<FIXTURE_SAMPLE_ID>')
    );
});

it('expanded header omits the link when studyId is unresolved', () => {
    const view = new FusionComparisonView({ store } as any);
    // No structuralVariants → studyIdBySampleId is empty → helper method returns
    // undefined for any sample.
    assert.isUndefined(view.expandedSampleLink('UNKNOWN_SAMPLE'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn run testMain GREP=FusionComparisonView.spec`
Expected: FAIL — no `expanded-header` node; `expandedSampleLink` not a function.

- [ ] **Step 3: Write the implementation**

In `FusionComparisonView.tsx`:

Add imports (near the other local imports at the top of the file):

```typescript
import { frameStatusStyle } from './components/frameStatusStyle';
import { sampleFusionViewerHref } from './data/cohortLinks';
```

Add a small helper method to the class (place it next to the other `expanded*`/render-helper methods, e.g. just before `render()`):

```typescript
    // The fusion-viewer deep link for a sample, or undefined when its studyId
    // is unknown (so the header can omit a dead link).
    expandedSampleLink = (sampleId: string): string | undefined => {
        const studyId = this.studyIdBySampleId.get(sampleId);
        if (!studyId) return undefined;
        return sampleFusionViewerHref(studyId, sampleId);
    };
```

Insert the header block immediately after the opening `<div data-testid="expanded-diagram">` (currently line 1049) and BEFORE the existing `{(() => { ... FusionDiagramSVG ... })()}` IIFE — do not modify the existing IIFE:

```typescript
                    <div data-testid="expanded-diagram">
                        {(() => {
                            const sampleId = expandedRow.sampleId;
                            const pair = expandedRow.threePrimeSymbol
                                ? `${expandedRow.fivePrimeSymbol} → ${expandedRow.threePrimeSymbol}`
                                : expandedRow.fivePrimeSymbol;
                            const link = this.expandedSampleLink(sampleId);
                            return (
                                <div
                                    data-testid="expanded-header"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 12,
                                        margin: '10px 0 2px',
                                        fontSize: 12,
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>
                                        {sampleId}
                                    </span>
                                    <span style={{ color: '#495057' }}>
                                        {pair}
                                    </span>
                                    <span style={{ color: '#6c757d' }}>
                                        {frameStatusStyle(expandedRow.frame).label}
                                    </span>
                                    {link && (
                                        <a
                                            data-testid="expanded-fusion-link"
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Open in fusion viewer ↗
                                        </a>
                                    )}
                                </div>
                            );
                        })()}
```

(The existing `{(() => { ... const t5 = ... <FusionDiagramSVG/> ... })()}` block and the closing `</div>` remain exactly as they are, now following the header block.)

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn run testMain GREP=FusionComparisonView.spec`
Expected: PASS (both new cases; existing cases still green).

- [ ] **Step 5: Commit**

```bash
git add src/pages/patientView/fusionViewer/FusionComparisonView.tsx src/pages/patientView/fusionViewer/FusionComparisonView.spec.tsx
git commit -m "feat(fusion): sample header + fusion-viewer link on expanded cohort panel"
```

---

## Final verification

- [ ] Run both touched suites: `yarn run testMain GREP=cohortLinks.spec` and `yarn run testMain GREP=FusionComparisonView.spec` and `yarn run testMain GREP=FusionCohortMatrix.spec`. Expected: all green.
- [ ] TypeScript compiles (repo type-check script). Expected: no errors.
- [ ] Prettier: `yarn run prettierFixLocal`, confirm no diff.
- [ ] Manual smoke (optional, `yarn run start`): expand a sample strip → header shows sample id · gene pair · frame; clicking "Open in fusion viewer ↗" opens `…/patient/fusionViewer?sampleId=…&studyId=…` in a new tab on the correct sample's fusion tab. Also confirm the cohort matrix sample links now open the fusion tab correctly (regression win from Task 1).

---

## Self-review notes

- **Spec coverage:** header sample name + gene pair + frame + link → Task 2; correct deep-link format + shared-helper fix (matrix repaired for free) → Task 1; studyId-missing omits link → Task 2 (`expandedSampleLink` returns undefined) test; single-gene → gene pair falls back to 5′ symbol (Task 2 code). Fusion pre-selection explicitly out of scope (spec).
- **Type consistency:** `sampleFusionViewerHref(studyId, sampleId)` identical signature Task 1 ↔ Task 2; `expandedSampleLink` returns `string | undefined`, guarded before render.
- **Placeholder note:** Task 2's test uses `<FIXTURE_*>` placeholders that the implementer MUST replace with the real values from the existing `FusionComparisonView.spec.tsx` fixture (a valid sampleId present in the seeded rows, its studyId, and its 5′ symbol). This is the one spot requiring the implementer to read the sibling fixture.
- **Known minor:** the header renders even when the diagram IIFE returns null (transcripts not yet loaded) — intended, so the sample name + link are available immediately.
