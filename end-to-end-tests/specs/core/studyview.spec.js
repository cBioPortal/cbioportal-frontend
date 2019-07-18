const assert = require('assert');
const expect = require('chai').expect;
const waitForOncoprint = require('./../specUtils').waitForOncoprint;
const goToUrlAndSetLocalStorage = require('./../specUtils').goToUrlAndSetLocalStorage;
const waitForNetworkQuiet = require('./../specUtils').waitForNetworkQuiet;
const assertScreenShotMatch = require('../../lib/testUtils').assertScreenShotMatch;
const toStudyViewSummaryTab = require('./../specUtils').toStudyViewSummaryTab;
const toStudyViewClinicalDataTab = require('./../specUtils').toStudyViewClinicalDataTab;
const removeAllStudyViewFilters = require('./../specUtils').removeAllStudyViewFilters;
const getNumberOfStudyViewCharts = require('./../specUtils').getNumberOfStudyViewCharts;
const getTextFromElement = require('./../specUtils').getTextFromElement;
const waitForStudyViewSelectedInfo = require('./../specUtils').waitForStudyViewSelectedInfo;
const checkElementWithMouseDisabled = require('./../specUtils').checkElementWithMouseDisabled;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");
const CUSTOM_SELECTION_BUTTON = "[data-test='custom-selection-button']";
const SELECTED_SAMPLES = "strong[data-test='selected-samples']";
const SELECTED_PATIENTS = "strong[data-test='selected-patients']";
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_CLINICAL_TAB = ".addChartTabs a.tabAnchor_Clinical";
const ADD_CHART_GENOMIC_TAB = ".addChartTabs a.tabAnchor_Genomic";
const ADD_CHART_CUSTOM_DATA_TAB = ".addChartTabs a.tabAnchor_Custom_Data";
const ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON = "[data-test='CustomCaseSetSubmitButton']";
const ADD_CHART_CUSTOM_GROUPS_TEXTAREA = "[data-test='CustomCaseSetInput']";
const STUDY_SUMMARY_RAW_DATA_DOWNLOAD="[data-test='studySummaryRawDataDownloadIcon']";
const CNA_GENES_TABLE="[data-test='cna-genes-table']";
const CANCER_GENE_FILTER_ICON="[data-test='cancer-gene-filter']";

const WAIT_FOR_VISIBLE_TIMEOUT = 30000;

describe('study laml_tcga tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        goToUrlAndSetLocalStorage(url);
    });
    it('study view laml_tcga', () => {
        browser.waitForVisible("[data-test='summary-tab-content']", WAIT_FOR_VISIBLE_TIMEOUT);
        waitForNetworkQuiet();
        // screenshot seems to occasionally fail because of tooltip showing up
        // see "need-fixing" tests
        // const res = browser.checkElement('#mainColumn');
        // assertScreenShotMatch(res);
    });
    it('study view laml_tcga clinical data clicked', () => {
        browser.click('.tabAnchor_clinicalData');
        browser.waitForVisible("[data-test='clinical-data-tab-content']", WAIT_FOR_VISIBLE_TIMEOUT);
        waitForNetworkQuiet();
        const res = browser.checkElement('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('study should have the raw data available', () =>{
       assert(browser.isExisting(STUDY_SUMMARY_RAW_DATA_DOWNLOAD));
    });

    it('with mutation data only check box should work', () => {
        toStudyViewSummaryTab();
        waitForStudyViewSelectedInfo();
        browser.click("[data-test='with-mutation-data'] input");
        waitForStudyViewSelectedInfo();
        assert.equal(getTextFromElement(SELECTED_PATIENTS), '197');
        assert.equal(getTextFromElement(SELECTED_SAMPLES), '197');
        browser.waitForVisible("[data-test='clear-all-filters']");
        browser.click("[data-test='clear-all-filters']");
    });

    it('with cna data only check box should work', () => {
        waitForStudyViewSelectedInfo();
        browser.click("[data-test='with-cna-data'] input");
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '191');
        assert(getTextFromElement(SELECTED_SAMPLES) === '191');
        browser.waitForVisible("[data-test='clear-all-filters']");
        browser.click("[data-test='clear-all-filters']");
    });

    it('when quickly adding charts, each chart should get proper data.', () => {
        browser.click(ADD_CHART_BUTTON);
        // Wait for the data frequency is calculated
        waitForNetworkQuiet();
        // Click on three options
        browser.click("[data-test='add-chart-option-fab'] input");
        browser.click("[data-test='add-chart-option-basophils-cell-count'] input");
        browser.click("[data-test='add-chart-option-blast-count'] input");

        // Pause a bit time to let the page render the charts
        browser.pause();
        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('when adding chart with categories more than the pie2Table threshold, the pie chart should be converted to table', () => {
        browser.setValue("[data-test='fixed-header-table-search-input']", 'Other Sample ID');
        browser.waitForVisible("[data-test='add-chart-option-other-sample-id'] input", WAIT_FOR_VISIBLE_TIMEOUT);

        // Pause a bit time to let the table render
        browser.pause();

        browser.click("[data-test='add-chart-option-other-sample-id'] input");
        browser.waitForVisible("[data-test='chart-container-SAMPLE_OTHER_SAMPLE_ID']", WAIT_FOR_VISIBLE_TIMEOUT);
        const res = browser.checkElement("[data-test='chart-container-SAMPLE_OTHER_SAMPLE_ID']");
        assertScreenShotMatch(res);
    });

    it('custom Selection should trigger filtering the study, no chart should be added, custom selection tooltip should be closed', () => {
        browser.click(CUSTOM_SELECTION_BUTTON);

        // Select button should be disabled
        assert(!browser.isEnabled(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON));
        browser.waitForVisible(ADD_CHART_CUSTOM_GROUPS_TEXTAREA);
        browser.setValue(ADD_CHART_CUSTOM_GROUPS_TEXTAREA, 'laml_tcga:TCGA-AB-2802-03\nlaml_tcga:TCGA-AB-2803-03\n');
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
            assert(getTextFromElement(ADD_CHART_BUTTON) === '+ Add Chart');

            toStudyViewClinicalDataTab();
            assert(getTextFromElement(ADD_CHART_BUTTON) === '+ Add Column');
        });
        it('chart in genomic tab can be updated', () => {
            toStudyViewSummaryTab();
            const numOfChartsBeforeAdding = getNumberOfStudyViewCharts();
            if (!browser.isVisible(ADD_CHART_GENOMIC_TAB)) {
                browser.click(ADD_CHART_BUTTON);
            }
            browser.click(ADD_CHART_GENOMIC_TAB);

            const chosenCheckbox = browser.elements('.addChartTabs .add-chart-option input').value[0];
            const isSelected = chosenCheckbox.isSelected();

            chosenCheckbox.click();
            assert(numOfChartsBeforeAdding === (getNumberOfStudyViewCharts() + (isSelected ? 1 : -1)));
        });
        it('chart in clinical tab can be updated', () => {
            const numOfChartsBeforeAdding = getNumberOfStudyViewCharts();

            if (!browser.isVisible(ADD_CHART_CLINICAL_TAB)) {
                browser.click(ADD_CHART_BUTTON);
            }
            browser.click(ADD_CHART_CLINICAL_TAB);

            const chosenCheckbox = browser.elements('.addChartTabs .add-chart-option input').value[0];
            const isSelected = chosenCheckbox.isSelected();

            chosenCheckbox.click();
            assert(numOfChartsBeforeAdding === (getNumberOfStudyViewCharts() + (isSelected ? 1 : -1)));
        });
        describe('add custom chart', () => {
            before(()=>{
                if (!browser.isVisible(ADD_CHART_CUSTOM_DATA_TAB)) {
                    browser.waitForExist(ADD_CHART_BUTTON);
                    browser.click(ADD_CHART_BUTTON);
                }
                browser.waitForExist(ADD_CHART_CUSTOM_DATA_TAB);
                browser.click(ADD_CHART_CUSTOM_DATA_TAB);
            });
            it('add chart button should be disabled when no content in the textarea', () => {
                assert(!browser.isEnabled(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON));
            });
            it('add chart button should be disabled when content is invalid', () => {
                browser.setValue(ADD_CHART_CUSTOM_GROUPS_TEXTAREA, "test");
                // pause to wait for the content validation
                browser.pause();
                assert(!browser.isEnabled(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON));
            });
            it('add chart button should be enabled when content is valid', () => {
                browser.setValue(ADD_CHART_CUSTOM_GROUPS_TEXTAREA, "laml_tcga:TCGA-AB-2802-03");
                // pause to wait for the content validation
                browser.pause();
                assert(browser.isEnabled(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON));
            });
            it('a new chart should be added and filtered', () => {
                browser.waitForEnabled(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON);
                const beforeClick = getNumberOfStudyViewCharts();
                browser.click(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON);

                browser.waitForVisible("[data-test='chart-container-CUSTOM_FILTERS_3']");

                // it should not impact any other charts
                assert(beforeClick + 1 === getNumberOfStudyViewCharts());

                // make sure the title is reflected
                assert(getTextFromElement("[data-test='chart-container-CUSTOM_FILTERS_3'] .chartTitle") === 'Custom Chart 1');

                // make sure the chart is filtered
                const res = browser.checkElement(".userSelections");
                assertScreenShotMatch(res);
            });
            after(()=>{
                // Close the tooltip
                if (browser.isVisible(ADD_CHART_CUSTOM_DATA_TAB)) {
                    browser.click(ADD_CHART_BUTTON);
                }
            })
        });
    });
});

describe('add chart should not be shown in other irrelevant tabs', () => {
    it('check', () => {
        // This is one of the studies have MDACC heatmap enabled
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/study?id=brca_tcga_pub`);
        waitForNetworkQuiet(20000);
        browser.waitForVisible("#studyViewTabs a.tabAnchor_heatmaps", WAIT_FOR_VISIBLE_TIMEOUT);
        browser.click("#studyViewTabs a.tabAnchor_heatmaps");
        assert(!browser.isExisting(ADD_CHART_BUTTON));
    });
});

describe('check the filters are working properly', ()=>{

    before(function() {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga&filters=%7B%2522clinicalDataEqualityFilters%2522:%5B%7B%2522attributeId%2522:%2522SEX%2522,%2522clinicalDataType%2522:%2522PATIENT%2522,%2522values%2522:%5B%2522Female%2522%5D%7D%5D,%2522clinicalDataIntervalFilters%2522:%5B%7B%2522attributeId%2522:%2522AGE%2522,%2522clinicalDataType%2522:%2522PATIENT%2522,%2522values%2522:%5B%7B%2522start%2522:25,%2522end%2522:30%7D,%7B%2522start%2522:30,%2522end%2522:35%7D,%7B%2522start%2522:35,%2522end%2522:40%7D,%7B%2522start%2522:40,%2522end%2522:45%7D,%7B%2522start%2522:45,%2522end%2522:50%7D,%7B%2522start%2522:50,%2522end%2522:55%7D,%7B%2522start%2522:55,%2522end%2522:60%7D,%7B%2522start%2522:60,%2522end%2522:65%7D,%7B%2522start%2522:65,%2522end%2522:70%7D,%7B%2522start%2522:70,%2522end%2522:75%7D,%7B%2522start%2522:75,%2522end%2522:80%7D%5D%7D%5D,%2522mutatedGenes%2522:%5B%7B%2522entrezGeneIds%2522:%5B2322,4869%5D%7D%5D,%2522cnaGenes%2522:%5B%7B%2522alterations%2522:%5B%7B%2522alteration%2522:-2,%2522entrezGeneId%2522:60412%7D,%7B%2522alteration%2522:2,%2522entrezGeneId%2522:84435%7D%5D%7D%5D%7D`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet(60000);
    });
    it('filter study from url', function() {
        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('removing filters are working properly', function() {
        // Remove pie chart filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '5');
        assert(getTextFromElement(SELECTED_SAMPLES) === '5');

        // Remove bar chart filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '6');
        assert(getTextFromElement(SELECTED_SAMPLES) === '6');


        // Remove mutated genes filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '9');
        assert(getTextFromElement(SELECTED_SAMPLES) === '9');

        // Remove cna genes filter
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        browser.elements("[data-test='pill-tag-delete']").value[0].click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '200');
        assert(getTextFromElement(SELECTED_SAMPLES) === '200');
    });
});


describe('cancer gene filter', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        goToUrlAndSetLocalStorage(url);
    });

    it('the cancer gene filter should be, by default, enabled', () => {
        browser.waitForVisible(`${CNA_GENES_TABLE} [data-test='gene-column-header']`, WAIT_FOR_VISIBLE_TIMEOUT);
        assert.equal(browser.isExisting(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`), true);
        assert.equal(browser.getCssProperty(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`, 'color').parsed.hex, '#000000');
    });

    it('the cancer gene filter should remove non cancer gene', () => {
        assertScreenShotMatch(checkElementWithMouseDisabled(CNA_GENES_TABLE));
    });

    it('non cancer gene should show up when the cancer gene filter is disabled', () => {
        // disable the filter and check
        browser.click(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`);
        assert.equal(browser.getCssProperty(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`, 'color').parsed.hex, '#bebebe');
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
        browser.setValue("[data-test='fixed-header-table-search-input']", 'msi');
        browser.waitForVisible(msiScoreRow);

        browser.waitForVisible(msiScoreRow + ' input', WAIT_FOR_VISIBLE_TIMEOUT);
        browser.click(msiScoreRow + ' input');
        // Close the tooltip

        browser.waitForVisible(ADD_CHART_BUTTON, WAIT_FOR_VISIBLE_TIMEOUT);
        browser.click(ADD_CHART_BUTTON);

        browser.waitForVisible("[data-test='chart-container-SAMPLE_MSI_SCORE']", WAIT_FOR_VISIBLE_TIMEOUT);

        const res = checkElementWithMouseDisabled("[data-test='chart-container-SAMPLE_MSI_SCORE'] svg");
        assertScreenShotMatch(res);

        toStudyViewClinicalDataTab();
        browser.waitForVisible("[data-test='clinical-data-tab-content'] table", WAIT_FOR_VISIBLE_TIMEOUT);
        assert(browser.isExisting("span[data-test='MSI Score']"));
    });
});

describe('study view lgg_tcga study tests', () => {
    const pieChart = "[data-test='chart-container-PATIENT_SEX']";
    const table = "[data-test='chart-container-SAMPLE_CANCER_TYPE_DETAILED']";
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_tcga`;
        goToUrlAndSetLocalStorage(url);
        toStudyViewSummaryTab();
        waitForNetworkQuiet();
    });
    describe('bar chart', () => {
        const barChart = "[data-test='chart-container-SAMPLE_DAYS_TO_COLLECTION']";
        it('the log scale should be used for Sample Collection', () => {
            browser.waitForVisible(barChart, WAIT_FOR_VISIBLE_TIMEOUT);
            browser.moveToObject(barChart);
            browser.waitUntil(() => {
                return browser.isExisting(barChart + ' .controls');
            }, 10000);

            // move to hamburger icon
            browser.moveToObject("[data-test='chart-header-hamburger-icon']");

            // wait for the menu available
            browser.waitForVisible("[data-test='chart-header-hamburger-icon-menu']", WAIT_FOR_VISIBLE_TIMEOUT);

            assert(browser.isSelected(barChart + ' .chartHeader .logScaleCheckbox input'));
        });
    });
    describe('pie chart', () => {
        describe('chart controls',()=>{
            it('the table icon should be available', () => {
                browser.waitForVisible(pieChart, WAIT_FOR_VISIBLE_TIMEOUT);
                browser.moveToObject(pieChart);

                browser.waitUntil(() => {
                    return browser.isExisting(pieChart + ' .controls');
                }, 10000);
                assert(browser.isExisting(pieChart + ' .controls .fa-table'));
            });
        })
    });
    describe('table', () => {
        describe('chart controls',()=>{
            it('the pie icon should be available', () => {
                browser.waitForVisible(table, WAIT_FOR_VISIBLE_TIMEOUT);
                browser.moveToObject(table);

                browser.waitUntil(() => {
                    return browser.isExisting(table + ' .controls');
                }, 10000);
                assert(browser.isExisting(table + ' .controls .fa-pie-chart'));
            });

            it('table should be sorted by Freq in the default setting', ()=>{
                // we need to move to the top of the page, otherwise the offset of add chart button is calculated wrong
                browser.moveToObject("body", 0, 0);
                // Remove and add the table back to reset the table to prevent any side effects created in other tests
                browser.click(ADD_CHART_BUTTON);
                browser.waitForVisible(ADD_CHART_CLINICAL_TAB, WAIT_FOR_VISIBLE_TIMEOUT);
                browser.click(ADD_CHART_CLINICAL_TAB);

                const option = "[data-test='add-chart-option-cancer-type-detailed'] input";

                browser.setValue("[data-test='fixed-header-table-search-input']", 'cancer type detailed');
                browser.waitForVisible(option, WAIT_FOR_VISIBLE_TIMEOUT);
                if(browser.element(option).isSelected()) {
                    browser.click(option);
                }

                browser.pause();
                browser.click(option);
                // Close the tooltip
                browser.click(ADD_CHART_BUTTON);

                const res = checkElementWithMouseDisabled(table);
                assertScreenShotMatch(res);
            })
        })
    });
});

describe('multi studies', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=acc_tcga,lgg_tcga`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
    });


    it('multi studies view should not have the raw data available', () =>{
        assert(!browser.isExisting(STUDY_SUMMARY_RAW_DATA_DOWNLOAD));
    });
});

describe('check the simple filter(filterAttributeId, filterValues) is working properly', ()=>{
    it('A error message should be shown when the filterAttributeId is not available for the study', ()=>{
        const url = `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=ONCOTREE_CODE_TEST&filterValues=OAST`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
        browser.moveToObject("body", 0, 0);

        const res = checkElementWithMouseDisabled("[data-test='study-view-header']");
        assertScreenShotMatch(res);
    });
});
