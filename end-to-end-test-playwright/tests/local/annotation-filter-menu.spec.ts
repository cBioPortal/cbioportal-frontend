// Source: end-to-end-test/local/specs/annotation-filter-menu.spec.js
import { test, expect, Page } from '../../fixtures';
import {
    goToUrlAndSetLocalStorage,
    goToUrlAndSetLocalStorageWithProperty,
} from './helpers';
import { waitForStudyView } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;
const comparisonResultsViewUrl = `${CBIOPORTAL_URL}/results/comparison?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=study_es_0_cnaseq&gene_list=ABLIM1%2520TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=alterations`;

const SV_COUNTS_SORT_DESC_10 = {
    BRAF: '37',
    SND1: '10',
    AGK: '4',
    ALK: '4',
    TTN: '4',
    NCOA4: '3',
    AGAP3: '2',
    CDK5RAP2: '2',
    EML4: '2',
    MKRN1: '2',
};

async function waitForComparisonTab(page: Page) {
    await expect(
        page.locator('[data-test=GroupComparisonAlterationEnrichments]')
    ).toBeVisible({ timeout: 30000 });
}

async function openAlterationTypeSelectionMenu(page: Page) {
    await page
        .locator('[data-test=AlterationEnrichmentTypeSelectorButton]')
        .waitFor({ state: 'attached' });
    await page
        .locator('[data-test=AlterationEnrichmentTypeSelectorButton]')
        .click();
    await expect(
        page.locator('[data-test=AlterationTypeSelectorMenu]')
    ).toBeVisible();
}

async function selectTier(page: Page, tier: string) {
    const toggleAllTiers = page.locator('[data-test=ToggleAllDriverTiers]');
    await toggleAllTiers.waitFor({ state: 'attached' });
    await toggleAllTiers.click();
    const tierEl = page.locator(`[data-test=${tier}]`);
    await tierEl.waitFor({ state: 'attached' });
    await expect(tierEl).toBeVisible();
    await tierEl.click();
}

async function sortPaneByCount(page: Page, pane: string) {
    await page
        .locator(`//*[@data-test="${pane}"]`)
        .locator('span:text-is("#")')
        .click();
    await waitForStudyView(page);
}

async function clickCheckBoxStudyView(page: Page, name: string) {
    const checkboxContainer = page.locator(`label:text-is("${name}")`);
    await expect(checkboxContainer).toBeVisible();
    const checkboxField = checkboxContainer.locator('input');
    await expect(checkboxField).toBeVisible();
    await checkboxField.click();
    await waitForStudyView(page);
}

const sortDescLimit = (
    entryCounts: Record<string, string>,
    limit = 10
): Record<string, string> => {
    return Object.fromEntries(
        Object.entries(entryCounts)
            .sort((e1, e2) =>
                e1[1] !== e2[1]
                    ? parseInt(e2[1]) - parseInt(e1[1])
                    : e1[0].localeCompare(e2[0])
            )
            .slice(0, limit)
    );
};

async function clickCheckBoxResultsView(page: Page, name: string) {
    const el = page.locator(`label:text-is("${name}")`).locator('input');
    await el.waitFor({ state: 'attached' });
    await expect(el).toBeVisible();
    await el.click();
    await waitForUpdateResultsView(page);
}

async function geneTableCounts(
    page: Page,
    dataTest: string
): Promise<Record<string, string>> {
    const fieldName =
        dataTest === 'copy number alterations-table'
            ? 'numberOfAlteredCasesText'
            : 'numberOfAlterations';
    const tableSel = `//*[@data-test="${dataTest}"]`;
    const geneCells = page
        .locator(tableSel)
        .locator('[data-test=geneNameCell]');
    const geneCount = await geneCells.count();
    const geneNames: string[] = [];
    for (let i = 0; i < geneCount; i++) {
        geneNames.push(
            await geneCells
                .nth(i)
                .locator('div')
                .first()
                .innerText()
        );
    }
    const countCells = page
        .locator(tableSel)
        .locator(`[data-test=${fieldName}]`);
    const countCount = await countCells.count();
    const geneCounts: string[] = [];
    for (let i = 0; i < countCount; i++) {
        geneCounts.push(await countCells.nth(i).innerText());
    }
    const cnaCells = page.locator(tableSel).locator('[data-test=cnaCell]');
    const cnaCount = await cnaCells.count();
    const cnas: string[] = [];
    for (let i = 0; i < cnaCount; i++) {
        cnas.push(await cnaCells.nth(i).innerText());
    }
    return geneNames.reduce((obj: Record<string, string>, geneName, index) => {
        let suffix = '';
        if (cnas.length > 0) suffix = '_' + cnas[index];
        const key = geneName + suffix;
        return { ...obj, [key]: geneCounts[index] };
    }, {});
}

async function enrichmentTableCounts(
    page: Page
): Promise<Record<string, { alt: string; unalt: string }>> {
    const tbody = page.locator('[data-test=LazyMobXTable]').locator('tbody');
    const rows = tbody.locator('tr');
    const rowCount = await rows.count();
    const geneNames: string[] = [];
    for (let i = 0; i < rowCount; i++) {
        geneNames.push(
            await rows
                .nth(i)
                .locator('span[data-test=geneNameCell]')
                .innerText()
        );
    }
    const altCells = page.locator('//*[@data-test="Altered group-CountCell"]');
    const altCount = await altCells.count();
    const alteredCounts: string[] = [];
    for (let i = 0; i < altCount; i++) {
        alteredCounts.push(await altCells.nth(i).innerText());
    }
    const unaltCells = page.locator(
        '//*[@data-test="Unaltered group-CountCell"]'
    );
    const unaltCount = await unaltCells.count();
    const unalteredCounts: string[] = [];
    for (let i = 0; i < unaltCount; i++) {
        unalteredCounts.push(await unaltCells.nth(i).innerText());
    }
    return geneNames.reduce(
        (
            obj: Record<string, { alt: string; unalt: string }>,
            geneName,
            index
        ) => ({
            ...obj,
            [geneName]: {
                alt: alteredCounts[index],
                unalt: unalteredCounts[index],
            },
        }),
        {}
    );
}

async function waitForUpdateResultsView(page: Page) {
    await expect(page.locator('[data-test=LazyMobXTable]')).toBeVisible();
}

async function turnOffCancerGenesFilters(page: Page) {
    const icons = page.locator(
        '[data-test=gene-column-header] [data-test=header-filter-icon]'
    );
    const count = await icons.count();
    for (let i = 0; i < count; i++) {
        const color = await icons
            .nth(i)
            .evaluate((el: Element) => window.getComputedStyle(el).color);
        if (color === 'rgba(0, 0, 0, 1)' || color === 'rgb(0, 0, 0)') {
            await icons.nth(i).click();
        }
    }
}

async function openAlterationFilterMenu(page: Page) {
    await expect(
        page.locator('[data-test=AlterationFilterButton]')
    ).toBeVisible();
    await page.locator('[data-test=AlterationFilterButton]').click();
    await expect(
        page.locator('[data-test=GlobalSettingsDropdown] input').first()
    ).toBeVisible();
}

async function openAlterationFilterMenuGroupComparison(page: Page) {
    await expect(
        page.locator(
            '[data-test=AlterationEnrichmentAnnotationsSelectorButton]'
        )
    ).toBeVisible();
    await page
        .locator('[data-test=AlterationEnrichmentAnnotationsSelectorButton]')
        .click();
    await expect(
        page.locator('[data-test=GlobalSettingsDropdown] input').first()
    ).toBeVisible();
}

test.describe('alteration filter menu', () => {
    test.describe('study view', () => {
        test.describe('filtering of gene tables', () => {
            test.beforeEach(async ({ page }) => {
                await goToUrlAndSetLocalStorageWithProperty(
                    page,
                    studyViewUrl,
                    true,
                    {
                        show_oncokb: false,
                    }
                );
                await waitForStudyView(page);
                await turnOffCancerGenesFilters(page);
                await openAlterationFilterMenu(page);
            });

            test('filters mutation table when unchecking somatic checkbox', async ({
                page,
            }) => {
                await clickCheckBoxStudyView(page, 'Somatic');
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    BRCA2: '6',
                    BRCA1: '1',
                    ATM: '1',
                    TP53: '1',
                });
                expect(
                    Object.keys(
                        await geneTableCounts(page, 'structural variants-table')
                    ).length
                ).toBe(0);
                expect(
                    await geneTableCounts(page, 'copy number alterations-table')
                ).toEqual({
                    ERCC5_AMP: '7',
                    AURKAIP1_AMP: '7',
                    ATAD3A_AMP: '7',
                    ATAD3B_AMP: '7',
                    ACAP3_AMP: '7',
                    ATAD3C_AMP: '7',
                    AGRN_AMP: '7',
                    ERCC5_HOMDEL: '2',
                    AURKAIP1_HOMDEL: '2',
                    ATAD3A_HOMDEL: '2',
                    ATAD3B_HOMDEL: '2',
                    ACAP3_HOMDEL: '2',
                    ATAD3C_HOMDEL: '2',
                    AGRN_HOMDEL: '2',
                });
            });

            test('filters mutation table when unchecking germline checkbox', async ({
                page,
            }) => {
                await clickCheckBoxStudyView(page, 'Germline');
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    BRCA2: '6',
                    ACP3: '5',
                    BRCA1: '4',
                    ATM: '1',
                    DTNB: '1',
                    ABLIM1: '1',
                    MSH3: '1',
                    MYB: '1',
                    TP53: '1',
                    PIEZO1: '1',
                    ADAMTS20: '1',
                    OR11H1: '1',
                    TMEM247: '1',
                });
                expect(
                    sortDescLimit(
                        await geneTableCounts(page, 'structural variants-table')
                    )
                ).toEqual(SV_COUNTS_SORT_DESC_10);
                expect(
                    await geneTableCounts(page, 'copy number alterations-table')
                ).toEqual({
                    ERCC5_AMP: '7',
                    AURKAIP1_AMP: '7',
                    ATAD3A_AMP: '7',
                    ATAD3B_AMP: '7',
                    ACAP3_AMP: '7',
                    ATAD3C_AMP: '7',
                    AGRN_AMP: '7',
                    ERCC5_HOMDEL: '2',
                    AURKAIP1_HOMDEL: '2',
                    ATAD3A_HOMDEL: '2',
                    ATAD3B_HOMDEL: '2',
                    ACAP3_HOMDEL: '2',
                    ATAD3C_HOMDEL: '2',
                    AGRN_HOMDEL: '2',
                });
            });

            test('does not filter mutation table when unchecking unknown status checkbox', async ({
                page,
            }) => {
                await page.locator('[data-test=ShowUnknown]').click();
                await waitForStudyView(page);
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    BRCA2: '12',
                    ACP3: '5',
                    BRCA1: '5',
                    ATM: '2',
                    DTNB: '1',
                    ABLIM1: '1',
                    MSH3: '1',
                    MYB: '1',
                    TP53: '2',
                    PIEZO1: '1',
                    ADAMTS20: '1',
                    OR11H1: '1',
                    TMEM247: '1',
                });
                expect(
                    sortDescLimit(
                        await geneTableCounts(page, 'structural variants-table')
                    )
                ).toEqual(SV_COUNTS_SORT_DESC_10);
                expect(
                    await geneTableCounts(page, 'copy number alterations-table')
                ).toEqual({
                    ERCC5_AMP: '7',
                    AURKAIP1_AMP: '7',
                    ATAD3A_AMP: '7',
                    ATAD3B_AMP: '7',
                    ACAP3_AMP: '7',
                    ATAD3C_AMP: '7',
                    AGRN_AMP: '7',
                    ERCC5_HOMDEL: '2',
                    AURKAIP1_HOMDEL: '2',
                    ATAD3A_HOMDEL: '2',
                    ATAD3B_HOMDEL: '2',
                    ACAP3_HOMDEL: '2',
                    ATAD3C_HOMDEL: '2',
                    AGRN_HOMDEL: '2',
                });
            });

            test('filters tables when unchecking driver checkbox', async ({
                page,
            }) => {
                await clickCheckBoxStudyView(page, 'Putative drivers');
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    ACP3: '5',
                    ADAMTS20: '1',
                    ATM: '2',
                    BRCA1: '3',
                    BRCA2: '12',
                    DTNB: '1',
                    MSH3: '1',
                    MYB: '1',
                    PIEZO1: '1',
                    TMEM247: '1',
                    TP53: '2',
                });

                expect(
                    await geneTableCounts(page, 'copy number alterations-table')
                ).toEqual({
                    AURKAIP1_AMP: '7',
                    ATAD3A_AMP: '7',
                    ATAD3B_AMP: '7',
                    ACAP3_AMP: '7',
                    ATAD3C_AMP: '7',
                    ERCC5_AMP: '6',
                    AGRN_AMP: '6',
                    AURKAIP1_HOMDEL: '2',
                    ATAD3A_HOMDEL: '2',
                    ATAD3B_HOMDEL: '2',
                    ACAP3_HOMDEL: '2',
                    ATAD3C_HOMDEL: '2',
                    AGRN_HOMDEL: '2',
                    ERCC5_HOMDEL: '1',
                });
            });

            test('filters tables when unchecking passenger checkbox', async ({
                page,
            }) => {
                await clickCheckBoxStudyView(page, 'Putative passengers');
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    BRCA2: '12',
                    ACP3: '5',
                    BRCA1: '4',
                    ATM: '2',
                    ABLIM1: '1',
                    TP53: '2',
                    ADAMTS20: '1',
                    OR11H1: '1',
                });

                expect(
                    await geneTableCounts(page, 'copy number alterations-table')
                ).toEqual({
                    ERCC5_AMP: '7',
                    AURKAIP1_AMP: '7',
                    ATAD3A_AMP: '7',
                    ATAD3B_AMP: '7',
                    ACAP3_AMP: '6',
                    ATAD3C_AMP: '6',
                    AGRN_AMP: '7',
                    ERCC5_HOMDEL: '2',
                    AURKAIP1_HOMDEL: '2',
                    ATAD3A_HOMDEL: '2',
                    ATAD3B_HOMDEL: '2',
                    ACAP3_HOMDEL: '2',
                    ATAD3C_HOMDEL: '2',
                    AGRN_HOMDEL: '2',
                });
            });

            test('filters tables when unchecking when unchecking unknown oncogenicity checkbox', async ({
                page,
            }) => {
                await page
                    .locator('[data-test=ShowUnknownOncogenicity]')
                    .click();
                await waitForStudyView(page);
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    BRCA1: '3',
                    PIEZO1: '1',
                    DTNB: '1',
                    ABLIM1: '1',
                    MSH3: '1',
                    MYB: '1',
                    OR11H1: '1',
                    TMEM247: '1',
                });

                expect(
                    await geneTableCounts(page, 'copy number alterations-table')
                ).toEqual({
                    ERCC5_AMP: '1',
                    ACAP3_AMP: '1',
                    ATAD3C_AMP: '1',
                    AGRN_AMP: '1',
                    ERCC5_HOMDEL: '1',
                });
            });

            test('filters structural variant tables when unchecking when unchecking somatic oncogenicity checkbox', async ({
                page,
            }) => {
                await page.locator('[data-test=HideSomatic]').click();
                await waitForStudyView(page);
                expect(
                    Object.keys(
                        await geneTableCounts(page, 'structural variants-table')
                    ).length
                ).toBe(0);
            });

            test('does not filter tables when checking all tier checkboxes', async ({
                page,
            }) => {
                await waitForStudyView(page);
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    BRCA2: '12',
                    ACP3: '5',
                    BRCA1: '5',
                    ATM: '2',
                    DTNB: '1',
                    ABLIM1: '1',
                    MSH3: '1',
                    MYB: '1',
                    TP53: '2',
                    PIEZO1: '1',
                    ADAMTS20: '1',
                    OR11H1: '1',
                    TMEM247: '1',
                });

                expect(
                    await geneTableCounts(page, 'copy number alterations-table')
                ).toEqual({
                    ERCC5_AMP: '7',
                    AURKAIP1_AMP: '7',
                    ATAD3A_AMP: '7',
                    ATAD3B_AMP: '7',
                    ACAP3_AMP: '7',
                    ATAD3C_AMP: '7',
                    AGRN_AMP: '7',
                    ERCC5_HOMDEL: '2',
                    AURKAIP1_HOMDEL: '2',
                    ATAD3A_HOMDEL: '2',
                    ATAD3B_HOMDEL: '2',
                    ACAP3_HOMDEL: '2',
                    ATAD3C_HOMDEL: '2',
                    AGRN_HOMDEL: '2',
                });
            });

            test('filters tables when checking only Class 1 checkbox', async ({
                page,
            }) => {
                await selectTier(page, 'Class_1');
                await waitForStudyView(page);
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    BRCA1: '3',
                    ABLIM1: '1',
                    DTNB: '1',
                });

                expect(
                    await geneTableCounts(page, 'copy number alterations-table')
                ).toEqual({
                    ATAD3B_HOMDEL: '1',
                    AGRN_AMP: '1',
                });
            });

            test('filters tables when checking only Class 2 checkbox', async ({
                page,
            }) => {
                await selectTier(page, 'Class_2');

                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    TMEM247: '1',
                });

                expect(
                    await geneTableCounts(page, 'structural variants-table')
                ).toEqual({ ALK: '1', EML4: '1' });

                expect(
                    await geneTableCounts(page, 'copy number alterations-table')
                ).toEqual({
                    ATAD3A_HOMDEL: '1',
                    ACAP3_AMP: '1',
                });
            });

            test('filters tables when checking only Class 3 checkbox', async ({
                page,
            }) => {
                await selectTier(page, 'Class_3');
                await waitForStudyView(page);
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    MSH3: '1',
                    PIEZO1: '1',
                });

                expect(
                    await geneTableCounts(page, 'structural variants-table')
                ).toEqual({ NCOA4: '1', RET: '1' });

                expect(
                    Object.keys(
                        await geneTableCounts(
                            page,
                            'copy number alterations-table'
                        )
                    ).length
                ).toBe(0);
            });

            test('filters tables when checking only Class 4 checkbox', async ({
                page,
            }) => {
                await selectTier(page, 'Class_4');
                await waitForStudyView(page);
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    ADAMTS20: '1',
                });

                expect(
                    await geneTableCounts(page, 'structural variants-table')
                ).toEqual({
                    KIAA1549: '1',
                    BRAF: '1',
                    NCOA4: '1',
                    PIEZO1: '1',
                });

                expect(
                    Object.keys(
                        await geneTableCounts(
                            page,
                            'copy number alterations-table'
                        )
                    ).length
                ).toBe(0);
            });

            test('filters tables when checking only unknown tier checkbox', async ({
                page,
            }) => {
                await selectTier(page, 'ShowUnknownTier');
                await waitForStudyView(page);
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    BRCA2: '12',
                    ACP3: '5',
                    ATM: '2',
                    BRCA1: '2',
                    TP53: '2',
                    MYB: '1',
                    OR11H1: '1',
                });

                await sortPaneByCount(page, 'structural variants-table');
                expect(
                    sortDescLimit(
                        await geneTableCounts(
                            page,
                            'structural variants-table'
                        ),
                        8
                    )
                ).toEqual({
                    BRAF: '36',
                    SND1: '10',
                    AGK: '4',
                    TTN: '4',
                    ALK: '3',
                    AGAP3: '2',
                    CDK5RAP2: '2',
                    MKRN1: '2',
                });
                expect(
                    await geneTableCounts(page, 'copy number alterations-table')
                ).toEqual({
                    ERCC5_AMP: '7',
                    AURKAIP1_AMP: '7',
                    ATAD3A_AMP: '7',
                    ATAD3B_AMP: '7',
                    ATAD3C_AMP: '7',
                    ACAP3_AMP: '6',
                    AGRN_AMP: '6',
                    ERCC5_HOMDEL: '2',
                    AURKAIP1_HOMDEL: '2',
                    ACAP3_HOMDEL: '2',
                    ATAD3C_HOMDEL: '2',
                    AGRN_HOMDEL: '2',
                    ATAD3B_HOMDEL: '1',
                    ATAD3A_HOMDEL: '1',
                });
            });
        });

        test.describe('filtering of study view samples', () => {
            test.beforeEach(async ({ page }) => {
                await goToUrlAndSetLocalStorage(page, studyViewUrl, true);
                await waitForStudyView(page);
                await turnOffCancerGenesFilters(page);
                await openAlterationFilterMenu(page);
            });

            test('adds breadcrumb text for mutations', async ({ page }) => {
                await clickCheckBoxStudyView(page, 'Somatic');
                await clickCheckBoxStudyView(page, 'Putative passengers');
                await page.locator('[data-test=ToggleAllDriverTiers]').click();
                await page.locator('[data-test=ShowUnknownTier]').click();
                await waitForStudyView(page);
                const element = page
                    .locator('//*[@data-test="mutations-table"]')
                    .locator('input')
                    .first();
                await element.click();
                await page
                    .locator('//*[@data-test="mutations-table"]')
                    .locator('button:text-is("Select Samples")')
                    .click();
                const sectionsLocator = page
                    .locator('[data-test=groupedGeneFilterIcons]')
                    .locator('div');
                expect(
                    await sectionsLocator
                        .nth(0)
                        .locator('span')
                        .nth(1)
                        .innerText()
                ).toBe('driver or unknown');
                expect(
                    await sectionsLocator
                        .nth(1)
                        .locator('span')
                        .nth(1)
                        .innerText()
                ).toBe('germline or unknown');
                expect(
                    await sectionsLocator
                        .nth(2)
                        .locator('span')
                        .nth(1)
                        .innerText()
                ).toBe('unknown');
            });

            test('adds breadcrumb text for cnas', async ({ page }) => {
                await clickCheckBoxStudyView(page, 'Somatic');
                await clickCheckBoxStudyView(page, 'Putative drivers');
                await page
                    .locator('//*[@data-test="copy number alterations-table"]')
                    .locator('input')
                    .first()
                    .click();
                await page
                    .locator('//*[@data-test="copy number alterations-table"]')
                    .locator('button:text-is("Select Samples")')
                    .click();
                const sections = page
                    .locator('[data-test=groupedGeneFilterIcons]')
                    .locator('div');
                expect(await sections.count()).toBe(1);
                expect(
                    await sections
                        .nth(0)
                        .locator('span')
                        .nth(1)
                        .innerText()
                ).toBe('passenger or unknown');
            });

            test('reduced samples in genes table', async ({ page }) => {
                await clickCheckBoxStudyView(page, 'Somatic');
                await clickCheckBoxStudyView(page, 'Putative passengers');

                await page
                    .locator('//*[@data-test="mutations-table"]')
                    .locator('input')
                    .nth(1)
                    .click();

                await page
                    .locator('//*[@data-test="mutations-table"]')
                    .locator('button:text-is("Select Samples")')
                    .click();
                await waitForStudyView(page);
                expect(await geneTableCounts(page, 'mutations-table')).toEqual({
                    BRCA2: '1',
                    BRCA1: '1',
                    ATM: '1',
                    TP53: '1',
                });
            });
        });
    });

    test.describe.serial('group comparison - results view ', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(
                page,
                comparisonResultsViewUrl,
                true
            );
            await waitForComparisonTab(page);

            await openAlterationTypeSelectionMenu(page);
            await clickCheckBoxResultsView(
                page,
                'Structural Variants / Fusions'
            );
            await clickCheckBoxResultsView(page, 'Copy Number Alterations');
            await page.locator('[data-test=buttonSelectAlterations]').click();
            await waitForUpdateResultsView(page);

            await openAlterationFilterMenuGroupComparison(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('filters enrichment table when unchecking germline checkbox', async () => {
            await waitForStudyView(page);
            await clickCheckBoxResultsView(page, 'Germline');
            expect(await enrichmentTableCounts(page)).toEqual({
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '0 (0.00%)', unalt: '6 (30.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            await clickCheckBoxResultsView(page, 'Germline');
        });

        test('filters enrichment table when unchecking somatic checkbox', async () => {
            await clickCheckBoxResultsView(page, 'Somatic');
            expect(await enrichmentTableCounts(page)).toEqual({
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '5 (25.00%)' },
            });
            await clickCheckBoxResultsView(page, 'Somatic');
        });

        test('filters enrichment table when unchecking unknown status checkbox', async () => {
            await page.locator('[data-test=ShowUnknown]').click();
            await waitForUpdateResultsView(page);
            expect(await enrichmentTableCounts(page)).toEqual({
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            await page.locator('[data-test=ShowUnknown]').click();
        });

        test('filters enrichment table when unchecking driver checkbox', async () => {
            await clickCheckBoxResultsView(page, 'Putative drivers');
            expect(await enrichmentTableCounts(page)).toEqual({
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            await clickCheckBoxResultsView(page, 'Putative drivers');
        });

        test('filters enrichment table when unchecking passenger checkbox', async () => {
            await clickCheckBoxResultsView(page, 'Putative passengers');
            expect(await enrichmentTableCounts(page)).toEqual({
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            await clickCheckBoxResultsView(page, 'Putative passengers');
        });

        test('filters enrichment table when unchecking unknown oncogenicity checkbox', async () => {
            await page.locator('[data-test=ShowUnknownOncogenicity]').click();
            await waitForUpdateResultsView(page);
            expect(await enrichmentTableCounts(page)).toEqual({
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
            });
            await page.locator('[data-test=ShowUnknownOncogenicity]').click();
        });

        test('does not filter tables when checking all tier checkboxes', async () => {
            expect(await enrichmentTableCounts(page)).toEqual({
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
        });

        test('filters tables when checking Class 2 checkbox', async () => {
            await selectTier(page, 'Class_2');
            await waitForUpdateResultsView(page);
            expect(await enrichmentTableCounts(page)).toEqual({
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
            });
            await page.locator('[data-test=Class_2]').click();
        });

        test('filters tables when checking unknown tier checkbox', async () => {
            await page.locator('[data-test=ShowUnknownTier]').click();
            await waitForUpdateResultsView(page);
            expect(await enrichmentTableCounts(page)).toEqual({
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            await page.locator('[data-test=ShowUnknownTier]').click();
        });
    });
});
