var assert = require('assert');

const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const {
    clickElement,
    waitForNetworkQuiet,
    goToUrlAndSetLocalStorage,
    checkElementWithMouseDisabled,
    getElementByTestHandle,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Patient Cohort View Custom Tab Tests', () => {
    const patientUrl = `${CBIOPORTAL_URL}/patient?studyId=coadread_tcga_pub&caseId=TCGA-A6-2670#navCaseIds=coadread_tcga_pub:TCGA-A6-2670,coadread_tcga_pub:TCGA-A6-2672`;

    it('Patient page valid after cohort navigation', async () => {
        await goToUrlAndSetLocalStorage(patientUrl);

        await waitForNetworkQuiet();

        await clickElement('.nextPageBtn');

        await browser.pause(2000);

        const res = await checkElementWithMouseDisabled('body', 500);
        assertScreenShotMatch(res);

        // now reload so that we get to the patient via direct initial load (not cohort navigation)
        await browser.url(await browser.getUrl());

        await waitForNetworkQuiet();

        // check that it matches again
        const res2 = await checkElementWithMouseDisabled('body', 500);
        assertScreenShotMatch(res2);
    });
});

describe('Patient View Sample Header Screenshot Tests', () => {
    const patientUrl = `${CBIOPORTAL_URL}/patient?studyId=msk_impact_50k_2026&caseId=P-0002435`;

    before(async () => {
        await goToUrlAndSetLocalStorage(patientUrl);
        const clinicalSpans = await getElementByTestHandle(
            'patientSamplesClinicalSpans'
        );
        await clinicalSpans.waitForDisplayed({ timeout: 20000 });
        await waitForNetworkQuiet(10000);
    });

    it('TMB-H biomarker annotation renders inline in the sample header', async () => {
        const res = await checkElementWithMouseDisabled(
            '[data-test="patientSamplesClinicalSpans"]',
            0,
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
});
