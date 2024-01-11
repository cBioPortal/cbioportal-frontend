const assert = require('assert');
const assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
const {
    checkElementWithMouseDisabled,
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    setDropdownOpen,
    jsApiHover,
    getElementByTestHandle,
    jq,
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
const MUTATIONS_GENES_TABLE = "[data-test='mutations-table']";
const CANCER_GENE_FILTER_ICON = "[data-test='header-filter-icon']";
const ADD_CUSTOM_CHART_TAB = '.addChartTabs a.tabAnchor.tabAnchor_Custom_Data';

describe('study view generic assay categorical/binary features', function() {
    it.skip('generic assay pie chart should be added in the summary tab', function() {
        this.retries(0);

        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        goToUrlAndSetLocalStorage(url, true);

        $(ADD_CHART_BUTTON).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CHART_BUTTON).click();

        // Change to GENERIC ASSAY tab
        $(ADD_CHART_GENERIC_ASSAY_TAB).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        //browser.debug();
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
        $('div[data-test="GenericAssayEntitySelection"]').waitForExist();
        $('div[data-test="GenericAssayEntitySelection"] input').setValue(
            'mutational_signature_category_10'
        );

        $('div=Select all filtered options (1)').waitForExist();
        $('div=Select all filtered options (1)').click();
        // close the dropdown
        var indicators = $$('div[class$="indicatorContainer"]');
        indicators[0].click();
        var selectedOptions = $$('div[class$="multiValue"]');
        assert.equal(selectedOptions.length, 1);

        // this needs to be done twice for some reason on circleci
        $('button=Add Chart').click();
        $('button=Add Chart').click();
        //$('button=Add Chart').click();
        // Wait for chart to be added
        waitForNetworkQuiet();

        // allow time to render
        browser.pause(1000);

        const el = jq(
            "[data-test*='chart-container-mutational_signature_category_10_mutational']"
        );
        const att = $(el[0]).getAttribute('data-test');

        console.log('AARON');
        console.log(att);

        const res = checkElementWithMouseDisabled(`[data-test='${att}']`);

        assertScreenShotMatch(res);
    });
});

describe('Test the Custom data tab', function() {
    it('Add custom data tab should have numerical and categorical selector', () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        goToUrlAndSetLocalStorage(url, true);
        waitForNetworkQuiet();

        $(ADD_CHART_BUTTON).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CHART_BUTTON).click();

        waitForNetworkQuiet();
        // Change to custom tab
        $(ADD_CUSTOM_CHART_TAB).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CUSTOM_CHART_TAB).click();
        const res = browser.checkElement('div.msk-tab.custom');
        assertScreenShotMatch(res);
    });
    it('Selecting numerical for custom data should return a bar chart', () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        goToUrlAndSetLocalStorage(url, true);
        waitForNetworkQuiet();

        $(ADD_CHART_BUTTON).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CHART_BUTTON).click();

        waitForNetworkQuiet();
        // Change to custom tab
        $(ADD_CUSTOM_CHART_TAB).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CUSTOM_CHART_TAB).click();
        CUSTOM_CHART_TAB = $('div.msk-tab.custom');
        // Add values to the input form
    });
});

describe('study view x vs y charts', function() {
    this.retries(0);
    const X_VS_Y_CHART = `div[data-test="chart-container-X-VS-Y-AGE-MUTATION_COUNT"]`;
    const X_VS_Y_HAMBURGER_ICON = `${X_VS_Y_CHART} [data-test="chart-header-hamburger-icon"]`;
    const X_VS_Y_MENU = `${X_VS_Y_CHART} [data-test="chart-header-hamburger-icon-menu"]`;
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        goToUrlAndSetLocalStorage(url, true);

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

        // temporarily allow button to not be enabled
        // TODO: issue # 9226
        try {
            // submit
            $('button[data-test="x-vs-y-submit-btn"]').waitForEnabled();
            $('button[data-test="x-vs-y-submit-btn"]').click();
        } catch (e) {
            // this should only fail because the submit button isnt enabled because the chart already still exists
        }

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

describe('study view editable breadcrumbs', () => {
    it('breadcrumbs are editable for mutation count chart', () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;
        // set up the page without filters
        goToUrlAndSetLocalStorage(url, true);
        waitForNetworkQuiet();
        // add filters (this is necessary to do separately because goToUrlAndSetLocalStorage doesn't play nice with hash params
        browser.url(
            `${url}#filterJson={"clinicalDataFilters":[{"attributeId":"MUTATION_COUNT","values":[{"start":15,"end":20},{"start":20,"end":25},{"start":25,"end":30},{"start":30,"end":35},{"start":35,"end":40},{"start":40,"end":45}]}],"studyIds":["lgg_ucsf_2014_test_generic_assay"],"alterationFilter":{"copyNumberAlterationEventTypes":{"AMP":true,"HOMDEL":true},"mutationEventTypes":{"any":true},"structuralVariants":null,"includeDriver":true,"includeVUS":true,"includeUnknownOncogenicity":true,"includeUnknownTier":true,"includeGermline":true,"includeSomatic":true,"includeUnknownStatus":true,"tiersBooleanMap":{}}}`
        );
        waitForNetworkQuiet();
        $('.userSelections').waitForDisplayed();

        const element = $('.userSelections').$('span=15');
        element.click();
        element.keys(['ArrowRight', 'ArrowRight', 'Backspace', 'Backspace']);
        element.setValue(13);
        element.keys(['Enter']);

        // Wait for everything to settle
        waitForNetworkQuiet();
        browser.pause(1000);

        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });
    after(() => {
        // reset charts to reset custom bin
        setDropdownOpen(true, ADD_CHART_BUTTON, 'button=Reset charts');
        $('button=Reset charts').click();
        $('.modal-content')
            .$('button=Confirm')
            .waitForDisplayed();
        $('.modal-content')
            .$('button=Confirm')
            .click();
        // wait for session to save
        browser.pause(4000);
        waitForNetworkQuiet();
    });
});

describe('cancer gene filter', function() {
    this.retries(0);

    it('cancer gene filter should by default be disabled', () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;
        // set up the page without filters
        goToUrlAndSetLocalStorage(url, true);
        $(
            `${MUTATIONS_GENES_TABLE} [data-test='gene-column-header']`
        ).waitForDisplayed({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });
        assert.equal(
            $(
                `${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`
            ).isExisting(),
            true
        );
        assert.equal(
            $(
                `${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`
            ).getCSSProperty('color').parsed.hex,
            '#bebebe'
        );
    });

    it('cancer gene filter should remove non cancer genes', () => {
        $(`${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`).click();
        assert.equal(
            $(
                `${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`
            ).getCSSProperty('color').parsed.hex,
            '#000000'
        );
        assertScreenShotMatch(
            checkElementWithMouseDisabled(MUTATIONS_GENES_TABLE)
        );
    });

    it('reset charts button should revert and disable cancer gene filter', () => {
        $(ADD_CHART_BUTTON).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        browser.waitUntil(
            () => {
                const isOpen = $('button=Reset charts').isExisting()
                    ? $('button=Reset charts').isDisplayedInViewport()
                    : false;
                if (isOpen) {
                    return true;
                } else {
                    $(ADD_CHART_BUTTON).click();
                }
            },
            {
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                interval: 10000,
            }
        );

        $('button=Reset charts').click();
        $('.modal-content')
            .$('button=Confirm')
            .waitForDisplayed();
        $('.modal-content')
            .$('button=Confirm')
            .click();
        assert.equal(
            $(
                `${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`
            ).getCSSProperty('color').parsed.hex,
            '#bebebe'
        );
        assertScreenShotMatch(
            checkElementWithMouseDisabled(MUTATIONS_GENES_TABLE)
        );
    });
});
