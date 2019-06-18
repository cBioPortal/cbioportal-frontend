const assert = require('assert');
const expect = require('chai').expect;
const waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
const goToUrlAndSetLocalStorage = require('../../../shared/specUtils').goToUrlAndSetLocalStorage;
const waitForNetworkQuiet = require('../../../shared/specUtils').waitForNetworkQuiet;
const assertScreenShotMatch = require('../../../shared/lib/testUtils').assertScreenShotMatch;
const toStudyViewSummaryTab = require('../../../shared/specUtils').toStudyViewSummaryTab;
const toStudyViewClinicalDataTab = require('../../../shared/specUtils').toStudyViewClinicalDataTab;
const getNumberOfStudyViewCharts = require('../../../shared/specUtils').getNumberOfStudyViewCharts;
const getTextFromElement = require('../../../shared/specUtils').getTextFromElement;
const waitForStudyViewSelectedInfo = require('../../../shared/specUtils').waitForStudyViewSelectedInfo;

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

const RETRIES = 5;

describe('study laml_tcga tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        goToUrlAndSetLocalStorage(url);
    });
    it('study view laml_tcga', function() {
        // allow retrying to fix flaky test, we should fix the test properly before
        // moving out of "need fixing" category
        this.retries(RETRIES);

        browser.waitForVisible("[data-test='summary-tab-content']", 10000);
        waitForNetworkQuiet();
        // screenshot seems to occasionally fail because of tooltip showing up
        const res = browser.checkElement('#mainColumn');
        assertScreenShotMatch(res);
    });
});

describe.only('check the filters are working properly', ()=>{

    before(function() {
        // allow retrying to fix flaky tests, we should fix the test properly before
        // moving out of "need fixing" category
        this.retries(RETRIES);

        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga&filters=%7B%2522clinicalDataEqualityFilters%2522:%5B%7B%2522attributeId%2522:%2522SEX%2522,%2522clinicalDataType%2522:%2522PATIENT%2522,%2522values%2522:%5B%2522Female%2522%5D%7D%5D,%2522clinicalDataIntervalFilters%2522:%5B%7B%2522attributeId%2522:%2522AGE%2522,%2522clinicalDataType%2522:%2522PATIENT%2522,%2522values%2522:%5B%7B%2522start%2522:25,%2522end%2522:30%7D,%7B%2522start%2522:30,%2522end%2522:35%7D,%7B%2522start%2522:35,%2522end%2522:40%7D,%7B%2522start%2522:40,%2522end%2522:45%7D,%7B%2522start%2522:45,%2522end%2522:50%7D,%7B%2522start%2522:50,%2522end%2522:55%7D,%7B%2522start%2522:55,%2522end%2522:60%7D,%7B%2522start%2522:60,%2522end%2522:65%7D,%7B%2522start%2522:65,%2522end%2522:70%7D,%7B%2522start%2522:70,%2522end%2522:75%7D,%7B%2522start%2522:75,%2522end%2522:80%7D%5D%7D%5D,%2522mutatedGenes%2522:%5B%7B%2522entrezGeneIds%2522:%5B2322,4869%5D%7D%5D,%2522cnaGenes%2522:%5B%7B%2522alterations%2522:%5B%7B%2522alteration%2522:-2,%2522entrezGeneId%2522:60412%7D,%7B%2522alteration%2522:2,%2522entrezGeneId%2522:84435%7D%5D%7D%5D%7D`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet(60000);
    });
    it('filter study from url', function() {
        const res = browser.checkElement('#mainColumn');
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

describe('study view msk_impact_2017 study tests', function() {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=msk_impact_2017`;
        goToUrlAndSetLocalStorage(url);
    });
    it('the study should show proper number of samples/patients', function() {
        // allow retrying to fix flaky tests, we should fix the test properly before
        // moving out of "need fixing" category
        this.retries(RETRIES);

        waitForNetworkQuiet(20000);
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '10,336');
        assert(getTextFromElement(SELECTED_SAMPLES) === '10,945');
    });
});


describe('check the simple filter(filterAttributeId, filterValues) is working properly', function() {

    it('filter study from url using simple filter', function() {
        // allow retrying to fix flaky tests, we should fix the test properly before
        // moving out of "need fixing" category
        this.retries(RETRIES);

        const url = `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=ONCOTREE_CODE&filterValues=OAST`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
        browser.moveToObject("body", 0, 0);
        const res = browser.checkElement('#mainColumn');
        assertScreenShotMatch(res);
    });
});
