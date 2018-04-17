var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var useExternalFrontend = require('./specUtils').useExternalFrontend;
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('case set selection in front page query form', function(){
    var selectedCaseSet_sel = 'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

    this.retries(2);

    beforeEach(function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('selects the default case set for single study selections', ()=>{
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ovarian nature 2011');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumors with sequencing and CNA data (316)",
            "Default selected case set"
        );
    });
    it('selects the right default case sets in a single->multiple->single study selection flow', ()=>{
        // Select Ampullary Carcinoma
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Sequenced Tumors (160)",
            "Default selected case set"
        );

        // select Adrenocortical Carcinoma
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('adrenocortical carcinoma tcga provisional');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "All",
            "Default case set for multiple"
        );

        // Deselect Ampullary Carcinoma
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumor Samples with sequencing and CNA data (88)",
            "Default selected case set for adrenocortical carcinoma"
        );
    });
    it('selects the right default case sets in a single->select all filtered->single study selection flow', ()=>{
        // Select Ampullary Carcinoma
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Sequenced Tumors (160)",
            "Default selected case set"
        );

        // select all TCGA non-provisional
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('tcga -provisional');
        browser.pause(500);
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');
        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "All",
            "Default selected case set with multiple studies should be 'All'"
        );

        // Deselect all tcga -provisional studies
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');
        browser.pause(100);

        // select Adrenocortical Carcinoma
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('adrenocortical carcinoma tcga provisional');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "All",
            "Default case set for multiple"
        );

        // Deselect Ampullary Carcinoma
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumor Samples with sequencing and CNA data (88)",
            "Default selected case set for adrenocortical carcinoma"
        );
    });
});

describe('case set selection in modify query form', function(){
    var selectedCaseSet_sel = 'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

    this.retries(2);

    beforeEach(function(){
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_rppa&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;
        goToUrlAndSetLocalStorage(url);
        browser.waitForExist("#modifyQueryBtn", 60000)
    });

    it('contains correct selected case set through a certain use flow involving two selected studies', ()=>{
        //populates case set selector with selected case set in current query, then selects "All" when more studies are selected, then selects default when only one is selected again
        // open query form
        $('#modifyQueryBtn').click();
        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumors with RPPA data (196)",
            "Initially selected case set should be as specified from URL"
        );

        // Select a different study
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('adrenocortical carcinoma tcga provisional');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');
        browser.pause(100);

        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "All",
            "Default selected case set with multiple studies should be 'All'"
        );

        // Uncheck study
        browser.click('[data-test="StudySelect"] input');
        browser.pause(100);

        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumors with sequencing and CNA data (212)",
            "Now we should be back to default selected case set for this study"
        );
    });

    it('contains correct selected case set through a certain use flow involving the "select all filtered studies" checkbox', ()=>{
        //populates case set selector with selected case set in current query, then selects "All" when more studies are selected, then selects default when only one is selected again
        // open query form
        $('#modifyQueryBtn').click();
        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumors with RPPA data (196)",
            "Initially selected case set should be as specified from URL"
        );

        // Select all tcga -provisional studies
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('impact');
        browser.pause(500);

        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');
        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "All",
            "Default selected case set with multiple studies should be 'All'"
        );

        // Deselect all tcga -provisional studies
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');
        browser.pause(100);

        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumors with sequencing and CNA data (212)",
            "Now we should be back to default selected case set for this study"
        );
    });
});

describe('genetic profile selection in modify query form', function(){

    this.retries(2);

    beforeEach(function(){
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=chol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=chol_tcga_all&gene_list=EGFR&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=chol_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=chol_tcga_gistic&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=chol_tcga_rppa_Zscores`;
        goToUrlAndSetLocalStorage(url);
        browser.waitForExist("#modifyQueryBtn", 60000)
    });

    it('contains correct selected genetic profiles through a certain use flow involving two studies', ()=>{
        //populates selected genetic profiles from current query, then goes back to defaults if another study is selected then deselected
        // open modify query form
        $('#modifyQueryBtn').click();
        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA, and protein should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'), "protein level should be selected");

        // select another study
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        // wait for data type priority selector to load
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="radio"][data-test="MC"]', 10000);
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="radio"][data-test="MC"]'), "mutation and cna option should be selected");

        //deselect other study
        browser.click('[data-test="StudySelect"] input');

        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'), "protein level not selected");
    });

    it('contains correct selected genetic profiles through a certain use flow involving the "select all filtered studies" checkbox', ()=>{
        //populates selected genetic profiles from current query, then goes back to defaults if a lot of studies are selected then deselected
        // open modify query form
        $('#modifyQueryBtn').click();
        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA, and protein should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'), "protein level should be selected");

        // select all TCGA non-provisional
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('tcga -provisional');
        browser.pause(500);
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');

        // wait for data type priority selector to load
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="radio"][data-test="MC"]', 10000);
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="radio"][data-test="MC"]'), "mutation and cna option should be selected");

        // Deselect all tcga -provisional studies
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');
        browser.pause(100);

        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'), "protein level not selected");
    });
});

describe('genetic profile selection in front page query form', ()=>{
    beforeEach(function(){
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });
    it('selects the right default genetic profiles in a single->multiple->single study selection flow', ()=>{
        // select a study
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ovarian nature 2011');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');
        browser.pause(200);

        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");

        // select another study
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        // wait for data type priority selector to load
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="radio"][data-test="MC"]', 10000);
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="radio"][data-test="MC"]'), "mutation and cna option should be selected");

        //deselect other study
        browser.click('[data-test="StudySelect"] input');

        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");

        // select all tcga provisional
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('tcga provisional');
        browser.pause(500);
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');

        // wait for data type priority selector to load
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="radio"][data-test="MC"]', 10000);
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="radio"][data-test="MC"]'), "mutation and cna option should be selected");

        // Deselect all tcga provisional studies
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');
        browser.pause(100);

        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");
    });
});
