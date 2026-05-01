// Source: end-to-end-test/local/specs/hide-download-controls.spec.js
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import {
    setServerConfiguration,
    waitForGroupComparisonTabOpen,
    waitForNetworkQuiet,
    waitForStudyQueryPage,
    waitForStudyView,
} from '../helpers/common';
import { waitForOncoprint } from '../helpers/oncoprint';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const downloadIcon = '.fa-download';
const downloadCloudIcon = '.fa-cloud-download';
const clipboardIcon = '.fa-clipboard';

async function globalCheck(page: Page) {
    await expect(
        page.locator(':text("Download")'),
        'The word "Download" occurs on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    ).toHaveCount(0);
    await expect(
        page.locator(':text("download")'),
        'The word "download" occurs on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    ).toHaveCount(0);
    await expect(
        page.locator(downloadIcon),
        'A download button/icon is visible on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    ).toHaveCount(0);
    await expect(
        page.locator(downloadCloudIcon),
        'A cloud download button/icon is visible on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    ).toHaveCount(0);
    await expect(
        page.locator(clipboardIcon),
        'A download button/icon is visible on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    ).toHaveCount(0);
}

async function openAndSetProperty(
    page: Page,
    url: string,
    prop: Record<string, unknown>
) {
    await goToUrlAndSetLocalStorage(page, url, true);
    await setServerConfiguration(page, prop);
    await goToUrlAndSetLocalStorage(page, url, true);
}

async function waitForTabs(page: Page, count: number) {
    await expect
        .poll(async () => await page.locator('.tabAnchor').count(), {
            timeout: 300000,
        })
        .toBeGreaterThanOrEqual(count);
}

async function waitForPatientView(page: Page, timeout = 20000) {
    await page
        .locator('#patientViewPageTabs')
        .waitFor({ state: 'attached', timeout });
    await expect(
        page.locator('[data-test=patientview-copynumber-table]')
    ).toBeVisible({ timeout });
    await expect(
        page.locator('[data-test=patientview-mutation-table]')
    ).toBeVisible({ timeout });
}

async function studyViewChartHoverHamburgerIcon(
    page: Page,
    chartDataTest: string,
    timeout: number
) {
    const chart = `[data-test=${chartDataTest}]`;
    await expect(page.locator(chart)).toBeVisible({ timeout });
    await page.locator(chart).dispatchEvent('mouseover');

    const hamburgerIcon = '[data-test=chart-header-hamburger-icon]';
    await page
        .locator(hamburgerIcon)
        .first()
        .dispatchEvent('mouseover');
}

async function openGroupComparison(
    page: Page,
    studyViewUrl: string,
    chartDataTest: string,
    timeout = 30000
) {
    await goToUrlAndSetLocalStorage(page, studyViewUrl, true);
    await expect(page.locator('[data-test=summary-tab-content]')).toBeVisible({
        timeout,
    });
    await waitForNetworkQuiet(page, 20000);

    const chart = `[data-test=${chartDataTest}]`;
    await expect(page.locator(chart)).toBeVisible({ timeout });
    await page.mouse.move(0, 0);
    await page.locator(chart).scrollIntoViewIfNeeded();
    await page.locator(chart).dispatchEvent('mouseover');

    const hamburgerIcon = `${chart} [data-test=chart-header-hamburger-icon]`;
    await expect(page.locator(hamburgerIcon)).toBeVisible({ timeout });
    await page.locator(hamburgerIcon).hover();

    const compareGroupsItem = page.locator(`${hamburgerIcon} li`).nth(1);
    await expect(compareGroupsItem).toBeVisible();

    const popupPromise = page.context().waitForEvent('page');
    await compareGroupsItem.click();
    const newPage = await popupPromise;
    await newPage.waitForLoadState('load');
    await waitForGroupComparisonTabOpen(newPage, timeout);
    return newPage;
}

test.describe('hide download controls feature', () => {
    test.describe.serial('study query page', () => {
        const expectedTabNames = ['Query'];
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await openAndSetProperty(page, CBIOPORTAL_URL, {
                skin_hide_download_controls: 'hide',
            });
            await waitForStudyQueryPage(page);
            await waitForTabs(page, expectedTabNames.length);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('covers all tabs with download control tests', async () => {
            const tabElements = page.locator('.tabAnchor');
            const total = await tabElements.count();
            const observedTabNames: string[] = [];
            for (let i = 0; i < total; i++) {
                const t = tabElements.nth(i);
                if (await t.isVisible()) {
                    observedTabNames.push(await t.innerText());
                }
            }
            expect(
                observedTabNames,
                `There appears to be a new tab on the page (observed names: [${observedTabNames.join(
                    ', '
                )}] expected names: [${expectedTabNames.join(
                    ', '
                )}]). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include tests for this in hide-download-controls.spec.js.`
            ).toEqual(expectedTabNames);
        });

        test('global check for icon and occurrence of "Download" as a word', async () => {
            await globalCheck(page);
        });

        test('does not show Download tab', async () => {
            await expect(page.locator('.tabAnchor_download')).toHaveCount(0);
        });

        test('does not show download icons data sets in study rows', async () => {
            await goToUrlAndSetLocalStorage(
                page,
                `${CBIOPORTAL_URL}/datasets`,
                true
            );
            await page
                .locator('[data-test=LazyMobXTable]')
                .first()
                .waitFor({ state: 'attached' });
            await expect(page.locator(downloadIcon)).toHaveCount(0);
        });
    });

    test.describe.serial('results view page', () => {
        const expectedTabNames = [
            'OncoPrint',
            'Cancer Types Summary',
            'Mutual Exclusivity',
            'Plots',
            'Mutations',
            'Co-expression',
            'Comparison/Survival',
            'CN Segments',
            'Pathways',
        ];
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 3200, height: 1000 },
            });

            await openAndSetProperty(
                page,
                `${CBIOPORTAL_URL}/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=mutations%2Cgistic&case_set_id=study_es_0_cnaseq&gene_list=CREB3L1%2520RPS11%2520PNMA1%2520MMP2%2520ZHX3%2520ERCC5%2520TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=mrna`,
                { skin_hide_download_controls: 'hide' }
            );
            await waitForOncoprint(page);
            await waitForTabs(page, expectedTabNames.length);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('covers all tabs with download control tests', async () => {
            const tabElements = page.locator('.tabAnchor');
            const total = await tabElements.count();
            const observedTabNames: string[] = [];
            for (let i = 0; i < total; i++) {
                const t = tabElements.nth(i);
                if (await t.isVisible()) {
                    observedTabNames.push(await t.innerText());
                }
            }
            expect(
                observedTabNames,
                `There appears to be a new tab on the page (observed names: [${observedTabNames.join(
                    ', '
                )}] expected names: [${expectedTabNames.join(
                    ', '
                )}]). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include tests for this in hide-download-controls.spec.js.`
            ).toEqual(expectedTabNames);
        });

        test.describe('oncoprint', () => {
            test('does not show download/clipboard icons and does not contain the word "Download"', async () => {
                await globalCheck(page);
            });
        });

        test.describe('cancer type summary', () => {
            test('does not show download/clipboard icons and does not contain the word "Download"', async () => {
                await page.locator('.tabAnchor_cancerTypesSummary').click();
                await page
                    .locator('[data-test=cancerTypeSummaryChart]')
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });

        test.describe('mutual exclusivity', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_mutualExclusivity').click();
                await page
                    .locator('[data-test=LazyMobXTable]')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });

        test.describe('plots', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_plots').click();
                await page
                    .locator(':text("mRNA vs mut type")')
                    .waitFor({ state: 'attached' });
                await page.locator(':text("mRNA vs mut type")').click();
                await page
                    .locator('[data-test=PlotsTabPlotDiv]')
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });

        test.describe('mutations', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_mutations').click();
                await page
                    .locator('[data-test=LollipopPlot]')
                    .waitFor({ state: 'attached' });
                await page.locator('.tabAnchor_TP53').click();
                await page
                    .locator('[data-test=LollipopPlot]')
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });

        test.describe('co-expression', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_coexpression').click();
                await page
                    .locator('#coexpression-plot-svg')
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });

        test.describe.serial('comparison/survival', () => {
            test.beforeAll(async () => {
                await page.locator('.tabAnchor_comparison').click();
                await waitForNetworkQuiet(page);
            });
            test('covers all tabs with download control tests', async () => {
                const expected = [
                    'Overlap',
                    'Survival',
                    'Clinical',
                    'Genomic Alterations',
                    'mRNA',
                    'DNA Methylation',
                    'Generic Assay Patient Test',
                    'Mutational Signature',
                    'Treatment Response',
                ];

                const tabElements = page.locator(
                    '[data-test=ComparisonTabDiv] .tabAnchor'
                );
                const total = await tabElements.count();
                const observedTabNames: string[] = [];
                for (let i = 0; i < total; i++) {
                    const t = tabElements.nth(i);
                    if (await t.isVisible()) {
                        observedTabNames.push(await t.innerText());
                    }
                }

                expect(
                    observedTabNames,
                    `There appears to be a new tab on the page (observed names: [${observedTabNames.join(
                        ', '
                    )}] expected names: [${expected.join(
                        ', '
                    )}]). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include tests for this in hide-download-controls.spec.js.`
                ).toEqual(expected);
            });
            test.describe('overlap tab', () => {
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await page.locator('.tabAnchor_overlap').click();
                    await page
                        .locator('[data-test=ComparisonPageOverlapTabContent]')
                        .waitFor({ state: 'attached' });
                    await globalCheck(page);
                });
            });
            test.describe('survival tab', () => {
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await page.locator('.tabAnchor_survival').click();
                    await page
                        .locator('[data-test=SurvivalChart]')
                        .waitFor({ state: 'attached' });
                    await globalCheck(page);
                });
            });
            test.describe('clinical tab', () => {
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await page.locator('.tabAnchor_clinical').click();
                    await page
                        .locator('[data-test=ClinicalTabPlotDiv]')
                        .waitFor({ state: 'attached' });
                    await page
                        .locator('[data-test=LazyMobXTable]')
                        .first()
                        .waitFor({ state: 'attached' });
                    await globalCheck(page);
                });
            });
            test.describe('alterations tab', () => {
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await page.locator('.tabAnchor_alterations').click();
                    await page
                        .locator('[data-test=LazyMobXTable]')
                        .first()
                        .waitFor({ state: 'attached' });
                    await globalCheck(page);
                });
            });
            test.describe('mrna tab', () => {
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await page.locator('.tabAnchor_mrna').click();
                    await page
                        .locator('[data-test=GroupComparisonMRNAEnrichments]')
                        .waitFor({ state: 'attached' });
                    await page
                        .locator(
                            '[data-test=GroupComparisonMRNAEnrichments] tbody tr b'
                        )
                        .first()
                        .click();
                    await page
                        .locator('[data-test=MiniBoxPlot]')
                        .first()
                        .waitFor({ state: 'attached' });
                    await globalCheck(page);
                });
            });
            test.describe('dna_methylation tab', () => {
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await page.locator('.tabAnchor_dna_methylation').click();
                    await page
                        .locator(
                            '[data-test=GroupComparisonMethylationEnrichments]'
                        )
                        .waitFor({ state: 'attached' });
                    await page
                        .locator(
                            '[data-test=GroupComparisonMethylationEnrichments] tbody tr b'
                        )
                        .first()
                        .click();
                    await page
                        .locator('[data-test=MiniBoxPlot]')
                        .first()
                        .waitFor({ state: 'attached' });
                    await globalCheck(page);
                });
            });
            test.describe('treatment response tab', () => {
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await page
                        .locator('.tabAnchor_generic_assay_treatment_response')
                        .click();
                    await page
                        .locator(
                            '[data-test=GroupComparisonGenericAssayEnrichments]'
                        )
                        .waitFor({ state: 'attached' });
                    await page
                        .locator(
                            '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                        )
                        .first()
                        .click();
                    await page
                        .locator('[data-test=MiniBoxPlot]')
                        .first()
                        .waitFor({ state: 'attached' });
                    await globalCheck(page);
                });
            });
            test.describe('mutational signature tab', () => {
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await page
                        .locator(
                            '.tabAnchor_generic_assay_mutational_signature'
                        )
                        .click();
                    await page
                        .locator(
                            '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                        )
                        .first()
                        .waitFor({ state: 'attached' });
                    await page.waitForTimeout(1000);
                    await page
                        .locator(
                            '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                        )
                        .nth(1)
                        .click();
                    await page
                        .locator('[data-test=MiniBoxPlot]')
                        .first()
                        .waitFor({ state: 'attached' });
                    await globalCheck(page);
                });
            });

            test.describe.skip('generic assay patient test tab', () => {
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await page
                        .locator(
                            '.tabAnchor_generic_assay_generic_assay_patient_test'
                        )
                        .click();
                    await page
                        .locator(
                            '[data-test=GroupComparisonGenericAssayEnrichments]'
                        )
                        .waitFor({ state: 'attached' });
                    await page
                        .locator(
                            '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                        )
                        .nth(5)
                        .click();
                    await page
                        .locator('[data-test=MiniBoxPlot]')
                        .first()
                        .waitFor({ state: 'attached' });
                    await globalCheck(page);
                });
            });

            test.describe.serial('CN segments', () => {
                test.beforeAll(async () => {
                    await page.locator('.tabAnchor_cnSegments').click();
                    await page
                        .locator('.igvContainer')
                        .waitFor({ state: 'attached' });
                });
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await globalCheck(page);
                });
            });

            test.describe.serial('pathways', () => {
                test.beforeAll(async () => {
                    await page.locator('.tabAnchor_pathways').click();
                    await page
                        .locator('.pathwayMapper')
                        .first()
                        .waitFor({ state: 'attached' });
                });
                test('global check for icon and occurrence of "Download" as a word', async () => {
                    await globalCheck(page);
                });
            });

            test('does not show Download tab', async () => {
                await expect(page.locator('.tabAnchor_download')).toHaveCount(
                    0
                );
            });
        });
    });

    test.describe.serial('patient view', () => {
        const expectedTabNames = [
            'Summary',
            'Pathways',
            'Clinical Data',
            'Files & Links',
            'Tissue Image',
            'Pathology Slide',
            'Study Sponsors',
        ];
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await openAndSetProperty(
                page,
                `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK`,
                { skin_hide_download_controls: 'hide' }
            );
            await waitForPatientView(page);
            await waitForTabs(page, expectedTabNames.length);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('covers all tabs with download control tests', async () => {
            const tabElements = page.locator('.tabAnchor');
            const total = await tabElements.count();
            const observedTabNames: string[] = [];
            for (let i = 0; i < total; i++) {
                const t = tabElements.nth(i);
                if (await t.isVisible()) {
                    observedTabNames.push(await t.innerText());
                }
            }
            expect(
                observedTabNames,
                `There appears to be a new tab on the page (observed names: [${observedTabNames.join(
                    ', '
                )}] expected names: [${expectedTabNames.join(
                    ', '
                )}]). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include tests for this in hide-download-controls.spec.js.`
            ).toEqual(expectedTabNames);
        });
        test.describe('summary tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_summary').click();
                await page
                    .locator('[data-test=LazyMobXTable]')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('pathways tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_pathways').click();
                await page
                    .locator('.pathwayMapper')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('clinical data tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_clinicalData').click();
                await page
                    .locator('[data-test=LazyMobXTable]')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('files and links tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_filesAndLinks').click();
                await page
                    .locator('.resourcesSection')
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('tissue image tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_tissueImage').click();
                await page.locator('iframe').waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('pathology slide tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page
                    .locator('.tabAnchor_openResource_PATHOLOGY_SLIDE')
                    .click();
                await page
                    .locator('h2')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('study sponsors tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page
                    .locator('.tabAnchor_openResource_STUDY_SPONSORS')
                    .click();
                await page
                    .locator('h2')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
    });

    test.describe.serial('study view', () => {
        const expectedTabNames = [
            'Summary',
            'Clinical Data',
            'CN Segments',
            'Files & Links',
            'Plots Beta!',
            'Study Sponsors',
        ];
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await openAndSetProperty(
                page,
                `${CBIOPORTAL_URL}/study/summary?id=study_es_0`,
                { skin_hide_download_controls: 'hide' }
            );
            await waitForStudyView(page);
            await waitForTabs(page, expectedTabNames.length);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test.describe('summary tab', () => {
            test('covers all tabs with download control tests', async () => {
                const tabElements = page.locator('.tabAnchor');
                const total = await tabElements.count();
                const observedTabNames: string[] = [];
                for (let i = 0; i < total; i++) {
                    const t = tabElements.nth(i);
                    if (await t.isVisible()) {
                        observedTabNames.push(await t.innerText());
                    }
                }
                expect(
                    observedTabNames,
                    `There appears to be a new tab on the page (observed names: [${observedTabNames.join(
                        ', '
                    )}] expected names: [${expectedTabNames.join(
                        ', '
                    )}]). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include tests for this in hide-download-controls.spec.js.`
                ).toEqual(expectedTabNames);
            });
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await globalCheck(page);
            });
            test('does not show download option in chart menu-s', async () => {
                await studyViewChartHoverHamburgerIcon(
                    page,
                    'chart-container-SAMPLE_COUNT',
                    1000
                );
                await globalCheck(page);
                await studyViewChartHoverHamburgerIcon(
                    page,
                    'chart-container-study_es_0_mutations',
                    1000
                );
                await globalCheck(page);
                await studyViewChartHoverHamburgerIcon(
                    page,
                    'chart-container-MUTATION_COUNT',
                    1000
                );
                await globalCheck(page);
                await studyViewChartHoverHamburgerIcon(
                    page,
                    'chart-container-GENOMIC_PROFILES_SAMPLE_COUNT',
                    1000
                );
                await globalCheck(page);
                await studyViewChartHoverHamburgerIcon(
                    page,
                    'chart-container-FRACTION_GENOME_ALTERED',
                    1000
                );
                await globalCheck(page);
                await studyViewChartHoverHamburgerIcon(
                    page,
                    'chart-container-OS_SURVIVAL',
                    1000
                );
                await globalCheck(page);
            });
        });
        test.describe('clinical data tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_clinicalData').click();
                await page
                    .locator('[data-test=LazyMobXTable]')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('CN segments tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_cnSegments').click();
                await page
                    .locator('.igvContainer')
                    .waitFor({ state: 'attached', timeout: 30000 });
                await globalCheck(page);
            });
        });
        test.describe('files and links tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_filesAndLinks').click();
                await page
                    .locator('.resourcesSection')
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('study sponsors tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page
                    .locator('.tabAnchor_openResource_STUDY_SPONSORS')
                    .click();
                await page
                    .locator('h2')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
    });

    test.describe.serial('group comparison', () => {
        const expectedTabNames = [
            'Overlap',
            'Survival',
            'Clinical',
            'Genomic Alterations',
            'Mutations Beta!',
            'mRNA',
            'DNA Methylation',
            'Generic Assay Patient Test',
            'Mutational Signature',
            'Treatment Response',
        ];
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            const studyPage = await browser.newPage();
            // wdio used the 'show' setting first to allow openGroupComparison
            // to find the chart hamburger menus, then 'hide' afterwards.
            await openAndSetProperty(studyPage, CBIOPORTAL_URL, {
                skin_hide_download_controls: 'show',
            });
            page = await openGroupComparison(
                studyPage,
                `${CBIOPORTAL_URL}/study/summary?id=study_es_0`,
                'chart-container-OS_STATUS',
                30000
            );
            await openAndSetProperty(page, page.url(), {
                skin_hide_download_controls: 'hide',
            });
            await waitForTabs(page, expectedTabNames.length);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('covers all tabs with download control tests', async () => {
            const allTabs = page.locator('.tabAnchor');
            const total = await allTabs.count();
            const observedTabNames: string[] = [];
            for (let i = 0; i < total; i++) {
                const tab = allTabs.nth(i);
                if (await tab.isVisible()) {
                    observedTabNames.push(await tab.innerText());
                }
            }
            expect(
                observedTabNames,
                `There appears to be a new tab on the page (observed names: [${observedTabNames.join(
                    ', '
                )}] expected names: [${expectedTabNames.join(
                    ', '
                )}]). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include tests for this in hide-download-controls.spec.js.`
            ).toEqual(expectedTabNames);
        });
        test.describe('overlap tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page
                    .locator('[data-test=ComparisonPageOverlapTabDiv]')
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('survival tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_survival').click();
                await page
                    .locator('[data-test=ComparisonPageSurvivalTabDiv]')
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('clinical tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_clinical').click();
                await page
                    .locator('[data-test=LazyMobXTable]')
                    .first()
                    .waitFor({ state: 'attached' });
                await page
                    .locator('[data-test=ClinicalTabPlotDiv]')
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('genomic alterations tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_alterations').click();
                await page
                    .locator('[data-test=GeneBarPlotDiv]')
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('mRNA tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_mrna').click();
                await page
                    .locator('[data-test=GroupComparisonMRNAEnrichments]')
                    .waitFor({ state: 'attached' });
                await page
                    .locator(
                        '[data-test=GroupComparisonMRNAEnrichments] tbody tr b'
                    )
                    .first()
                    .click();
                await page
                    .locator('[data-test=MiniBoxPlot]')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('DNA methylation tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page.locator('.tabAnchor_dna_methylation').click();
                await page
                    .locator(
                        '[data-test=GroupComparisonMethylationEnrichments]'
                    )
                    .waitFor({ state: 'attached' });
                await page
                    .locator(
                        '[data-test=GroupComparisonMethylationEnrichments] tbody tr b'
                    )
                    .first()
                    .click();
                await page
                    .locator('[data-test=MiniBoxPlot]')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('treatment response tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page
                    .locator('.tabAnchor_generic_assay_treatment_response')
                    .click();
                await page
                    .locator('[data-test=LazyMobXTable]')
                    .first()
                    .waitFor({ state: 'attached' });
                await page
                    .locator(
                        '[data-test=GroupComparisonGenericAssayEnrichments]'
                    )
                    .waitFor({ state: 'attached' });
                await page
                    .locator(
                        '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                    )
                    .first()
                    .click();
                await page
                    .locator('[data-test=MiniBoxPlot]')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe('mutational signature tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page
                    .locator('.tabAnchor_generic_assay_mutational_signature')
                    .click();
                await page
                    .locator(
                        '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                    )
                    .first()
                    .waitFor({ state: 'attached' });
                await page.waitForTimeout(1000);
                await page
                    .locator(
                        '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                    )
                    .nth(5)
                    .click();
                await page
                    .locator('[data-test=MiniBoxPlot]')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
        test.describe.skip('generic assay patient test tab', () => {
            test('global check for icon and occurrence of "Download" as a word', async () => {
                await page
                    .locator(
                        '.tabAnchor_generic_assay_generic_assay_patient_test'
                    )
                    .click();
                await page
                    .locator(
                        '[data-test=GroupComparisonGenericAssayEnrichments]'
                    )
                    .waitFor({ state: 'attached' });
                await page
                    .locator(
                        '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                    )
                    .nth(5)
                    .click();
                await page
                    .locator('[data-test=MiniBoxPlot]')
                    .first()
                    .waitFor({ state: 'attached' });
                await globalCheck(page);
            });
        });
    });
});
