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
// A specific chart, not "whatever the first grid item holds": the first
// svg path in an arbitrary chart may be an axis or background, not a
// clickable slice. CANCER_TYPE is always present for this study.
const CANCER_TYPE_CHART = '[data-test="chart-container-CANCER_TYPE"]';

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

async function openEmbeddingsTab(page: Page) {
    await page.locator(EMBEDDINGS_TAB).click({ timeout: 30000 });
    await expect(page.locator(VIZ)).toBeVisible({ timeout: 60000 });
}

async function backToSummary(page: Page) {
    await page.locator(SUMMARY_TAB).click({ timeout: 30000 });
    await expect(page.locator(SUMMARY_CONTENT)).toBeVisible({
        timeout: 30000,
    });
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
        // the lock is what starts the rAF loop.
        await page.locator('[data-test="embeddings-panel-count-2"]').click();
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
        // come back, not which cohort it produces.
        const chart = page.locator(CANCER_TYPE_CHART);
        await expect(chart).toBeVisible({ timeout: 60000 });
        const slice = chart.locator('svg path').first();
        await expect(slice).toBeVisible({ timeout: 30000 });

        const started = Date.now();
        await slice.click({ timeout: 30000, force: true });
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
