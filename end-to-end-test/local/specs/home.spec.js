var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils').goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('homepage', function() {

    this.retries(2);

    before(()=>{
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    if (useExternalFrontend) {
        it('it should show dev mode when testing', function() {
            var devMode = $('.alert-warning');
            devMode.waitForExist(10000);
            assert(browser.getText('.alert-warning').indexOf('dev mode') > 0);
        });
    }

});
