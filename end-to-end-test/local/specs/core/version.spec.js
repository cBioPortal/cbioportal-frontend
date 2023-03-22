var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils')
    .useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

// this consoles the backend version to make sure
// we are running correct backend
describe('Backend version', function() {
    it('Retrieves backend info', () => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        browser.setTimeout({ script: 5000 });
        const d = browser.executeAsync(function(done) {
            // browser context - you may not access client or console
            fetch('/api/info').then(d => {
                d.json().then(t => {
                    done(JSON.stringify(t));
                });
            });
        });
        console.log(d);
    });
});
