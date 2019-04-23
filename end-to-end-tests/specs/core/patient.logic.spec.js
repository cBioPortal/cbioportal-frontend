var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var getTextInOncoprintLegend = require('./specUtils').getTextInOncoprintLegend;
var setOncoprintMutationsMenuOpen = require('./specUtils').setOncoprintMutationsMenuOpen;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var useExternalFrontend = require('./specUtils').useExternalFrontend;
var waitForNumberOfStudyCheckboxes = require('./specUtils').waitForNumberOfStudyCheckboxes;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");



function setInputText(selector, text){
    browser.setValue(selector, '\uE003'.repeat(browser.getValue(selector).length) + text);
}

var searchInputSelector = ".autosuggest input[type=text]";

describe('patient page', function(){

    this.retries(2);
    before(()=>{
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('oncokb indicators show up and hovering produces oncocard', function(){

        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/patient?studyId=ucec_tcga_pub&caseId=TCGA-BK-A0CC`);

        browser.waitForExist('span=PPP2R1A');

        // find oncokb image
        const oncokbIcon = '[data-test2="PPP2R1A"][data-test="oncogenic-icon-image"]';
        browser.waitForExist(oncokbIcon, 30000);

        // move over oncokb image (this is deprecated, but there is no new
        // function yet)

        browser.waitForExist(oncokbIcon, 3000);
        browser.moveToObject(oncokbIcon,5,5);

        browser.waitForExist('[data-test="oncokb-card"]', 30000);

        assert.equal(browser.getText('[data-test="oncokb-card-title"]').toLowerCase(), 'ppp2r1a s256f in uterine serous carcinoma/uterine papillary serous carcinoma'.toLowerCase());
    });

});


