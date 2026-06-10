import { test, expect, Page } from '../fixtures';
import { expectElementScreenshot } from './helpers/common';

/**
 * Port of end-to-end-test/local/specs/core/embeddings.screenshot.spec.js.
 *
 * Similarity Maps (patient embeddings) screenshot coverage: the deck.gl
 * UMAP scatter and its legend under the various coloring modes (cancer
 * type, gene mutation, categorical + numeric clinical attribute) and the
 * selection/filtering behaviour driven from the study-view summary tab.
 *
 * This lives in the remote lane (not tests/local) because the feature
 * pulls its embedding data from a fixed remote asset
 * (datahub.assets.cbioportal.org/embeddings/msk_mosaic_2026) and renders
 * the public `msk_chord_2024` study — neither is present in the localdb
 * seed. The EMBEDDINGS feature flag is opt-in via the URL.
 */

const STUDY = 'msk_chord_2024';
const VIZ = '[data-test="embeddings-visualization"]';
const LEGEND = '[data-test="embeddings-legend"]';
const EMBEDDINGS_TAB = '#studyViewTabs a.tabAnchor_embeddings';
const SUMMARY_TAB = '#studyViewTabs a.tabAnchor_summary';

function coloringParam(selection: Record<string, string>): string {
    return encodeURIComponent(JSON.stringify(selection));
}

function filterParam(values: string[]): string {
    return encodeURIComponent(
        JSON.stringify({
            clinicalDataEqualityFilters: [
                { attributeId: 'CANCER_TYPE_DETAILED', values },
            ],
        })
    );
}

// deck.gl renders the WebGL scatter a frame or two after the embedding
// JSON resolves; the legend appearing is our signal that the data is in
// and coloring has been applied. Wait on both, then give the canvas a
// beat to paint before the visual diff.
async function waitForEmbeddingRender(page: Page) {
    await expect(page.locator(VIZ)).toBeVisible({ timeout: 60000 });
    await expect(page.locator(LEGEND)).toBeVisible({ timeout: 60000 });
    await page
        .locator(`${VIZ} canvas`)
        .first()
        .waitFor({ state: 'attached' });
    await page.waitForTimeout(2000);
}

async function snapViz(page: Page, name: string) {
    await waitForEmbeddingRender(page);
    await expectElementScreenshot(page, VIZ, name, {
        hide: ['.dropdown-menu'],
    });
}

async function snapLegend(page: Page, name: string) {
    await waitForEmbeddingRender(page);
    await expectElementScreenshot(page, LEGEND, name);
}

test.describe('embeddings tab screenshots', () => {
    test.describe('basic embedding visualization', () => {
        test('renders embeddings tab with default cancer type coloring', async ({
            page,
        }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&featureFlags=EMBEDDINGS`
            );
            await snapViz(page, 'embeddings-default-cancer-type.png');
        });

        test('shows legend with category counts', async ({ page }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&featureFlags=EMBEDDINGS`
            );
            await snapLegend(page, 'embeddings-legend-cancer-type.png');
        });
    });

    test.describe('gene mutation coloring', () => {
        const mutationColoring = (gene: string) =>
            coloringParam({
                selectedOption: gene,
                colorByMutationType: 'true',
                colorByCopyNumber: 'true',
                colorBySv: 'true',
            });

        test('colors embedding by EGFR mutations', async ({ page }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&embeddings_coloring_selection=${mutationColoring(
                    'EGFR'
                )}&featureFlags=EMBEDDINGS`
            );
            await snapViz(page, 'embeddings-egfr-mutations.png');
        });

        test('colors embedding by BRAF mutations', async ({ page }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&embeddings_coloring_selection=${mutationColoring(
                    'BRAF'
                )}&featureFlags=EMBEDDINGS`
            );
            await snapViz(page, 'embeddings-braf-mutations.png');
        });

        test('shows legend with mutation types for EGFR', async ({ page }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&embeddings_coloring_selection=${mutationColoring(
                    'EGFR'
                )}&featureFlags=EMBEDDINGS`
            );
            await snapLegend(page, 'embeddings-legend-egfr-mutations.png');
        });
    });

    test.describe('clinical attribute coloring', () => {
        const clinicalColoring = (attributeId: string) =>
            coloringParam({
                selectedOption: `undefined_${JSON.stringify({
                    clinicalAttributeId: attributeId,
                    patientAttribute: true,
                    studyId: STUDY,
                })}`,
                colorByMutationType: 'false',
                colorByCopyNumber: 'false',
                colorBySv: 'false',
            });

        test('colors embedding by categorical clinical attribute (ADRENAL_GLANDS)', async ({
            page,
        }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&embeddings_coloring_selection=${clinicalColoring(
                    'ADRENAL_GLANDS'
                )}&featureFlags=EMBEDDINGS`
            );
            await snapViz(page, 'embeddings-clinical-adrenal-glands.png');
        });

        test('shows legend with clinical attribute values', async ({
            page,
        }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&embeddings_coloring_selection=${clinicalColoring(
                    'ADRENAL_GLANDS'
                )}&featureFlags=EMBEDDINGS`
            );
            await snapLegend(page, 'embeddings-legend-adrenal-glands.png');
        });

        test('colors embedding by numeric clinical attribute with gradient (CURRENT_AGE)', async ({
            page,
        }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&embeddings_coloring_selection=${clinicalColoring(
                    'CURRENT_AGE'
                )}&featureFlags=EMBEDDINGS`
            );
            await snapViz(page, 'embeddings-clinical-current-age.png');
        });

        test('shows gradient legend for numeric clinical attribute', async ({
            page,
        }) => {
            await page.goto(
                `/study/embeddings?id=${STUDY}&embeddings_coloring_selection=${clinicalColoring(
                    'CURRENT_AGE'
                )}&featureFlags=EMBEDDINGS`
            );
            await snapLegend(page, 'embeddings-legend-current-age.png');
        });
    });

    test.describe('selection and filtering', () => {
        test('shows unselected samples as gray when filtering by cancer type', async ({
            page,
        }) => {
            await page.goto(
                `/study?id=${STUDY}&filterJson=${filterParam([
                    'Colorectal Cancer',
                ])}&featureFlags=EMBEDDINGS`
            );
            await page.locator(EMBEDDINGS_TAB).click();
            await snapViz(page, 'embeddings-filtered-colorectal.png');
        });

        test('legend includes Unselected category when filtering', async ({
            page,
        }) => {
            await page.goto(
                `/study?id=${STUDY}&filterJson=${filterParam([
                    'Colorectal Cancer',
                ])}&featureFlags=EMBEDDINGS`
            );
            await page.locator(EMBEDDINGS_TAB).click();
            await snapLegend(page, 'embeddings-legend-filtered-colorectal.png');
        });
    });

    test.describe('viewport and layout', () => {
        test('maintains full width after switching tabs', async ({ page }) => {
            await page.goto(
                `/study?id=${STUDY}&filterJson=${filterParam([
                    'Melanoma',
                ])}&featureFlags=EMBEDDINGS`
            );
            await page.locator(SUMMARY_TAB).click();
            await page.locator(EMBEDDINGS_TAB).click();
            await snapViz(page, 'embeddings-full-width-after-tab-switch.png');
        });
    });
});
