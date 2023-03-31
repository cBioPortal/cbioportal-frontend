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
    getElementByTestHandle,
    setServerConfiguration,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

var searchInputSelector = 'div[data-test=study-search] input[type=text]';

function expressionDataAvailable() {
    return $(
        'span=mRNA Expression. Select one of the profiles below:'
    ).isExisting();
}

describe('plots tab expression data with rule configuration', function() {
    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        setServerConfiguration({
            enable_cross_study_expression: `
                (studies)=>studies.filter(s=>/pan_can_atlas/.test(s.studyId) === false).length === 0
            `,
        });
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

describe('plots tab expression data without rule configuration', function() {
    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        setServerConfiguration({
            enable_cross_study_expression: undefined,
        });
    });

    it('for multi study query that is NOT all pan_can, expression data is NOT available in plots', () => {
        const url = `/results/plots?cancer_study_list=acc_tcga_pan_can_atlas_2018%2Cchol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=all&gene_list=CDKN2A%2520MDM2&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL + url);
        waitForNetworkQuiet();

        browser.execute(() => {
            window.globalStores.appStore.serverConfig.enable_cross_study_expression = undefined;
        });

        $('.Select-arrow-zone').click();
        $('.Select-option=Mutation').waitForExist();
        assert.equal($('.Select-option=mRNA').isExisting(), false);

        $(
            'div=Expression data cannot be compared across the selected studies.'
        ).isExisting();
    });
});

describe('expression data in query form', function() {
    beforeEach(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        setServerConfiguration({
            enable_cross_study_expression: `
                (studies)=>studies.filter(s=>/pan_can_atlas/.test(s.studyId) === false).length === 0
            `,
        });

        waitForNetworkQuiet();
    });

    after(() => {
        setServerConfiguration({});
    });

    it('For single study with expression data, we can see expression data', () => {
        $('.studyItem_sarc_tcga_pub').click();
        getElementByTestHandle('queryByGeneButton').click();
        assert.equal(expressionDataAvailable(), true);
    });

    it("For single study without expression data, we AREN'T offered expression data", () => {
        $('.studyItem_chol_nccs_2013').click();

        getElementByTestHandle('queryByGeneButton').click();
        assert.equal(expressionDataAvailable(), false);
    });

    it("For two studies with expression data (only one pancan) we AREN'T offered expression data", () => {
        $('.studyItem_sarc_tcga_pub').click();
        $('.studyItem_chol_tcga_pan_can_atlas_2018').click();

        getElementByTestHandle('queryByGeneButton').click();

        assert.equal(expressionDataAvailable(), false);
    });

    it('For two studies (both pan can) with expression data we ARE offered expression data', () => {
        $('.studyItem_brca_tcga_pan_can_atlas_2018').click();
        $('.studyItem_chol_tcga_pan_can_atlas_2018').click();

        getElementByTestHandle('queryByGeneButton').click();

        assert.equal(expressionDataAvailable(), true);
    });
});

describe('cross study expression data without configuration rule', () => {
    beforeEach(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.execute(() => {
            window.globalStores.appStore.serverConfig.enable_cross_study_expression = undefined;
        });
    });

    it('without configuration rule, no multi study expression', () => {
        $('.studyItem_brca_tcga_pan_can_atlas_2018').click();
        $('.studyItem_chol_tcga_pan_can_atlas_2018').click();

        getElementByTestHandle('queryByGeneButton').click();

        assert.equal(expressionDataAvailable(), false);
    });

    it('without configuration rule, single study expression available', () => {
        $('.studyItem_brca_tcga_pan_can_atlas_2018').click();
        $('.studyItem_chol_tcga_pan_can_atlas_2018').click();

        getElementByTestHandle('queryByGeneButton').click();

        assert.equal(expressionDataAvailable(), false);
    });
});

describe('custom expression comparison rule', () => {
    beforeEach(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
        setServerConfiguration({
            enable_cross_study_expression:
                '(studies)=>studies.filter(s=>/gbm_cptac_2021/.test(s.studyId)).length > 0',
        });
    });

    it('with all pancan, expression NOT available', () => {
        $('.studyItem_brca_tcga_pan_can_atlas_2018').click();
        $('.studyItem_chol_tcga_pan_can_atlas_2018').click();

        getElementByTestHandle('queryByGeneButton').click();

        assert.equal(expressionDataAvailable(), false);
    });

    it('configuration rule is satisfied and expression available across study', () => {
        $('.studyItem_chol_tcga').click();
        $('.studyItem_gbm_cptac_2021').click();

        getElementByTestHandle('queryByGeneButton').click();

        assert.equal(expressionDataAvailable(), true);
    });

    it('single study still has expression despite rule', () => {
        $('.studyItem_chol_tcga_pan_can_atlas_2018').click();

        getElementByTestHandle('queryByGeneButton').click();

        assert.equal(expressionDataAvailable(), true);
    });
});
