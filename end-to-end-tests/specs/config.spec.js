var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var useExternalFrontend = require('./specUtils').useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('homepage', function() {

    this.retries(2);

    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.localStorage('POST', {key: 'frontendConfig', value: "{}"});


    });

    afterEach(()=>{
        browser.localStorage('POST', {key: 'frontendConfig', value: JSON.stringify({"serverConfig":{}}) });
    });

    it('test login observes authenticationMethod config property', function () {

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.waitForExist("#rightHeaderContent");

        browser.isExisting("button=Login");

        browser.localStorage('POST', {key: 'frontendConfig', value: JSON.stringify({"serverConfig":{"authenticationMethod":null}}) });

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.waitForExist("#rightHeaderContent");

        assert.equal(browser.isExisting("button=Login"), false);

    });

    it('test login observes authenticationMethod config property', function () {

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.waitForExist("#rightHeaderContent");

        browser.isExisting("a=Data Sets");

        setServerConfiguration({"skin_show_data_tab":false});

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.waitForExist("#rightHeaderContent");

        assert.equal(browser.isExisting("a=Data Sets"), false);

    });


    it('shows right logo in header bar depending on skin_right_logo', function () {

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.waitForExist("#rightHeaderContent");

        var test = browser.execute(function(){
            return $("img[src='images/msk_logo_transparent_black.png']").length === 0;
        });

        assert.equal(test.value, true);

        setServerConfiguration({"skin_right_logo":"msk_logo_transparent_black.png"});

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.waitForExist("#rightHeaderContent");

        assert(testJqueryExpression(()=>{
            return $("img[src='images/msk_logo_transparent_black.png']").length > 0;
        }));

    });

    it('shows skin_blurb as configured', function () {

        setServerConfiguration({"skin_blurb":"<div id='blurbDiv'>This is the blurb</div>"});

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.waitForExist("#blurbDiv");

    });



});

function testJqueryExpression(callback){
    return browser.execute(callback).value;
}

function setServerConfiguration(serverConfig){
    browser.localStorage('POST', {key: 'frontendConfig', value: JSON.stringify({"serverConfig":serverConfig}) });
}