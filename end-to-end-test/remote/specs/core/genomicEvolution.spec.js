var assert = require('assert');
var expect = require('chai').expect;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils').goToUrlAndSetLocalStorage;
var checkOncoprintElement = require('../../../shared/specUtils').checkOncoprintElement;
var waitForNetworkQuiet = require('../../../shared/specUtils').waitForNetworkQuiet;
var assertScreenShotMatch = require('../../../shared/lib/testUtils').assertScreenShotMatch;
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Patient View Genomic Evolution tab', function() {
    describe('mutation table', () => {
        before(() => {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/patient/genomicEvolution?caseId=P04&studyId=lgg_ucsf_2014`
            );
            waitForNetworkQuiet(10000);
        });
        it('shows only highlighted, or all mutations, depending on setting', () => {
            // at first, showing all mutations
            browser.waitForExist('input[data-test="TableShowOnlyHighlighted"]', 3000);
            assert(!browser.isSelected('input[data-test="TableShowOnlyHighlighted"]'));

            // at first, more than 2 mutations (making this ambiguous to be unaffected by data changes
            browser.waitForExist(
                'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
            );
            let numMutationsText = browser.getText(
                'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
            );
            let numMutations = parseInt(numMutationsText, 10);
            assert(numMutations > 2);

            // now select two mutations
            browser.click(
                'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
            );
            browser.click(
                'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(4)'
            );

            // should still show all
            browser.waitForExist(
                'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
            );
            numMutationsText = browser.getText(
                'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
            );
            numMutations = parseInt(numMutationsText, 10);
            assert(numMutations > 2);

            // now select "show only highlighted"
            browser.click('input[data-test="TableShowOnlyHighlighted"]');
            browser.waitUntil(
                () => {
                    numMutationsText = browser.getText(
                        'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
                    );
                    numMutations = parseInt(numMutationsText, 10);
                    return numMutations === 2;
                },
                2000,
                'should only be 2 mutations in the table now'
            );

            // now click on one of the 2 mutations
            browser.click(
                'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
            );
            browser.waitUntil(
                () => {
                    numMutationsText = browser.getText(
                        'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
                    );
                    numMutations = parseInt(numMutationsText, 10);
                    return numMutations === 1;
                },
                2000,
                'should only be 1 mutation in the table now'
            );

            // now click on the last remaining mutation
            browser.click(
                'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
            );
            browser.waitUntil(
                () => {
                    numMutationsText = browser.getText(
                        'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
                    );
                    numMutations = parseInt(numMutationsText, 10);
                    return numMutations > 2;
                },
                2000,
                'should show all mutations again, since none explicitly selected'
            );
        });
    });
});
