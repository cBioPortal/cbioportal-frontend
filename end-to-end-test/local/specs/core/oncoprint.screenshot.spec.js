var {
    goToUrlAndSetLocalStorage,
    assertScreenShotMatch,
    waitForOncoprint,
    checkOncoprintElement,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('oncoprint', function() {
    describe('generic assay categorical tracks', () => {
        it('shows binary and multiple category tracks', () => {
            var url = `${CBIOPORTAL_URL}/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=IDH1&geneset_list=%20&tab_index=tab_visualize&Action=Submit&show_samples=true&generic_assay_groups=lgg_ucsf_2014_test_generic_assay_mutational_signature_binary_v2%2Cmutational_signature_binary_2%2Cmutational_signature_binary_1%3Blgg_ucsf_2014_test_generic_assay_mutational_signature_category_v2%2Cmutational_signature_category_6%2Cmutational_signature_category_8%2Cmutational_signature_category_9`;
            goToUrlAndSetLocalStorage(url, true);
            waitForOncoprint(10000);
            var res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });
    });
});
