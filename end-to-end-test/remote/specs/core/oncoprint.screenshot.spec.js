var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var setInputText = require('../../../shared/specUtils').setInputText;
var waitForNumberOfStudyCheckboxes = require('../../../shared/specUtils')
    .waitForNumberOfStudyCheckboxes;
var checkOncoprintElement = require('../../../shared/specUtils')
    .checkOncoprintElement;
var getGroupHeaderOptionsElements = require('../../../shared/specUtils')
    .getOncoprintGroupHeaderOptionsElements;
var setDropdownOpen = require('../../../shared/specUtils').setDropdownOpen;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const ONCOPRINT_TIMEOUT = 60000;

function getNthTrackOptionsElements(n) {
    // n is one-indexed

    const button_selector =
        '#oncoprintDiv .oncoprintjs__track_options__toggle_btn_img.nth-' + n;
    const dropdown_selector =
        '#oncoprintDiv .oncoprintjs__track_options__dropdown.nth-' + n;

    return {
        button: $(button_selector),
        button_selector,
        dropdown: $(dropdown_selector),
        dropdown_selector,
    };
}

describe('oncoprint screenshot tests', function() {
    it('coadread_tcga_pub with clinical and heatmap tracks', function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=coadread_tcga_pub_rna_seq_mrna_median_Zscores&show_samples=false&clinicallist=0%2C2%2CMETHYLATION_SUBTYPE&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF&`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('acc_tcga with clinical and heatmap tracks', function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1&data_priority=0&case_set_id=acc_tcga_all&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=acc_tcga_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=acc_tcga_rppa_Zscores&show_samples=false&clinicallist=0%2C1%2CMETASTATIC_DX_CONFIRMED_BY&heatmap_track_groups=acc_tcga_rna_seq_v2_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('blca_tcga with clinical and heatmap tracks', function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=blca_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1&data_priority=0&case_set_id=blca_tcga_pub_all&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_rna_seq_mrna_median_Zscores&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_rppa_Zscores&show_samples=false&heatmap_track_groups=blca_tcga_pub_rna_seq_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2&clinicallist=CANCER_TYPE_DETAILED%2CMETASTATIC_SITE_OTHER%2CNEW_TUMOR_EVENT_AFTER_INITIAL_TREATMENT`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('hcc_inserm_fr_2015 with genes including TERT - it should show orange promoter mutations in TERT', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/index.do?cancer_study_id=hcc_inserm_fr_2015&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=hcc_inserm_fr_2015_sequenced&gene_list=SOX9%2520RAN%2520TNK2%2520EP300%2520PXN%2520NCOA2%2520AR%2520NRIP1%2520NCOR1%2520NCOR2%2520TERT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=hcc_inserm_fr_2015_mutations`
        );
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('msk_impact_2017 with SOS1 - SOS1 should be not sequenced', function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('msk_impact_2017 with ALK and SOS1 - SOS1 should be not sequenced', function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('msk_impact_2017 with SOS1 with CNA profile - SOS1 should not be sequenced', function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('brca_tcga_pub with KRAS NRAS BRAF and methylation heatmap tracks', function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=brca_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=brca_tcga_pub_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic&show_samples=false&heatmap_track_groups=brca_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF%2CTP53%2CBRCA1%2CBRCA2`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('profiled in tracks in msk impact with 3 not profiled genes', function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=msk_impact_2017_cnaseq&gene_list=AKR1C1%2520AKR1C2%2520AKR1C4&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('profiled in tracks in a combined study', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?session_id=5c38e4c0e4b05228701fb0c9&show_samples=false`
        );
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('profiled in tracks in multiple study with SOS1', function() {
        var url = `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=msk_impact_2017%2Cbrca_tcga_pub&case_set_id=all&data_priority=0&gene_list=SOS1&geneset_list=%20&tab_index=tab_visualize`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('multiple tracks with same gene', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=acc_tcga_pan_can_atlas_2018&case_set_id=acc_tcga_pan_can_atlas_2018_cnaseq&data_priority=0&gene_list=EGFR%253AAMP%253BEGFR%253AMUT%253B%2520PTEN%253B%2520EGFR%2520EGFR&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_pan_can_atlas_2018_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_pan_can_atlas_2018_mutations&tab_index=tab_visualize`
        );
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('removes top treatment track successfully', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=ccle_broad_2019&case_set_id=ccle_broad_2019_cnaseq&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ccle_broad_2019_cna&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ccle_broad_2019_mutations&profileFilter=0&tab_index=tab_visualize&heatmap_track_groups=ccle_broad_2019_CCLE_drug_treatment_IC50%2CAfatinib-2%2CAKTinhibitorVIII-1&treatment_list=Afatinib-2%3BAKTinhibitorVIII-1`
        );
        waitForOncoprint(ONCOPRINT_TIMEOUT);

        const elements = getNthTrackOptionsElements(2);
        setDropdownOpen(
            true,
            elements.button_selector,
            elements.dropdown_selector,
            'Couldnt open top treatment track options'
        );
        browser.click(elements.dropdown_selector + ' li:nth-child(3)'); // Click Remove
        waitForOncoprint(ONCOPRINT_TIMEOUT);

        var res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('coadread_tcga_pub with column gaps inserted based on clinical track', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&clinicallist=CANCER_TYPE_DETAILED&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
        );
        waitForOncoprint(ONCOPRINT_TIMEOUT);

        const cancerTypeDetailedElements = getNthTrackOptionsElements(1);
        setDropdownOpen(
            true,
            cancerTypeDetailedElements.button_selector,
            cancerTypeDetailedElements.dropdown_selector,
            'Failed to open cancer type detailed track menu'
        );
        browser.click(
            `${cancerTypeDetailedElements.dropdown_selector} li:nth-child(9)`
        ); // Click "show gaps"
        browser.pause(100); // give time to sort and insert gaps

        // open minimap
        browser.waitForExist('[data-test="ShowMinimapButton"]');
        browser.click('[data-test="ShowMinimapButton"]');

        // zoom to fit
        browser.waitForVisible('.oncoprint-zoomtofit-btn');
        browser.click('.oncoprint-zoomtofit-btn');
        browser.pause(100); // give time to rezoom

        const res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
});

describe('track group headers', function() {
    beforeEach(function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF%3Bcoadread_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF&show_samples=false`
        );
        $('.alert-warning')
            .$('button.close')
            .click(); // close dev mode notification so it doesnt intercept clicks

        waitForOncoprint(ONCOPRINT_TIMEOUT);

        // Cluster the mrna heatmap group
        var mrnaElements = getGroupHeaderOptionsElements(2);
        setDropdownOpen(
            true,
            mrnaElements.button_selector,
            mrnaElements.dropdown_selector + ' li:nth-child(1)'
        );
        browser.click(mrnaElements.dropdown_selector + ' li:nth-child(1)'); // Click Cluster
        browser.pause(500); // give it time to sort
    });

    it('oncoprint should cluster heatmap group correctly', function() {
        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint should delete clustered heatmap group correctly', function() {
        // Remove the mrna heatmap group, leaving the methylation group and everything sorted by data
        var mrnaElements = getGroupHeaderOptionsElements(2);
        setDropdownOpen(
            true,
            mrnaElements.button_selector,
            mrnaElements.dropdown_selector + ' li:nth-child(4)',
            'could not open mrna group options dropdown'
        );
        browser.click(mrnaElements.dropdown_selector + ' li:nth-child(4)'); // Click Delete
        waitForOncoprint(10000);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint should delete non-clustered heatmap group correctly', function() {
        // Remove the methylation group, leaving the mrna group clustered
        var methylElements = getGroupHeaderOptionsElements(3);
        setDropdownOpen(
            true,
            methylElements.button_selector,
            methylElements.dropdown_selector + ' li:nth-child(4)',
            'could not open mrna group options dropdown'
        );
        browser.click(methylElements.dropdown_selector + ' li:nth-child(4)'); // Click Delete
        waitForOncoprint(10000);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint should return to non-clustered state correctly', function() {
        // Cluster the mrna heatmap group
        var mrnaElements = getGroupHeaderOptionsElements(2);
        setDropdownOpen(
            true,
            mrnaElements.button_selector,
            mrnaElements.dropdown_selector + ' li:nth-child(2)'
        );
        browser.click(mrnaElements.dropdown_selector + ' li:nth-child(2)'); // Click Don't Cluster
        browser.pause(500); // give it time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
});

describe('sorting', function() {
    it('oncoprint should sort patients correctly in coadread_tcga_pub', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        var inputSelector = '.autosuggest input[type="text"]';

        browser.waitForExist(inputSelector, 10000);

        setInputText(inputSelector, 'colorectal tcga nature');

        waitForNumberOfStudyCheckboxes(1);

        var checkBox = $('[data-test="StudySelect"]');

        checkBox.waitForExist(10000);

        browser.click('[data-test="StudySelect"] input');

        browser.click('a=Query By Gene');

        browser.pause(1000);

        // query KRAS NRAS BRAF
        $('[data-test="geneSet"]').setValue('KRAS NRAS BRAF');

        browser.waitForEnabled('[data-test="queryButton"]', 30000);

        browser.click('[data-test="queryButton"]');

        waitForOncoprint(ONCOPRINT_TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint should sort samples correctly in coadread_tcga_pub', function() {
        $(
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton'
        ).click(); // open view menu
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
        ).waitForExist(10000);
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
        ).click(); // go to sample mode

        waitForOncoprint(ONCOPRINT_TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint should sort patients correctly in gbm_tcga_pub', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        var inputSelector = '.autosuggest input[type="text"]';

        browser.waitForExist(inputSelector, 10000);

        setInputText(inputSelector, 'glio tcga nature 2008');

        waitForNumberOfStudyCheckboxes(1); // should only be one element

        var checkBox = $('[data-test="StudySelect"]');

        checkBox.waitForExist(500);

        browser.click('[data-test="StudySelect"] input');

        browser.click('a=Query By Gene');

        //browser.pause(500);

        // query KRAS NRAS BRAF
        $('[data-test="geneSet"]').setValue('TP53 MDM2 MDM4');

        browser.waitForEnabled('[data-test="queryButton"]', 30000);

        browser.click('[data-test="queryButton"]');

        waitForOncoprint(ONCOPRINT_TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint should sort samples correctly in gbm_tcga_pub', function() {
        $(
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton'
        ).click(); // open view menu
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
        ).waitForExist(10000);
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
        ).click(); // go to sample mode

        waitForOncoprint(ONCOPRINT_TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - initial patient order', function() {
        goToUrlAndSetLocalStorage(
            CBIOPORTAL_URL +
                '/index.do?cancer_study_id=gbm_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=gbm_tcga_pub_cnaseq&gene_list=TP53%20MDM2%20MDM4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae&clinicallist=FRACTION_GENOME_ALTERED%2CDFS_MONTHS%2CKARNOFSKY_PERFORMANCE_SCORE%2COS_STATUS&heatmap_track_groups=gbm_tcga_pub_mrna_median_Zscores%2CTP53%2CMDM2%2CMDM4%3Bgbm_tcga_pub_mrna_merged_median_Zscores%2CTP53%2CMDM2%2CMDM4'
        );
        $('.alert-warning')
            .$('button.close')
            .click(); // close dev mode notification so it doesnt intercept clicks

        waitForOncoprint(ONCOPRINT_TIMEOUT);

        // first get rid of the Profiled track
        var profiledElements = getNthTrackOptionsElements(5);
        browser.click(profiledElements.button_selector);
        browser.waitForVisible(profiledElements.dropdown_selector, 1000); // wait for menu to appear
        browser.click(profiledElements.dropdown_selector + ' li:nth-child(3)'); // Click Remove Track
        waitForOncoprint(2000);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprint sorts through a flow with clinical tracks sorted - initial sample order', function() {
        $(
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton'
        ).click(); // open view menu
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
        ).waitForVisible(10000);
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
        ).click(); // go to sample mode

        waitForOncoprint(ONCOPRINT_TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprint sorts through a flow with clinical tracks sorted - sorted patient order 1', function() {
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="1"]'
        ).waitForVisible(10000);
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="1"]'
        ).click(); // go to patient mode

        waitForOncoprint(ONCOPRINT_TIMEOUT);

        var overallSurvivalElements = getNthTrackOptionsElements(4);
        overallSurvivalElements.button.click();
        browser.waitForVisible(overallSurvivalElements.dropdown_selector, 1000); // wait for menu to appear
        overallSurvivalElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprint sorts through a flow with clinical tracks sorted - sorted patient order 2', function() {
        var overallSurvivalElements = getNthTrackOptionsElements(4);
        setDropdownOpen(
            true,
            overallSurvivalElements.button_selector,
            overallSurvivalElements.dropdown_selector,
            'couldnt show overall survival dropdown'
        );
        overallSurvivalElements.dropdown.$('li:nth-child(6)').click(); // Click sort Z-a
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted patient order 3', function() {
        var karnofskyPerformanceElements = getNthTrackOptionsElements(3);
        karnofskyPerformanceElements.button.click(); // open Karnofsky Performance clinical track menu
        browser.waitForVisible(
            karnofskyPerformanceElements.dropdown_selector,
            1000
        ); // wait for menu to appear
        karnofskyPerformanceElements.dropdown.$('li:nth-child(6)').click(); // Click sort Z-a
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted patient order 4', function() {
        var karnofskyPerformanceElements = getNthTrackOptionsElements(3);
        setDropdownOpen(
            true,
            karnofskyPerformanceElements.button_selector,
            karnofskyPerformanceElements.dropdown_selector,
            'couldnt show karnofsky performance dropdown'
        );
        karnofskyPerformanceElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 1', function() {
        while (
            !browser.isVisible(
                '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
            )
        ) {
            // behavior varies whether this menu is still visible, so we have to go into this loop to make sure its visible before clicking to sample mode
            browser.click(
                '.oncoprintContainer .oncoprint__controls #viewDropdownButton'
            ); // open view menu
            browser.pause(100);
        }
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
        ).click(); // go to sample mode

        waitForOncoprint(ONCOPRINT_TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 2', function() {
        var diseaseFreeElements = getNthTrackOptionsElements(2);
        diseaseFreeElements.button.click(); // open Disease Free (months) clinical track menu
        browser.waitForVisible(diseaseFreeElements.dropdown_selector, 1000); // wait for menu to appear
        diseaseFreeElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 3', function() {
        var diseaseFreeElements = getNthTrackOptionsElements(2);
        setDropdownOpen(
            true,
            diseaseFreeElements.button_selector,
            diseaseFreeElements.dropdown_selector,
            'couldnt show disease free dropdown'
        );
        diseaseFreeElements.dropdown.$('li:nth-child(6)').click(); // Click sort Z-a
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 4', function() {
        var fractionGenomeAlteredElements = getNthTrackOptionsElements(1);
        fractionGenomeAlteredElements.button.click(); // open Fraction Genome Altered clinical track menu
        browser.waitForVisible(
            fractionGenomeAlteredElements.dropdown_selector,
            1000
        ); // wait for menu to appear
        fractionGenomeAlteredElements.dropdown.$('li:nth-child(6)').click(); // Click sort Z-a
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 5', function() {
        var fractionGenomeAlteredElements = getNthTrackOptionsElements(1);
        setDropdownOpen(
            true,
            fractionGenomeAlteredElements.button_selector,
            fractionGenomeAlteredElements.dropdown_selector,
            'couldnt show fraction genome altered dropdown'
        );
        fractionGenomeAlteredElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 6', function() {
        // Sort TP53 heatmap track
        var TP53HeatmapElements = getNthTrackOptionsElements(8);
        TP53HeatmapElements.button.click(); // open Fraction Genome Altered clinical track menu
        browser.waitForVisible(TP53HeatmapElements.dropdown_selector, 1000); // wait for menu to appear
        browser.scroll(0, 1000); // scroll down
        browser.click(
            TP53HeatmapElements.dropdown_selector + ' li:nth-child(6)'
        ); // Click sort Z-a
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted sample order 1', function() {
        goToUrlAndSetLocalStorage(
            CBIOPORTAL_URL +
                '/index.do?cancer_study_id=gbm_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=gbm_tcga_pub_cnaseq&gene_list=TP53%2520MDM2%2520MDM4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae&clinicallist=FRACTION_GENOME_ALTERED%2CDFS_MONTHS%2CKARNOFSKY_PERFORMANCE_SCORE%2COS_STATUS&heatmap_track_groups=gbm_tcga_pub_mrna_median_Zscores%2CTP53%2CMDM2%2CMDM4%3Bgbm_tcga_pub_mrna_merged_median_Zscores%2CTP53%2CMDM2%2CMDM4&show_samples=true'
        );
        $('.alert-warning')
            .$('button.close')
            .click(); // close dev mode notification so it doesnt intercept clicks

        waitForOncoprint(ONCOPRINT_TIMEOUT);

        // first get rid of the Profiled track
        var profiledElements = getNthTrackOptionsElements(5);
        browser.click(profiledElements.button_selector);
        browser.waitForVisible(profiledElements.dropdown_selector, 1000); // wait for menu to appear
        browser.click(`${profiledElements.dropdown_selector} li:nth-child(3)`); // Click Remove Track
        browser.pause(100); // give time to take effect

        browser.scroll(0, 1000); //scroll down

        // Sort heatmap tracks
        var TP53HeatmapElements = getNthTrackOptionsElements(8);
        browser.click(TP53HeatmapElements.button_selector); // open track menu
        browser.waitForVisible(TP53HeatmapElements.dropdown_selector, 1000); // wait for menu to appear
        browser.click(
            TP53HeatmapElements.dropdown_selector + ' li:nth-child(6)'
        ); // Click sort Z-a
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted sample order 2', function() {
        var TP53HeatmapElements = getNthTrackOptionsElements(8);
        setDropdownOpen(
            true,
            TP53HeatmapElements.button_selector,
            TP53HeatmapElements.dropdown_selector,
            'couldnt show TP53 heatmap dropdown'
        );
        TP53HeatmapElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted sample order 3', function() {
        var TP53HeatmapElements = getNthTrackOptionsElements(8);
        setDropdownOpen(
            false,
            TP53HeatmapElements.button_selector,
            TP53HeatmapElements.dropdown_selector,
            'couldnt hide TP53 heatmap dropdown'
        );

        var MDM4HeatmapElements = getNthTrackOptionsElements(13);
        MDM4HeatmapElements.button.click(); // open track menu
        browser.waitForVisible(MDM4HeatmapElements.dropdown_selector, 1000); // wait for menu to appear
        MDM4HeatmapElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted sample order 4', function() {
        var MDM4HeatmapElements = getNthTrackOptionsElements(13);
        setDropdownOpen(
            true,
            MDM4HeatmapElements.button_selector,
            MDM4HeatmapElements.dropdown_selector,
            'couldnt show MDM4 heatmap dropdown'
        );
        MDM4HeatmapElements.dropdown.$('li:nth-child(6)').click(); // Click sort Z-a
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted sample order 5', function() {
        var TP53HeatmapElements = getNthTrackOptionsElements(8);
        TP53HeatmapElements.button.click(); // open track menu
        browser.waitForVisible(TP53HeatmapElements.dropdown_selector, 1000); // wait for menu to appear
        TP53HeatmapElements.dropdown.$('li:nth-child(7)').click(); // Click Don't sort
        browser.pause(100); // give time to sort

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted patient order 1', function() {
        $(
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton'
        ).click(); // open view menu
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="1"]'
        ).waitForExist(10000);
        $(
            '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="1"]'
        ).click(); // go to patient mode
        waitForOncoprint(ONCOPRINT_TIMEOUT);

        var res = checkOncoprintElement();
        assertScreenShotMatch(res);
    });
});
