const assertScreenShotMatch = require('../../shared/lib/testUtils')
    .assertScreenShotMatch;
const {
    checkElementWithMouseDisabled,
    goToUrlAndSetLocalStorage,
    jsApiHover,
} = require('../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;
const MUTATION_COUNT_CHART = `div[data-test="chart-container-MUTATION_COUNT"]`;
const MUTATION_COUNT_HAMBURGER_ICON = `${MUTATION_COUNT_CHART} [data-test="chart-header-hamburger-icon"]`;
const MUTATION_COUNT_MENU = `${MUTATION_COUNT_CHART} [data-test="chart-header-hamburger-icon-menu"]`;
const CUSTOM_BINS_MENU = `.modal-dialog`;
const UPDATE_BUTTON = '.btn-sm';
const BIN_SIZE_INPUT = '[data-test=bin-size-input]';
const MIN_VALUE_INPUT = '[data-test=anchorvalue-input]';
const CUSTOM_BINS_TEXTAREA = '[data-test=custom-bins-textarea]';

describe('Custom Bins menu in study view chart header', function() {
    beforeEach(() => {
        goToUrlAndSetLocalStorage(studyViewUrl, true);
        openCustomBinsMenu();
    });

    it('creates quartiles bins', () => {
        selectMenuOption('label=Quartiles');
        clickUpdate();
        $('body').moveTo();
        const res = checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });

    it('creates median split bins', () => {
        selectMenuOption('label=Median split');
        clickUpdate();
        $('body').moveTo();
        const res = checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });

    it('generates bins using min and bin size input fields', () => {
        selectMenuOption('label=Generate bins');
        $(BIN_SIZE_INPUT).waitForExist();
        $(BIN_SIZE_INPUT).setValue('2');
        $(MIN_VALUE_INPUT).setValue('2');
        clickUpdate();
        $('body').moveTo();
        const res = checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });

    it('creates custom bins using custom bins input field', () => {
        selectMenuOption('label=Custom bins');
        $(CUSTOM_BINS_TEXTAREA).waitForExist();
        $(CUSTOM_BINS_TEXTAREA).setValue('0,10,20,30,40');
        clickUpdate();
        $('body').moveTo();
        const res = checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });
});

function openCustomBinsMenu() {
    $(MUTATION_COUNT_CHART).waitForDisplayed();
    jsApiHover(MUTATION_COUNT_CHART);

    $(MUTATION_COUNT_HAMBURGER_ICON).waitForDisplayed();
    jsApiHover(MUTATION_COUNT_HAMBURGER_ICON);

    $(MUTATION_COUNT_MENU).waitForDisplayed();
    $(MUTATION_COUNT_MENU)
        .$('a.dropdown-item')
        .click();

    $(CUSTOM_BINS_MENU).waitForDisplayed();
}

function selectMenuOption(identifier) {
    $(CUSTOM_BINS_MENU)
        .$(identifier)
        .click();
}

function clickUpdate() {
    $(CUSTOM_BINS_MENU)
        .$(UPDATE_BUTTON)
        .click();
}
