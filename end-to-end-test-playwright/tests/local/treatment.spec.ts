// Source: end-to-end-test/local/specs/treatment.spec.js
import { test, expect, Locator, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { setInputText } from '../helpers/common';
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
const TREATMENT_IC50_PROFILE_NAME =
    'IC50 values of compounds on cellular phenotype readout';
const TREATMENT_EC50_PROFILE_NAME =
    'EC50 values of compounds on cellular phenotype readout';
const GENERIC_ASSAY_PROFILE_SELECTOR =
    '[data-test="GenericAssayProfileSelection"]';
const GENERIC_ASSAY_ENTITY_SELECTOR =
    '[data-test="GenericAssayEntitySelection"]';

async function waitForPlotsTab(page: Page, timeout = 20000) {
    await expect(page.locator('div.axisBlock').first()).toBeVisible({
        timeout,
    });
}

async function selectReactSelectOption(parent: Locator, optionText: string) {
    await parent.locator('.Select-control').click();
    await parent.locator(`.Select-option:text-is("${optionText}")`).click();
}

async function reactSelectOption(
    parent: Locator,
    optionText: string,
    loose = false
): Promise<Locator> {
    await parent.locator('.Select-control').click();
    if (loose) {
        return parent.locator(`.Select-option:has-text("${optionText}")`);
    }
    return parent.locator(`.Select-option:text-is("${optionText}")`);
}

async function goToTreatmentTab(page: Page) {
    await page.locator('button[id=addTracksDropdown]').click();
    await page.locator(ADD_TRACKS_TREATMENT_TAB).waitFor({ state: 'attached' });
    await page.locator(ADD_TRACKS_TREATMENT_TAB).click();
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

    await page
        .locator('[data-test=generic-assay-info-icon]')
        .waitFor({ state: 'attached' });
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

    await page
        .locator('[data-test=ViewLimitValues]')
        .waitFor({ state: 'attached' });
    if (
        !(await page
            .locator('[data-test=ViewLimitValues]')
            .isChecked()
            .catch(() => false))
    ) {
        await page.locator('[data-test=ViewLimitValues]').click();
    }

    if (
        await page
            .locator('[data-test=HorizontalLogCheckbox]')
            .isChecked()
            .catch(() => false)
    ) {
        await page.locator('[data-test=HorizontalLogCheckbox]').click();
    }

    if (
        await page
            .locator('[data-test=VerticalLogCheckbox]')
            .isChecked()
            .catch(() => false)
    ) {
        await page.locator('[data-test=VerticalLogCheckbox]').click();
    }
}

test.describe('treatment feature', () => {
    test.describe('oncoprint tab', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, oncoprintTabUrl, true);
            await waitForOncoprint(page);
        });

        test('shows treatment data type option in heatmap menu', async ({
            page,
        }) => {
            await goToTreatmentTab(page);
            await page.locator(GENERIC_ASSAY_PROFILE_SELECTOR).click();
            await page
                .locator(
                    `//*[text()="${TREATMENT_IC50_PROFILE_NAME}"] >> nth=0`
                )
                .waitFor({ state: 'attached' });
            await expect(
                page.locator(
                    `//*[text()="${TREATMENT_IC50_PROFILE_NAME}"] >> nth=0`
                )
            ).toBeAttached();
            await page
                .locator(
                    `//*[text()="${TREATMENT_EC50_PROFILE_NAME}"] >> nth=0`
                )
                .waitFor({ state: 'attached' });
            await expect(
                page.locator(
                    `//*[text()="${TREATMENT_EC50_PROFILE_NAME}"] >> nth=0`
                )
            ).toBeAttached();
        });

        test('shows treatment selection box in heatmap menu when treatment data type is selected', async ({
            page,
        }) => {
            await goToTreatmentTab(page);
            await page.locator(GENERIC_ASSAY_PROFILE_SELECTOR).click();
            await page
                .locator(
                    `//*[text()="${TREATMENT_IC50_PROFILE_NAME}"] >> nth=0`
                )
                .waitFor({ state: 'attached' });
            await page
                .locator(
                    `//*[text()="${TREATMENT_IC50_PROFILE_NAME}"] >> nth=0`
                )
                .click();
            await expect(
                page.locator(
                    `//*[text()="${TREATMENT_IC50_PROFILE_NAME}"] >> nth=0`
                )
            ).toBeAttached();
            await page.locator(GENERIC_ASSAY_PROFILE_SELECTOR).click();
            await page
                .locator(
                    `//*[text()="${TREATMENT_EC50_PROFILE_NAME}"] >> nth=0`
                )
                .waitFor({ state: 'attached' });
            await page
                .locator(
                    `//*[text()="${TREATMENT_EC50_PROFILE_NAME}"] >> nth=0`
                )
                .click();
            await expect(
                page.locator(
                    `//*[text()="${TREATMENT_EC50_PROFILE_NAME}"] >> nth=0`
                )
            ).toBeAttached();
        });

        test('shows all treatments in generic assay selector', async ({
            page,
        }) => {
            await goToTreatmentTab(page);
            await page.locator(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            const options = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="option"]');
            expect(await options.count()).toBe(10);
        });

        test('select one treatment in generic assay selector', async ({
            page,
        }) => {
            await goToTreatmentTab(page);
            await page.locator(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            await setInputText(
                page,
                '[data-test="GenericAssayEntitySelection"] input >> nth=0',
                '17-AAG'
            );
            const options = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="option"]');
            await options.nth(1).click();
            await page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="multiValue"]')
                .first()
                .waitFor({ state: 'attached' });
            const selectedOptions = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="multiValue"]');
            expect(await selectedOptions.count()).toBe(1);
        });

        test('show multiple filtered treatments', async ({ page }) => {
            await goToTreatmentTab(page);
            await page.locator(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            await setInputText(
                page,
                '[data-test="GenericAssayEntitySelection"] input >> nth=0',
                'AZD'
            );
            const options = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="option"]');
            expect(await options.count()).toBe(3);
        });

        test('select multiple filtered treatments in generic assay selector', async ({
            page,
        }) => {
            await goToTreatmentTab(page);
            await page.locator(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            await setInputText(
                page,
                '[data-test="GenericAssayEntitySelection"] input >> nth=0',
                'AZD'
            );
            const options = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="option"]');
            await options.first().click();
            await page
                .locator('div[class$="multiValue"]')
                .first()
                .waitFor({ state: 'attached' });
            const selectedOptions = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="multiValue"]');
            expect(await selectedOptions.count()).toBe(2);
        });

        test('keeps the filtered treatments list open after selecting an option', async ({
            page,
        }) => {
            await goToTreatmentTab(page);
            await page.locator(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            let options = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="option"]');
            expect(await options.count()).toBe(10);

            await options.first().click();
            options = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="option"]');
            expect(await options.count()).toBe(9);
        });

        test('initializes from `generic_assay_groups` URL parameter', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorage(
                page,
                oncoprintTabUrl.concat(
                    '&generic_assay_groups=study_es_0_treatment_ic50,17-AAG'
                ),
                true
            );
            await waitForOncoprint(page);
            await goToTreatmentTab(page);
            await page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="multiValue"]')
                .first()
                .waitFor({ state: 'attached' });
            const selectedOptions = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="multiValue"]');
            expect(await selectedOptions.count()).toBe(1);
            expect(await selectedOptions.first().innerText()).toBe(
                'Name of 17-AAG (17-AAG): Desc of 17-AAG'
            );
        });

        test('sets `generic_assay_groups` URL parameter', async ({ page }) => {
            await goToTreatmentTab(page);
            await page.locator(GENERIC_ASSAY_PROFILE_SELECTOR).click();
            await page
                .locator(
                    `//*[text()="${TREATMENT_EC50_PROFILE_NAME}"] >> nth=0`
                )
                .waitFor({ state: 'attached' });
            await page
                .locator(
                    `//*[text()="${TREATMENT_EC50_PROFILE_NAME}"] >> nth=0`
                )
                .click();

            await page.locator(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            await setInputText(
                page,
                '[data-test="GenericAssayEntitySelection"] input >> nth=0',
                '17-AAG'
            );
            const options = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="option"]');
            await options.first().click();
            const indicators = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="indicatorContainer"]');
            await indicators.first().click();
            const selectedOptions = page
                .locator(GENERIC_ASSAY_ENTITY_SELECTOR)
                .locator('div[class$="multiValue"]');
            expect(await selectedOptions.count()).toBe(1);

            await page.locator('button:text-is("Add Track")').click();
            await waitForOncoprint(page);
            const url = page.url();

            const regex = /generic_assay_groups=study_es_0_treatment_ec50%2C17-AAG/;
            expect(url).toMatch(regex);
        });
    });

    test.describe('plots tab', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, plotsTabUrl, true);
            await waitForPlotsTab(page);
        });

        test('shows treatment option in horizontal data type selection box', async ({
            page,
        }) => {
            const select = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            const opt = await reactSelectOption(select, 'Treatment Response');
            await expect(opt).toBeAttached();
        });

        test('shows treatment option in vertical data type selection box', async ({
            page,
        }) => {
            const select = page
                .locator('[name=v-profile-type-selector]')
                .locator('xpath=..');
            const opt = await reactSelectOption(select, 'Treatment Response');
            await expect(opt).toBeAttached();
        });

        test('horizontal axis menu shows treatments in profile menu', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Treatment Response');

            const horzProfileSelect = page
                .locator('[name=h-profile-name-selector]')
                .locator('xpath=..');
            const ec50Opt = await reactSelectOption(
                horzProfileSelect,
                'EC50 values of compounds on cellular phenotype readout'
            );
            await expect(ec50Opt).toBeAttached();
            const ic50Opt = await reactSelectOption(
                horzProfileSelect,
                'IC50 values of compounds on cellular phenotype readout'
            );
            await expect(ic50Opt).toBeAttached();
        });

        test('vertical axis menu shows treatments in profile menu', async ({
            page,
        }) => {
            const vertDataSelect = page
                .locator('[name=v-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(vertDataSelect, 'Treatment Response');

            const vertProfileSelect = page
                .locator('[name=v-profile-name-selector]')
                .locator('xpath=..');
            const ec50Opt = await reactSelectOption(
                vertProfileSelect,
                'EC50 values of compounds on cellular phenotype readout'
            );
            await expect(ec50Opt).toBeAttached();
            const ic50Opt = await reactSelectOption(
                vertProfileSelect,
                'IC50 values of compounds on cellular phenotype readout'
            );
            await expect(ic50Opt).toBeAttached();
        });

        test('horizontal axis menu shows treatment entry in entity menu', async ({
            page,
        }) => {
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

            await page
                .locator('[data-test=generic-assay-info-icon]')
                .waitFor({ state: 'attached' });

            await page.evaluate(() => {
                (window as any).resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect(
                    {
                        value: '17-AAG',
                        label: 'Name of 17-AAG',
                    }
                );
            });
            await page.evaluate(() => {
                (window as any).resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect(
                    {
                        value: 'AEW541',
                        label: 'Name of AEW541',
                    }
                );
            });
        });

        test('vertical axis menu shows treatment entry in entity menu', async ({
            page,
        }) => {
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

            await page
                .locator('[data-test=generic-assay-info-icon]')
                .waitFor({ state: 'attached' });
        });

        test('has Ordered samples entry in vert. menu when treatment selected on horz. axis', async ({
            page,
        }) => {
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

            await page
                .locator('[data-test=generic-assay-info-icon]')
                .waitFor({ state: 'attached' });

            await page.evaluate(() => {
                (window as any).resultsViewPlotsTab.onVerticalAxisGenericAssaySelect(
                    {
                        value: 'AEW541',
                        label: 'Name of AEW541',
                    }
                );
            });

            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            const opt = await reactSelectOption(
                horzDataSelect,
                'Ordered samples'
            );
            await expect(opt).toBeAttached();
        });

        test('has `Ordered samples` entry in horz. menu when treatment selected on vert. axis', async ({
            page,
        }) => {
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

            await page
                .locator('[data-test=generic-assay-info-icon]')
                .waitFor({ state: 'attached' });

            await page.evaluate(() => {
                (window as any).resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect(
                    {
                        value: 'AEW541',
                        label: 'Name of AEW541',
                    }
                );
            });

            const vertDataSelect = page
                .locator('[name=v-profile-type-selector]')
                .locator('xpath=..');
            const opt = await reactSelectOption(
                vertDataSelect,
                'Ordered samples'
            );
            await expect(opt).toBeAttached();
        });

        test('shows `Log Scale` checkbox when treatment selected on vert. axis', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Treatment Response');
            await expect(
                page.locator('[data-test=HorizontalLogCheckbox]')
            ).toBeAttached();
        });

        test('shows `Log Scale` checkbox when treatment selected on horz. axis', async ({
            page,
        }) => {
            const vertDataSelect = page
                .locator('[name=v-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(vertDataSelect, 'Treatment Response');
            await expect(
                page.locator('[data-test=VerticalLogCheckbox]')
            ).toBeAttached();
        });

        test('shows checkbox for limit values (e.g., larger_than_8.00) checkbox when such profile selected on horz. axis', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Treatment Response');

            const horzProfileSelect = page
                .locator('[name=h-profile-name-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(
                horzProfileSelect,
                'EC50 values of compounds on cellular phenotype readout'
            );

            await page
                .locator('[data-test=generic-assay-info-icon]')
                .waitFor({ state: 'attached', timeout: 10000 });

            await page.evaluate(() => {
                (window as any).resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect(
                    {
                        value: 'AEW541',
                        label: 'Name of AEW541',
                    }
                );
            });

            await page
                .locator('[data-test=ViewLimitValues]')
                .waitFor({ state: 'attached' });
            await expect(
                page.locator('[data-test=ViewLimitValues]')
            ).toBeVisible();
        });

        test('shows checkbox for limit values (e.g., larger_than_8.00) checkbox when such profile selected on vert. axis', async ({
            page,
        }) => {
            const vertDataSelect = page
                .locator('[name=v-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(vertDataSelect, 'Treatment Response');

            const vertProfileSelect = page
                .locator('[name=v-profile-name-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(
                vertProfileSelect,
                'EC50 values of compounds on cellular phenotype readout'
            );
            await page
                .locator('[data-test=generic-assay-info-icon]')
                .waitFor({ state: 'attached', timeout: 10000 });

            await page.evaluate(() => {
                (window as any).resultsViewPlotsTab.onVerticalAxisGenericAssaySelect(
                    {
                        value: 'AEW541',
                        label: 'Name of AEW541',
                    }
                );
            });

            await page
                .locator('[data-test=ViewLimitValues]')
                .waitFor({ state: 'attached' });
            await expect(
                page.locator('[data-test=ViewLimitValues]')
            ).toBeVisible();
        });

        test('shows hint for handling of threshold values for treatment data in scatter plot', async ({
            page,
        }) => {
            await expect(
                page.locator('label:has-text("Value >8.00 Labels **")')
            ).toBeAttached();
            await expect(
                page.locator('div:has-text("** ")').first()
            ).toBeAttached();
        });

        test('shows gene selection box in utilities menu for waterfall plot', async ({
            page,
        }) => {
            await selectTreamentsBothAxes(page);

            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');
            await expect(page.locator('.gene-select-container')).toBeAttached();
        });

        test('shows selected genes in gene selection box in utilities menu for waterfall plot', async ({
            page,
        }) => {
            await selectTreamentsBothAxes(page);

            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            await page
                .locator('.gene-select-container')
                .waitFor({ state: 'attached' });
            const geneSelect = page.locator('.gene-select-container');

            await geneSelect.click();
            await expect(
                page
                    .locator('[data-test=GeneColoringMenu]')
                    .locator('div:text-is("Genes")')
            ).toBeVisible();

            const geneMenuEntries = await page.evaluate(() => {
                const root = document.querySelector(
                    '[data-test=GeneColoringMenu]'
                );
                if (!root) return [];
                const labels = Array.from(root.querySelectorAll('div')).filter(
                    el => (el as HTMLElement).innerText === 'Genes'
                );
                if (labels.length === 0) return [];
                const parent = labels[0].parentElement;
                if (!parent) return [];
                const wrappers = parent.querySelectorAll('div');
                if (wrappers.length < 2) return [];
                const innerEntries = wrappers[1].querySelectorAll('div');
                return Array.from(innerEntries).map(
                    e => (e as HTMLElement).innerText
                );
            });

            expect(geneMenuEntries[0]).toBe('CDKN2A');
            expect(geneMenuEntries[1]).toBe('MDM2');
            expect(geneMenuEntries[2]).toBe('MDM4');
            expect(geneMenuEntries[3]).toBe('TP53');
        });

        test('shows sort order button for waterfall plot when `Ordered samples` selected', async ({
            page,
        }) => {
            await selectTreamentsBothAxes(page);
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');
            await expect(
                page.locator('[data-test=changeSortOrderButton]')
            ).toBeAttached();
        });
    });
});
