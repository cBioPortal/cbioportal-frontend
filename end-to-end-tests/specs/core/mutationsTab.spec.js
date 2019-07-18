var assert = require('assert');
var waitForOncoprint = require('../specUtils').waitForOncoprint;
var setOncoprintMutationsMenuOpen = require('../specUtils').setOncoprintMutationsMenuOpen;
var goToUrlAndSetLocalStorage = require('../specUtils').goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe("mutations tab", function() {
    it("uses VUS filtering", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=acc_tcga_pan_can_atlas_2018&case_set_id=acc_tcga_pan_can_atlas_2018_cnaseq&data_priority=0&gene_list=HSD17B4&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_pan_can_atlas_2018_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_pan_can_atlas_2018_mutations&tab_index=tab_visualize`);
        waitForOncoprint(60000);
        setOncoprintMutationsMenuOpen(true);
        browser.click('input[data-test="HideVUS"]');
        browser.waitForExist('a.tabAnchor_mutations');
        browser.click('a.tabAnchor_mutations');
        browser.waitForVisible('[data-test="LazyMobXTable_CountHeader"]');
        assert(browser.getHTML('[data-test="LazyMobXTable_CountHeader"]', false).indexOf("0 Mutations") > -1);
    });
});
