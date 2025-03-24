var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../shared/specUtils').waitForNetworkQuiet;
var openGroupComparison = require('../../shared/specUtils').openGroupComparison;
var assertScreenShotMatch = require('../../shared/lib/testUtils')
    .assertScreenShotMatch;
var setInputText = require('../../shared/specUtils').setInputText;
var {
    setDropdownOpen,
    selectClinicalTabPlotType,
    getElementByTestHandle,
    setCheckboxChecked,
} = require('../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Screenshot test for extend survival chart (feature flag)', function() {
    this.retries(0);

    before(function() {
        openGroupComparison(
            `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay&featureFlags=SURVIVAL_PLOT_EXTENDED`,
            'chart-container-OS_STATUS',
            100000
        );
        $('.tabAnchor_survival').click();
        $('[data-test="ComparisonPageSurvivalTabDiv"]').waitForExist({
            timeout: 20000,
        });
    });
    it('Survival chart with landmark event and hazard ratio disabled', function() {
        var res = browser.checkElement('div[data-test=SurvivalChart]');
        assertScreenShotMatch(res);
    });
    it('Survival chart with landmark event at time point 20', function() {
        setCheckboxChecked(true, 'input[data-test=landmarkLines]');
        setInputText('input[data-test=landmarkValues]', '20');
        var res = browser.checkElement('div[data-test=SurvivalChart]');
        assertScreenShotMatch(res);
    });
    it('Survival chart with hazard ratio table', function() {
        setCheckboxChecked(false, 'input[data-test=landmarkLines]');
        setCheckboxChecked(true, 'input[data-test=hazardRatioCheckbox]');
        var res = browser.checkElement('div[data-test=survivalTabView]');
        assertScreenShotMatch(res);
    });
    it('Survival chart with hazard ratio table and landmark line', function() {
        setCheckboxChecked(true, 'input[data-test=landmarkLines]');
        setInputText('input[data-test=landmarkValues]', '20');
        setCheckboxChecked(true, 'input[data-test=hazardRatioCheckbox]');
        var res = browser.checkElement('div[data-test=survivalTabView]');
        assertScreenShotMatch(res);
    });
});
