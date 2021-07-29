var assert = require('assert');
var goToUrlAndSetLocalStorageWithProperty = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorageWithProperty;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const loggedInButton = '#rightHeaderContent .identity';

describe('hide logged-in button feature', function() {
    if (useExternalFrontend) {
        it('does not show logged-in button when portal property set', function() {
            goToUrlAndSetLocalStorageWithProperty(CBIOPORTAL_URL, true, {
                skin_hide_logout_button: true,
            });
            assert(!$(loggedInButton).isExisting());
        });
    }
});
