const assert = require('assert');
const assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
const {
    checkElementWithMouseDisabled,
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    jsApiHover,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_GENERIC_ASSAY_TAB =
    '.addChartTabs a.tabAnchor_MUTATIONAL_SIGNATURE_TEST';
const GENERIC_ASSAY_PROFILE_SELECTION =
    "[data-test='GenericAssayProfileSelection']";
const CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT =
    'div=mutational signature category v2 (61 samples)';
const ADD_CHART_X_VS_Y_TAB = '.addChartTabs a.tabAnchor_X_Vs_Y';
const WAIT_FOR_VISIBLE_TIMEOUT = 30000;

describe('study view generic assay categorical/binary features', function() {
    it('generic assay pie chart should be added in the summary tab', () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        goToUrlAndSetLocalStorage(url, true);
        waitForNetworkQuiet();

        $(ADD_CHART_BUTTON).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CHART_BUTTON).click();

        waitForNetworkQuiet();

        // Change to GENERIC ASSAY tab
        $(ADD_CHART_GENERIC_ASSAY_TAB).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CHART_GENERIC_ASSAY_TAB).click();

        // Select category mutational signature profile
        $(GENERIC_ASSAY_PROFILE_SELECTION).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(GENERIC_ASSAY_PROFILE_SELECTION).click();

        $(GENERIC_ASSAY_PROFILE_SELECTION)
            .$(CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT)
            .waitForDisplayed({
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });
        $(GENERIC_ASSAY_PROFILE_SELECTION)
            .$(CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT)
            .click();

        // wait for generic assay data loading complete
        // and select a option
        $('div[data-test="GenericAssaySelection"]').waitForExist();
        $('div[data-test="GenericAssaySelection"] input').setValue(
            'mutational_signature_category_10'
        );
        $('div=Select all filtered options (1)').waitForExist();
        $('div=Select all filtered options (1)').click();
        // close the dropdown
        var indicators = $$('div[class$="indicatorContainer"]');
        indicators[0].click();
        var selectedOptions = $$('div[class$="multiValue"]');
        assert.equal(selectedOptions.length, 1);

        $('button=Add Chart').click();
        // Wait for chart to be added
        waitForNetworkQuiet();

        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });
});

describe('study view x vs y charts', () => {
    const X_VS_Y_CHART = `div[data-test="chart-container-X-VS-Y-AGE-MUTATION_COUNT"]`;
    const X_VS_Y_HAMBURGER_ICON = `${X_VS_Y_CHART} [data-test="chart-header-hamburger-icon"]`;
    const X_VS_Y_MENU = `${X_VS_Y_CHART} [data-test="chart-header-hamburger-icon-menu"]`;
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        goToUrlAndSetLocalStorage(url, true);
        waitForNetworkQuiet();

        // remove mutation count vs diagnosis age chart if it exists
        if ($(X_VS_Y_CHART).isExisting()) {
            jsApiHover(X_VS_Y_CHART);
            $(X_VS_Y_CHART)
                .$('[data-test="deleteChart"]')
                .waitForDisplayed();
            $(X_VS_Y_CHART)
                .$('[data-test="deleteChart"]')
                .click();
            browser.waitUntil(() => {
                return !$(X_VS_Y_CHART).isExisting();
            });
        }
    });
    it('adds mutation count vs diagnosis age chart', () => {
        $(ADD_CHART_BUTTON).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CHART_BUTTON).click();

        waitForNetworkQuiet();

        // Change to X vs Y tab
        $(ADD_CHART_X_VS_Y_TAB).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CHART_X_VS_Y_TAB).click();

        // Add Mutation Count vs Diagnosis Age chart
        // X-axis: diagnosis age
        $('.xvsy-x-axis-selector').waitForDisplayed();
        $('.xvsy-x-axis-selector').click();
        $('.xvsy-x-axis-selector')
            .$('div=Diagnosis Age')
            .waitForDisplayed();
        $('.xvsy-x-axis-selector')
            .$('div=Diagnosis Age')
            .click();

        // Y-axis: mutation count
        $('.xvsy-y-axis-selector').waitForDisplayed();
        $('.xvsy-y-axis-selector').click();
        $('.xvsy-y-axis-selector')
            .$('div=Mutation Count')
            .waitForDisplayed();
        $('.xvsy-y-axis-selector')
            .$('div=Mutation Count')
            .click();

        // submit
        $('button[data-test="x-vs-y-submit-btn"]').waitForEnabled();
        $('button[data-test="x-vs-y-submit-btn"]').click();

        $(X_VS_Y_CHART).waitForExist();
        const res = checkElementWithMouseDisabled(X_VS_Y_CHART);
        assertScreenShotMatch(res);
    });
    it('turns on log scale from dropdown menu', () => {
        jsApiHover(X_VS_Y_CHART);
        $(X_VS_Y_HAMBURGER_ICON).waitForDisplayed();
        jsApiHover(X_VS_Y_HAMBURGER_ICON);
        $(X_VS_Y_MENU).waitForDisplayed();
        $(X_VS_Y_MENU)
            .$('a.logScaleCheckbox')
            .click();
        $('body').moveTo();
        const res = checkElementWithMouseDisabled(X_VS_Y_CHART);
        assertScreenShotMatch(res);
    });
    it('swaps axis from dropdown menu', () => {
        jsApiHover(X_VS_Y_CHART);
        $(X_VS_Y_HAMBURGER_ICON).waitForDisplayed();
        jsApiHover(X_VS_Y_HAMBURGER_ICON);
        $(X_VS_Y_MENU).waitForDisplayed();
        $(X_VS_Y_MENU)
            .$('[data-test="swapAxes"]')
            .click();
        $('body').moveTo();
        const res = checkElementWithMouseDisabled(X_VS_Y_CHART);
        assertScreenShotMatch(res);
    });
});
