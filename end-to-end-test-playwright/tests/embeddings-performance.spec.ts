import { test, expect, Page } from '../fixtures';
import { waitForStudyView } from './helpers/common';

/**
 * Guards the study view against the Similarity Maps tab doing work while
 * nobody is looking at it.
 *
 * The study view mounts its tabs with `unmountOnHide={false}`, so once the
 * embeddings tab has been opened it stays mounted for the rest of the
 * session. Without the `isTabActive` guards in EmbeddingsPanel that meant
 * every study-view selection rebuilt the whole ~50k-point embedding
 * pipeline for a hidden tab, and selecting on the Summary tab slowed to a
 * crawl.
 *
 * The structural assertions here are the real guard - they're
 * deterministic. The timing budget is deliberately loose: it exists to
 * catch a pipeline-sized regression (seconds), not to benchmark the study
 * view on a shared CI runner.
 */

const STUDY = 'msk_impact_50k_2026';
const SUMMARY_TAB = '#studyViewTabs a.tabAnchor_summary';
const EMBEDDINGS_TAB = '#studyViewTabs a.tabAnchor_embeddings';
const SUMMARY_CONTENT = '[data-test="summary-tab-content"]';
const SELECTED_INFO = '[data-test="selected-info"]';
const VIZ = '[data-test="embeddings-visualization"]';
// Any pie slice in any chart will do - this is about selection latency,
// not which chart or cohort it produces. CANCER_TYPE specifically can't be
// used for this: STUDY_VIEW_CONFIG.tableAttrs forces it to a table (no svg
// at all) regardless of category count. Scoping to `.studyViewPieChartGroup
// path` (PieChart.tsx's own slice class, already used the same way in
// end-to-end-test/local/specs/core/group-color-chooser.spec.js) finds a
// slice in whichever chart actually rendered as a pie for this study.
const PIE_SLICE =
    '[data-test^="chart-container-"] .studyViewPieChartGroup path';

// The embedding coordinates are a fixed remote asset, fetched only once
// the tab actually renders.
const EMBEDDING_ASSET = /umap_he_50k\.json/;

const SELECTION_BUDGET_MS = 10000;

// Split view turns the viewport lock on automatically, and the lock drives a
// requestAnimationFrame loop per panel. Victory and d3-timer also schedule
// frames for the summary tab's own charts, so the lock can only be measured
// as a delta against a baseline taken before the tab is ever opened - two
// locked panels would add ~60fps each on top of whatever the charts do.
const RAF_SAMPLE_MS = 2000;
const RAF_LOCK_ALLOWANCE = 60;

function studyUrl(tab = 'summary'): string {
    return `/study/${tab}?id=${STUDY}&featureFlags=EMBEDDINGS`;
}

async function openSummary(page: Page) {
    await page.goto(studyUrl());
    await expect(page.locator(SUMMARY_CONTENT)).toBeVisible({
        timeout: 60000,
    });
    await waitForStudyView(page, 60000);
}

// MSKTabs paginates the tab bar when its tabs don't all fit, and only
// renders the current page's tabs into the DOM - the rest are reachable
// only via a chevron. This study has enough data-type tabs that Embeddings
// can land on a later page, so page forward until its anchor shows up
// instead of assuming it's always on the first page.
async function openEmbeddingsTab(page: Page) {
    const embeddingsTab = page.locator(EMBEDDINGS_TAB);
    const nextPageArrow = page.locator('#studyViewTabs .fa-chevron-right');
    for (let i = 0; i < 10 && !(await embeddingsTab.isVisible()); i++) {
        if (await nextPageArrow.isVisible()) {
            await nextPageArrow.click();
        } else {
            await page.waitForTimeout(500);
        }
    }
    await embeddingsTab.click({ timeout: 30000 });
    await expect(page.locator(VIZ)).toBeVisible({ timeout: 60000 });
}

async function backToSummary(page: Page) {
    // Opening Embeddings can leave the tab bar paged forward onto its page;
    // Summary is the first tab, so page back until it's rendered again.
    const summaryTab = page.locator(SUMMARY_TAB);
    const prevPageArrow = page.locator('#studyViewTabs .fa-chevron-left');
    for (let i = 0; i < 10 && !(await summaryTab.isVisible()); i++) {
        if (await prevPageArrow.isVisible()) {
            await prevPageArrow.click();
        } else {
            await page.waitForTimeout(500);
        }
    }
    await summaryTab.click({ timeout: 30000 });
    await expect(page.locator(SUMMARY_CONTENT)).toBeVisible({
        timeout: 30000,
    });
    // The wrapper appears before its charts finish (re-)loading their data -
    // wait for every chart's spinner to clear so callers don't measure or
    // click into a grid that's still being rebuilt.
    await waitForStudyView(page, 60000);
}

test.describe('study view is unaffected by the embeddings tab', () => {
    test('the summary tab never fetches the embedding data', async ({
        page,
    }) => {
        // Same budget as the others in this file: opening the study view and
        // then the embeddings tab for a 50k-sample study can outrun the
        // config's default timeout on its own.
        test.setTimeout(180000);

        const embeddingRequests: string[] = [];
        page.on('request', request => {
            if (EMBEDDING_ASSET.test(request.url())) {
                embeddingRequests.push(request.url());
            }
        });

        await openSummary(page);
        expect(embeddingRequests).toEqual([]);

        // ...and it is fetched once the tab is actually opened, so the
        // assertion above is testing the guard rather than a dead URL.
        await openEmbeddingsTab(page);
        expect(embeddingRequests.length).toBeGreaterThan(0);
    });

    test('the embedding stops rendering once you leave the tab', async ({
        page,
    }) => {
        test.setTimeout(180000);

        await openSummary(page);
        await openEmbeddingsTab(page);
        await backToSummary(page);

        // The tab stays mounted, but its subtree must not - otherwise every
        // study-view selection re-renders the deck.gl layers behind the
        // summary tab.
        await expect(page.locator(VIZ)).toHaveCount(0);
    });

    test('the viewport lock stops polling once you leave the tab', async ({
        page,
    }) => {
        test.setTimeout(180000);

        // Count frames scheduled over a fixed window. The page's own charts
        // schedule some, so this is only meaningful as a before/after delta.
        const countFrames = (ms: number) =>
            page.evaluate(async sampleMs => {
                const original = window.requestAnimationFrame;
                let count = 0;
                window.requestAnimationFrame = function(cb) {
                    count++;
                    return original.call(window, cb);
                } as typeof window.requestAnimationFrame;
                await new Promise(resolve => setTimeout(resolve, sampleMs));
                window.requestAnimationFrame = original;
                return count;
            }, ms);

        await openSummary(page);
        const baseline = await countFrames(RAF_SAMPLE_MS);

        await openEmbeddingsTab(page);

        // Two panels: this is what switches the shared viewport lock on, and
        // the lock is what starts the rAF loop. The button itself reports
        // visible/enabled/stable right away, but the click can still sit
        // waiting to be processed for a while - the 50k-point layer's
        // initial WebGL upload keeps the main thread busy well past the
        // point the container is considered "visible".
        await page
            .locator('[data-test="embeddings-panel-count-2"]')
            .click({ timeout: 60000 });
        await expect(page.locator(VIZ)).toHaveCount(2, { timeout: 60000 });

        await backToSummary(page);
        const afterLeaving = await countFrames(RAF_SAMPLE_MS);

        expect(
            afterLeaving,
            `summary tab scheduled ${afterLeaving} frames in ${RAF_SAMPLE_MS}ms after leaving the embeddings tab, against a ${baseline}-frame baseline - the viewport lock is still polling behind it`
        ).toBeLessThan(baseline + RAF_LOCK_ALLOWANCE);
    });

    test('a summary selection still updates promptly after the embeddings tab has been opened', async ({
        page,
    }) => {
        test.setTimeout(180000);

        await openSummary(page);
        await openEmbeddingsTab(page);
        await backToSummary(page);

        const selectedInfo = page.locator(SELECTED_INFO);
        await expect(selectedInfo).toBeVisible({ timeout: 30000 });
        const before = (await selectedInfo.innerText()).trim();

        // Any slice will do - this is about how long the selection takes to
        // come back, not which cohort it produces. But `click` targets the
        // center of a locator's bounding box, and a pie slice's bounding box
        // can be much bigger than its actual wedge (a 5% slice still spans
        // most of the radius) - the center can fall outside the rendered
        // path entirely. Picking the largest bounding box reliably lands
        // inside its own wedge. backToSummary now waits for every chart's
        // spinner to clear first, so this measurement isn't racing charts
        // that are still (re-)inserting their own slices into the DOM.
        const slices = page.locator(PIE_SLICE);
        await expect(slices.first()).toBeVisible({ timeout: 60000 });
        const boxes = await slices.evaluateAll(paths =>
            paths.map(p => {
                const { width, height } = p.getBoundingClientRect();
                return width * height;
            })
        );
        const largest = boxes.indexOf(Math.max(...boxes));
        const slice = slices.nth(largest);

        const started = Date.now();
        await slice.click({ timeout: 30000 });
        await expect
            .poll(async () => (await selectedInfo.innerText()).trim(), {
                timeout: SELECTION_BUDGET_MS,
            })
            .not.toBe(before);
        const elapsed = Date.now() - started;

        expect(
            elapsed,
            `selection took ${elapsed}ms, over the ${SELECTION_BUDGET_MS}ms budget`
        ).toBeLessThan(SELECTION_BUDGET_MS);
    });
});
