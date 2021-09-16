var assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    checkElementWithMouseDisabled,
} = require('../../shared/specUtils');
var assertScreenShotMatch = require('../../shared/lib/testUtils')
    .assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const WAIT_FOR_VISIBLE_TIMEOUT = 30000;
// const RESET_CHART_BUTTON = "[data-test='reset-charts-button']";
// const CONFIRM_RESET_CHART_BUTTON = "[data-test='confirm-reset-charts-button']";

// Add new numerical profile here
const numericalProfileInfoByType = {
    MUTATIONAL_SIGNATURE: {
        profileId:
            'lgg_ucsf_2014_test_generic_assay_mutational_signature_contribution_v2',
        selectEntityId: 'mutational_signature_contribution_1',
    },
};

// Add new categorical profile here
const categoricalProfileInfoByType = {
    HLA: {
        profileId: 'lgg_ucsf_2014_test_generic_assay_hla',
        selectEntityId: 'HLA-A',
    },
    ARMLEVEL_CNA: {
        profileId: 'lgg_ucsf_2014_test_generic_assay_armlevel_cna',
        selectEntityId: '1p_status',
    },
    MUTATIONAL_SIGNATURE_TEST: {
        profileId:
            'lgg_ucsf_2014_test_generic_assay_mutational_signature_binary_v2',
        selectEntityId: 'mutational_signature_binary_1',
    },
};

describe('generic assay numerical data tests', function() {
    for (const [profileType, profileInfo] of Object.entries(
        numericalProfileInfoByType
    )) {
        runGenericAssayNumericalDataTestSuite(profileType, profileInfo);
    }
});

describe('generic assay catrgorical data tests', function() {
    for (const [profileType, profileInfo] of Object.entries(
        categoricalProfileInfoByType
    )) {
        runGenericAssayCategoricalDataTestSuite(profileType, profileInfo);
    }
});

function runGenericAssayNumericalDataTestSuite(profileType, profileInfo) {
    it(`add ${profileType} chart in the summary tab`, () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        goToUrlAndSetLocalStorage(url, true);
        waitForNetworkQuiet();

        $(ADD_CHART_BUTTON).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CHART_BUTTON).click();

        waitForNetworkQuiet();

        // Change to GENERIC ASSAY tab
        $(`.addChartTabs a.tabAnchor_${profileType}`).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(`.addChartTabs a.tabAnchor_${profileType}`).click();

        // wait for generic assay data loading complete
        // and select a option
        $('div[data-test="GenericAssaySelection"]').waitForExist();
        $('div[data-test="GenericAssaySelection"] input').setValue(
            profileInfo.selectEntityId
        );
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
}

function runGenericAssayCategoricalDataTestSuite(profileType, profileInfo) {
    it(`add ${profileType} chart in the summary tab`, () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        goToUrlAndSetLocalStorage(url, true);
        waitForNetworkQuiet();

        $(ADD_CHART_BUTTON).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CHART_BUTTON).click();

        waitForNetworkQuiet();

        // Change to GENERIC ASSAY tab
        $(`.addChartTabs a.tabAnchor_${profileType}`).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(`.addChartTabs a.tabAnchor_${profileType}`).click();

        // wait for generic assay data loading complete
        // and select a option
        $('div[data-test="GenericAssaySelection"]').waitForExist();
        $('div[data-test="GenericAssaySelection"] input').setValue(
            profileInfo.selectEntityId
        );
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
}
