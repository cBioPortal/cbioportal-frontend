var goToUrlAndSetLocalStorage = require('../../shared/specUtils').goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('./../../shared/lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe("homepage", function () {

    it('shows the home page', () => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
        browser.waitForVisible('div[data-test="studyList"]');
        $('div[data-test="studyList"] input').setValue('dummy-study');
        var res = browser.checkElement('div[data-test="studyList"]');
        assertScreenShotMatch(res);
    });

})