const assert = require('assert');
const expect = require('chai').expect;
const waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
const goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
const waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
const assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
const toStudyViewSummaryTab = require('../../../shared/specUtils')
    .toStudyViewSummaryTab;
const toStudyViewClinicalDataTab = require('../../../shared/specUtils')
    .toStudyViewClinicalDataTab;
const removeAllStudyViewFilters = require('../../../shared/specUtils')
    .removeAllStudyViewFilters;
const getNumberOfStudyViewCharts = require('../../../shared/specUtils')
    .getNumberOfStudyViewCharts;
const getTextFromElement = require('../../../shared/specUtils')
    .getTextFromElement;
const waitForStudyViewSelectedInfo = require('../../../shared/specUtils')
    .waitForStudyViewSelectedInfo;

var {
    checkElementWithMouseDisabled,
    setInputText,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const CUSTOM_SELECTION_BUTTON = "[data-test='custom-selection-button']";
const SELECTED_SAMPLES = "strong[data-test='selected-samples']";
const SELECTED_PATIENTS = "strong[data-test='selected-patients']";
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_CLINICAL_TAB = '.addChartTabs a.tabAnchor_Clinical';
const ADD_CHART_GENOMIC_TAB = '.addChartTabs a.tabAnchor_Genomic';
const ADD_CHART_CUSTOM_DATA_TAB = '.addChartTabs a.tabAnchor_Custom_Data';
const ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON =
    "[data-test='CustomCaseSetSubmitButton']";
const ADD_CHART_CUSTOM_GROUPS_TEXTAREA = "[data-test='CustomCaseSetInput']";
const STUDY_SUMMARY_RAW_DATA_DOWNLOAD =
    "[data-test='studySummaryRawDataDownloadIcon']";
const CNA_GENES_TABLE = "[data-test='copy number alterations-table']";
const CANCER_GENE_FILTER_ICON = "[data-test='cancer-gene-filter']";

const WAIT_FOR_VISIBLE_TIMEOUT = 30000;

const hide = ['.chartHeader .controls'];

describe('study laml_tcga tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        goToUrlAndSetLocalStorage(url);
    });
    it('study view laml_tcga', () => {
        browser.waitForVisible(
            "[data-test='summary-tab-content']",
            WAIT_FOR_VISIBLE_TIMEOUT
        );
        waitForNetworkQuiet();
        // screenshot seems to occasionally fail because of tooltip showing up
        // see "need-fixing" tests
        // const res = browser.checkElement('#mainColumn');
        // assertScreenShotMatch(res);
    });
    it('study view laml_tcga clinical data clicked', () => {
        browser.click('.tabAnchor_clinicalData');
        browser.waitForVisible(
            "[data-test='clinical-data-tab-content']",
            WAIT_FOR_VISIBLE_TIMEOUT
        );
        waitForNetworkQuiet();
        const res = browser.checkElement('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('study should have the raw data available', () => {
        assert(browser.isExisting(STUDY_SUMMARY_RAW_DATA_DOWNLOAD));
    });

    it('when quickly adding charts, each chart should get proper data.', () => {
        toStudyViewSummaryTab();
        waitForStudyViewSelectedInfo();
        browser.click(ADD_CHART_BUTTON);
        // Wait for the data frequency is calculated
        waitForNetworkQuiet();
        // Click on three options
        browser.click("[data-test='add-chart-option-fab'] input");
        browser.click(
            "[data-test='add-chart-option-basophils-cell-count'] input"
        );
        browser.click("[data-test='add-chart-option-blast-count'] input");

        // Pause a bit time to let the page render the charts
        browser.pause();
        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('when adding chart with categories more than the pie2Table threshold, the pie chart should be converted to table', () => {
        browser.setValue(
            "[data-test='fixed-header-table-search-input']",
            'Other Sample ID'
        );
        browser.waitForVisible(
            "[data-test='add-chart-option-other-sample-id'] input",
            WAIT_FOR_VISIBLE_TIMEOUT
        );

        // Pause a bit time to let the table render
        browser.pause();

        browser.click("[data-test='add-chart-option-other-sample-id'] input");
        browser.waitForVisible(
            "[data-test='chart-container-OTHER_SAMPLE_ID']",
            WAIT_FOR_VISIBLE_TIMEOUT
        );
        const res = browser.checkElement(
            "[data-test='chart-container-OTHER_SAMPLE_ID']"
        );
        assertScreenShotMatch(res);
    });

    it('custom Selection should trigger filtering the study, no chart should be added, custom selection tooltip should be closed', () => {
        browser.click(CUSTOM_SELECTION_BUTTON);

        // Select button should be disabled
        assert(!browser.isEnabled(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON));
        browser.waitForVisible(ADD_CHART_CUSTOM_GROUPS_TEXTAREA);
        browser.setValue(
            ADD_CHART_CUSTOM_GROUPS_TEXTAREA,
            'laml_tcga:TCGA-AB-2802-03\nlaml_tcga:TCGA-AB-2803-03\n'
        );
        browser.waitForEnabled(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON);
        browser.click(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON);

        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '2');
        assert(getTextFromElement(SELECTED_SAMPLES) === '2');

        // clear the filters
        browser.waitForVisible("[data-test='clear-all-filters']");
        browser.click("[data-test='clear-all-filters']");
    });

    describe('add chart', () => {
        it('the button text should be updated in different tab', () => {
            toStudyViewSummaryTab();
            assert(getTextFromElement(ADD_CHART_BUTTON) === 'Charts ▾');

            toStudyViewClinicalDataTab();
            assert(getTextFromElement(ADD_CHART_BUTTON) === 'Columns ▾');
        });
        it('chart in genomic tab can be updated', () => {
            toStudyViewSummaryTab();
            const numOfChartsBeforeAdding = getNumberOfStudyViewCharts();
            if (!browser.isVisible(ADD_CHART_GENOMIC_TAB)) {
                browser.click(ADD_CHART_BUTTON);
            }
            browser.click(ADD_CHART_GENOMIC_TAB);

            const chosenCheckbox =
                '.addChartTabs .addGenomicChartTab .add-chart-option:nth-child(1) input';
            browser.waitForExist(chosenCheckbox, 10000);

            const isSelected = browser.isSelected(chosenCheckbox);

            browser.click(chosenCheckbox);
            assert(
                numOfChartsBeforeAdding ===
                    getNumberOfStudyViewCharts() + (isSelected ? 1 : -1)
            );
        });
        it('chart in clinical tab can be updated', () => {
            const numOfChartsBeforeAdding = getNumberOfStudyViewCharts();

            if (!browser.isVisible(ADD_CHART_CLINICAL_TAB)) {
                browser.click(ADD_CHART_BUTTON);
            }
            browser.click(ADD_CHART_CLINICAL_TAB);

            const chosenCheckbox = browser.elements(
                '.addChartTabs .add-chart-option input'
            ).value[0];
            const isSelected = chosenCheckbox.isSelected();

            chosenCheckbox.click();
            assert(
                numOfChartsBeforeAdding ===
                    getNumberOfStudyViewCharts() + (isSelected ? 1 : -1)
            );
        });
        describe('add custom chart', () => {
            before(() => {
                if (!browser.isVisible(ADD_CHART_CUSTOM_DATA_TAB)) {
                    browser.waitForExist(ADD_CHART_BUTTON);
                    browser.click(ADD_CHART_BUTTON);
                }
                browser.waitForExist(ADD_CHART_CUSTOM_DATA_TAB);
                browser.click(ADD_CHART_CUSTOM_DATA_TAB);
            });
            it('add chart button should be disabled when no content in the textarea', () => {
                assert(
                    !browser.isEnabled(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
                );
            });
            it('add chart button should be disabled when content is invalid', () => {
                browser.setValue(ADD_CHART_CUSTOM_GROUPS_TEXTAREA, 'test');
                // pause to wait for the content validation
                browser.pause();
                assert(
                    !browser.isEnabled(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
                );
            });
            it('add chart button should be enabled when content is valid', () => {
                browser.setValue(
                    ADD_CHART_CUSTOM_GROUPS_TEXTAREA,
                    'laml_tcga:TCGA-AB-2802-03'
                );
                // pause to wait for the content validation
                browser.pause();
                assert(
                    browser.isEnabled(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
                );
            });
            it('a new chart should be added and filtered', () => {
                browser.waitForEnabled(
                    ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON
                );
                const beforeClick = getNumberOfStudyViewCharts();
                browser.click(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON);

                browser.waitForVisible(
                    "[data-test='chart-container-CUSTOM_FILTERS_3']"
                );

                // it should not impact any other charts
                assert(beforeClick + 1 === getNumberOfStudyViewCharts());

                // make sure the title is reflected
                assert(
                    getTextFromElement(
                        "[data-test='chart-container-CUSTOM_FILTERS_3'] .chartTitle"
                    ) === 'Custom Chart 1'
                );

                // make sure the chart is filtered
                const res = browser.checkElement('.userSelections');
                assertScreenShotMatch(res);
            });
            after(() => {
                // Close the tooltip
                if (browser.isVisible(ADD_CHART_CUSTOM_DATA_TAB)) {
                    browser.click(ADD_CHART_BUTTON);
                }
            });
        });
    });
});

describe('add chart should not be shown in other irrelevant tabs', () => {
    it('check', () => {
        // This is one of the studies have MDACC heatmap enabled
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/study?id=brca_tcga_pub`);
        waitForNetworkQuiet(30000);
        browser.waitForVisible(
            '#studyViewTabs a.tabAnchor_heatmaps',
            WAIT_FOR_VISIBLE_TIMEOUT
        );
        browser.click('#studyViewTabs a.tabAnchor_heatmaps');
        assert(!browser.isExisting(ADD_CHART_BUTTON));
    });
});

describe('check the filters are working properly', () => {
    before(function() {
        const url = `${CBIOPORTAL_URL}/study/summary?id=laml_tcga#filterJson=%7B%22genomicDataFilters%22%3A%5B%7B%22hugoGeneSymbol%22%3A%22NPM1%22%2C%22profileType%22%3A%22rna_seq_v2_mrna_median_Zscores%22%2C%22values%22%3A%5B%7B%22start%22%3A0%2C%22end%22%3A0.25%7D%2C%7B%22start%22%3A0.25%2C%22end%22%3A0.5%7D%2C%7B%22start%22%3A0.5%2C%22end%22%3A0.75%7D%5D%7D%5D%2C%22clinicalDataFilters%22%3A%5B%7B%22attributeId%22%3A%22SEX%22%2C%22values%22%3A%5B%7B%22value%22%3A%22Female%22%7D%5D%7D%2C%7B%22attributeId%22%3A%22AGE%22%2C%22values%22%3A%5B%7B%22end%22%3A35%2C%22start%22%3A30%7D%2C%7B%22end%22%3A40%2C%22start%22%3A35%7D%2C%7B%22end%22%3A45%2C%22start%22%3A40%7D%2C%7B%22end%22%3A50%2C%22start%22%3A45%7D%2C%7B%22end%22%3A55%2C%22start%22%3A50%7D%2C%7B%22end%22%3A60%2C%22start%22%3A55%7D%2C%7B%22end%22%3A65%2C%22start%22%3A60%7D%5D%7D%5D%2C%22geneFilters%22%3A%5B%7B%22molecularProfileIds%22%3A%5B%22laml_tcga_mutations%22%5D%2C%22geneQueries%22%3A%5B%5B%22NPM1%22%2C%22FLT3%22%5D%5D%7D%2C%7B%22molecularProfileIds%22%3A%5B%22laml_tcga_gistic%22%5D%2C%22geneQueries%22%3A%5B%5B%22FUS%3AHOMDEL%22%2C%22KMT2A%3AAMP%22%5D%5D%7D%5D%2C%22genomicProfiles%22%3A%5B%5B%22gistic%22%5D%2C%5B%22mutations%22%5D%5D%7D`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet(60000);
    });
    it('filter study from url', function() {
        waitForNetworkQuiet(60000);
        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('removing filters are working properly', function() {
        // Remove pie chart filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '1');
        assert(getTextFromElement(SELECTED_SAMPLES) === '1');

        // Remove bar chart filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '1');
        assert(getTextFromElement(SELECTED_SAMPLES) === '1');

        // Remove gene specific chart filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '5');
        assert(getTextFromElement(SELECTED_SAMPLES) === '5');

        // Remove mutated genes filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '13');
        assert(getTextFromElement(SELECTED_SAMPLES) === '13');

        // Remove cna genes filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '188');
        assert(getTextFromElement(SELECTED_SAMPLES) === '188');

        // Remove genomic profiles sample count filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '200');
        assert(getTextFromElement(SELECTED_SAMPLES) === '200');
    });
});

// This needs to be done separately due to leak of data in the other tests
describe('check the fusion filter is working properly', () => {
    before(function() {
        const url = `${CBIOPORTAL_URL}/study/summary?id=es_dfarber_broad_2014&filters=%7B%22geneFilters%22%3A%5B%7B%22molecularProfileIds%22%3A%5B%22es_dfarber_broad_2014_fusion%22%5D%2C%22geneQueries%22%3A%5B%5B%22FLI1%22%5D%5D%7D%5D%7D`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet(60000);
    });
    it('fusion filter filter study from url', function() {
        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('fusion filter removing filters are working properly', function() {
        // Remove cna genes filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '103');
        assert(getTextFromElement(SELECTED_SAMPLES) === '107');
    });
});

describe('cancer gene filter', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        goToUrlAndSetLocalStorage(url);
    });

    it('the cancer gene filter should be, by default, enabled', () => {
        browser.waitForVisible(
            `${CNA_GENES_TABLE} [data-test='gene-column-header']`,
            WAIT_FOR_VISIBLE_TIMEOUT
        );
        assert.equal(
            browser.isExisting(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`),
            true
        );
        assert.equal(
            browser.getCssProperty(
                `${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`,
                'color'
            ).parsed.hex,
            '#000000'
        );
    });

    it('the cancer gene filter should remove non cancer gene', () => {
        assertScreenShotMatch(checkElementWithMouseDisabled(CNA_GENES_TABLE));
    });

    it('non cancer gene should show up when the cancer gene filter is disabled', () => {
        // disable the filter and check
        browser.click(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`);
        assert.equal(
            browser.getCssProperty(
                `${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`,
                'color'
            ).parsed.hex,
            '#bebebe'
        );
        assertScreenShotMatch(checkElementWithMouseDisabled(CNA_GENES_TABLE));
    });
});

describe('crc_msk_2017 study tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=crc_msk_2017`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
    });
    it('the MSI score should use the custom bins, then the MSI score column should be added in the clinical data tab', () => {
        browser.waitForVisible(ADD_CHART_BUTTON, WAIT_FOR_VISIBLE_TIMEOUT);
        browser.click(ADD_CHART_BUTTON);

        // Wait after the frequency is calculated.
        waitForNetworkQuiet();

        const msiScoreRow = "[data-test='add-chart-option-msi-score']";
        browser.setValue(
            "[data-test='fixed-header-table-search-input']",
            'msi'
        );
        browser.waitForVisible(msiScoreRow);

        browser.waitForVisible(
            msiScoreRow + ' input',
            WAIT_FOR_VISIBLE_TIMEOUT
        );
        browser.click(msiScoreRow + ' input');
        // Close the tooltip

        browser.waitForVisible(ADD_CHART_BUTTON, WAIT_FOR_VISIBLE_TIMEOUT);
        browser.click(ADD_CHART_BUTTON);

        browser.waitForExist(
            "[data-test='chart-container-MSI_SCORE'] svg",
            WAIT_FOR_VISIBLE_TIMEOUT
        );

        const res = checkElementWithMouseDisabled(
            "[data-test='chart-container-MSI_SCORE'] svg"
        );
        assertScreenShotMatch(res);

        toStudyViewClinicalDataTab();
        browser.waitForVisible(
            "[data-test='clinical-data-tab-content'] table",
            WAIT_FOR_VISIBLE_TIMEOUT
        );
        assert(browser.isExisting("span[data-test='MSI Score']"));
    });
});

describe('study view lgg_tcga study tests', () => {
    const pieChart = "[data-test='chart-container-SEX']";
    const table = "[data-test='chart-container-CANCER_TYPE_DETAILED']";
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_tcga`;
        goToUrlAndSetLocalStorage(url);
        toStudyViewSummaryTab();
        waitForNetworkQuiet();
    });
    describe('bar chart', () => {
        const barChart = "[data-test='chart-container-DAYS_TO_COLLECTION']";
        it('the log scale should be used for Sample Collection', () => {
            browser.waitForVisible(barChart, WAIT_FOR_VISIBLE_TIMEOUT);
            browser.moveToObject(barChart);
            browser.waitUntil(() => {
                return browser.isExisting(barChart + ' .controls');
            }, 10000);

            // move to hamburger icon
            browser.moveToObject("[data-test='chart-header-hamburger-icon']");

            // wait for the menu available
            browser.waitForVisible(
                "[data-test='chart-header-hamburger-icon-menu']",
                WAIT_FOR_VISIBLE_TIMEOUT
            );

            assert(
                browser.isSelected(
                    barChart + ' .chartHeader .logScaleCheckbox input'
                )
            );
        });
    });
    describe('pie chart', () => {
        describe('chart controls', () => {
            it('the table icon should be available', () => {
                browser.waitForVisible(pieChart, WAIT_FOR_VISIBLE_TIMEOUT);
                browser.moveToObject(pieChart);

                browser.waitUntil(() => {
                    return browser.isExisting(pieChart + ' .controls');
                }, 10000);
                assert(browser.isExisting(pieChart + ' .controls .fa-table'));
            });
        });
    });
    describe('table', () => {
        describe('chart controls', () => {
            it('the pie icon should be available', () => {
                browser.waitForVisible(table, WAIT_FOR_VISIBLE_TIMEOUT);
                browser.moveToObject(table);

                browser.waitUntil(() => {
                    return browser.isExisting(table + ' .controls');
                }, 10000);
                assert(browser.isExisting(table + ' .controls .fa-pie-chart'));
            });

            it('table should be sorted by Freq in the default setting', () => {
                // we need to move to the top of the page, otherwise the offset of add chart button is calculated wrong
                browser.moveToObject('body', 0, 0);
                // Remove and add the table back to reset the table to prevent any side effects created in other tests
                browser.click(ADD_CHART_BUTTON);
                browser.waitForVisible(
                    ADD_CHART_CLINICAL_TAB,
                    WAIT_FOR_VISIBLE_TIMEOUT
                );
                browser.click(ADD_CHART_CLINICAL_TAB);

                const option =
                    "[data-test='add-chart-option-cancer-type-detailed'] input";

                browser.setValue(
                    "[data-test='fixed-header-table-search-input']",
                    'cancer type detailed'
                );
                browser.waitForVisible(option, WAIT_FOR_VISIBLE_TIMEOUT);
                if (browser.element(option).isSelected()) {
                    browser.click(option);
                }

                browser.pause();
                browser.click(option);
                // Close the tooltip
                browser.click(ADD_CHART_BUTTON);

                const res = checkElementWithMouseDisabled(table);
                assertScreenShotMatch(res);
            });
        });
    });
});

describe('virtual study', () => {
    it('loads a virtual study', () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=5dd408f0e4b0f7d2de7862a8`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
        browser.pause(1000);
        assertScreenShotMatch(checkElementWithMouseDisabled('#mainColumn'));
    });
});

describe('multi studies', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=acc_tcga,lgg_tcga`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
    });

    it('check for survival plots', () => {
        assertScreenShotMatch(checkElementWithMouseDisabled('#mainColumn'));
    });

    it('multi studies view should not have the raw data available', () => {
        assert(!browser.isExisting(STUDY_SUMMARY_RAW_DATA_DOWNLOAD));
    });
});

describe('check the simple filter(filterAttributeId, filterValues) is working properly', () => {
    it('A error message should be shown when the filterAttributeId is not available for the study', () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=ONCOTREE_CODE_TEST&filterValues=OAST`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
        browser.moveToObject('body', 0, 0);

        const res = checkElementWithMouseDisabled(
            "[data-test='study-view-header']"
        );
        assertScreenShotMatch(res);
    });
    it('Check if case insensitivity in filter works', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=SEX&filterValues=MALE`
        );
        waitForNetworkQuiet();
        waitForStudyViewSelectedInfo();
        const sampleCount1 = getTextFromElement(SELECTED_PATIENTS);

        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=SEX&filterValues=Male`
        );
        waitForNetworkQuiet();
        waitForStudyViewSelectedInfo();
        const sampleCount2 = getTextFromElement(SELECTED_PATIENTS);
        assert(sampleCount1 === sampleCount2);
    });
});

describe('the gene panel is loaded properly', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=msk_impact_2017`;
        goToUrlAndSetLocalStorage(url);
    });
    it('check the mutated genes table has gene panel info', () => {
        const tooltipSelector = '[data-test="freq-cell-tooltip"]';
        browser.waitForVisible(
            `${CNA_GENES_TABLE} [data-test='freq-cell']`,
            WAIT_FOR_VISIBLE_TIMEOUT
        );

        browser.moveToObject(
            `${CNA_GENES_TABLE} [data-test='freq-cell']:first-child`
        );

        browser.waitForVisible(tooltipSelector, WAIT_FOR_VISIBLE_TIMEOUT);

        // the gene panel ID IMPACT341 should be listed
        browser.getText(tooltipSelector).includes('IMPACT341');

        browser.click(
            `${tooltipSelector} a[data-test='gene-panel-linkout-IMPACT341']`
        );

        // the modal title should show gene panel ID
        browser.waitForVisible(
            `[data-test="gene-panel-modal-title"]`,
            WAIT_FOR_VISIBLE_TIMEOUT
        );
        assert.equal(
            browser.getText(`[data-test="gene-panel-modal-title"]`),
            'IMPACT341'
        );

        // test whether the gene info has been loaded correctly
        browser.waitForVisible(
            `[data-test="gene-panel-modal-body"]`,
            WAIT_FOR_VISIBLE_TIMEOUT
        );
        assert.equal(
            browser.getText(
                '[data-test="gene-panel-modal-body"] p:first-child'
            ),
            'ABL1'
        );
    });
});

describe('submit genes to results view query', () => {
    it('gives a submit error if protein oql is inputted and no protein profile is available for the study', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study/summary?id=brca_mskcc_2019`
        );
        browser.waitForExist('[data-test="geneSet"]', 5000);
        setInputText('[data-test="geneSet"]', 'PTEN: PROT>0');

        // error appears
        browser.waitUntil(() => {
            return (
                browser.isExisting('[data-test="oqlErrorMessage"]') &&
                browser.getText('[data-test="oqlErrorMessage"]') ===
                    'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
            );
        }, 20000);

        // submit is disabled
        browser.waitUntil(() => {
            return !browser.isEnabled('button[data-test="geneSetSubmit"]');
        }, 5000);
    });
    it('auto-selects an mrna profile when mrna oql is entered', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study/summary?id=acc_tcga_pan_can_atlas_2018`
        );
        const studyViewTabId = browser.getTabIds()[0];

        // enter oql
        browser.waitForExist('textarea[data-test="geneSet"]', 10000);
        setInputText('textarea[data-test="geneSet"]', 'PTEN: EXP>1');

        browser.waitForEnabled('button[data-test="geneSetSubmit"]', 10000);
        browser.click('button[data-test="geneSetSubmit"]');

        // switch tabs to results view
        const resultsViewTabId = browser
            .getTabIds()
            .find(x => x !== studyViewTabId);
        browser.switchTab(resultsViewTabId);

        // wait for query to load
        waitForOncoprint(20000);

        // only mrna profile is there
        const query = browser.execute(function() {
            return urlWrapper.query;
        }).value;
        assert.equal(
            query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
            undefined
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
            undefined
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
            'acc_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median_Zscores'
        );
    });
});
