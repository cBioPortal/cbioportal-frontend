var assert = require('assert');
var expect = require('chai').expect;

var {
    goToUrlAndSetLocalStorage,
    clickQueryByGeneButton,
    useExternalFrontend,
    useNetlifyDeployPreview,
    setInputText,
    waitForNumberOfStudyCheckboxes,
    clickModifyStudySelectionButton,
    waitForOncoprint,
    setDropdownOpen,
    jq,
    waitForNetworkQuiet,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

var searchInputSelector = 'div[data-test=study-search] input[type=text]';

describe('homepage', function() {
    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('For multi study query, if all studies are pan_can then we CAN compare expression in plots', () => {
        const url = `/results/plots?cancer_study_list=acc_tcga_pan_can_atlas_2018%2Cchol_tcga_pan_can_atlas_2018&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=all&gene_list=CDKN2A%2520MDM2&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL + url);
        waitForNetworkQuiet();
        $('.Select-arrow-zone').click();
        $('.Select-option').waitForExist();
        $('.Select-option=mRNA').isExisting();

        assert.equal(
            $(
                'div=Expression data cannot be compared across the selected studies.'
            ).isExisting(),
            false
        );
    });

    it('For multi study query that is NOT all pan_can, no expression data in plots', () => {
        const url = `/results/plots?cancer_study_list=acc_tcga_pan_can_atlas_2018%2Cchol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=all&gene_list=CDKN2A%2520MDM2&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL + url);
        waitForNetworkQuiet();
        $('.Select-arrow-zone').click();
        $('.Select-option=Mutation').waitForExist();
        assert.equal($('.Select-option=mRNA').isExisting(), false);

        assert.equal(
            $(
                'div=Expression data cannot be compared across the selected studies.'
            ).isExisting(),
            true
        );
    });

    it('For single study, NOT pan_can, there is expression available in plots', () => {
        const url = `/results/plots?cancer_study_list=chol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=all&gene_list=CDKN2A%2520MDM2&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL + url);
        waitForNetworkQuiet();
        $('.Select-arrow-zone').click();
        $('.Select-option=Mutation').waitForExist();
        assert.equal($('.Select-option=mRNA').isExisting(), true);

        assert.equal(
            $(
                'div=Expression data cannot be compared across the selected studies.'
            ).isExisting(),
            false
        );
    });
});
