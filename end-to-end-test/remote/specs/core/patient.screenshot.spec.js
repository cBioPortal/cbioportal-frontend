var assert = require('assert');

const {
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
} = require('../../../shared/specUtils');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const { clickElement } = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Patient Cohort View Custom Tab Tests', () => {
    const patientUrl = `${CBIOPORTAL_URL}/patient?studyId=coadread_tcga_pub&caseId=TCGA-A6-2670#navCaseIds=coadread_tcga_pub:TCGA-A6-2670,coadread_tcga_pub:TCGA-A6-2672`;

    it('Patient page valid after cohort navigation', async () => {
        await goToUrlAndSetLocalStorage(patientUrl);

        await waitForNetworkQuiet();

        await clickElement('.nextPageBtn');

        await waitForNetworkQuiet();

        const res = await browser.checkDocument();
        assertScreenShotMatch(res);

        // now reload so that we get to the patient via direct initial load (not cohort navigation)
        await browser.url(await browser.getUrl());

        await waitForNetworkQuiet();

        // check that it matches again
        const res2 = await browser.checkDocument();
        assertScreenShotMatch(res2);
    });
});
