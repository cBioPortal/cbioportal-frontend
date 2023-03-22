var assert = require('assert');
var goToUrlAndSetLocalStorageWithProperty = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorageWithProperty;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('displays appropriate user name/email', function() {
    it('shows email in the logged-in button with new value defined', function() {
        userEmailAddress = 'other@email.com';
        goToUrlAndSetLocalStorageWithProperty(CBIOPORTAL_URL, true, {
            user_display_name: userEmailAddress,
        });
        assert.equal(
            $('#dat-dropdown.btn-sm.dropdown-toggle.btn.btn-default').getText(),
            'Logged in as ' + userEmailAddress + ' '
        );
    });

    it('does not display login button if no value defined', function() {
        goToUrlAndSetLocalStorageWithProperty(CBIOPORTAL_URL, true, {
            user_display_name: null,
        });
        $('#rightHeaderContent').waitForExist();
        !$('#dat-dropdown.btn-sm.dropdown-toggle.btn.btn-default').isExisting();
    });
});
