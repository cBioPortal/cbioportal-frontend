var assert = require('assert');

var {
    getPortalUrlFromEnv,
    goToUrlAndSetLocalStorage,
    setInputText,
} = require('../../shared/specUtils');

const CBIOPORTAL_URL = `${getPortalUrlFromEnv()}/login.jsp`;
const CBIOPORTAL_BOT_PASSWORD = process.env.CBIOPORTAL_BOT_PASSWORD;

describe('login', function() {
    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('should login with the provided username and password', function() {
        browser.waitForVisible('[alt="cBioPortal Google+ Log-in"]', 10000);
        browser.click('[alt="cBioPortal Google+ Log-in"]');
        browser.waitForVisible('input[id=identifierId]', 10000);
        browser.pause(2000);
        setInputText('input[id=identifierId]', 'cbioportaldevops@gmail.com');
        browser.waitForVisible('div[id=identifierNext]');
        browser.pause(2000);
        browser.click('div[id=identifierNext]');
        browser.waitForVisible('input[type=password]', 10000);
        browser.pause(2000);
        setInputText('input[type=password]', CBIOPORTAL_BOT_PASSWORD);
        browser.waitForVisible('div[id=passwordNext]');
        browser.pause(2000);
        browser.click('div[id=passwordNext]');

        browser.waitForVisible('div[class=identity]', 10000);
        var identity = browser.getText('div[class=identity]');

        assert.ok(
            identity.includes('cbioportaldevops@gmail.com'),
            'user dropdown menu should contain the logged in email address'
        );
    });
});
