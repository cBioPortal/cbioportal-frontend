var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('results view mutation table', function() {
    it('shows ASCN columns for study with ASCN data', () => {
        var url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=ascn_test_study&case_set_id=ascn_test_study_cnaseq&data_priority=0&gene_list=PIK3R1&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ascn_test_study_cna&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ascn_test_study_mutations&profileFilter=0&tab_index=tab_visualize`;
        goToUrlAndSetLocalStorage(url);
        $(
            'table[class="simple-table table table-striped table-border-top"]'
        ).waitForExist();
        res = browser.checkElement(
            'table[class="simple-table table table-striped table-border-top"]'
        );
        assertScreenShotMatch(res);
    });

    it('shows ASCN columns for study where some samples have ASCN data and some do not', () => {
        var url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=ascn_test_study%2Cstudy_es_0&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&localdev=true&profileFilter=0&tab_index=tab_visualize`;
        goToUrlAndSetLocalStorage(url);
        $(
            'table[class="simple-table table table-striped table-border-top"]'
        ).waitForExist();
        res = browser.checkElement(
            'table[class="simple-table table table-striped table-border-top"]'
        );
        assertScreenShotMatch(res);
    });

    it('does not show ASCN columns study with no ASCN data', () => {
        var url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize`;
        goToUrlAndSetLocalStorage(url);
        $(
            'table[class="simple-table table table-striped table-border-top"]'
        ).waitForExist();
        res = browser.checkElement(
            'table[class="simple-table table table-striped table-border-top"]'
        );
        assertScreenShotMatch(res);
    });
});
