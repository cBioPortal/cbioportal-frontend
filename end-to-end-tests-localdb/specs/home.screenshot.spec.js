var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe("homepage", function () {

    it('shows the home page', () => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
        browser.waitForVisible('div[data-test="studyList"]', 20000);
        $('div[data-test="studyList"] input').setValue('dummy-study');
        var res = browser.checkElement('div[data-test="studyList"]');
        assertScreenShotMatch(res);
    });

})