var assert = require('assert');

const {
    goToUrlAndSetLocalStorage,
    checkOncoprintElement,
    checkElementWithMouseDisabled,
    waitForNetworkQuiet,
} = require('../../../shared/specUtils');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Patient Cohort View Custom Tab Tests', () => {
    const patientUrl = `${CBIOPORTAL_URL}/patient?studyId=coadread_tcga_pub&caseId=TCGA-A6-2670#navCaseIds=coadread_tcga_pub:TCGA-A6-2670,coadread_tcga_pub:TCGA-A6-2672`;

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

// describe('patient page', function() {
//     before(() => {
//         goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
//     });
//
//     it('should show all samples button for single sample view of multi sample patient', function() {
//         goToUrlAndSetLocalStorage(
//             `${CBIOPORTAL_URL}/patient?studyId=lgg_ucsf_2014&tab=summaryTab&sampleId=P04_Pri`
//         );
//
//         checkElementWithMouseDisabled();
//     });
// });
