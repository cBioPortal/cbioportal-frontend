const assert = require('assert');
const expect = require('chai').expect;
const waitForOncoprint = require('./../specUtils').waitForOncoprint;
const goToUrlAndSetLocalStorage = require('./../specUtils').goToUrlAndSetLocalStorage;
const waitForNetworkQuiet = require('./../specUtils').waitForNetworkQuiet;
const assertScreenShotMatch = require('../../lib/testUtils').assertScreenShotMatch;
const toStudyViewSummaryTab = require('./../specUtils').toStudyViewSummaryTab;
const toStudyViewClinicalDataTab = require('./../specUtils').toStudyViewClinicalDataTab;
const getNumberOfStudyViewCharts = require('./../specUtils').getNumberOfStudyViewCharts;
const getTextFromElement = require('./../specUtils').getTextFromElement;
const waitForStudyViewSelectedInfo = require('./../specUtils').waitForStudyViewSelectedInfo;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");
const CUSTOM_SELECTION_BUTTON = "[data-test='custom-selection-button']";
const SELECTED_SAMPLES = "strong[data-test='selected-samples']";
const SELECTED_PATIENTS = "strong[data-test='selected-patients']";
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_CLINICAL_TAB = ".addChartTabs a.tabAnchor_Clinical";
const ADD_CHART_GENOMIC_TAB = ".addChartTabs a.tabAnchor_Genomic";
const ADD_CHART_CUSTOM_DATA_TAB = ".addChartTabs a[class='tabAnchor_Custom Data']";
const ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON = "[data-test='CustomCaseSetSubmitButton']";
const ADD_CHART_CUSTOM_GROUPS_TEXTAREA = "[data-test='CustomCaseSetInput']";
const STUDY_SUMMARY_RAW_DATA_DOWNLOAD="[data-test='studySummaryRawDataDownloadIcon']";

describe('check the filters are working properly', ()=>{
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga&filters={%22clinicalDataEqualityFilters%22:[{%22attributeId%22:%22SEX%22,%22clinicalDataType%22:%22PATIENT%22,%22values%22:[%22Female%22]}],%22clinicalDataIntervalFilters%22:[{%22attributeId%22:%22AGE%22,%22clinicalDataType%22:%22PATIENT%22,%22values%22:[{%22start%22:25,%22end%22:30},{%22start%22:30,%22end%22:35},{%22start%22:35,%22end%22:40},{%22start%22:40,%22end%22:45},{%22start%22:45,%22end%22:50},{%22start%22:50,%22end%22:55},{%22start%22:55,%22end%22:60},{%22start%22:60,%22end%22:65},{%22start%22:65,%22end%22:70},{%22start%22:70,%22end%22:75},{%22start%22:75,%22end%22:80}]}],%22mutatedGenes%22:[{%22entrezGeneIds%22:[2322,4869]}],%22cnaGenes%22:[{%22alterations%22:[{%22alteration%22:-2,%22entrezGeneId%22:60412},{%22alteration%22:2,%22entrezGeneId%22:84435}]}]}`;
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

describe('study view msk_impact_2017 study tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=msk_impact_2017`;
        goToUrlAndSetLocalStorage(url);
    });
    it('the study should show proper number of samples/patients', () => {
        waitForNetworkQuiet(20000);
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '10,336');
        assert(getTextFromElement(SELECTED_SAMPLES) === '10,945');
    });
});


describe('check the simple filter(filterAttributeId, filterValues) is working properly', ()=>{
    it('filter study from url using simple filter', ()=>{
        const url = `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=ONCOTREE_CODE&filterValues=OAST`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
        browser.moveToObject("body", 0, 0);
        const res = browser.checkElement('#mainColumn');
        assertScreenShotMatch(res);
    });
});
