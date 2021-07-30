var assert = require('assert');
var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
var setSettingsMenuOpen = require('../../../shared/specUtils')
    .setSettingsMenuOpen;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('mutations tab', function() {
    it('uses VUS filtering', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=acc_tcga_pan_can_atlas_2018&case_set_id=acc_tcga_pan_can_atlas_2018_cnaseq&data_priority=0&gene_list=HSD17B4&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_pan_can_atlas_2018_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_pan_can_atlas_2018_mutations&tab_index=tab_visualize`
        );
        waitForOncoprint(60000);
        setSettingsMenuOpen(true);
        $('input[data-test="HideVUS"]').click();
        setSettingsMenuOpen(false);
        $('a.tabAnchor_mutations').waitForExist();
        $('a.tabAnchor_mutations').click();
        $('[data-test="LazyMobXTable_CountHeader"]').waitForDisplayed();
        assert(
            $('[data-test="LazyMobXTable_CountHeader"]')
                .getHTML(false)
                .indexOf('0 Mutations') > -1
        );
    });
    it('uses germline filtering', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=brca_tcga_pub&case_set_id=brca_tcga_pub_cnaseq&data_priority=0&gene_list=BRCA1%2520BRCA2&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations&tab_index=tab_visualize`
        );
        $('[data-test="LazyMobXTable_CountHeader"]').waitForDisplayed({
            timeout: 10000,
        });
        assert(
            $('[data-test="LazyMobXTable_CountHeader"]')
                .getHTML(false)
                .indexOf('19 Mutations') > -1,
            'unfiltered is 19 mutations'
        );

        setSettingsMenuOpen(true);
        $(
            'div[data-test="GlobalSettingsDropdown"] input[data-test="HideGermline"]'
        ).click();
        setSettingsMenuOpen(false);

        $('[data-test="LazyMobXTable_CountHeader"]').waitForDisplayed({
            timeout: 10000,
        });
        assert(
            $('[data-test="LazyMobXTable_CountHeader"]')
                .getHTML(false)
                .indexOf('6 Mutations') > -1,
            'filtered is 6 mutations'
        );
    });
});
