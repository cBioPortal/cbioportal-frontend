var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils')
    .useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('study select page', function() {
    if (useExternalFrontend) {
        describe('error messaging for invalid study id(s)', function() {
            // FIXME: on authenticated portals the alert does not show because the backend throws 403 because
            // the user does not have permission to access a non-existing study.
            // Possibly, run localdb against an unauthenticated portal or as a remote tests against public cbioportal
            it.skip('show error alert and query form for single invalid study id', function() {
                var url = `${CBIOPORTAL_URL}/results/oncoprint?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`;
                goToUrlAndSetLocalStorage(url, true);
                $('[data-test="StudySelect"]').waitForExist();
                assert(
                    $('[data-test="unkown-study-warning"]').$(
                        'li=coadread_tcga_pubb'
                    )
                );
            });

            // FIXME: on authenticated portals the alert does not show because the backend throws 403 because
            // the user does not have permission to access a non-existing study.
            // Possibly, run localdb against an unauthenticated portal or as a remote tests against public cbioportal
            it.skip('show error alert and query form for two studies, one invalid', function() {
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=acc_tcgaa%2Cstudy_es_0&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize`;
                goToUrlAndSetLocalStorage(url, true);
                $('[data-test="StudySelect"]').waitForExist();
                assert(
                    $('[data-test="unkown-study-warning"]')
                        .$('li=acc_tcgaa')
                        .isExisting()
                );
                assert(
                    !$('[data-test="unkown-study-warning"]')
                        .$('li=study_es_0')
                        .isExisting()
                );
            });
        });
    }
});
