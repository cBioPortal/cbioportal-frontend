import { test, expect, Page } from '../fixtures';

/**
 * Port of end-to-end-test/local/specs/core/embeddings.spec.js.
 *
 * Functional (non-screenshot) coverage of the Similarity Maps tab: legend
 * toggling, sample counts, toolbar controls, selection/filtering, and URL
 * parameter handling. Lives in the remote lane for the same reason as
 * embeddings-screenshot.spec.ts: the embedding data and `msk_chord_2024`
 * study only exist against the public backend.
 *
 * The original wdio `coloring menu interactions` test targeted a
 * `[data-test="embeddings-coloring-menu"]` selector that does not exist in
 * the component and was guarded by `isExisting()`, so it never asserted
 * anything — it is intentionally not ported.
 */

const STUDY = 'msk_impact_50k_2026';
const LEGEND = '[data-test="embeddings-legend"]';
const VIZ = '[data-test="embeddings-visualization"]';
const EMBEDDINGS_TAB = '#studyViewTabs a.tabAnchor_embeddings';
const SUMMARY_TAB = '#studyViewTabs a.tabAnchor_summary';
const LEGEND_ITEM = `${LEGEND} div[style*="cursor: pointer"]`;

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

            await firstItem.click();
            await expect(firstItem).toHaveAttribute('style', /opacity:\s*0\.5/);

            await firstItem.click();
            await expect(firstItem).toHaveAttribute('style', /opacity:\s*1/);
        });

        test('shows/hides all categories with the Show All/Hide All button', async ({
            page,
        }) => {
            await gotoEmbeddings(page);
            const toggle = page
                .locator(LEGEND)
                .getByRole('button')
                .first();
            await expect(toggle).toBeVisible();

            await toggle.click();
            await expect(toggle).toContainText('Show All');

            await toggle.click();
            await expect(toggle).toContainText('Hide All');
        });

        test('displays total and visible sample counts', async ({ page }) => {
            await gotoEmbeddings(page);
            const legend = page.locator(LEGEND);
            await expect(legend).toContainText('Total Samples:');
            await expect(legend).toContainText('Visible Samples:');
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
            await expect(page.locator(LEGEND)).toContainText('Unselected');
        });

        test('preserves the filter when switching between tabs', async ({
            page,
        }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&featureFlags=EMBEDDINGS${filterHash(
                    ['Melanoma']
                )}`
            );
            await expect(page.locator(LEGEND)).toContainText('Unselected');

            // Round-trip through the summary tab to confirm the filter (and
            // thus the Unselected category) survives an in-app tab switch.
            await page.locator(SUMMARY_TAB).click();
            await page.locator(EMBEDDINGS_TAB).click();
            await expect(page.locator(LEGEND)).toContainText('Unselected');
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
            await expect(page.locator(LEGEND)).toContainText(
                /Missense|Truncating|Inframe|Not mutated/
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
            await expect(page.locator(LEGEND)).toContainText(/Male|Female/);
        });
    });
});
