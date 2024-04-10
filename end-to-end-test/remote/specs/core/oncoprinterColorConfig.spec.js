var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var assert = require('assert');
var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var getNthOncoprintTrackOptionsElements = require('../../../shared/specUtils')
    .getNthOncoprintTrackOptionsElements;
var {
    checkOncoprintElement,
    getElementByTestHandle,
} = require('../../../shared/specUtils.js');

const TIMEOUT = 6000;

const ONCOPRINT_TIMEOUT = 60000;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('oncoprinter clinical example data, color configuration', () => {
    it('oncoprinter color configuration modal reflects user selected colors', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        $('.oncoprinterClinicalExampleData').waitForExist();
        $('.oncoprinterClinicalExampleData').click();
        $('.oncoprinterSubmit').click();
        waitForOncoprint(TIMEOUT);

        var trackOptionsElts = getNthOncoprintTrackOptionsElements(2);
        // open menu
        $(trackOptionsElts.button_selector).click();
        $(trackOptionsElts.dropdown_selector).waitForDisplayed({
            timeout: 1000,
        });
        // click "Edit Colors" to open modal
        $(trackOptionsElts.dropdown_selector + ' li:nth-child(11)').click();
        browser.pause(1000);

        // select new colors for track values
        getElementByTestHandle('color-picker-icon').click();
        $('.circle-picker').waitForDisplayed({ timeout: 1000 });
        $('.circle-picker [title="#990099"]').click();
        waitForOncoprint();
        getElementByTestHandle('color-picker-icon').waitForDisplayed();
        getElementByTestHandle('color-picker-icon').click();
        $('.circle-picker').waitForDisplayed({ reverse: true });

        $$('[data-test="color-picker-icon"]')[1].click();
        $('.circle-picker').waitForDisplayed({ timeout: 1000 });
        $('.circle-picker [title="#109618"]').click();
        waitForOncoprint();
        getElementByTestHandle('color-picker-icon').waitForDisplayed();
        $$('[data-test="color-picker-icon"]')[1].click();
        $('.circle-picker').waitForDisplayed({ reverse: true });

        $$('[data-test="color-picker-icon"]')[2].click();
        $('.circle-picker').waitForDisplayed({ timeout: 1000 });
        $('.circle-picker [title="#8b0707"]').click();
        waitForOncoprint();

        assert.strictEqual(
            $('[data-test="color-picker-icon"] rect').getAttribute('fill'),
            '#990099'
        );
        assert.strictEqual(
            $$('[data-test="color-picker-icon"] rect')[1].getAttribute('fill'),
            '#109618'
        );
        assert.strictEqual(
            $$('[data-test="color-picker-icon"] rect')[2].getAttribute('fill'),
            '#8b0707'
        );
    });

    it('oncoprinter reflects user selected colors', () => {
        // close modal
        $('a.tabAnchor_oncoprint').click();
        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprinter reset colors button is visible when default colors not used', () => {
        // click "Edit Colors" to open modal and check "Reset Colors" button in modal
        var trackOptionsElts = getNthOncoprintTrackOptionsElements(2);
        $(trackOptionsElts.button_selector).click();
        $(trackOptionsElts.dropdown_selector).waitForDisplayed({
            timeout: 1000,
        });
        $(trackOptionsElts.dropdown_selector + ' li:nth-child(11)').click();
        getElementByTestHandle('resetColors').waitForDisplayed();
    });

    it('oncoprinter color configuration modal reflects default colors', () => {
        // click "Reset Colors" track
        getElementByTestHandle('resetColors').click();
        waitForOncoprint();

        assert.strictEqual(
            $('[data-test="color-picker-icon"] rect').getAttribute('fill'),
            '#dc3912'
        );
        assert.strictEqual(
            $$('[data-test="color-picker-icon"] rect')[1].getAttribute('fill'),
            '#3366cc'
        );
        assert.strictEqual(
            $$('[data-test="color-picker-icon"] rect')[2].getAttribute('fill'),
            '#ff9900'
        );
    });

    it('oncoprinter reflects default colors', () => {
        // close modal
        $('a.tabAnchor_oncoprint').click();
        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprinter reset colors button is hidden when default colors are used', () => {
        // click "Edit Colors" to open modal and check "Reset Colors" button in modal
        var trackOptionsElts = getNthOncoprintTrackOptionsElements(2);
        $(trackOptionsElts.button_selector).click();
        $(trackOptionsElts.dropdown_selector).waitForDisplayed({
            timeout: 1000,
        });
        $(trackOptionsElts.dropdown_selector + ' li:nth-child(11)').click();
        getElementByTestHandle('resetColors').waitForDisplayed({
            reverse: true,
        });
    });
});
