var assert = require('assert');
var expect = require('chai').expect;

const asyncUtils = require('../../../shared/specUtils_Async');

const {
    clickQueryByGeneButton,
    waitForNumberOfStudyCheckboxes,
    waitForOncoprint,
    goToUrlAndSetLocalStorage,
    getElementByTestHandle,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const ONCOPRINT_TIMEOUT = 15000;

const ALL_CASE_SET_REGEXP = /^All \(\d+\)$/;

describe('Invalid query handling', () => {
    it('shows query form if no genes are submitted', () => {
        const url = `${CBIOPORTAL_URL}/results/oncoprint?cancer_study_list=metastatic_solid_tumors_mich_2017`;
        goToUrlAndSetLocalStorage(url);
        $('[data-test="studyList"]').waitForDisplayed();

        assert($('[data-test="studyList"]').isDisplayed());

        const elem = $('.studyItem_metastatic_solid_tumors_mich_2017'); // or $(() => document.getElementById('elem'))
        const checkbox = elem.$(function() {
            return this.previousSibling;
        });
        assert(checkbox.isSelected(), 'study in url is selected in query form');
    });
});

describe('cross cancer query', function() {
    it('should show cross cancer bar chart be defai;t with TP53 in title when selecting multiple studies and querying for single gene TP53', async function() {
        await asyncUtils.goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_list=chol_tcga%2Cblca_tcga_pub%2Ccoadread_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=all&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );

        // wait for cancer types summary to appear
        await asyncUtils.getElementByTestHandle('cancerTypeSummaryChart', {
            timeout: 60000,
        });

        // check if TP53 is in the navigation above the plots
        await browser.waitUntil(() => {
            return $('.nav-pills*=TP53').isDisplayed();
        });
    });
});

describe('single study query', async function() {
    this.retries(0);

    describe('mutation mapper ', async function() {
        it('should show somatic and germline mutation rate', async () => {
            await asyncUtils.goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);

            const input = await $('[data-test=study-search] input[type=text]');

            await input.waitForExist({ timeout: 10000 });

            await input.setValue('ovarian nature 2011');

            await asyncUtils.waitForNumberOfStudyCheckboxes(1);

            await asyncUtils.clickElement('[data-test="StudySelect"] input');

            await asyncUtils.clickQueryByGeneButton();

            // query BRCA1 and BRCA2
            const geneInput = await $('[data-test="geneSet"]');
            geneInput.setValue('BRCA1 BRCA2');

            await (await $('[data-test="queryButton"]')).waitForEnabled({
                timeout: 10000,
            });

            await asyncUtils.clickElement('handle=queryButton', {
                timeout: 10000,
            });

            await asyncUtils.clickElement('a.tabAnchor_mutations', {
                timeout: 10000,
            });

            await asyncUtils.clickElement('handle=mutation-rate-summary', {
                timeout: 6000,
            });

            const text = await asyncUtils.getText(
                '[data-test="mutation-rate-summary"]'
            );

            // check germline mutation rate
            assert(text.search('8.2%') > -1);
            // check somatic mutation
            assert(text.search('3.5%') > -1);
        });

        it('should show lollipop for MUC2', async function() {
            await asyncUtils.goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=cellline_nci60&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=cellline_nci60_cnaseq&gene_list=MUC2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=cellline_nci60_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=cellline_nci60_cna`
            );

            await asyncUtils.clickElement('a.tabAnchor_mutations', {
                timeout: 10000,
            });

            await asyncUtils.getElementByTestHandle('LollipopPlot', {
                timeout: 6000,
            });
        });
    });

    describe('enrichments', function() {
        //this.retries(3)

        it('should show mutations plot', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?cancer_study_id=ov_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=ov_tcga_pub_cna_seq&gene_list=BRCA1+BRCA2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ov_tcga_pub_gistic`
            );

            $('.comparisonTabSubTabs .tabAnchor_alterations').waitForExist();
        });
    });
});

describe('results page', function() {
    this.retries(0);

    describe('tab hiding', function() {
        it('should hide coexpression and cn segment tabs in a query without any data for those tabs', () => {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?session_id=5bc64b48498eb8b3d5685af7`
            );
            waitForOncoprint();
            assert(!$('a.tabAnchor_coexpression').isDisplayed());
            assert(!$('a.tabAnchor_cnSegments').isDisplayed());
        });
        it('should hide survival tab in a query without any survival data', () => {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?session_id=5bc64bb5498eb8b3d5685afb`
            );
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForDisplayed({
                timeout: 20000,
            });
            assert(!$('a.tabAnchor_survival').isDisplayed());
        });
    });
    describe('mutual exclusivity tab', function() {
        it('should appear in a single study query with multiple genes', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%2520NRAS%2520BRAF%250APTEN%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`
            );
            $('a.tabAnchor_mutualExclusivity').waitForExist({ timeout: 10000 });

            assert($('a.tabAnchor_mutualExclusivity').isDisplayed());
        });
        it('should appear in a multiple study with multiple genes', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS%2520NRAS%2520BRAF%250APTEN%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga`
            );
            $('a.tabAnchor_mutualExclusivity').waitForExist({ timeout: 10000 });

            assert($('a.tabAnchor_mutualExclusivity').isDisplayed());
        });
        it('should not appear in a single study query with one gene', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`
            );
            waitForOncoprint();
            assert(!$('a.tabAnchor_mutualExclusivity').isDisplayed());

            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`
            );
            waitForOncoprint();
            assert(!$('a.tabAnchor_mutualExclusivity').isDisplayed());
        });
        it('should not appear in a multiple study query with one gene', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga`
            );
            $('a.tabAnchor_oncoprint').waitForExist({ timeout: 10000 });
            browser.waitUntil(function() {
                return !$('a.tabAnchor_mutualExclusivity').isDisplayed();
            });
            assert(!$('a.tabAnchor_mutualExclusivity').isDisplayed());
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga`
            );
            $('a.tabAnchor_oncoprint').waitForExist({ timeout: 10000 });
            browser.waitUntil(function() {
                return !$('a.tabAnchor_mutualExclusivity').isDisplayed();
            });
            assert(!$('a.tabAnchor_mutualExclusivity').isDisplayed());
        });
    });
});

describe('case set selection in modify query form', function() {
    var selectedCaseSet_sel =
        'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

    this.retries(2);

    beforeEach(function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_rppa&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;
        goToUrlAndSetLocalStorage(url);
        $('#modifyQueryBtn').waitForExist({ timeout: 60000 });
    });

    it('contains correct selected case set through a certain use flow involving two selected studies', () => {
        //populates case set selector with selected case set in current query, then selects "All" when more studies are selected, then selects default when only one is selected again
        // open query form
        $('#modifyQueryBtn').click();
        $(selectedCaseSet_sel).waitForExist({ timeout: 10000 });
        assert.equal(
            $(selectedCaseSet_sel).getText(),
            'Samples with protein data (RPPA) (196)',
            'Initially selected case set should be as specified from URL'
        );

        // Select a different study
        var input = $('div[data-test=study-search] input[type=text]');
        input.waitForExist({ timeout: 10000 });
        input.setValue('adrenocortical carcinoma tcga firehose legacy');
        waitForNumberOfStudyCheckboxes(1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist({ timeout: 10000 });
        $('[data-test="StudySelect"] input').click();
        browser.pause(100);

        getElementByTestHandle('COPY_NUMBER_ALTERATION').waitForExist({
            timeout: 10000,
        });

        $(selectedCaseSet_sel).waitForExist({ timeout: 10000 });
        assert(
            ALL_CASE_SET_REGEXP.test($(selectedCaseSet_sel).getText()),
            "'All' case set"
        );

        // Uncheck study
        $('[data-test="StudySelect"] input').click();
        browser.pause(100);

        $(selectedCaseSet_sel).waitForExist({ timeout: 10000 });
        assert.equal(
            $(selectedCaseSet_sel).getText(),
            'Samples with mutation and CNA data (212)',
            'Now we should be back to default selected case set for this study'
        );
    });

    it('contains correct selected case set through a certain use flow involving the "select all filtered studies" checkbox', () => {
        //populates case set selector with selected case set in current query, then selects "All" when more studies are selected, then selects default when only one is selected again
        // open query form
        $('#modifyQueryBtn').click();
        $(selectedCaseSet_sel).waitForExist({ timeout: 10000 });
        assert.equal(
            $(selectedCaseSet_sel).getText(),
            'Samples with protein data (RPPA) (196)',
            'Initially selected case set should be as specified from URL'
        );

        // Select all impact studies
        var input = $('div[data-test=study-search] input[type=text]');
        input.waitForExist({ timeout: 10000 });
        input.setValue('glioblastoma');
        browser.pause(500);

        $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();

        getElementByTestHandle('MUTATION_EXTENDED').waitForExist({
            timeout: 10000,
        });
        getElementByTestHandle('COPY_NUMBER_ALTERATION').waitForExist({
            timeout: 10000,
        });

        $(selectedCaseSet_sel).waitForExist({ timeout: 10000 });
        browser.waitUntil(() => {
            return ALL_CASE_SET_REGEXP.test($(selectedCaseSet_sel).getText());
        }, 5000);

        // Deselect all filtered studies
        $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();
        browser.pause(100);

        $(selectedCaseSet_sel).waitForExist({ timeout: 10000 });
        assert.equal(
            $(selectedCaseSet_sel).getText(),
            'Samples with mutation and CNA data (212)',
            'Now we should be back to default selected case set for this study'
        );
    });
});

describe('gene list input', function() {
    beforeEach(function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_rppa&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;
        goToUrlAndSetLocalStorage(url);
        $('#modifyQueryBtn').waitForExist({ timeout: 60000 });
    });

    // we're testing this because it was broken
    it('allows gene textarea update', () => {
        $('#modifyQueryBtn').click();
        const textarea = getElementByTestHandle('geneSet');
        textarea.waitForDisplayed();
        textarea.setValue('TP53 BRAF');

        assert(textarea.getValue() === 'TP53 BRAF');
    });
});

describe('genetic profile selection in modify query form', function() {
    beforeEach(function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=chol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=chol_tcga_all&gene_list=EGFR&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=chol_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=chol_tcga_gistic&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=chol_tcga_rppa_Zscores`;
        goToUrlAndSetLocalStorage(url);
        $('#modifyQueryBtn').waitForExist({ timeout: 20000 });
    });

    it('contains correct selected genetic profiles through a certain use flow involving two studies', async () => {
        //populates selected genetic profiles from current query, then goes back to defaults if another study is selected then deselected
        // open modify query form
        $('#modifyQueryBtn').click();

        browser.waitUntil(() => {
            return $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ).isSelected();
        });

        await asyncUtils.isSelected(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
        );

        await asyncUtils.isSelected(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
        );

        await asyncUtils.isSelected(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
        );

        await asyncUtils.isSelected(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'
        );

        // select another study
        var input = await $('div[data-test=study-search] input[type=text]');
        await input.waitForExist({ timeout: 10000 });
        await input.setValue('ampullary baylor');
        await asyncUtils.waitForNumberOfStudyCheckboxes(1);
        const checkBox = await $('[data-test="StudySelect"]');
        await checkBox.waitForExist({ timeout: 10000 });

        await asyncUtils.clickElement(`[data-test="StudySelect"] input`);

        await asyncUtils.isSelected('handle=MUTATION_EXTENDED');

        await asyncUtils.isSelected('handle=COPY_NUMBER_ALTERATION');

        await asyncUtils.isSelected('handle=COPY_NUMBER_ALTERATION');

        //deselect other study so that available profile types will change
        await asyncUtils.clickElement(`[data-test="StudySelect"] input`);

        await asyncUtils.isSelected('handle=MUTATION_EXTENDED');

        await asyncUtils.isSelected('handle=COPY_NUMBER_ALTERATION');

        await asyncUtils.isUnselected('handle=MRNA_EXPRESSION');

        await asyncUtils.isUnselected('handle=PROTEIN_LEVEL');
    });

    it('contains correct selected genetic profiles through a certain use flow involving the "select all filtered studies" checkbox', () => {
        //populates selected genetic profiles from current query, then goes back to defaults if a lot of studies are selected then deselected
        // open modify query form
        $('#modifyQueryBtn').click();
        // wait for profiles selector to load
        getElementByTestHandle('MUTATION_EXTENDED', {
            timeout: 10000,
        });

        // mutations, CNA, and protein should be selected
        assert(
            getElementByTestHandle('COPY_NUMBER_ALTERATION').isSelected(),
            'mutation profile should be selected'
        );
        assert(
            getElementByTestHandle('MUTATION_EXTENDED').isSelected(),
            'cna profile should be selected'
        );
        assert(
            !$(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ).isSelected(),
            'mrna profile not selected'
        );
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'
            ).isSelected(),
            'protein level should be selected'
        );

        // select all TCGA non-firehose studies
        var input = $('div[data-test=study-search] input[type=text]');
        input.waitForExist({ timeout: 10000 });
        input.setValue('tcga -firehose');
        browser.pause(500);

        $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();

        // wait for data type priority selector to load
        // getElementByTestHandle('MUTATION_EXTENDED').waitForExist({
        //     timeout: 10000,
        // });

        browser.waitUntil(() => {
            return getElementByTestHandle('MUTATION_EXTENDED').isSelected();
        });

        //browser.debug();

        assert(
            getElementByTestHandle('COPY_NUMBER_ALTERATION').isSelected(),
            "'Copy number alterations' should be selected"
        );

        // Deselect all TCGA non-firehose studies
        $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();
        browser.pause(100);

        // wait for profiles selector to load
        $(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]'
        ).waitForExist({ timeout: 3000 });
        // mutations, CNA should be selected
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ).isSelected(),
            'mutation profile should be selected'
        );
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ).isSelected(),
            'cna profile should be selected'
        );
        assert(
            !$(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ).isSelected(),
            'mrna profile not selected'
        );
        assert(
            !$(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'
            ).isSelected(),
            'protein level not selected'
        );
    });
});

describe('invalid query from url', function() {
    this.retries(1);

    it('show invalid query alert when url contains invalid gene', () => {
        //go to cbioportal with a url that contains an invalid gene symbol RB:
        var url = `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=mixed_pipseq_2017&case_set_id=mixed_pipseq_2017_sequenced&clinicallist=NUM_SAMPLES_PER_PATIENT&data_priority=0&gene_list=RB&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=mixed_pipseq_2017_mutations&show_samples=false&tab_index=tab_visualize`;
        goToUrlAndSetLocalStorage(url);

        // check alert message
        $('[data-test="invalidQueryAlert"]').waitForExist({ timeout: 60000 });
        var text = $('[data-test="invalidQueryAlert"]')
            .getText()
            .trim();
        assert.equal(
            text,
            'Your query has invalid or out-dated gene symbols. Please correct below.'
        );
    });

    it('show result view page after correct the invalid gene', () => {
        // correct to valid gene symbol RB1
        $('[data-test="geneSet"]').setValue('RB1');

        $('[data-test="queryButton"]').waitForEnabled({ timeout: 15000 });
        $('[data-test="queryButton"]').click();

        $('#modifyQueryBtn').waitForExist({ timeout: 3000 });
        waitForOncoprint();
    });
});
