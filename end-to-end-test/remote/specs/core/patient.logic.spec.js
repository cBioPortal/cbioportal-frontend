var assert = require('assert');

var {
    goToUrlAndSetLocalStorage,
    getElementByTestHandle,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('patient page', function() {
    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('should show "all samples button" for single sample view of multi sample patient', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/patient?studyId=lgg_ucsf_2014&tab=summaryTab&sampleId=P04_Pri`
        );

        $('button=Show all 4 samples').waitForExist();
    });

    it('show appropriate messaging when a patient has only some profiled samples', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/patient?studyId=mpcproject_broad_2021&caseId=MPCPROJECT_0013`
        );

        // there is one partial profile message for CNA and sample 2
        getElementByTestHandle('patientview-mutation-table').waitForDisplayed();
    });
});
