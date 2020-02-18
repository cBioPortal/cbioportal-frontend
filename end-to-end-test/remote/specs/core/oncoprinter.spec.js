var assert = require('assert');
var {
    waitForOncoprint,
    setOncoprintMutationsMenuOpen,
    goToUrlAndSetLocalStorage,
    setInputText,
} = require('../../../shared/specUtils');

const TIMEOUT = 6000;

const ONCOPRINT_TIMEOUT = 60000;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('oncoprinter tests', function() {
    describe('custom driver annotation', () => {
        function doTestWithCustomDriver() {
            browser.waitForExist('.oncoprinterGeneticExampleData');
            browser.click('.oncoprinterGeneticExampleData');
            browser.click('.oncoprinterSubmit');
            waitForOncoprint(TIMEOUT);

            setOncoprintMutationsMenuOpen(true);
            assert(!browser.isSelected('input[data-test="annotateOncoKb"]'));
            assert(!browser.isSelected('input[data-test="annotateCBioPortalCount"]'));
            assert(browser.isSelected('input[data-test="annotateCustomBinary"]'));
        }

        function doTestWithoutCustomDriver() {
            browser.waitForExist('.oncoprinterGeneticExampleData');
            setInputText(
                'textarea.oncoprinterGeneticDataInput',
                'TCGA-25-2392-01 TP53 FUSION FUSION\nTCGA-04-1357-01 BRCA1 Q1538A MISSENSE'
            );
            browser.click('.oncoprinterSubmit');
            waitForOncoprint(TIMEOUT);

            setOncoprintMutationsMenuOpen(true);
            assert(browser.isSelected('input[data-test="annotateOncoKb"]'));
            assert(!browser.isExisting('input[data-test="annotateCustomBinary"]'));
        }

        it('only custom driver annotation is selected when input data includes a custom driver', () => {
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
            doTestWithCustomDriver();
        });
        it('oncokb is selected, and custom driver button hidden, when input data does not include a custom driver', () => {
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
            doTestWithoutCustomDriver();
        });
        it('mutation annotation settings reset whenever oncoprint is submitted', () => {
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
            doTestWithCustomDriver();
            browser.click('.oncoprinterModifyInput');
            doTestWithoutCustomDriver();
        });
    });
});
