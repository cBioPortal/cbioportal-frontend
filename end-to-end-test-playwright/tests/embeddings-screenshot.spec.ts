import { test, expect, Page } from '../fixtures';
import { expectElementScreenshot } from './helpers/common';

/**
 * Port of end-to-end-test/local/specs/core/embeddings.screenshot.spec.js.
 *
 * Similarity Maps (patient embeddings) screenshot coverage: the deck.gl
 * UMAP scatter and its legend under the various coloring modes (cancer
 * type, gene mutation, categorical + numeric clinical attribute) and the
 * selection/filtering behaviour driven from a study-view filter.
 *
 * This lives in the remote lane (not tests/local) because the feature
 * pulls its embedding data from a fixed remote asset
 * (datahub.assets.cbioportal.org/embeddings/msk_mosaic_2026) and renders
 * the public `msk_impact_50k_2026` cohort — both present only against the
 * public backend, not the localdb seed. The EMBEDDINGS feature flag is
 * opt-in via the URL.
 *
 * Gene coloring is keyed by `<entrezGeneId>_<...>` (see
 * EmbeddingsTab.parseColoringSelectionFromURL); EGFR = 1956, BRAF = 673.
 */

const STUDY = 'msk_impact_50k_2026';
const VIZ = '[data-test="embeddings-visualization"]';
const LEGEND = '[data-test="embeddings-legend"]';

const EGFR = '1956_undefined';
const BRAF = '673_undefined';

function coloringParam(selection: Record<string, string>): string {
    return encodeURIComponent(JSON.stringify(selection));
}

function geneColoring(geneValue: string): string {
    return coloringParam({
        selectedOption: geneValue,
        colorByMutationType: 'true',
        colorByCopyNumber: 'true',
        colorBySv: 'true',
    });
}

function clinicalColoring(
    attributeId: string,
    patientAttribute: boolean
): string {
    return coloringParam({
        selectedOption: `undefined_${JSON.stringify({
            clinicalAttributeId: attributeId,
            patientAttribute,
            studyId: STUDY,
        })}`,
        colorByMutationType: 'false',
        colorByCopyNumber: 'false',
        colorBySv: 'false',
    });
}

// Study-view filters are applied via the `#filterJson=` URL hash (not a
// query param) using the clinicalDataFilters schema, where each value is
// an object: see tests/studyview.spec.ts for the canonical encoding.
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

// deck.gl renders the WebGL scatter a frame or two after the embedding
// JSON resolves; the legend appearing is our signal that the data is in.
// When a coloring mode requires extra data (gene mutations, a filter), the
// legend first shows the default cancer-type entries and re-renders once
// that data lands — so callers pass `legendText` to wait for the coloring
// to actually take effect before the visual diff.
async function waitForEmbeddingRender(
    page: Page,
    legendText?: RegExp
): Promise<void> {
    await expect(page.locator(VIZ)).toBeVisible({ timeout: 60000 });
    await expect(page.locator(LEGEND)).toBeVisible({ timeout: 60000 });
    if (legendText) {
        await expect(page.locator(LEGEND)).toContainText(legendText, {
            timeout: 60000,
        });
    }
    await page
        .locator(`${VIZ} canvas`)
        .first()
        .waitFor({ state: 'attached' });
    await page.waitForTimeout(2000);
}

async function snapViz(page: Page, name: string, legendText?: RegExp) {
    await waitForEmbeddingRender(page, legendText);
    await expectElementScreenshot(page, VIZ, name, {
        hide: ['.dropdown-menu'],
    });
}

async function snapLegend(page: Page, name: string, legendText?: RegExp) {
    await waitForEmbeddingRender(page, legendText);
    await expectElementScreenshot(page, LEGEND, name);
}

function embeddingsUrl(query = ''): string {
    return `/study/embeddings?id=${STUDY}&featureFlags=EMBEDDINGS${query}`;
}

test.describe('embeddings tab screenshots', () => {
    test.describe('basic embedding visualization', () => {
        test('renders embeddings tab with default cancer type coloring', async ({
            page,
        }) => {
            await page.goto(embeddingsUrl());
            await snapViz(page, 'embeddings-default-cancer-type.png');
        });

        test('shows legend with category counts', async ({ page }) => {
            await page.goto(embeddingsUrl());
            await snapLegend(page, 'embeddings-legend-cancer-type.png');
        });
    });

    test.describe('gene mutation coloring', () => {
        // Wait for the mutation legend to replace the default cancer-type
        // entries before snapping, otherwise the capture races the
        // mutation-data fetch and falls back to cancer-type coloring.
        const MUTATION_LEGEND = /Not mutated|Missense|Truncating|Amplification/;

        test('colors embedding by EGFR mutations', async ({ page }) => {
            await page.goto(
                embeddingsUrl(
                    `&embeddings_coloring_selection=${geneColoring(EGFR)}`
                )
            );
            await snapViz(
                page,
                'embeddings-egfr-mutations.png',
                MUTATION_LEGEND
            );
        });

        test('colors embedding by BRAF mutations', async ({ page }) => {
            await page.goto(
                embeddingsUrl(
                    `&embeddings_coloring_selection=${geneColoring(BRAF)}`
                )
            );
            await snapViz(
                page,
                'embeddings-braf-mutations.png',
                MUTATION_LEGEND
            );
        });

        test('shows legend with mutation types for EGFR', async ({ page }) => {
            await page.goto(
                embeddingsUrl(
                    `&embeddings_coloring_selection=${geneColoring(EGFR)}`
                )
            );
            await snapLegend(
                page,
                'embeddings-legend-egfr-mutations.png',
                MUTATION_LEGEND
            );
        });
    });

    test.describe('clinical attribute coloring', () => {
        test('colors embedding by categorical clinical attribute (SEX)', async ({
            page,
        }) => {
            await page.goto(
                embeddingsUrl(
                    `&embeddings_coloring_selection=${clinicalColoring(
                        'SEX',
                        true
                    )}`
                )
            );
            await snapViz(page, 'embeddings-clinical-sex.png', /Male|Female/);
        });

        test('shows legend with clinical attribute values', async ({
            page,
        }) => {
            await page.goto(
                embeddingsUrl(
                    `&embeddings_coloring_selection=${clinicalColoring(
                        'SEX',
                        true
                    )}`
                )
            );
            await snapLegend(page, 'embeddings-legend-sex.png', /Male|Female/);
        });

        test('colors embedding by numeric clinical attribute with gradient (FRACTION_GENOME_ALTERED)', async ({
            page,
        }) => {
            await page.goto(
                embeddingsUrl(
                    `&embeddings_coloring_selection=${clinicalColoring(
                        'FRACTION_GENOME_ALTERED',
                        false
                    )}`
                )
            );
            await snapViz(page, 'embeddings-clinical-fga.png');
        });

        test('shows gradient legend for numeric clinical attribute', async ({
            page,
        }) => {
            await page.goto(
                embeddingsUrl(
                    `&embeddings_coloring_selection=${clinicalColoring(
                        'FRACTION_GENOME_ALTERED',
                        false
                    )}`
                )
            );
            await snapLegend(page, 'embeddings-legend-fga.png');
        });
    });

    test.describe('selection and filtering', () => {
        // Navigate straight to the embeddings route with the filter in the
        // URL hash: clicking the tab after a summary-tab load is not
        // actionable within the action timeout while the 50k-sample view
        // renders. Filtering brings in the gray "Unselected" cohort.
        const COLORECTAL = embeddingsUrl() + filterHash(['Colorectal Cancer']);

        test('shows unselected samples as gray when filtering by cancer type', async ({
            page,
        }) => {
            await page.goto(COLORECTAL);
            await snapViz(
                page,
                'embeddings-filtered-colorectal.png',
                /Unselected/
            );
        });

        test('legend includes Unselected category when filtering', async ({
            page,
        }) => {
            await page.goto(COLORECTAL);
            await snapLegend(
                page,
                'embeddings-legend-filtered-colorectal.png',
                /Unselected/
            );
        });
    });

    test.describe('viewport and layout', () => {
        test('renders full width with a cohort filter applied', async ({
            page,
        }) => {
            await page.goto(embeddingsUrl() + filterHash(['Melanoma']));
            await snapViz(
                page,
                'embeddings-full-width-filtered.png',
                /Unselected/
            );
        });
    });
});
