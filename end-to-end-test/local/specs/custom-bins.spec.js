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
const BIN_SIZE = 'span=Bin size';
const MIN_VALUE = 'span=Min value';

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

describe('custom bins menu', function() {
    it('select quartiles and verify chart', () => {
        goToUrlAndSetLocalStorage(studyViewUrl, true);
        openCustomBinsMenu();
        $(CUSTOM_BINS_MENU)
            .$('label=Quartiles')
            .click();
        $(CUSTOM_BINS_MENU)
            .$(UPDATE_BUTTON)
            .click();
        $('body').moveTo();
        const res = checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });

    it('select median split and verify chart', () => {
        goToUrlAndSetLocalStorage(studyViewUrl, true);
        openCustomBinsMenu();
        $(CUSTOM_BINS_MENU)
            .$('label=Median split')
            .click();
        $(CUSTOM_BINS_MENU)
            .$(UPDATE_BUTTON)
            .click();
        $('body').moveTo();
        const res = checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });

    it('select generate bins, introduce values and verify chart', () => {
        goToUrlAndSetLocalStorage(studyViewUrl, true);
        openCustomBinsMenu();
        $(CUSTOM_BINS_MENU)
            .$('label=Generate bins')
            .click();
        $(BIN_SIZE)
            .$('..')
            .$('.input-sm')
            .setValue('2');
        $(MIN_VALUE)
            .$('..')
            .$('.input-sm')
            .setValue('2');
        $(CUSTOM_BINS_MENU)
            .$(UPDATE_BUTTON)
            .click();
        $('body').moveTo();
        const res = checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });

    it('select custom bins, introduce values and verify chart', () => {
        goToUrlAndSetLocalStorage(studyViewUrl, true);
        openCustomBinsMenu();
        $(CUSTOM_BINS_MENU)
            .$('label=Custom bins')
            .click();
        $$('.input-sm')[2].setValue('0,10,20,30,40');
        $(CUSTOM_BINS_MENU)
            .$(UPDATE_BUTTON)
            .click();
        $('body').moveTo();
        const res = checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });
});
