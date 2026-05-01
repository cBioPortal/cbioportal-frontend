// Source: end-to-end-test/local/specs/treatment.screenshot.spec.js
import { test, expect, Page } from '../../fixtures';
import { Locator } from '@playwright/test';
import { goToUrlAndSetLocalStorage } from './helpers';
import { expectElementScreenshot, setInputText } from '../helpers/common';
import { waitForOncoprint } from '../helpers/oncoprint';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize';

const plotsTabUrl =
    CBIOPORTAL_URL +
    '/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&clinicallist=PROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize&generic_assay_groups=study_es_0_treatment_ic50,Afatinib-1,Afatinib-2';

const ADD_TRACKS_TREATMENT_TAB =
    '.oncoprintAddTracks a.tabAnchor_TREATMENT_RESPONSE';
const TREATMENT_EC50_PROFILE_NAME =
    'EC50 values of compounds on cellular phenotype readout';
const GENERIC_ASSAY_ENTITY_SELECTOR =
    '[data-test="GenericAssayEntitySelection"]';
const GENERIC_ASSAY_PROFILE_SELECTOR =
    '[data-test="GenericAssayProfileSelection"]';

async function waitForPlotsTab(page: Page, timeoutMs = 20000) {
    await expect(page.locator('div.axisBlock').first()).toBeVisible({
        timeout: timeoutMs,
    });
}

async function goToTreatmentTab(page: Page) {
    await page.locator('button[id=addTracksDropdown]').click();
    await expect(page.locator(ADD_TRACKS_TREATMENT_TAB)).toBeAttached();
    await page.locator(ADD_TRACKS_TREATMENT_TAB).click();
}

async function selectReactSelectOption(parent: Locator, optionText: string) {
    await parent.locator('.Select-control').click();
    await parent
        .locator(`.Select-option:has-text("${optionText}")`)
        .first()
        .click();
}

async function selectTreamentsBothAxes(page: Page) {
    const horzDataSelect = page
        .locator('[name=h-profile-type-selector]')
        .locator('xpath=..');
    await selectReactSelectOption(horzDataSelect, 'Treatment Response');
    const horzProfileSelect = page
        .locator('[name=h-profile-name-selector]')
        .locator('xpath=..');
    await selectReactSelectOption(
        horzProfileSelect,
        'IC50 values of compounds on cellular phenotype readout'
    );

    const vertDataSelect = page
        .locator('[name=v-profile-type-selector]')
        .locator('xpath=..');
    await selectReactSelectOption(vertDataSelect, 'Treatment Response');
    const vertProfileSelect = page
        .locator('[name=v-profile-name-selector]')
        .locator('xpath=..');
    await selectReactSelectOption(
        vertProfileSelect,
        'IC50 values of compounds on cellular phenotype readout'
    );

    await expect(
        page.locator('[data-test=generic-assay-info-icon]').first()
    ).toBeAttached();
    await page.evaluate(() => {
        (window as any).resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
            value: 'AEW541',
            label: 'Name of AEW541',
        });
    });

    await page.evaluate(() => {
        (window as any).resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
            value: 'AEW541',
            label: 'Name of AEW541',
        });
    });

    await expect(
        page.locator('[data-test=ViewLimitValues]').first()
    ).toBeAttached();
    if (
        !(await page
            .locator('[data-test=ViewLimitValues]')
            .first()
            .isChecked())
    ) {
        await page
            .locator('[data-test=ViewLimitValues]')
            .first()
            .click();
    }

    if (await page.locator('[data-test=HorizontalLogCheckbox]').isChecked()) {
        await page.locator('[data-test=HorizontalLogCheckbox]').click();
    }

    if (await page.locator('[data-test=VerticalLogCheckbox]').isChecked()) {
        await page.locator('[data-test=VerticalLogCheckbox]').click();
    }
}

test.describe('treatment feature', () => {
    test.describe('oncoprint tab', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, oncoprintTabUrl, true);
            await waitForOncoprint(page);
        });

        test('shows treatment profile heatmap track for treatment', async ({
            page,
        }) => {
            await goToTreatmentTab(page);
            await page.locator(GENERIC_ASSAY_PROFILE_SELECTOR).click();
            const ec50Option = page
                .locator(`xpath=//*[text()="${TREATMENT_EC50_PROFILE_NAME}"]`)
                .first();
            await expect(ec50Option).toBeAttached();
            await ec50Option.click();
            await page.locator(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            await setInputText(
                page,
                '[data-test="GenericAssayEntitySelection"] input >> nth=0',
                '17-AAG'
            );
            const options = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="option"]');
            await options.nth(0).click();
            const indicators = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="indicatorContainer"]');
            await indicators.nth(0).click();
            const selectedOptions = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="multiValue"]');

            expect(await selectedOptions.count()).toBe(1);

            await page.locator('button:has-text("Add Track")').click();
            await page.locator('button[id=addTracksDropdown]').click();
            await waitForOncoprint(page);
            await expectElementScreenshot(
                page,
                '[id=oncoprintDiv]',
                'treatment-shows-treatment-profile-heatmap-track-for-treatment.png'
            );
        });
    });

    test.describe('plots tab', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, plotsTabUrl, true);
            await waitForPlotsTab(page);
            await selectTreamentsBothAxes(page);
        });

        test('shows `value larger_than_8.00` in figure legend and indicates sub-threshold data points in plot', async ({
            page,
        }) => {
            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'treatment-shows-value-larger-than-8-in-figure-legend-and-indicates-sub-threshold-data-points-in-plot.png'
            );
        });

        test('shows waterfall plot when `Ordered samples` option is selected', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            await expect(
                page.locator('[data-test=ViewCopyNumber]')
            ).toBeAttached();
            await page.locator('[data-test=ViewCopyNumber]').click();

            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'treatment-shows-waterfall-plot-when-ordered-samples-option-is-selected.png'
            );
        });

        test('when option deselected, hides `value larger_than_8.00` in figure legend and sub-threshold data point indicators in waterfall plot', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            await expect(
                page.locator('[data-test=ViewCopyNumber]')
            ).toBeAttached();
            await page.locator('[data-test=ViewCopyNumber]').click();

            await page
                .locator('[data-test=ViewLimitValues]')
                .first()
                .click();

            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'treatment-when-option-deselected-hides-sub-threshold-data-point-indicators-in-waterfall-plot.png'
            );
        });

        test('rotates waterfall plot when swapping axes', async ({ page }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            await expect(
                page.locator('[data-test=ViewCopyNumber]')
            ).toBeAttached();
            await page.locator('[data-test=ViewCopyNumber]').click();

            await page.locator('[data-test=swapHorzVertButton]').click();

            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'treatment-rotates-waterfall-plot-when-swapping-axes.png'
            );
        });

        test('updates title of watefall plot when selecting a new gene', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            await expect(
                page.locator('[data-test=ViewCopyNumber]')
            ).toBeAttached();
            await page.locator('[data-test=ViewCopyNumber]').click();

            await page.locator('.gene-select').click();

            const genesParent = page
                .locator('[data-test=GeneColoringMenu]')
                .locator('div:has-text("Genes")')
                .locator('xpath=..');
            const innerDivs = genesParent.locator('div');
            const geneMenuEntries = innerDivs.nth(1).locator('div');
            await geneMenuEntries.nth(3).click();

            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'treatment-updates-title-of-waterfall-plot-when-selecting-a-new-gene.png'
            );
        });

        test('applies log-scale in waterfall plot', async ({ page }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            await expect(
                page.locator('[data-test=ViewCopyNumber]')
            ).toBeAttached();
            await page.locator('[data-test=ViewCopyNumber]').click();

            await page.locator('[data-test=VerticalLogCheckbox]').click();

            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'treatment-applies-log-scale-in-waterfall-plot.png'
            );
        });

        test('reverses order of waterfall plot data when `Sort order` button pressed', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            await expect(
                page.locator('[data-test=ViewCopyNumber]')
            ).toBeAttached();
            await page.locator('[data-test=ViewCopyNumber]').click();

            await page.locator('[data-test=changeSortOrderButton]').click();

            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'treatment-reverses-order-of-waterfall-plot-data-when-sort-order-button-pressed.png'
            );
        });

        test('shows a search indicator when sample search term is entered', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            await expect(
                page.locator('[data-test=ViewCopyNumber]')
            ).toBeAttached();
            await page.locator('[data-test=ViewCopyNumber]').click();

            const sampleSearch = page
                .locator('label:has-text("Search Case(s)")')
                .locator('xpath=..')
                .locator('input');
            await sampleSearch.fill('TCGA-A2-A04U-01 TCGA-A1-A0SE-01');

            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'treatment-shows-a-search-indicator-when-sample-search-term-is-entered.png'
            );
        });
    });
});
