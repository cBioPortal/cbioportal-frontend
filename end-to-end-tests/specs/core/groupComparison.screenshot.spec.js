var assert = require('assert');
var goToUrlAndSetLocalStorage = require('./../specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('./../specUtils').waitForNetworkQuiet;
var assertScreenShotMatch = require('../../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");


describe("group comparison page screenshot tests", function () {
    before(function () {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/comparison?sessionId=5ce411c7e4b0ab4137874076`);
        browser.waitForVisible('div[data-test="ComparisonPageOverlapTabDiv"]', 20000);
    });
    it("group comparison page overlap tab upset plot view", function () {
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageOverlapTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

    it("group comparison page survival tab exclude overlapping samples", () => {
        assert(browser.isVisible('a.tabAnchor_survival'));
        browser.click("a.tabAnchor_survival");
        browser.waitForVisible('div[data-test="ComparisonPageSurvivalTabDiv"]', 60000);
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageSurvivalTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

    it("group comparison page survival tab include overlapping samples", function () {
        browser.execute(function () { groupComparisonPage.onOverlapStrategySelect({ value: "Include overlapping samples and patients" }); });
        waitForNetworkQuiet();
        browser.waitForExist('div[data-test="ComparisonPageSurvivalTabDiv"]', 60000);
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageSurvivalTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

    it("group comparison page clinical tab include overlapping samples Kruskal Wallis test", function () {
        assert(browser.isVisible('a.tabAnchor_clinical'));
        browser.click("a.tabAnchor_clinical");
        waitForNetworkQuiet();
        browser.waitForVisible('div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageClinicalTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

    it("group comparison page clinical tab swaped axes Kruskal Wallis test", function () {
        browser.click('div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]');
        browser.waitForVisible('div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageClinicalTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });


    it("group comparison page clinical tab log scale  Kruskal Wallis test", function () {
        browser.click('div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="logScale"]');
        browser.waitForVisible('div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageClinicalTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });


    it("group comparison page clinical tab percentage stacked bar chart exclude overlapping samples Chi squared test", function () {
        browser.execute(function () { groupComparisonPage.onOverlapStrategySelect({ value: "Exclude overlapping samples and patients" }); });
        waitForNetworkQuiet();
        browser.waitForVisible('div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageClinicalTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

    it("group comparison page clinical tab bar chart Chi squared test", function () {
        var plotTypeSelector = $('[data-test="plotTypeSelector"] .Select-input input');
        plotTypeSelector.setValue('Bar chart');
        browser.click('[data-test="plotTypeSelector"] .Select-option');
        browser.waitForVisible('div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageClinicalTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

    it("group comparison page clinical tab stacked bar chart Chi squared test", function () {
        var plotTypeSelector = $('[data-test="plotTypeSelector"] .Select-input input');
        plotTypeSelector.setValue('Stacked bar chart');
        browser.click('[data-test="plotTypeSelector"] .Select-option');
        browser.waitForVisible('div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageClinicalTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

    it("group comparison page clinical tab stacked bar chart swaped axes Chi squared test", function () {
        browser.click('div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]');
        browser.waitForVisible('div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageClinicalTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

    it("group comparison page clinical tab stacked bar chart horizontal bars Chi squared test", function () {
        browser.click('div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]');
        browser.click('div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="HorizontalBars"]');
        browser.waitForVisible('div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.moveToObject("body", 0, 0);
        var res = browser.checkElement('div[data-test="ComparisonPageClinicalTabDiv"]', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

});
