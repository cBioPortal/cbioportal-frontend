var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var useExternalFrontend = require('./specUtils').useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('results page expression tab', ()=>{

    before(()=>{
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL + "/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=EGFR&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=chol_tcga_pan_can_atlas_2018%2Cchol_tcga%2Cblca_dfarber_mskcc_2014#cc-plots");
    });

    function getSelectedStudies(studyCheckboxes){

        return studyCheckboxes.filter(function(el){
            return el.isSelected();
        });
    }

    it('study selection modal filters work properly', function(){

        var buttonElement = $('[data-test="ExpressionStudyModalButton"]');

        buttonElement.waitForExist(20000);

        browser.click('[data-test="ExpressionStudyModalButton"]');

        browser.pause(100);

        assert.equal(browser.isVisible('[data-test="ExpressionStudyModalButton"]'), true, 'modal is visible');

        var studyCheckboxes = browser.elements('[data-test="ExpressionStudyModal"] input[type=checkbox]').value;

        assert.equal(studyCheckboxes.length, 3, 'all studies are selected');

        assert.equal(getSelectedStudies(studyCheckboxes).length, 2, 'all studies with data selected by default');

        browser.click('[data-test="ExpressionStudyUnselectAll"]');

        assert.equal(getSelectedStudies(studyCheckboxes).length, 0, 'no studies are selected');

        browser.click('[data-test="ExpressionStudySelectAll"]');

        assert.equal(getSelectedStudies(studyCheckboxes).length, 2, 'all studies with data selected');

    });


})