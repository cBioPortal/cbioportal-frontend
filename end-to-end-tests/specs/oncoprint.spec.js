var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;
var assert = require('assert');
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var getNthOncoprintTrackOptionsElements = require('./specUtils').getNthOncoprintTrackOptionsElements;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe("merged tracks", ()=>{
    it("oncoprint loads and expands a merged track", ()=>{
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=coadread_tcga&case_set_id=coadread_tcga_cnaseq&data_priority=0&gene_list=%255B%2522RAS%2522%2520KRAS%2520NRAS%2520HRAS%255D&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_mutations&tab_index=tab_visualize`);
        waitForOncoprint(10000);

        var trackOptionsElts = getNthOncoprintTrackOptionsElements(1);
        // open menu
        browser.click(trackOptionsElts.button_selector);
        browser.waitForVisible(trackOptionsElts.dropdown_selector, 1000);
        // click expand
        browser.click(trackOptionsElts.dropdown_selector + " li:nth-child(3)");
        waitForOncoprint(10000);

        var res = browser.checkElement('.oncoprintContainer', { hide:['.oncoprint__controls']}); // just hide the controls bc for some reason they keep showing up transparent in this test only
        assertScreenShotMatch(res);
    });
});