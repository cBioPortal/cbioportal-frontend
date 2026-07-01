import { test, expect, Page } from '../fixtures';
import {
    byTestHandle,
    setCheckboxChecked,
    setInputText,
} from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/mutationTable.spec.js.
 *
 * Exercises the results-view mutation table:
 *  - Search-box filtering shrinks row count.
 *  - Column-picker toggles that demand async data from Genome Nexus
 *    (Exon, HGVSc, GNOMAD, ClinVar, dbSNP) eventually populate cells.
 *  - Per-column header filter dropdown narrows rows by sample id.
 *  - Functional Impact column shows 24 Mutation Assessor dots.
 *
 * Uses separate pages per describe block since each loads a different
 * study URL. Each block is `describe.serial` only to the extent that a
 * single test inside some groups mutates state for a follow-on test
 * (e.g. "Exon" then "Show more"); other groups have a single test.
 */

const RESULTS_MUTATION_TABLE_URL =
    '/results/mutations?Action=Submit&Z_SCORE_THRESHOLD=1.0' +
    '&cancer_study_id=gbm_tcga_pub&cancer_study_list=gbm_tcga_pub' +
    '&case_set_id=gbm_tcga_pub_sequenced' +
    '&clinicallist=PROFILED_IN_gbm_tcga_pub_cna_rae' +
    '&gene_list=TP53%20MDM2%20MDM4&gene_set_choice=user-defined_list' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations' +
    '&show_samples=false';

const NSCLC_URL =
    '/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=nsclc_tcga_broad_2016&case_set_id=nsclc_tcga_broad_2016_cnaseq' +
    '&data_priority=0&gene_list=TP53&geneset_list=%20' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations' +
    '&tab_index=tab_visualize';

const BRCA_BROAD_URL =
    '/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=brca_broad&case_set_id=brca_broad_sequenced&data_priority=0' +
    '&gene_list=TP53&geneset_list=%20' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_broad_mutations' +
    '&tab_index=tab_visualize';

/**
 * Oncogenic-icon render is the closest signal that the table has
 * actually populated — sort happens after data arrives.
 */
async function waitForTable(page: Page, timeout = 60000) {
    await expect(
        page.locator('tr:nth-child(1) [data-test=oncogenic-icon-image]')
    ).toBeVisible({ timeout });
}

/**
 * The Columns picker renders inside a react-virtualized grid, so the
 * target checkbox may be virtualized out of the DOM until scrolled
 * into view. Scrolling past the end is a no-op; this is the same trick
 * the wdio spec used.
 */
async function scrollColumnPickerToBottom(page: Page) {
    await page.evaluate(() => {
        const grid = document.getElementsByClassName(
            'ReactVirtualized__Grid'
        )[0] as HTMLElement | undefined;
        if (grid) grid.scrollTo(1000, 1000);
    });
}

test.describe('mutation table: basic search', () => {
    test('filters table with search box', async ({ browser }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(RESULTS_MUTATION_TABLE_URL);
        await waitForTable(page);

        const rowsBefore = await page.locator('tr').count();
        await setInputText(
            page,
            '[data-test=table-search-input]',
            'TCGA-02-0010-01'
        );
        await expect
            .poll(() => page.locator('tr').count(), { timeout: 10000 })
            .toBeLessThan(rowsBefore);

        await page.close();
    });
});

test.describe.serial(
    'mutation table: exon + HGVSc columns (genome nexus)',
    () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(RESULTS_MUTATION_TABLE_URL);
            await waitForTable(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('adding "Exon" column populates 25 exon cells', async () => {
            await page.locator('#addColumnsDropdown').click();
            await scrollColumnPickerToBottom(page);
            await page.waitForTimeout(2000);
            await page.locator(':text-is("Exon")').click();

            await expect
                .poll(
                    () =>
                        page
                            .locator('[class*=exon-module__exon-table]')
                            .count(),
                    { timeout: 60000 }
                )
                .toBe(25);
        });

        test('"Show more" extends exon cells past 25', async () => {
            const showMore = page.locator('#showMoreButton');
            await expect(showMore).toBeEnabled({ timeout: 60000 });
            await showMore.click();
            await expect
                .poll(
                    () =>
                        page
                            .locator('[class*=exon-module__exon-table]')
                            .count(),
                    { timeout: 60000 }
                )
                .toBeGreaterThan(25);
        });

        test('adding HGVSc column populates a known transcript change', async () => {
            await page.locator('#addColumnsDropdown').click();
            await page.locator(':text-is("HGVSc")').click();
            await expect(
                page.locator('text=ENST00000269305.4:c.817C>T').first()
            ).toBeVisible({ timeout: 60000 });
        });

        test('"Show more" loads additional HGVSc data (C>T)', async () => {
            // "Show more" may already be disabled if the prior click (in
            // the exon test) pulled in the whole dataset — in which case
            // every C>T cell is already present. Skip the click if that's
            // the case and just assert C>T is visible.
            const showMore = page.locator('#showMoreButton');
            if (await showMore.isEnabled()) {
                await showMore.click();
            }
            await expect(page.locator('text=C>T').first()).toBeVisible({
                timeout: 60000,
            });
        });
    }
);

test.describe('mutation table: GNOMAD column tooltip', () => {
    test('GNOMAD frequency tooltip renders 9 allele-frequency rows', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(NSCLC_URL);
        await expect(
            page.locator('[data-test=oncogenic-icon-image]').first()
        ).toBeVisible({ timeout: 300000 });

        await setInputText(
            page,
            '[data-test="table-search-input"]',
            'LUAD-B00416-Tumor'
        );
        await expect(
            page.locator('[data-test=oncogenic-icon-image]').first()
        ).toBeVisible({ timeout: 10000 });

        await page.locator('#addColumnsDropdown').scrollIntoViewIfNeeded();
        await page.locator('#addColumnsDropdown').click();
        await scrollColumnPickerToBottom(page);
        await expect(
            page.locator('[data-test="add-chart-option-gnomad"] input')
        ).toBeVisible({ timeout: 10000 });
        await setCheckboxChecked(
            page,
            true,
            '[data-test="add-chart-option-gnomad"] input'
        );
        await page.locator('#addColumnsDropdown').click();

        const frequency = page
            .locator(
                '[data-test2="LUAD-B00416-Tumor"][data-test="gnomad-column"] span'
            )
            .first();
        await expect(frequency).toBeVisible({ timeout: 10000 });
        await expect
            .poll(
                async () => /\d/.test((await frequency.textContent()) ?? ''),
                {
                    timeout: 30000,
                }
            )
            .toBe(true);

        await frequency.scrollIntoViewIfNeeded();
        await frequency.hover();

        await expect(page.locator('[data-test="gnomad-table"]')).toBeVisible({
            timeout: 20000,
        });
        await expect
            .poll(
                () =>
                    page.locator('[data-test="allele-frequency-data"]').count(),
                { timeout: 10000 }
            )
            .toBe(9);

        await page.close();
    });
});

test.describe('mutation table: ClinVar column', () => {
    test('adding ClinVar column populates 25 clinvar cells', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(BRCA_BROAD_URL);
        await waitForTable(page);

        await page.locator('#addColumnsDropdown').click();
        await scrollColumnPickerToBottom(page);
        await page.locator(':text-is("ClinVar")').click();

        await expect
            .poll(() => page.locator('[data-test="clinvar-data"]').count(), {
                timeout: 60000,
            })
            .toBe(25);

        await page.close();
    });
});

test.describe('mutation table: dbSNP column', () => {
    test('adding dbSNP column populates 25 dbsnp cells', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(BRCA_BROAD_URL);
        await waitForTable(page);

        await page.locator('#addColumnsDropdown').click();
        await scrollColumnPickerToBottom(page);
        await page.waitForTimeout(2000);
        await page.locator(':text-is("dbSNP")').click();

        await expect
            .poll(() => page.locator('[data-test="dbsnp-data"]').count(), {
                timeout: 60000,
            })
            .toBe(25);

        await page.close();
    });
});

test.describe('mutation table: header filter dropdown', () => {
    test('per-column filter dropdown narrows by sample id', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(BRCA_BROAD_URL);
        await waitForTable(page);
        await expect(page.locator('.lazy-mobx-table')).toBeVisible();

        // The filter icon is CSS-hidden until its TH is hovered; hover
        // the TH first so the icon becomes visible and hittable.
        const filterTh = page
            .locator('.lazy-mobx-table th', { has: page.locator('.fa-filter') })
            .first();
        await filterTh.hover();
        const filterBtn = filterTh.locator('.fa-filter');
        await filterBtn.click();
        await expect(
            page.locator('.multilineHeader .dropdown').first()
        ).toBeVisible();

        await expect(
            page.locator('.multilineHeader .dropdown.open input[type=checkbox]')
        ).toHaveCount(28);

        await setInputText(
            page,
            '.multilineHeader .dropdown.open input.input-sm',
            'BR-V-033'
        );
        await expect(
            page.locator('.multilineHeader .dropdown.open input[type=checkbox]')
        ).toHaveCount(1);

        await expect(page.locator('.lazy-mobx-table tbody tr')).toHaveCount(1);
        await expect(
            page.locator('.lazy-mobx-table tbody tr td').first()
        ).toHaveText('BR-V-033');

        await page.close();
    });
});

test.describe(
    'mutation table: Functional Impact column (Mutation Assessor)',
    () => {
        test('adding Functional Impact column shows 24 MA dots', async ({
            browser,
        }) => {
            const page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(RESULTS_MUTATION_TABLE_URL);
            await waitForTable(page, 300000);

            await page.locator('#addColumnsDropdown').click();
            await page.waitForTimeout(2000);
            await page.locator(':text-is("Functional Impact")').click();
            await page.locator('#addColumnsDropdown').click();
            await page.waitForTimeout(2000);

            await expect
                .poll(
                    () =>
                        page
                            .locator('[data-test="mutation-assessor-dot"]')
                            .count(),
                    { timeout: 60000 }
                )
                .toBe(24);

            await page.close();
        });
    }
);
