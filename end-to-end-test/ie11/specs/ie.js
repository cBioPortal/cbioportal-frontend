var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;

const CBIOPORTAL_URL = 'http://localhost:3000';

describe('Application in IE11', function() {
    it('renders query page study items', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
        $('[data-test="StudySelect"]').waitForExist(30000);
    });

    // it('renders the oncoprint', function() {
    //     $('.exampleQueries').waitForExist();
    //     $('.exampleQueries')
    //         .$$('a')[1]
    //         .click();
    //     waitForOncoprint(10000);
    // });
});
