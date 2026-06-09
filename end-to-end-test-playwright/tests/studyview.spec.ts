import { test, expect, Page, Locator } from '../fixtures';
import {
    byTestHandle,
    expectElementScreenshot,
    setCheckboxChecked,
    setDropdownOpen,
    setInputText,
    waitForNetworkQuiet,
    waitForStudyView,
} from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/studyview.spec.js.
 *
 * Exercises the /study view across many studies:
 *  - laml_tcga summary/clinical tabs, add-chart flows, custom selection
 *  - charts not shown on irrelevant tabs (brca_tcga_pub)
 *  - URL-driven filters (laml_tcga) and fusion filter (es_dfarber_broad_2014)
 *  - cancer gene filter toggle (laml_tcga CNA table)
 *  - crc_msk_2017 custom bin MSI score chart
 *  - lgg_tcga bar chart log scale, pie chart controls, table sorting
 *  - TCGA pancancer atlas load, virtual study load, multi-study layout
 *  - gene panel tooltip/modal, submit-to-results-view OQL flows
 *  - treatments tables (gbm_columbia_2019 + lgg_ucsf_2014)
 *  - msk_impact_2017 mutations-table and custom data chart validation
 */

const CUSTOM_SELECTION_BUTTON = '[data-test="custom-selection-button"]';
const SELECTED_SAMPLES = 'strong[data-test="selected-samples"]';
const SELECTED_PATIENTS = 'strong[data-test="selected-patients"]';
const ADD_CHART_BUTTON = '[data-test="add-charts-button"]';
const ADD_CHART_CLINICAL_TAB = '.addChartTabs a.tabAnchor_Clinical';
const ADD_CHART_GENOMIC_TAB = '.addChartTabs a.tabAnchor_Genomic';
const ADD_CHART_CUSTOM_DATA_TAB = '.addChartTabs a.tabAnchor_Custom_Data';
const ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON =
    '[data-test="CustomCaseSetSubmitButton"]';
const ADD_CHART_CUSTOM_GROUPS_TEXTAREA = '[data-test="CustomCaseSetInput"]';
const STUDY_SUMMARY_RAW_DATA_DOWNLOAD =
    '[data-test="studySummaryRawDataDownloadIcon"]';
const CNA_GENES_TABLE = '[data-test="copy number alterations-table"]';
const CANCER_GENE_FILTER_ICON = '[data-test="header-filter-icon"]';

const WAIT_FOR_VISIBLE_TIMEOUT = 30000;

async function toStudyViewSummaryTab(page: Page) {
    const summaryTab = '#studyViewTabs a.tabAnchor_summary';
    const summaryContent = '[data-test="summary-tab-content"]';
    await page
        .locator(summaryTab)
        .waitFor({ state: 'visible', timeout: 10000 });
    await page.locator(summaryTab).click();
    await page
        .locator(summaryContent)
        .waitFor({ state: 'visible', timeout: 10000 });
}

async function toStudyViewClinicalDataTab(page: Page) {
    const clinicalDataTab = '#studyViewTabs a.tabAnchor_clinicalData';
    const clinicalDataContent = '[data-test="clinical-data-tab-content"]';
    await page
        .locator(clinicalDataTab)
        .waitFor({ state: 'visible', timeout: 10000 });
    await page.locator(clinicalDataTab).click();
    await page
        .locator(clinicalDataContent)
        .waitFor({ state: 'visible', timeout: 10000 });
}

async function waitForStudyViewSelectedInfo(page: Page) {
    await page
        .locator('[data-test="selected-info"]')
        .waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForTimeout(2000);
}

async function getNumberOfStudyViewCharts(page: Page): Promise<number> {
    return page.locator('div.react-grid-item').count();
}

async function getTextFromElement(locator: Locator): Promise<string> {
    return (await locator.innerText()).trim();
}

async function jsApiHover(page: Page, selector: string) {
    await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (el)
            el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }, selector);
}

function rgbToHex(color: string): string {
    const m = color.match(/\d+/g);
    if (!m) return color;
    const [r, g, b] = m.map(Number);
    return (
        '#' +
        [r, g, b]
            .map(v => v.toString(16).padStart(2, '0'))
            .join('')
            .toLowerCase()
    );
}

async function getColorOfNthElement(
    page: Page,
    selector: string,
    index: number,
    property = 'color'
): Promise<string> {
    const rgb = await page.evaluate(
        ({ sel, idx, prop }) => {
            const els = document.querySelectorAll(sel);
            const el = els[idx] as HTMLElement;
            return el ? getComputedStyle(el)[prop as any] : '';
        },
        { sel: selector, idx: index, prop: property }
    );
    return rgbToHex(rgb as string);
}

test.describe('studyview tests', () => {
    // Each nested describe owns its own page — either via beforeAll
    // creating a browser.newPage and afterAll closing it, or via the
    // per-test `page` fixture in beforeEach. No state crosses block
    // boundaries, so the top-level describe is safe to run in parallel
    // mode: --workers=N inside a shard then runs N of the nested
    // describes concurrently. Each describe.serial block remains serial
    // internally (Playwright honors the per-block mode).
    test.describe.configure({ mode: 'parallel' });

    test.describe.serial('study laml_tcga tests', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;
        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            // The study-summary "raw data download" icon's visibility
            // is gated on a fetch of study_list.json from
            // datahub.assets.cbioportal.org. From CI's network path
            // that fetch sometimes never lands; when it doesn't, the
            // hasRawDataForDownload remoteData call falls back to
            // false and the icon stays hidden — so the test fails
            // even after waiting 30s. Stub the manifest at the page
            // level with a known-good payload that includes
            // laml_tcga, matching the JSON-array shape the real
            // endpoint returns. Other tests in this block aren't
            // affected because none of them assert on the icon.
            await page.route('**/study_list.json', route =>
                route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        'laml_tcga',
                        'laml_tcga_pan_can_atlas_2018',
                    ]),
                })
            );
            await page.goto('/study?id=laml_tcga');
        });
        test.afterAll(async () => {
            await page.close();
        });

        test('study view laml_tcga', async () => {
            await byTestHandle(page, 'summary-tab-content').waitFor({
                state: 'visible',
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });
            await waitForNetworkQuiet(page);
            // original wdio spec had the screenshot assertion commented out
            // because of tooltip flakiness, so the port preserves DOM-only.
        });

        test('study view laml_tcga clinical data clicked', async () => {
            await page.locator('.tabAnchor_clinicalData').click();
            await byTestHandle(page, 'clinical-data-tab-content').waitFor({
                state: 'visible',
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });
            await waitForNetworkQuiet(page);
            await expectElementScreenshot(
                page,
                '#mainColumn',
                'laml_tcga-clinical-data-tab.png'
            );
        });

        test('study should have the raw data available', async () => {
            await toStudyViewSummaryTab(page);
            // The download icon's visibility is gated on the
            // StudyViewPageStore.hasRawDataForDownload remoteData
            // request, which fetches a separate study-list manifest
            // via getStudyDownloadListUrl(). That request goes through
            // `request(...)` (superagent), which is not tracked by
            // window.ajaxQuiet — so waitForNetworkQuiet can return
            // green while the manifest is still in flight, and the
            // icon stays hidden. Belt and suspenders:
            //   1) waitForNetworkQuiet for the main summary fetches.
            //   2) WAIT_FOR_VISIBLE_TIMEOUT on toHaveCount to absorb
            //      the trailing manifest request landing late on
            //      cold-cache CI.
            await waitForNetworkQuiet(page);
            await expect(
                page.locator(STUDY_SUMMARY_RAW_DATA_DOWNLOAD)
            ).toHaveCount(1, { timeout: WAIT_FOR_VISIBLE_TIMEOUT });
        });

        test('when quickly adding charts, each chart should get proper data.', async () => {
            await toStudyViewSummaryTab(page);
            await waitForStudyViewSelectedInfo(page);
            await page.locator(ADD_CHART_BUTTON).click();
            await waitForNetworkQuiet(page);

            await page
                .locator('[data-test="add-chart-option-cancer-type"] input')
                .click();
            await page
                .locator('[data-test="add-chart-option-case-lists"] input')
                .click();

            await waitForStudyView(page);
            await expectElementScreenshot(
                page,
                '#mainColumn',
                'laml_tcga-adding-charts.png'
            );
        });

        test('when adding chart with categories more than the pie2Table threshold, the pie chart should be converted to table', async () => {
            await setInputText(
                page,
                '[data-test="fixed-header-table-search-input"]',
                'Other Sample ID'
            );
            await page.waitForTimeout(2000);
            await page
                .locator('[data-test="add-chart-option-other-sample-id"] input')
                .waitFor({
                    state: 'visible',
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
            await page
                .locator('[data-test="add-chart-option-other-sample-id"] label')
                .click();
            await page.waitForTimeout(2000);
            await page
                .locator(
                    '[data-test="chart-container-OTHER_SAMPLE_ID"] .ReactVirtualized__Table'
                )
                .waitFor({
                    state: 'visible',
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
            await expectElementScreenshot(
                page,
                '[data-test="chart-container-OTHER_SAMPLE_ID"]',
                'laml_tcga-other-sample-id-table.png'
            );
        });

        test('custom Selection should trigger filtering the study, no chart should be added, custom selection tooltip should be closed', async () => {
            await page.locator(CUSTOM_SELECTION_BUTTON).click();
            await page.waitForTimeout(2000);

            await expect(
                page.locator(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
            ).toBeDisabled();
            await page
                .locator(ADD_CHART_CUSTOM_GROUPS_TEXTAREA)
                .waitFor({ state: 'visible' });
            await setInputText(
                page,
                ADD_CHART_CUSTOM_GROUPS_TEXTAREA,
                'laml_tcga:TCGA-AB-2802-03\nlaml_tcga:TCGA-AB-2803-03\n'
            );
            await expect(
                page.locator(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
            ).toBeEnabled();
            await page
                .locator(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
                .click();

            await waitForStudyViewSelectedInfo(page);
            expect(
                await getTextFromElement(page.locator(SELECTED_PATIENTS))
            ).toBe('2');
            expect(
                await getTextFromElement(page.locator(SELECTED_SAMPLES))
            ).toBe('2');

            await byTestHandle(page, 'clear-all-filters').waitFor({
                state: 'visible',
            });
            await page.locator('[data-test="clear-all-filters"]').click();
        });

        test.describe.serial('add chart', () => {
            test.describe.configure({ retries: 0 });
            test('the button text should be updated in different tab', async () => {
                await toStudyViewSummaryTab(page);
                expect(
                    await getTextFromElement(page.locator(ADD_CHART_BUTTON))
                ).toBe('Charts ▾');

                await toStudyViewClinicalDataTab(page);
                expect(
                    await getTextFromElement(page.locator(ADD_CHART_BUTTON))
                ).toBe('Columns ▾');
            });

            test('chart in genomic tab can be updated', async () => {
                await toStudyViewSummaryTab(page);
                const numOfChartsBeforeAdding = await getNumberOfStudyViewCharts(
                    page
                );
                await setDropdownOpen(
                    page,
                    true,
                    ADD_CHART_BUTTON,
                    ADD_CHART_GENOMIC_TAB
                );
                await page.locator(ADD_CHART_GENOMIC_TAB).click();
                await page.waitForTimeout(2000);

                const chosenCheckbox =
                    '.addChartTabs .addGenomicChartTab .add-chart-option:nth-child(1) input';
                const cb = page.locator(chosenCheckbox).first();
                await cb.waitFor({ state: 'attached', timeout: 10000 });
                const isSelected = await cb.isChecked();
                await cb.click();

                const numAfter = await getNumberOfStudyViewCharts(page);
                expect(numOfChartsBeforeAdding).toBe(
                    numAfter + (isSelected ? 1 : -1)
                );
            });

            test('chart in clinical tab can be updated', async () => {
                const numOfChartsBeforeAdding = await getNumberOfStudyViewCharts(
                    page
                );

                if (!(await page.locator(ADD_CHART_CLINICAL_TAB).isVisible())) {
                    await page.locator(ADD_CHART_BUTTON).click();
                }
                await page.locator(ADD_CHART_CLINICAL_TAB).click();

                const chosenCheckbox = page.locator(
                    '.addChartTabs .add-chart-option input'
                );
                const isSelected = await chosenCheckbox.first().isChecked();

                await chosenCheckbox.first().click();
                const numAfter = await getNumberOfStudyViewCharts(page);
                expect(numOfChartsBeforeAdding).toBe(
                    numAfter + (isSelected ? 1 : -1)
                );
            });

            test.describe.serial('add custom data', () => {
                test.describe.configure({ retries: 0 });
                test.beforeAll(async () => {
                    if (
                        !(await page
                            .locator(ADD_CHART_CUSTOM_DATA_TAB)
                            .isVisible())
                    ) {
                        await page
                            .locator(ADD_CHART_BUTTON)
                            .waitFor({ state: 'attached' });
                        await page.locator(ADD_CHART_BUTTON).click();
                    }
                    await page
                        .locator(ADD_CHART_CUSTOM_DATA_TAB)
                        .waitFor({ state: 'attached' });
                    await page.locator(ADD_CHART_CUSTOM_DATA_TAB).click();
                });

                test('add chart button should be disabled when no content in the textarea', async () => {
                    await expect(
                        page.locator(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
                    ).toBeDisabled();
                });

                test('add chart button should be disabled when content is invalid', async () => {
                    await setInputText(
                        page,
                        ADD_CHART_CUSTOM_GROUPS_TEXTAREA,
                        'test'
                    );
                    await page
                        .locator('[data-test=ValidationResultWarning]')
                        .waitFor({ state: 'visible' });
                    await expect(
                        page.locator(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
                    ).toBeDisabled();
                });

                test('add chart button should be enabled when content is valid', async () => {
                    await setInputText(
                        page,
                        ADD_CHART_CUSTOM_GROUPS_TEXTAREA,
                        'laml_tcga:TCGA-AB-2802-03'
                    );
                    await page
                        .locator('[data-test=ValidationResultWarning]')
                        .waitFor({ state: 'hidden' });
                    await expect(
                        page.locator(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
                    ).toBeEnabled();
                });

                test('a new chart should be added and filtered', async () => {
                    await expect(
                        page.locator(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
                    ).toBeEnabled();
                    const beforeClick = await getNumberOfStudyViewCharts(page);
                    await page
                        .locator(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
                        .click();

                    await page
                        .locator('.chartTitle', { hasText: 'Custom Data 1' })
                        .first()
                        .waitFor({ state: 'visible' });

                    expect(beforeClick + 1).toBe(
                        await getNumberOfStudyViewCharts(page)
                    );

                    await expect(
                        page
                            .locator('.userSelections')
                            .locator('span', { hasText: 'Custom Data 1' })
                            .first()
                    ).toBeAttached();
                });

                test.afterAll(async () => {
                    if (
                        await page
                            .locator(ADD_CHART_CUSTOM_DATA_TAB)
                            .isVisible()
                    ) {
                        await page.locator(ADD_CHART_BUTTON).click();
                    }
                });
            });
        });
    });

    test.describe(
        'add chart should not be shown in other irrelevant tabs',
        () => {
            test('check add chart button doesnt exist on heatmap', async ({
                page,
            }) => {
                await page.goto('/study?id=brca_tcga_pub');
                await waitForNetworkQuiet(page, 30000);

                await page
                    .locator('#studyViewTabs a.tabAnchor_clinicalData')
                    .waitFor({
                        state: 'visible',
                        timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                    });

                await expect(
                    page.locator('button', { hasText: 'Charts ▾' })
                ).toHaveCount(1);

                await page
                    .locator('#studyViewTabs a.tabAnchor_clinicalData')
                    .click();
                await expect(
                    page.locator('button', { hasText: 'Charts ▾' })
                ).toHaveCount(0);
            });
        }
    );

    test.describe.serial('check the filters are working properly', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;
        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            const url = `/study/summary?id=laml_tcga#filterJson=%7B%22genomicDataFilters%22%3A%5B%7B%22hugoGeneSymbol%22%3A%22NPM1%22%2C%22profileType%22%3A%22rna_seq_v2_mrna_median_Zscores%22%2C%22values%22%3A%5B%7B%22start%22%3A0%2C%22end%22%3A0.25%7D%2C%7B%22start%22%3A0.25%2C%22end%22%3A0.5%7D%2C%7B%22start%22%3A0.5%2C%22end%22%3A0.75%7D%5D%7D%5D%2C%22clinicalDataFilters%22%3A%5B%7B%22attributeId%22%3A%22SEX%22%2C%22values%22%3A%5B%7B%22value%22%3A%22Female%22%7D%5D%7D%2C%7B%22attributeId%22%3A%22AGE%22%2C%22values%22%3A%5B%7B%22end%22%3A35%2C%22start%22%3A30%7D%2C%7B%22end%22%3A40%2C%22start%22%3A35%7D%2C%7B%22end%22%3A45%2C%22start%22%3A40%7D%2C%7B%22end%22%3A50%2C%22start%22%3A45%7D%2C%7B%22end%22%3A55%2C%22start%22%3A50%7D%2C%7B%22end%22%3A60%2C%22start%22%3A55%7D%2C%7B%22end%22%3A65%2C%22start%22%3A60%7D%5D%7D%5D%2C%22geneFilters%22%3A%5B%7B%22molecularProfileIds%22%3A%5B%22laml_tcga_mutations%22%5D%2C%22geneQueries%22%3A%5B%5B%22NPM1%22%2C%22FLT3%22%5D%5D%7D%2C%7B%22molecularProfileIds%22%3A%5B%22laml_tcga_gistic%22%5D%2C%22geneQueries%22%3A%5B%5B%22FUS%3AHOMDEL%22%2C%22KMT2A%3AAMP%22%5D%5D%7D%5D%2C%22genomicProfiles%22%3A%5B%5B%22gistic%22%5D%2C%5B%22mutations%22%5D%5D%7D`;
            await page.goto(url);
            await waitForNetworkQuiet(page, 60000);
        });
        test.afterAll(async () => {
            await page.close();
        });

        test('filter study from url', async () => {
            await waitForNetworkQuiet(page, 60000);
            await expectElementScreenshot(
                page,
                '#mainColumn',
                'laml_tcga-url-filter.png'
            );
        });

        test('removing filters are working properly', async () => {
            await page
                .locator('[data-test="pill-tag-delete"]')
                .first()
                .click();
            await waitForStudyViewSelectedInfo(page);
            expect(
                await getTextFromElement(page.locator(SELECTED_PATIENTS))
            ).toBe('1');
            expect(
                await getTextFromElement(page.locator(SELECTED_SAMPLES))
            ).toBe('1');

            await page
                .locator('[data-test="pill-tag-delete"]')
                .first()
                .click();
            await waitForStudyViewSelectedInfo(page);
            expect(
                await getTextFromElement(page.locator(SELECTED_PATIENTS))
            ).toBe('1');
            expect(
                await getTextFromElement(page.locator(SELECTED_SAMPLES))
            ).toBe('1');

            await page
                .locator('[data-test="pill-tag-delete"]')
                .first()
                .click();
            await waitForStudyViewSelectedInfo(page);
            expect(
                await getTextFromElement(page.locator(SELECTED_PATIENTS))
            ).toBe('5');
            expect(
                await getTextFromElement(page.locator(SELECTED_SAMPLES))
            ).toBe('5');

            await page
                .locator('[data-test="pill-tag-delete"]')
                .first()
                .click();
            await waitForStudyViewSelectedInfo(page);
            await page
                .locator('[data-test="pill-tag-delete"]')
                .first()
                .click();
            await waitForStudyViewSelectedInfo(page);
            expect(
                await getTextFromElement(page.locator(SELECTED_PATIENTS))
            ).toBe('13');
            expect(
                await getTextFromElement(page.locator(SELECTED_SAMPLES))
            ).toBe('13');

            await page
                .locator('[data-test="pill-tag-delete"]')
                .first()
                .click();
            await waitForStudyViewSelectedInfo(page);
            await page
                .locator('[data-test="pill-tag-delete"]')
                .first()
                .click();
            await waitForStudyViewSelectedInfo(page);
            expect(
                await getTextFromElement(page.locator(SELECTED_PATIENTS))
            ).toBe('188');
            expect(
                await getTextFromElement(page.locator(SELECTED_SAMPLES))
            ).toBe('188');

            await page
                .locator('[data-test="pill-tag-delete"]')
                .first()
                .click();
            await waitForStudyViewSelectedInfo(page);
            await page
                .locator('[data-test="pill-tag-delete"]')
                .first()
                .click();
            await waitForStudyViewSelectedInfo(page);
            expect(
                await getTextFromElement(page.locator(SELECTED_PATIENTS))
            ).toBe('200');
            expect(
                await getTextFromElement(page.locator(SELECTED_SAMPLES))
            ).toBe('200');
        });
    });

    test.describe.serial('check the fusion filter is working properly', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;
        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            const url = `/study/summary?id=es_dfarber_broad_2014&filters=%7B%22geneFilters%22%3A%5B%7B%22molecularProfileIds%22%3A%5B%22es_dfarber_broad_2014_structural_variants%22%5D%2C%22geneQueries%22%3A%5B%5B%22FLI1%22%5D%5D%7D%5D%7D`;
            await page.goto(url);
            await waitForNetworkQuiet(page, 60000);
        });
        test.afterAll(async () => {
            await page.close();
        });

        test('fusion filter filter study from url', async () => {
            await page.waitForTimeout(2000);
            await waitForStudyViewSelectedInfo(page);
            await expectElementScreenshot(
                page,
                '#mainColumn',
                'fusion-filter-url.png'
            );
        });

        test('fusion filter removing filters are working properly', async () => {
            await page
                .locator('[data-test="pill-tag-delete"]')
                .first()
                .click();
            await waitForStudyViewSelectedInfo(page);
            expect(
                await getTextFromElement(page.locator(SELECTED_PATIENTS))
            ).toBe('103');
            expect(
                await getTextFromElement(page.locator(SELECTED_SAMPLES))
            ).toBe('107');
        });
    });

    test.describe('cancer gene filter', () => {
        test.use({ viewport: { width: 1600, height: 1000 } });

        test.beforeEach(async ({ page }) => {
            await page.goto('/study?id=laml_tcga');
            await page
                .locator(`${CNA_GENES_TABLE} [data-test="gene-column-header"]`)
                .waitFor({
                    state: 'visible',
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
        });

        test('the cancer gene filter should be, by default, disabled', async ({
            page,
        }) => {
            await expect(
                page.locator(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`)
            ).toHaveCount(1);
            expect(
                await getColorOfNthElement(
                    page,
                    `${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`,
                    0
                )
            ).toBe('#bebebe');
        });

        test('non cancer gene should show up when the cancer gene filter is disabled', async ({
            page,
        }) => {
            await expectElementScreenshot(
                page,
                CNA_GENES_TABLE,
                'cancer-gene-filter-off.png'
            );
        });

        test('the cancer gene filter should remove non cancer gene', async ({
            page,
        }) => {
            await page
                .locator(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`)
                .click();
            expect(
                await getColorOfNthElement(
                    page,
                    `${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`,
                    0
                )
            ).toBe('#000000');
            await expectElementScreenshot(
                page,
                CNA_GENES_TABLE,
                'cancer-gene-filter-on.png'
            );
        });
    });

    test.describe.serial('crc_msk_2017 study tests', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;
        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto('/study?id=crc_msk_2017');
            await waitForNetworkQuiet(page);
        });
        test.afterAll(async () => {
            await page.close();
        });

        test('the MSI score should use the custom bins, then the MSI score column should be added in the clinical data tab', async () => {
            await page.locator(ADD_CHART_BUTTON).waitFor({
                state: 'visible',
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });
            await expect(async () => {
                const cls =
                    (await page
                        .locator(ADD_CHART_BUTTON)
                        .getAttribute('class')) || '';
                expect(cls).not.toContain('disabled');
            }).toPass({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });
            await setDropdownOpen(
                page,
                true,
                ADD_CHART_BUTTON,
                '[data-test="fixed-header-table-search-input"]'
            );
            await waitForNetworkQuiet(page);

            const msiScoreRow = '[data-test="add-chart-option-msi-score"]';
            await setInputText(
                page,
                '[data-test="fixed-header-table-search-input"]',
                'msi'
            );
            await page.locator(msiScoreRow).waitFor({ state: 'visible' });
            await page.locator(`${msiScoreRow} input`).waitFor({
                state: 'visible',
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });
            await page.locator(`${msiScoreRow} input`).click();

            await page.locator(ADD_CHART_BUTTON).waitFor({
                state: 'visible',
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });
            await page.locator(ADD_CHART_BUTTON).click();

            await page
                .locator('[data-test="chart-container-MSI_SCORE"] svg')
                .first()
                .waitFor({
                    state: 'attached',
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
            await expectElementScreenshot(
                page,
                '[data-test="chart-container-MSI_SCORE"] svg >> nth=0',
                'crc-msk-2017-msi-score.png'
            );

            await toStudyViewClinicalDataTab(page);
            await page
                .locator('[data-test="clinical-data-tab-content"] table')
                .waitFor({
                    state: 'visible',
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
            await expect(
                page.locator('span[data-test="MSI Score"]')
            ).toHaveCount(1);
        });
    });

    test.describe('study view lgg_tcga study tests', () => {
        const pieChart = '[data-test="chart-container-SEX"]';
        const table = '[data-test="chart-container-CANCER_TYPE_DETAILED"]';
        test.use({ viewport: { width: 1600, height: 1000 } });

        test.beforeEach(async ({ page }) => {
            await page.goto('/study?id=lgg_tcga');
            await toStudyViewSummaryTab(page);
            await waitForNetworkQuiet(page);
        });

        test.describe('bar chart', () => {
            const barChart = '[data-test="chart-container-DAYS_TO_COLLECTION"]';
            test('the log scale should be used for Sample Collection', async ({
                page,
            }) => {
                await page.locator(barChart).waitFor({
                    state: 'visible',
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
                await page.locator(barChart).scrollIntoViewIfNeeded();
                await jsApiHover(page, barChart);
                await page
                    .locator(`${barChart} .controls`)
                    .waitFor({ state: 'attached', timeout: 10000 });
                await jsApiHover(
                    page,
                    '[data-test="chart-header-hamburger-icon"]'
                );
                await page
                    .locator('[data-test="chart-header-hamburger-icon-menu"]')
                    .first()
                    .waitFor({
                        state: 'visible',
                        timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                    });
                await expect(
                    page.locator(
                        `${barChart} .chartHeader .logScaleCheckbox input`
                    )
                ).toBeChecked();
            });
        });

        test.describe('pie chart', () => {
            test.describe('chart controls', () => {
                test('the table icon should be available', async ({ page }) => {
                    await page.locator(pieChart).waitFor({
                        state: 'visible',
                        timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                    });
                    await jsApiHover(page, pieChart);

                    await expect(
                        page.locator(`${pieChart} .controls`)
                    ).toHaveCount(1, { timeout: 10000 });
                    await expect(
                        page.locator(`${pieChart} .controls .fa-table`)
                    ).toHaveCount(1);
                });
            });
        });

        test.describe('table', () => {
            test.describe('chart controls', () => {
                test('the pie icon should be available', async ({ page }) => {
                    await page.locator(table).waitFor({
                        state: 'visible',
                        timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                    });
                    await jsApiHover(page, table);

                    await expect(
                        page.locator(`${table} .controls`)
                    ).toHaveCount(1, { timeout: 10000 });
                    await expect(
                        page.locator(`${table} .controls .fa-pie-chart`)
                    ).toHaveCount(1);
                });

                test('table should be sorted by Freq in the default setting', async ({
                    page,
                }) => {
                    await setDropdownOpen(
                        page,
                        true,
                        ADD_CHART_BUTTON,
                        ADD_CHART_CLINICAL_TAB
                    );
                    await page.locator(ADD_CHART_CLINICAL_TAB).click();

                    const option =
                        '[data-test="add-chart-option-cancer-type-detailed"] input';

                    await setInputText(
                        page,
                        '[data-test="fixed-header-table-search-input"]',
                        'cancer type detailed'
                    );
                    await page.locator(option).waitFor({
                        state: 'visible',
                        timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                    });
                    await setCheckboxChecked(page, false, option);
                    await page.waitForTimeout(2000);
                    await setDropdownOpen(
                        page,
                        true,
                        ADD_CHART_BUTTON,
                        ADD_CHART_CLINICAL_TAB
                    );
                    await page.locator(option).waitFor({
                        state: 'visible',
                        timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                    });
                    await setCheckboxChecked(page, true, option);

                    await setDropdownOpen(
                        page,
                        false,
                        ADD_CHART_BUTTON,
                        ADD_CHART_CLINICAL_TAB
                    );

                    await expectElementScreenshot(
                        page,
                        table,
                        'lgg-tcga-cancer-type-detailed-table.png'
                    );
                });
            });
        });
    });

    test.describe('study view tcga pancancer atlas tests', () => {
        test('tcga pancancer atlas page', async ({ page }) => {
            const url = `/study?id=laml_tcga_pan_can_atlas_2018%2Cacc_tcga_pan_can_atlas_2018%2Cblca_tcga_pan_can_atlas_2018%2Clgg_tcga_pan_can_atlas_2018%2Cbrca_tcga_pan_can_atlas_2018%2Ccesc_tcga_pan_can_atlas_2018%2Cchol_tcga_pan_can_atlas_2018%2Ccoadread_tcga_pan_can_atlas_2018%2Cdlbc_tcga_pan_can_atlas_2018%2Cesca_tcga_pan_can_atlas_2018%2Cgbm_tcga_pan_can_atlas_2018%2Chnsc_tcga_pan_can_atlas_2018%2Ckich_tcga_pan_can_atlas_2018%2Ckirc_tcga_pan_can_atlas_2018%2Ckirp_tcga_pan_can_atlas_2018%2Clihc_tcga_pan_can_atlas_2018%2Cluad_tcga_pan_can_atlas_2018%2Clusc_tcga_pan_can_atlas_2018%2Cmeso_tcga_pan_can_atlas_2018%2Cov_tcga_pan_can_atlas_2018%2Cpaad_tcga_pan_can_atlas_2018%2Cpcpg_tcga_pan_can_atlas_2018%2Cprad_tcga_pan_can_atlas_2018%2Csarc_tcga_pan_can_atlas_2018%2Cskcm_tcga_pan_can_atlas_2018%2Cstad_tcga_pan_can_atlas_2018%2Ctgct_tcga_pan_can_atlas_2018%2Cthym_tcga_pan_can_atlas_2018%2Cthca_tcga_pan_can_atlas_2018%2Cucs_tcga_pan_can_atlas_2018%2Cucec_tcga_pan_can_atlas_2018%2Cuvm_tcga_pan_can_atlas_2018`;
            await page.goto(url);
            await toStudyViewSummaryTab(page);
            await waitForNetworkQuiet(page, 30000);
            await expectElementScreenshot(
                page,
                '#mainColumn',
                'tcga-pancancer-atlas.png'
            );
        });
    });

    test.describe('virtual study', () => {
        test('loads a virtual study', async ({ page }) => {
            await page.goto('/study/summary?id=5dd408f0e4b0f7d2de7862a8');
            await waitForStudyView(page);
            await expectElementScreenshot(
                page,
                '#mainColumn',
                'virtual-study.png'
            );
        });
    });

    test.describe('multi studies', () => {
        test.use({ viewport: { width: 1600, height: 1000 } });

        test.beforeEach(async ({ page }) => {
            await page.goto('/study?id=acc_tcga,lgg_tcga');
            await waitForNetworkQuiet(page);
        });

        test('check for survival plots', async ({ page }) => {
            await expectElementScreenshot(
                page,
                '#mainColumn',
                'multi-studies-survival.png'
            );
        });

        test('multi studies view should not have the raw data available', async ({
            page,
        }) => {
            await expect(
                page.locator(STUDY_SUMMARY_RAW_DATA_DOWNLOAD)
            ).toHaveCount(0);
        });
    });

    test.describe(
        'check the simple filter(filterAttributeId, filterValues) is working properly',
        () => {
            test('A error message should be shown when the filterAttributeId is not available for the study', async ({
                page,
            }) => {
                await page.goto(
                    '/study?id=lgg_tcga&filterAttributeId=ONCOTREE_CODE_TEST&filterValues=OAST'
                );
                await waitForNetworkQuiet(page);
                await expectElementScreenshot(
                    page,
                    '[data-test="study-view-header"]',
                    'simple-filter-error.png'
                );
            });

            test('Check if case insensitivity in filter works', async ({
                page,
            }) => {
                await page.goto(
                    '/study?id=lgg_tcga&filterAttributeId=SEX&filterValues=MALE'
                );
                await waitForNetworkQuiet(page);
                await waitForStudyViewSelectedInfo(page);
                const sampleCount1 = await getTextFromElement(
                    page.locator(SELECTED_PATIENTS)
                );

                await page.goto(
                    '/study?id=lgg_tcga&filterAttributeId=SEX&filterValues=Male'
                );
                await waitForNetworkQuiet(page);
                await waitForStudyViewSelectedInfo(page);
                const sampleCount2 = await getTextFromElement(
                    page.locator(SELECTED_PATIENTS)
                );
                expect(sampleCount1).toBe(sampleCount2);
            });
        }
    );

    test.describe.serial('the gene panel is loaded properly', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;
        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto('/study?id=msk_impact_2017');
        });
        test.afterAll(async () => {
            await page.close();
        });

        test('check the mutated genes table has gene panel info', async () => {
            const tooltipSelector = '[data-test="freq-cell-tooltip"]';
            await page
                .locator(`${CNA_GENES_TABLE} [data-test="freq-cell"]`)
                .first()
                .waitFor({
                    state: 'visible',
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
            const el = page
                .locator(`${CNA_GENES_TABLE} [data-test="freq-cell"]`)
                .first();
            await el.scrollIntoViewIfNeeded();
            await el.hover();
            await page.locator(tooltipSelector).waitFor({
                state: 'visible',
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });

            const tooltipText = await getTextFromElement(
                page.locator(tooltipSelector)
            );
            expect(tooltipText.includes('IMPACT341')).toBeTruthy();

            await page
                .locator(
                    `${tooltipSelector} a[data-test="gene-panel-linkout-IMPACT341"]`
                )
                .click();

            await page.waitForTimeout(2000);

            await expect(async () => {
                const title = await getTextFromElement(
                    page.locator('[data-test="gene-panel-modal-title"]')
                );
                expect(title).toBe('IMPACT341');
            }).toPass({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });

            await page.locator('[data-test="gene-panel-modal-body"]').waitFor({
                state: 'visible',
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });
            expect(
                await getTextFromElement(
                    page.locator(
                        '[data-test="gene-panel-modal-body"] p:first-child'
                    )
                )
            ).toBe('ABL1');
        });
    });

    test.describe('submit genes to results view query', () => {
        test('gives a submit error if protein oql is inputted and no protein profile is available for the study', async ({
            page,
        }) => {
            await page.goto('/study/summary?id=brca_mskcc_2019');
            await page.waitForTimeout(2000);
            await page
                .locator('[data-test="geneSet"]')
                .waitFor({ state: 'attached', timeout: 5000 });
            await setInputText(page, '[data-test="geneSet"]', 'PTEN: PROT>0');

            await expect(async () => {
                const errEl = page.locator('[data-test="oqlErrorMessage"]');
                await expect(errEl).toBeVisible();
                expect(await getTextFromElement(errEl)).toBe(
                    'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
                );
            }).toPass({ timeout: 20000 });

            await expect(
                page.locator('button[data-test="geneSetSubmit"]')
            ).toBeDisabled({ timeout: 5000 });
        });

        test('auto-selects an mrna profile when mrna oql is entered', async ({
            page,
            context,
        }) => {
            await page.goto('/study/summary?id=acc_tcga_pan_can_atlas_2018');

            await page.locator('textarea[data-test="geneSet"]').waitFor({
                state: 'attached',
                timeout: 10000,
            });
            await setInputText(
                page,
                'textarea[data-test="geneSet"]',
                'PTEN: EXP>1'
            );

            await expect(
                page.locator('button[data-test="geneSetSubmit"]')
            ).toBeEnabled({ timeout: 10000 });

            const pagePromise = context.waitForEvent('page');
            await page.locator('button[data-test="geneSetSubmit"]').click();
            const resultsPage = await pagePromise;
            await resultsPage.waitForLoadState('domcontentloaded');

            await resultsPage.waitForTimeout(2000);
            await resultsPage
                .locator('#oncoprintDiv')
                .waitFor({ state: 'visible', timeout: 60000 });
            await waitForNetworkQuiet(resultsPage);

            const profileFilter = await resultsPage.evaluate(() => {
                const query = (window as any).urlWrapper?.query ?? {};
                return query.profileFilter ?? '';
            });
            expect(profileFilter.includes('mutations')).toBe(false);
            expect(profileFilter.includes('gistic')).toBe(false);
            expect(
                profileFilter.includes('rna_seq_v2_mrna_median_Zscores')
            ).toBe(true);
        });
    });

    test.describe('study view treatments table', () => {
        test('loads multiple studies with treatments tables', async ({
            page,
        }) => {
            await page.goto(
                '/study/summary?id=gbm_columbia_2019%2Clgg_ucsf_2014'
            );
            await waitForNetworkQuiet(page);
            await byTestHandle(page, 'PATIENT_TREATMENTS-table').waitFor({
                state: 'attached',
            });
            await byTestHandle(page, 'SAMPLE_TREATMENTS-table').waitFor({
                state: 'attached',
            });
            await expectElementScreenshot(
                page,
                '#mainColumn',
                'treatments-tables-multi-study.png'
            );
        });

        test('can filter a study by sample treatments', async ({ page }) => {
            const sampleTreatmentsFirstCheckbox =
                '[data-test="SAMPLE_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(1) input';
            const sampleTreatmentsSelectSamplesButton =
                '[data-test="SAMPLE_TREATMENTS-table"] button';
            await page.goto('/study/summary?id=lgg_ucsf_2014');

            await page
                .locator(sampleTreatmentsFirstCheckbox)
                .waitFor({ state: 'attached' });
            await page.locator(sampleTreatmentsFirstCheckbox).click();
            await page
                .locator(sampleTreatmentsSelectSamplesButton)
                .waitFor({ state: 'attached' });
            await page.locator(sampleTreatmentsSelectSamplesButton).click();
            await waitForNetworkQuiet(page);

            await expectElementScreenshot(
                page,
                '#mainColumn',
                'sample-treatments-filter.png'
            );
        });

        test('compare button appears when selecting multiple rows in sample treatments', async ({
            page,
        }) => {
            const sampleTreatmentsFirstCheckbox =
                '[data-test="SAMPLE_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(1) input';
            const sampleTreatmentsSecondCheckbox =
                '[data-test="SAMPLE_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(2) input';
            const sampleTreatmentsCompareButton =
                '[data-test="table-compare-btn"]';
            await page.goto('/study/summary?id=lgg_ucsf_2014');

            await page
                .locator(sampleTreatmentsFirstCheckbox)
                .waitFor({ state: 'attached' });
            await page.locator(sampleTreatmentsFirstCheckbox).click();
            await page
                .locator(sampleTreatmentsSecondCheckbox)
                .waitFor({ state: 'attached' });
            await page.locator(sampleTreatmentsSecondCheckbox).click();
            await expect(
                page.locator(sampleTreatmentsCompareButton)
            ).toHaveCount(1);
        });

        test('can filter a study by patient treatments', async ({ page }) => {
            await page.goto('/study/summary?id=lgg_ucsf_2014');

            const patientTreatmentsFirstCheckbox =
                '[data-test="PATIENT_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(1) input';
            const patientTreatmentsSelectSamplesButton =
                '[data-test="PATIENT_TREATMENTS-table"] button';

            await page
                .locator(patientTreatmentsFirstCheckbox)
                .waitFor({ state: 'attached' });
            await page.locator(patientTreatmentsFirstCheckbox).click();
            await page
                .locator(patientTreatmentsSelectSamplesButton)
                .waitFor({ state: 'attached' });
            await page.locator(patientTreatmentsSelectSamplesButton).click();
            await waitForNetworkQuiet(page);

            await expectElementScreenshot(
                page,
                '#mainColumn',
                'patient-treatments-filter.png'
            );
        });

        test('compare button appears when selecting multiple rows in patient treatments', async ({
            page,
        }) => {
            await page.goto('/study/summary?id=lgg_ucsf_2014');

            const patientTreatmentsFirstCheckbox =
                '[data-test="PATIENT_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(1) input';
            const patientTreatmentsSecondCheckbox =
                '[data-test="PATIENT_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(2) input';
            const patientTreatmentsCompareButton =
                '[data-test="table-compare-btn"]';

            await page
                .locator(patientTreatmentsFirstCheckbox)
                .waitFor({ state: 'attached' });
            await page.locator(patientTreatmentsFirstCheckbox).click();
            await page
                .locator(patientTreatmentsSecondCheckbox)
                .waitFor({ state: 'attached' });
            await page.locator(patientTreatmentsSecondCheckbox).click();
            await expect(
                page.locator(patientTreatmentsCompareButton)
            ).toHaveCount(1);
        });
    });

    test.describe('study view mutations table', () => {
        test('shows mutation frequencies correctly for called but unprofiled mutations', async ({
            page,
        }) => {
            await page.goto('/study/summary?id=msk_impact_2017');
            await expectElementScreenshot(
                page,
                '[data-test="chart-container-msk_impact_2017_mutations"]',
                'msk-impact-2017-mutations.png'
            );
        });
    });

    test.describe('custom data chart addition', () => {
        const customSamples = `msk_impact_2017:P-0007153-T01-IM5 1
msk_impact_2017:P-0008475-T01-IM5 1
msk_impact_2017:P-0009925-T01-IM5 2
msk_impact_2017:P-0010568-T01-IM5 2
msk_impact_2017:P-0010590-T01-IM5 2`;

        test('properly handles parsing of custom data list - distinct from custom sample list', async ({
            page,
        }) => {
            await page.goto('/study/summary?id=msk_impact_2017');

            await page
                .locator('[data-test=add-charts-button]')
                .waitFor({ state: 'visible', timeout: 10000 });
            await page.locator('[data-test=add-charts-button]').click();

            await page
                .locator('.tabAnchor_Custom_Data')
                .waitFor({ state: 'visible', timeout: 10000 });
            await page.locator('.tabAnchor_Custom_Data').click();

            await setInputText(page, '.custom textarea', customSamples);

            await expect(
                page.locator('[data-test=ValidationResultWarning]')
            ).toHaveCount(0);

            await setInputText(
                page,
                '.custom textarea',
                customSamples.replace('P-0008475-T01-IM5', 'P-XXXXX-T01-IM5')
            );

            await page.waitForTimeout(500);

            await expect(
                page.locator('[data-test=ValidationResultWarning]')
            ).toHaveCount(1);
        });
    });
});
