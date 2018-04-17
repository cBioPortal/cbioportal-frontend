var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var useExternalFrontend = require('./specUtils').useExternalFrontend;
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('patient page', function(){

    this.retries(2);
    before(()=>{
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('oncokb indicators show up and hovering produces oncocard', function(){

        browser.url(`${CBIOPORTAL_URL}/case.do#/patient?studyId=ucec_tcga_pub&caseId=TCGA-BK-A0CC`);

        browser.waitForExist('span=PPP2R1A');

        // find oncokb image
        var oncokbIndicator = $('[data-test="oncogenic-icon-image"]');
        oncokbIndicator.waitForExist(30000);

        // move over oncokb image (this is deprecated, but there is no new
        // function yet)

        browser.pause(3000);
        browser.moveToObject('[data-test="oncogenic-icon-image"]',5,5);

        var oncokbCard = $('[data-test="oncokb-card"]');

        oncokbCard.waitForExist(30000);

        assert.equal(browser.getText('.tip-header').toLowerCase(), 'ppp2r1a s256f in uterine serous carcinoma/uterine papillary serous carcinoma'.toLowerCase());

    });

});

describe('patient view page screenshot test', function(){
    before(()=>{
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/case.do#/patient?studyId=lgg_ucsf_2014&caseId=P04`);
    });

    it('patient view lgg_ucsf_2014 P04', function() {
        // find oncokb image
        var oncokbIndicator = $('[data-test="oncogenic-icon-image"]');
        oncokbIndicator.waitForExist(30000);
        // find vaf plot
        var vafPlot = $('.vafPlot');
        vafPlot.waitForExist(30000);

        var res = browser.checkElement('#mainColumn', {hide:['.qtip'] });
        assertScreenShotMatch(res);
    });
});
