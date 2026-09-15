import { test, expect, Page } from '../fixtures';

/**
 * Port of end-to-end-test/local/specs/core/embeddings.spec.js.
 *
 * Functional (non-screenshot) coverage of the Similarity Maps tab: legend
 * toggling, sample counts, toolbar controls, selection/filtering, and URL
 * parameter handling. Lives in the remote lane for the same reason as
 * embeddings-screenshot.spec.ts: the embedding data and the
 * `msk_impact_50k_2026` cohort only exist against the public backend.
 *
 * The original wdio `coloring menu interactions` test targeted a
 * `[data-test="embeddings-coloring-menu"]` selector that does not exist in
 * the component and was guarded by `isExisting()`, so it never asserted
 * anything — it is intentionally not ported.
 */

const STUDY = 'msk_impact_50k_2026';
const LEGEND = '[data-test="embeddings-legend"]';
const VIZ = '[data-test="embeddings-visualization"]';
const LEGEND_ITEM = `${LEGEND} div[style*="cursor: pointer"]`;
const STATUS_BAR = '[data-test="embeddings-status-bar"]';
const PAN_BUTTON = '[data-test="embeddings-pan-button"]';
const SELECT_BUTTON = '[data-test="embeddings-select-button"]';
const CLEAR_BUTTON = '[data-test="embeddings-clear-button"]';
const MAKE_GLOBAL_BUTTON = '[data-test="embeddings-make-global-button"]';
const LOCK_MAP_BUTTON = '[data-test="embeddings-lock-map-button"]';
const panelCountButton = (n: number) =>
    `[data-test="embeddings-panel-count-${n}"]`;

function coloringParam(selection: Record<string, string>): string {
    return encodeURIComponent(JSON.stringify(selection));
}

// Study-view filters are applied via the `#filterJson=` URL hash using the
// clinicalDataFilters schema (each value is an object); see
// tests/studyview.spec.ts for the canonical encoding.
function filterHash(values: string[]): string {
    return `#filterJson=${encodeURIComponent(
        JSON.stringify({
            clinicalDataFilters: [
                {
                    attributeId: 'CANCER_TYPE',
                    values: values.map(value => ({ value })),
                },
            ],
        })
    )}`;
}

async function gotoEmbeddings(page: Page, query = '') {
    await page.goto(
        `/study/embeddings?id=${STUDY}&featureFlags=EMBEDDINGS${query}`
    );
    await expect(page.locator(LEGEND)).toBeVisible({ timeout: 60000 });
}

test.describe('embeddings tab interactions', () => {
    test.describe('legend interactions', () => {
        test('toggles category visibility when clicking a legend item', async ({
            page,
        }) => {
            await gotoEmbeddings(page);
            const firstItem = page.locator(LEGEND_ITEM).first();
            await expect(firstItem).toBeVisible();

            await firstItem.click({ timeout: 30000 });
            await expect(firstItem).toHaveAttribute('style', /opacity:\s*0\.5/);

            await firstItem.click({ timeout: 30000 });
            await expect(firstItem).toHaveAttribute('style', /opacity:\s*1/);
        });

        test('shows/hides all categories with the Show All/Hide All button', async ({
            page,
        }) => {
            await gotoEmbeddings(page);
            // Not getByRole('button').first(): the collapse/expand chevron is also a button and sits before this one.
            const toggle = page.locator(
                '[data-test="embeddings-legend-toggle-all"]'
            );
            await expect(toggle).toBeVisible();

            // Recomputes visibility for all 50k samples, can outrun the default click timeout.
            await toggle.click({ timeout: 30000 });
            await expect(toggle).toContainText('Show All');

            await toggle.click({ timeout: 30000 });
            await expect(toggle).toContainText('Hide All');
        });

        test('displays the total embedded sample count in the status bar', async ({
            page,
        }) => {
            // Total/visible counts live in the shared status bar, not the legend (which only shows per-category counts).
            await gotoEmbeddings(page);
            await expect(page.locator(STATUS_BAR)).toContainText(
                /[\d,]+ samples embedded in/
            );
        });

        test('status bar switches to "Selection active" once a category is hidden, and Clear restores it', async ({
            page,
        }) => {
            await gotoEmbeddings(page);
            const firstItem = page.locator(LEGEND_ITEM).first();
            await expect(firstItem).toBeVisible();

            await firstItem.click({ timeout: 30000 });
            await expect(page.locator(STATUS_BAR)).toContainText(
                /Selection active.*[\d,]+\s*\/\s*[\d,]+.*visible/
            );
            await expect(page.locator(CLEAR_BUTTON)).toBeVisible();
            await expect(page.locator(MAKE_GLOBAL_BUTTON)).toBeVisible();

            await page.locator(CLEAR_BUTTON).click({ timeout: 30000 });
            await expect(page.locator(STATUS_BAR)).toContainText(
                /[\d,]+ samples embedded in/
            );
            await expect(page.locator(CLEAR_BUTTON)).not.toBeVisible();
        });

        test('legend row shows "visible / total" once its category is hidden', async ({
            page,
        }) => {
            await gotoEmbeddings(page);
            const firstItem = page.locator(LEGEND_ITEM).first();
            await expect(firstItem).toBeVisible();

            await firstItem.click({ timeout: 30000 });
            // The filter applies to this same panel too, so its count drops to "0 / N".
            await expect(firstItem).toContainText(/0\s*\/\s*[\d,]+/);
        });
    });

    test.describe('toolbar controls', () => {
        test('renders control buttons in the visualization toolbar', async ({
            page,
        }) => {
            await gotoEmbeddings(page);
            await expect(page.locator(`${VIZ} button`).first()).toBeVisible();
        });
    });

    test.describe('selection and filtering', () => {
        // Navigate straight to the embeddings route with the filter in the
        // URL: clicking the tab from a freshly-loaded summary view is not
        // actionable within the action timeout while the 50k-sample study
        // view renders.
        test('shows an Unselected category when a study-view filter is applied', async ({
            page,
        }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&featureFlags=EMBEDDINGS${filterHash(
                    ['Colorectal Cancer']
                )}`
            );
            await expect(page.locator(LEGEND)).toBeVisible({ timeout: 60000 });
            await expect(page.locator(LEGEND)).toContainText('Unselected', {
                timeout: 60000,
            });
        });
    });

    test.describe('multi-panel split view', () => {
        test('Pan/Select and panel-count controls are visible', async ({
            page,
        }) => {
            await gotoEmbeddings(page);
            await expect(page.locator(PAN_BUTTON)).toBeVisible();
            await expect(page.locator(SELECT_BUTTON)).toBeVisible();
            await expect(page.locator(panelCountButton(1))).toBeVisible();
        });

        test('hides the per-embedding status sentence once Lock Map is disabled with multiple panels open', async ({
            page,
        }) => {
            // Renders the full 50k-sample map twice (one per panel); measured ~66s in a clean run.
            test.setTimeout(240000);

            // Single panel: the status bar reports this one panel's map and
            // its sample counts.
            await gotoEmbeddings(page);
            await expect(page.locator(STATUS_BAR)).toContainText(
                /[\d,]+ samples embedded in/
            );

            // Lock Map defaults to on, so opening a second panel still
            // shows one shared map/sample-size in the status bar.
            await page.locator(panelCountButton(2)).click({ timeout: 30000 });
            await expect(page.locator(VIZ)).toHaveCount(2, { timeout: 60000 });
            await expect(
                page.locator(STATUS_BAR)
            ).toContainText(/[\d,]+ samples embedded in/, { timeout: 60000 });

            // Disabling Lock Map lets each panel pick a different map, so
            // there's no longer a single "the" map/sample-size to report.
            await page
                .locator(LOCK_MAP_BUTTON)
                .first()
                .click({ timeout: 30000 });
            await expect(
                page.locator(STATUS_BAR)
            ).not.toContainText(/embedded in/, { timeout: 30000 });

            // Switching back to a single panel restores it regardless.
            await page.locator(panelCountButton(1)).click({ timeout: 30000 });
            await expect(page.locator(VIZ)).toHaveCount(1, { timeout: 60000 });
            await expect(
                page.locator(STATUS_BAR)
            ).toContainText(/[\d,]+ samples embedded in/, { timeout: 30000 });
        });

        test('a cross-panel selection filter is reflected in every open panel', async ({
            page,
        }) => {
            // Renders the full 50k-sample map twice, same as the Lock Map test above.
            test.setTimeout(240000);

            // Load directly into 2-panel mode via URL params, avoiding a race with the panel-count button.
            await page.goto(
                `/study/embeddings?id=${STUDY}&featureFlags=EMBEDDINGS&embeddings_panel2_map=msk_mosaic_2026_he`
            );
            await expect(page.locator(VIZ)).toHaveCount(2, { timeout: 60000 });
            await expect(page.locator(LEGEND).first()).toBeVisible({
                timeout: 60000,
            });

            // Cross-panel filter recomputes visibility across both panels' 50k samples, can outrun the default click timeout.
            const firstPanelFirstItem = page.locator(LEGEND_ITEM).first();
            await expect(firstPanelFirstItem).toBeVisible();
            await firstPanelFirstItem.click({ timeout: 60000 });

            await expect(page.locator(STATUS_BAR)).toContainText(
                /Selection active/
            );
            await expect(page.locator(CLEAR_BUTTON)).toBeVisible();

            await page.locator(CLEAR_BUTTON).click({ timeout: 60000 });
            await expect(
                page.locator(STATUS_BAR)
            ).not.toContainText(/Selection active/, { timeout: 30000 });
        });
    });

    test.describe('URL parameter handling', () => {
        test('initializes gene mutation coloring from the URL', async ({
            page,
        }) => {
            // Gene coloring is keyed by `<entrezGeneId>_<...>`; EGFR = 1956.
            const param = coloringParam({
                selectedOption: '1956_undefined',
                colorByMutationType: 'true',
                colorByCopyNumber: 'true',
                colorBySv: 'true',
            });
            await gotoEmbeddings(
                page,
                `&embeddings_coloring_selection=${param}`
            );
            // Mutation coloring replaces the default cancer-type legend
            // once the gene's mutation data loads; allow time for it.
            await expect(page.locator(LEGEND)).toContainText(
                /Missense|Truncating|Inframe|Not mutated/,
                {
                    timeout: 60000,
                }
            );
        });

        test('initializes clinical attribute coloring from the URL', async ({
            page,
        }) => {
            const param = coloringParam({
                selectedOption: `undefined_${JSON.stringify({
                    clinicalAttributeId: 'SEX',
                    patientAttribute: true,
                    studyId: STUDY,
                })}`,
                colorByMutationType: 'false',
                colorByCopyNumber: 'false',
                colorBySv: 'false',
            });
            await gotoEmbeddings(
                page,
                `&embeddings_coloring_selection=${param}`
            );
            await expect(page.locator(LEGEND)).toContainText(/Male|Female/, {
                timeout: 60000,
            });
        });
    });
});
