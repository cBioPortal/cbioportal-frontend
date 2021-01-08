var assert = require('assert');
var expect = require('chai').expect;
const {
    waitForOncoprint,
    setResultsPageSettingsMenuOpen,
    setOncoprintMutationsMenuOpen,
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    sessionServiceIsEnabled,
} = require('../../../shared/specUtils');

const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

var { COEXPRESSION_TIMEOUT } = require('../../../shared/specUtils');

function waitForAndCheckPlotsTab() {
    browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 10000);
    var res = browser.checkElement('div[data-test="PlotsTabEntireDiv"]', {
        hide: ['.qtip'],
    });
    assertScreenShotMatch(res);
}

function runResultsTestSuite(prefix, options = {}) {
    it(`${prefix} render the oncoprint`, function() {
        waitForOncoprint(10000);
        var res = browser.checkElement('.oncoprintContainer', {
            hide: ['.oncoprint__controls'],
        }); // just hide the controls bc for some reason they keep showing up transparent in this test only
        assertScreenShotMatch(res);
    });

    // can't get it to pass reliably
    it.skip(`${prefix} igv_tab tab`, function() {
        browser.click('a.tabAnchor_cnSegments');
        browser.waitForExist('#cnSegmentsFrame', 20000);
        var res = browser.checkElement('.cnSegmentsMSKTabs', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it(`${prefix} cancer type summary`, function() {
        browser.click('a.tabAnchor_cancerTypesSummary');
        browser.waitForVisible('[data-test="cancerTypeSummaryChart"]', 10000);
        browser.waitForExist('[data-test="cancerTypeSummaryWrapper"]', 5000);
        var res = browser.checkElement(
            '[data-test="cancerTypeSummaryWrapper"]',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} mutex tab`, function() {
        browser.click('a.tabAnchor_mutualExclusivity');
        var res = browser.checkElement(
            '[data-test="mutualExclusivityTabDiv"]',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} plots tab`, function() {
        browser.click('a.tabAnchor_plots');
        waitForAndCheckPlotsTab();
    });

    it(`${prefix} mutation tab`, function() {
        browser.click('a.tabAnchor_mutations');
        browser.waitForVisible('.borderedChart svg', 20000);
        var res = browser.checkElement('[data-test="mutationsTabDiv"]', {
            hide: [
                '.qtip',
                '[data-test=view3DStructure]',
                '[data-test=GeneSummaryUniProt]',
            ],
            viewportChangePause: 4000,
        }); // hide these things because the timing of data loading makes this test so flaky
        assertScreenShotMatch(res);
    });

    it.skip(`${prefix} coexpression tab`, function() {
        browser.click('a.tabAnchor_coexpression');
        browser.waitForVisible(
            'div[data-test="CoExpressionPlot"]',
            COEXPRESSION_TIMEOUT
        );
        var res = browser.checkElement('[data-test="coExpressionTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it(`${prefix} comparison tab overlap`, function() {
        browser.click('a.tabAnchor_comparison');
        browser.waitForVisible(
            'div[data-test="ComparisonPageOverlapTabContent"]'
        );
        var res = browser.checkElement('div[data-test="ComparisonTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it(`${prefix} comparison tab clinical`, function() {
        browser.click('.comparisonTabSubTabs .tabAnchor_clinical');
        browser.waitForVisible('div[data-test="ComparisonPageClinicalTabDiv"]');
        var res = browser.checkElement('div[data-test="ComparisonTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it(`${prefix} comparison tab mutation enrichments`, function() {
        browser.click('.comparisonTabSubTabs .tabAnchor_mutations');
        browser.waitForVisible(
            'div[data-test="GroupComparisonMutationEnrichments"]'
        );
        var res = browser.checkElement('div[data-test="ComparisonTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it(`${prefix} comparison tab mutation enrichments patient mode`, function() {
        browser.execute(function() {
            comparisonTab.store.setUsePatientLevelEnrichments(true);
        });
        browser.waitForVisible(
            'div[data-test="GroupComparisonMutationEnrichments"]'
        );
        var res = browser.checkElement('div[data-test="ComparisonTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it(`${prefix} comparison tab mrna enrichments`, function() {
        browser.click('.comparisonTabSubTabs .tabAnchor_mrna');
        browser.waitForVisible(
            'div[data-test="GroupComparisonMRNAEnrichments"]'
        );
        browser.click(options.mrnaEnrichmentsRowSelector || 'b=ETV5');
        browser.waitForVisible('div[data-test="MiniBoxPlot"]');
        var res = browser.checkElement('div[data-test="ComparisonTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it(`${prefix} survival tab`, function() {
        browser.click('.comparisonTabSubTabs a.tabAnchor_survival');
        browser.waitForVisible(
            '[data-test="ComparisonPageSurvivalTabDiv"] svg',
            10000
        );
        var res = browser.checkElement('[data-test="ComparisonTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it(`${prefix} pathwaymapper tab`, function() {
        // go to pathways tab
        browser.waitForVisible('a.tabAnchor_pathways');
        browser.click('a.tabAnchor_pathways');

        browser.waitForVisible('#cy', 10000);
        browser.waitForExist('div[data-test="pathwayMapperMessageBox"]', 4000);

        var res = browser.checkElement('[data-test="pathwayMapperTabDiv"]', {
            hide: ['.qtip', '.__react_component_tooltip', '.rc-tooltip'],
        });

        assertScreenShotMatch(res);
    });

    it.skip(`${prefix} network tab`, function() {
        // TODO: unskip this when bug is fixed

        browser.click('a.tabAnchor_network');

        browser.waitForExist('iframe#networkFrame', 10000);

        browser.frame('networkFrame', function(err, result) {
            if (err) console.log(err);
        });
        browser.waitForVisible('#cytoscapeweb canvas', 60000);
        browser.execute(function() {
            $('<style>canvas { visibility: hidden} </style>').appendTo('body');
        });
        browser.frame(null);
        var res = browser.checkElement('#networkFrame', {
            hide: ['.qtip', 'canvas'],
        });

        assertScreenShotMatch(res);
    });

    it.skip(`${prefix} data_download tab`, function() {
        browser.click('a.tabAnchor_download');
        //  browser.pause(1000);
        browser.waitForExist('#text_area_gene_alteration_freq', 20000);
        browser.waitUntil(function() {
            return (
                browser.getValue('#text_area_gene_alteration_freq').length > 0
            );
        }, 20000);
        var res = browser.checkElement('[data-test="downloadTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });
}

describe('result page screenshot tests', function() {
    before(function() {
        var url = `${CBIOPORTAL_URL}/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit&show_samples=false&`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
    });

    runResultsTestSuite('no session');
});

describe('download tab screenshot tests', function() {
    it('download tab - msk_impact_2017 with ALK and SOS1 - SOS1 should be not sequenced', function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        browser.waitForExist('a.tabAnchor_download', 10000);
        browser.click('a.tabAnchor_download');
        browser.waitForExist(
            '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg',
            20000
        );
        browser.waitForExist('[data-test="downloadTabDiv"]', 5000);
        var res = browser.checkElement('[data-test="downloadTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it('download tab - nsclc_tcga_broad_2016 with TP53', function() {
        var url = `${CBIOPORTAL_URL}/results/download?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&case_set_id=nsclc_tcga_broad_2016_cnaseq&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations&tab_index=tab_visualize`;
        goToUrlAndSetLocalStorage(url);
        browser.waitForExist(
            '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg',
            20000
        );
        browser.waitForExist('[data-test="downloadTabDiv"]', 5000);
        var res = browser.checkElement('[data-test="downloadTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it('download tab - nsclc_tcga_broad_2016 with CDKN2A MDM2 and merged track MDM4 TP53', function() {
        var url = `${CBIOPORTAL_URL}/results/download?Action=Submit&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0&case_set_id=nsclc_tcga_broad_2016_cnaseq&gene_list=CDKN2A%2520MDM2%2520%255B%2522MERGED%2522%2520MDM4%2520TP53%255D&RPPA_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations`;
        goToUrlAndSetLocalStorage(url);
        browser.waitForExist(
            '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg',
            20000
        );
        browser.waitForExist('[data-test="downloadTabDiv"]', 5000);
        var res = browser.checkElement('[data-test="downloadTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it('download tab - nsclc_tcga_broad_2016 for query EGFR: MUT=T790M AMP', function() {
        var url = `${CBIOPORTAL_URL}/results/download?Action=Submit&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0&case_set_id=nsclc_tcga_broad_2016_cnaseq&gene_list=EGFR%253A%2520MUT%253DT790M%2520AMP&RPPA_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations`;
        goToUrlAndSetLocalStorage(url);
        browser.waitForExist(
            '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg',
            20000
        );
        browser.waitForExist('[data-test="downloadTabDiv"]', 5000);
        var res = browser.checkElement('[data-test="downloadTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it('download tab - nsclc_tcga_broad_2016 with overlapping TP53', function() {
        var url = `${CBIOPORTAL_URL}/results/download?Action=Submit&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0&case_set_id=nsclc_tcga_broad_2016_cnaseq&gene_list=TP53%250ATP53%253A%2520AMP%250ATP53%253A%2520MUT&RPPA_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations`;
        goToUrlAndSetLocalStorage(url);
        browser.waitForExist(
            '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg',
            20000
        );
        browser.waitForExist('[data-test="downloadTabDiv"]', 5000);
        var res = browser.checkElement('[data-test="downloadTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });
});

describe('patient view page screenshot test', function() {
    it('patient view lgg_ucsf_2014 P04', function() {
        var url = `${CBIOPORTAL_URL}/patient?studyId=lgg_ucsf_2014&caseId=P04`;
        goToUrlAndSetLocalStorage(url);

        // find oncokb image
        var oncokbIndicator = $('[data-test="oncogenic-icon-image"]');
        oncokbIndicator.waitForExist(30000);
        // find vaf plot
        var vafPlot = $('.vafPlot');
        vafPlot.waitForExist(30000);

        var res = browser.checkElement('#mainColumn', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

    it('patient view with 0 mutations msk_impact_2017 P-0000053-T01-IM3', function() {
        var url = `${CBIOPORTAL_URL}/patient?sampleId=P-0000053-T01-IM3&studyId=msk_impact_2017`;
        goToUrlAndSetLocalStorage(url);

        // should show 0 mutations
        browser.waitForText('.//*[text()[contains(.,"0 Mutations")]]');

        // should show 21.6% copy number altered in genomic overview
        browser.waitForText('.//*[text()[contains(.,"21.6%")]]');

        // take screenshot
        var res = browser.checkElement('#mainColumn', { hide: ['.qtip'] });
        assertScreenShotMatch(res);
    });

    it('patient view pathways tab msk_impact_2017 P-0000377', function() {
        var url = `${CBIOPORTAL_URL}/patient?studyId=msk_impact_2017&caseId=P-0000377`;
        goToUrlAndSetLocalStorage(url);

        // go to pathways tab
        browser.waitForVisible('a.tabAnchor_pathways');
        browser.click('a.tabAnchor_pathways');

        browser.waitForVisible('#cy', 10000);
        var res = browser.checkElement('[data-test="pathwayMapperTabDiv"]', {
            hide: ['.qtip', '.__react_component_tooltip', '.rc-tooltip'],
        });

        assertScreenShotMatch(res);
    });
});

describe('enrichments tab screenshot tests', function() {
    before(function() {
        var url = `${CBIOPORTAL_URL}/results/enrichments?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit`;
        goToUrlAndSetLocalStorage(url);
    });
    it('enrichments tab coadread_tcga_pub mRNA profile', function() {
        browser.waitForVisible('.comparisonTabSubTabs .tabAnchor_mrna');
        browser.click('.comparisonTabSubTabs .tabAnchor_mrna');
        browser.waitForVisible(
            'div[data-test="GroupComparisonMRNAEnrichments"]'
        );
        browser.waitForVisible('a=mRNA', 10000);
        browser.click('a=mRNA');
        browser.waitForVisible(
            'div[data-test="GroupComparisonMRNAEnrichments"]',
            20000
        );
        browser.waitForVisible('b=MERTK', 10000);
        browser.click('b=MERTK');
        browser.waitForVisible('div[data-test="MiniBoxPlot"]', 20000);
        var res = browser.checkElement('div[data-test="ComparisonTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });
});

describe.skip('multi-study enrichments tab screenshot tests', function() {
    before(function() {
        var url = `${CBIOPORTAL_URL}/results/enrichments?Action=Submit&cancer_study_list=coadread_tcga_pub%2Cgbm_tcga_pub&case_set_id=all&clinicallist=CANCER_STUDY%2CPROFILED_IN_COPY_NUMBER_ALTERATION%2CPROFILED_IN_MUTATION_EXTENDED&data_priority=0&gene_list=APC%0ACDKN2B&show_samples=false&tab_index=tab_visualize`;
        goToUrlAndSetLocalStorage(url);
    });
    it('multi-study mutation enrichments tab', function() {
        browser.waitForVisible(
            'div[data-test="MutationEnrichmentsTab"]',
            10000
        );
        var res = browser.checkElement('[data-test="enrichmentsTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it('multi-study copy-number enrichments tab', function() {
        browser.click('a=Copy-number');
        browser.waitForVisible(
            'div[data-test="CopyNumberEnrichmentsTab"]',
            20000
        );
        var res = browser.checkElement('[data-test="enrichmentsTabDiv"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });
});

describe('result page tabs, loading from session id', function() {
    before(function() {
        // only run these tests if session service is enabled
        if (sessionServiceIsEnabled() === false) {
            this.skip();
        }

        var url = `${CBIOPORTAL_URL}/results?session_id=5bbe8197498eb8b3d5684271`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(15000);
    });

    runResultsTestSuite('session');
});

describe('results page tabs while excluding unprofiled samples', function() {
    before(() => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=gbm_tcga&case_set_id=gbm_tcga_all&data_priority=0&gene_list=EGFR%250APTEN%250AIDH1%250ATP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=gbm_tcga_mrna_median_all_sample_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_mutations&hide_unprofiled_samples=false&profileFilter=0&tab_index=tab_visualize`
        );
        waitForOncoprint(10000);
        setResultsPageSettingsMenuOpen(true);
        browser.waitForExist('input[data-test="HideUnprofiled"]');
        browser.click('input[data-test="HideUnprofiled"]');
        waitForOncoprint(10000);
        setResultsPageSettingsMenuOpen(false);
    });

    runResultsTestSuite('excluding unprofiled samples', {
        mrnaEnrichmentsRowSelector: 'b=PRR22',
    });
});

describe('error messaging for 400 error', function() {
    before(function() {
        var url = `${CBIOPORTAL_URL}/results/oncoprint?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pubb_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`;
        goToUrlAndSetLocalStorage(url);
    });

    it('should show error message for 400 query', function() {
        browser.waitForExist('.errorScreen');
    });

    it('should allow return to homepage after error message', function() {
        $('.errorLogo').click();
        browser.waitForExist('.homePageLayout');
    });
});

describe('error messaging for 404 error', function() {
    it('should show error message for wrong sample', function() {
        var url = `${CBIOPORTAL_URL}/patient?sampleId=not-a-sample&studyId=msk_impact_2017`;
        goToUrlAndSetLocalStorage(url);

        browser.waitForExist('.errorScreen');
        var res = browser.checkElement('.errorScreen', {
            hide: ['.form-group'],
        });
        assertScreenShotMatch(res);
    });

    it('should show error message for wrong patient', function() {
        var url = `${CBIOPORTAL_URL}/patient?studyId=msk_impact_2017&caseId=not-a-patient`;
        goToUrlAndSetLocalStorage(url);

        browser.waitForExist('.errorScreen');
        var res = browser.checkElement('.errorScreen', {
            hide: ['.form-group'],
        });
        assertScreenShotMatch(res);
    });
});
