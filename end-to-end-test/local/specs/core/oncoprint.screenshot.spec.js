var {
    goToUrlAndSetLocalStorage,
    waitForOncoprint,
    checkOncoprintElement,
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../../shared/specUtils');
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyes0_oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&data_priority=0&gene_list=ABLIM1%250ATMEM247&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize';

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

    describe('default clinical tracks configuration', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorageWithProperty(CBIOPORTAL_URL, false, {
                oncoprint_clinical_tracks_show_by_default: JSON.stringify([
                    {
                        stableId: 'SUBTYPE',
                        sortOrder: 'ASC',
                        gapOn: 'true',
                    },
                    {
                        stableId: 'OS_STATUS',
                        sortOrder: 'DESC',
                        gapOn: 'false',
                    },
                    {
                        stableId: 'DFS_STATUS',
                        sortOrder: null,
                        gapOn: null,
                    },
                ]),
            });
            goToUrlAndSetLocalStorage(studyes0_oncoprintTabUrl, false);

            waitForOncoprint(10000);
        });

        it('shows the configured default clinical tracks in the oncoprint', () => {
            var res = checkOncoprintElement('.oncoprintContainer');
            assertScreenShotMatch(res);
        });
    });
});
