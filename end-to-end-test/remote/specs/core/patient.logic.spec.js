var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
var getTextInOncoprintLegend = require('../../../shared/specUtils')
    .getTextInOncoprintLegend;
var setOncoprintMutationsMenuOpen = require('../../../shared/specUtils')
    .setOncoprintMutationsMenuOpen;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils')
    .useExternalFrontend;
var waitForNumberOfStudyCheckboxes = require('../../../shared/specUtils')
    .waitForNumberOfStudyCheckboxes;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('patient page', function() {
    this.retries(2);
    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('should show all samples button for single sample view of multi sample patient', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/patient?studyId=lgg_ucsf_2014&tab=summaryTab&sampleId=P04_Pri`
        );

        $('.//*[text()[contains(.,"Show all")]]').waitForExist();

        assert.equal(
            $('.//*[text()[contains(.,"Show all")]]')
                .getText()
                .toLowerCase(),
            'show all 4 samples'.toLowerCase()
        );
    });
});
