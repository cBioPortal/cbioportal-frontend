var assert = require('assert');

const {
    goToUrlAndSetLocalStorage,
    checkOncoprintElement,
    waitForNetworkQuiet,
} = require('../../../shared/specUtils');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');

describe('Patient Cohort View Custom Tab Tests', () => {
    const patientUrl = `https://www.cbioportal.org/patient?studyId=coadread_tcga_pub&caseId=TCGA-A6-2670#navCaseIds=coadread_tcga_pub:TCGA-A6-2670,coadread_tcga_pub:TCGA-A6-2672`;

    it('Patient page valid after cohort navigation', function() {
        goToUrlAndSetLocalStorage(patientUrl);

        waitForNetworkQuiet();

        $('.nextPageBtn').click();

        waitForNetworkQuiet();

        var res = browser.checkDocument();
        assertScreenShotMatch(res);

        // now reload so that we get to the patient via direct initial load (not cohort navigation)
        browser.url(browser.getUrl());

        waitForNetworkQuiet();

        // check that it matches again
        var res2 = browser.checkDocument();
        assertScreenShotMatch(res2);
    });
});
