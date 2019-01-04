const assert = require('assert');
const expect = require('chai').expect;
const waitForOncoprint = require('./specUtils').waitForOncoprint;
const goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
const waitForNetworkQuiet = require('./specUtils').waitForNetworkQuiet;
const assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;
const toStudyViewSummaryTab = require('./specUtils').toStudyViewSummaryTab;
const toStudyViewClinicalDataTab = require('./specUtils').toStudyViewClinicalDataTab;
const getNumberOfStudyViewCharts = require('./specUtils').getNumberOfStudyViewCharts;
const getTextFromElement = require('./specUtils').getTextFromElement;
const waitForStudyViewSelectedInfo = require('./specUtils').waitForStudyViewSelectedInfo;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");
const CUSTOM_SELECTION_BUTTON = "[data-test='custom-selection-button']";
const SELECTED_SAMPLES = "span[data-test='selected-samples']";
const SELECTED_PATIENTS = "span[data-test='selected-patients']";
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_CLINICAL_TAB = ".addChartTabs a.tabAnchor_Clinical";
const ADD_CHART_GENOMIC_TAB = ".addChartTabs a.tabAnchor_Genomic";
const ADD_CHART_CUSTOM_GROUPS_TAB = ".addChartTabs a[class='tabAnchor_Custom Groups']";
const ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON = "[data-test='CustomCaseSetSubmitButton']";
const ADD_CHART_CUSTOM_GROUPS_TEXTAREA = "[data-test='CustomCaseSetInput']";

describe('study laml_tcga tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        goToUrlAndSetLocalStorage(url);
    });
    it('study view laml_tcga', () => {
        browser.waitForVisible("[data-test='summary-tab-content']", 10000);
        waitForNetworkQuiet();
        const res = browser.checkElement('#mainColumn');
        assertScreenShotMatch(res);
    });
    it('study view laml_tcga clinical data clicked', () => {
        browser.click('.tabAnchor_clinicalData');
        browser.waitForVisible("[data-test='clinical-data-tab-content']", 10000);
        waitForNetworkQuiet();
        const res = browser.checkElement('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('with mutation data only check box should work', () => {
        toStudyViewSummaryTab();
        waitForStudyViewSelectedInfo();
        browser.click("[data-test='with-mutation-data'] input");
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '197');
        assert(getTextFromElement(SELECTED_SAMPLES) === '197');
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
        browser.click(ADD_CHART_BUTTON)
        // Wait for the data frequency is calculated
        waitForNetworkQuiet();
        // Click on three options
        browser.click("[data-test='add-chart-option-fab'] input");
        browser.click("[data-test='add-chart-option-basophils-cell-count'] input");
        browser.click("[data-test='add-chart-option-blast-count'] input");

        // Pause a bit time to let the page render the charts
        browser.pause();
        const res = browser.checkElement('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('when adding chart with categories more than the pie2Table threshold, the pie chart should be converted to table', () => {
        browser.setValue("[data-test='fixed-header-table-search-input']", 'Cytogenetic');
        browser.waitForVisible("[data-test='add-chart-option-cytogenetic-abnormality-type']", 10000);
        browser.click("[data-test='add-chart-option-cytogenetic-abnormality-type']");
        browser.waitForVisible("[data-test='chart-container-PATIENT_CYTOGENETIC_ABNORMALITY_TYPE']", 10000);
        const res = browser.checkElement("[data-test='chart-container-PATIENT_CYTOGENETIC_ABNORMALITY_TYPE']");
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
                if (!browser.isVisible(ADD_CHART_CUSTOM_GROUPS_TAB)) {
                    browser.click(ADD_CHART_BUTTON);
                }
                browser.click(ADD_CHART_CUSTOM_GROUPS_TAB);
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

                browser.waitForVisible("[data-test='chart-container-CUSTOM_FILTERS_1']");

                // it should not impact any other charts
                assert(beforeClick + 1 === getNumberOfStudyViewCharts());

                // make sure the title is reflected
                assert(getTextFromElement("[data-test='chart-container-CUSTOM_FILTERS_1'] .chartTitle") === 'Custom Chart 1');

                // make sure the chart is filtered
                const res = browser.checkElement(".userSelections");
                assertScreenShotMatch(res);
            });
            after(()=>{
                // Close the tooltip
                if (browser.isVisible(ADD_CHART_CUSTOM_GROUPS_TAB)) {
                    browser.click(ADD_CHART_BUTTON);
                }
            })
        });

        describe('add chart should not be shown in other irrelevant tabs', () => {
            it('check', () => {
                // This is one of the studies have MDACC heatmap enabled
                goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/study?id=brca_tcga_pub`);
                waitForNetworkQuiet();
                browser.click("#studyViewTabs a.tabAnchor_heatmaps");
                assert(!browser.isExisting(ADD_CHART_BUTTON));
            });
        });
    })
});

describe('crc_msk_2018 study tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=crc_msk_2018`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
    });
    it('the MSI score should use the custom bins, then the MSI score column should be added in the clinical data tab', () => {
        browser.waitForVisible(ADD_CHART_BUTTON, 10000);
        browser.click(ADD_CHART_BUTTON);

        // Wait after the frequency is calculated.
        waitForNetworkQuiet();

        const msiScoreRow = "[data-test='add-chart-option-msi-score']";
        browser.setValue("[data-test='fixed-header-table-search-input']", 'msi');
        browser.waitForVisible(msiScoreRow);

        browser.waitForVisible(msiScoreRow + ' input', 10000);
        browser.click(msiScoreRow + ' input');
        // Close the tooltip

        browser.waitForVisible(ADD_CHART_BUTTON, 10000);
        browser.click(ADD_CHART_BUTTON);

        browser.waitForVisible("[data-test='chart-container-SAMPLE_MSI_SCORE']", 10000);

        const res = browser.checkElement("[data-test='chart-container-SAMPLE_MSI_SCORE'] svg");
        assertScreenShotMatch(res);

        toStudyViewClinicalDataTab();
        browser.waitForVisible("[data-test='clinical-data-tab-content'] table", 10000);
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
            browser.waitForVisible(barChart, 10000);
            browser.moveToObject(barChart);
            browser.waitForVisible(barChart + ' .controls');
            assert(browser.isSelected(barChart + ' .chartHeader .logScaleCheckbox input'));
        });

        it('the survival icon should not be available', () => {
            browser.waitForVisible(barChart + ' .controls');
            assert(!browser.isExisting(barChart + ' .controls .survivalIcon'));
        });
    });
    describe('pie chart', () => {
        describe('chart controls',()=>{
            it('the table icon should be available', () => {
                browser.waitForVisible(pieChart, 10000);
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
                browser.waitForVisible(table, 10000);
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
                browser.waitForVisible(ADD_CHART_CLINICAL_TAB, 10000);
                browser.click(ADD_CHART_CLINICAL_TAB);

                const option = "[data-test='add-chart-option-cancer-type-detailed'] input";

                browser.setValue("[data-test='fixed-header-table-search-input']", 'cancer type detailed');
                browser.waitForVisible(option, 10000);
                if(browser.element(option).isSelected()) {
                    browser.click(option);
                }

                browser.pause();
                browser.click(option);
                // Close the tooltip
                browser.click(ADD_CHART_BUTTON);

                const res = browser.checkElement(table);
                assertScreenShotMatch(res);
            })
        })
    });
    describe('survival', ()=>{
        describe('chart controls',()=>{
            it('the survival icon should be available', () => {
                browser.moveToObject("body", 0, 0);
                // Check table
                browser.waitForVisible(table, 10000);
                browser.moveToObject(table);
                browser.waitUntil(() => {
                    return browser.isExisting(table + ' .controls');
                }, 10000);
                assert(browser.isExisting(table + ' .controls .survivalIcon'));

                // Check pie chart
                browser.waitForVisible(pieChart, 10000);
                browser.moveToObject(pieChart);
                browser.waitUntil(() => {
                    return browser.isExisting(pieChart + ' .controls');
                }, 10000);
                assert(browser.isExisting(pieChart + ' .controls .survivalIcon'));
            });

            it('the survival icon should not be available when the study does not have survival plots visible', () => {

                // we need to move to the top of the page, otherwise the offset of add chart button is calculated wrong
                browser.moveToObject("body", 0, 0);

                browser.click(ADD_CHART_BUTTON);
                browser.waitForVisible(ADD_CHART_CLINICAL_TAB, 10000);
                browser.click(ADD_CHART_CLINICAL_TAB);

                browser.setValue("[data-test='fixed-header-table-search-input']", 'survival');

                browser.waitForVisible("[data-test='add-chart-option-overall-survival']", 10000);
                browser.click("[data-test='add-chart-option-overall-survival'] input");
                browser.click("[data-test='add-chart-option-disease-free-survival'] input");
                // Close the tooltip
                browser.click(ADD_CHART_BUTTON);

                // Check table
                browser.waitForVisible(table, 10000);
                browser.moveToObject(table);
                browser.waitUntil(() => {
                    return browser.isExisting(table + ' .controls');
                }, 10000);
                assert(!browser.isExisting(table + ' .controls .survivalIcon'));

                // Check pie chart
                browser.waitForVisible(pieChart, 10000);
                browser.moveToObject(pieChart);
                browser.waitUntil(() => {
                    return browser.isExisting(pieChart + ' .controls');
                }, 10000);
                assert(!browser.isExisting(pieChart + ' .controls .survivalIcon'));
            });
        })
    });
});

describe('study view msk_impact_2017 study tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=msk_impact_2017`;
        goToUrlAndSetLocalStorage(url);
    });
    it('the study should show proper number of samples/patients', () => {
        waitForNetworkQuiet();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '10,336');
        assert(getTextFromElement(SELECTED_SAMPLES) === '10,945');
    });
});

describe('check the filters are working properly', ()=>{
    before(() => {
        const url = 'http://www.cbioportal.org/study?id=laml_tcga&filters={%22clinicalDataEqualityFilters%22:[{%22attributeId%22:%22SEX%22,%22clinicalDataType%22:%22PATIENT%22,%22values%22:[%22Female%22]}],%22clinicalDataIntervalFilters%22:[{%22attributeId%22:%22AGE%22,%22clinicalDataType%22:%22PATIENT%22,%22values%22:[{%22start%22:25,%22end%22:30},{%22start%22:30,%22end%22:35},{%22start%22:35,%22end%22:40},{%22start%22:40,%22end%22:45},{%22start%22:45,%22end%22:50},{%22start%22:50,%22end%22:55},{%22start%22:55,%22end%22:60},{%22start%22:60,%22end%22:65},{%22start%22:65,%22end%22:70},{%22start%22:70,%22end%22:75},{%22start%22:75,%22end%22:80}]}],%22mutatedGenes%22:[{%22entrezGeneIds%22:[2322,4869]}],%22cnaGenes%22:[{%22alterations%22:[{%22alteration%22:-2,%22entrezGeneId%22:60412},{%22alteration%22:2,%22entrezGeneId%22:84435}]}]}';
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
    });
    it('filter study from url', ()=>{
        const res = browser.checkElement('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('removing filters are working properly', ()=>{
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