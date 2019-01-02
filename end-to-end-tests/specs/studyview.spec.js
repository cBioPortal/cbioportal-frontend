var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('./specUtils').waitForNetworkQuiet;
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('study view screenshot test', function() {
    before(function() {
        var url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        goToUrlAndSetLocalStorage(url);
    });
    it('study view laml_tcga', function() {
        browser.waitForVisible("[data-test='summary-tab-content']", 10000);
        waitForNetworkQuiet();
        var res = browser.checkElement('#mainColumn', {hide: ['.qtip', '#footer-span-version']});
        assertScreenShotMatch(res);
    });
    it('study view laml_tcga clinical data clicked', function() {
        browser.click('.tabAnchor_clinicalData');
        browser.waitForVisible("[data-test='clinical-data-tab-content']", 10000);
        waitForNetworkQuiet();
        var res = browser.checkElement('#mainColumn', {hide: ['.qtip', '#footer-span-version']});
        assertScreenShotMatch(res);
    });

    it('When quickly adding charts, each chart should get proper data.', function() {
        browser.click('a.tabAnchor_summary');
        browser.waitForVisible("[data-test='summary-tab-content']", 10000);

        browser.click("[data-test='add-charts-button']")

        // Wait for the data frequency is calculated
        browser.waitForVisible("[data-test='add-by-type']", 5000);

        // Click on three options
        browser.click("[data-test='add-chart-option-fab'] input");
        browser.click("[data-test='add-chart-option-basophils-cell-count'] input");
        browser.click("[data-test='add-chart-option-blast-count'] input");

        var res = browser.checkElement('#mainColumn', {hide: ['.qtip', '#footer-span-version']});
        assertScreenShotMatch(res);
    });

    it('When adding chart with categories more than the pie2Table threshold, the pie chart should be converted to table', function() {
        // Click on three options
        browser.setValue("[data-test='fixed-header-table-search-input']", 'Cytogenetic');

        browser.waitForVisible("[data-test='add-chart-option-cytogenetic-abnormality-type']", 1000);
        browser.click("[data-test='add-chart-option-cytogenetic-abnormality-type']");

        browser.waitForVisible("[data-test='chart-container-PATIENT_CYTOGENETIC_ABNORMALITY_TYPE']", 1000);

        var res = browser.checkElement("[data-test='chart-container-PATIENT_CYTOGENETIC_ABNORMALITY_TYPE']");
        assertScreenShotMatch(res);
    });
});