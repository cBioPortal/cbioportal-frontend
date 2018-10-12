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

    if (useExternalFrontend) {
        it('it should show dev mode when testing', function () {
            var devMode = $('.alert-warning');

            devMode.waitForExist(60000);
            assert(browser.getText('.alert-warning').indexOf('dev mode') > 0);
        });
    }

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

        browser.localStorage('POST', {key: 'frontendConfig', value: JSON.stringify({"serverConfig":{"skin_show_data_tab":false}}) });

        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.waitForExist("#rightHeaderContent");

        assert.equal(browser.isExisting("a=Data Sets"), false);

    });


});

