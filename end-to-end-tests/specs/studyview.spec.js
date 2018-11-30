var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('./specUtils').waitForNetworkQuiet;
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('new study view screenshot test', function(){
    before(function(){
        var url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        goToUrlAndSetLocalStorage(url);
    });
     it('new study view laml_tcga', function() {
        browser.waitForVisible('#mainColumn',10000);
        waitForNetworkQuiet();
        var res = browser.checkElement('#mainColumn', {hide:['.qtip', '#footer-span-version'] });
        assertScreenShotMatch(res);
    });
     it('new study view laml_tcga clinical data clicked', function() {
        browser.click('.tabAnchor_clinicalData');
        browser.waitForVisible('#mainColumn',10000);
        waitForNetworkQuiet();
        var res = browser.checkElement('#mainColumn', {hide:['.qtip', '#footer-span-version'] });
        assertScreenShotMatch(res);
    });
});