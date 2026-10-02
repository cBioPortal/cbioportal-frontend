import { test } from '../fixtures';
import { expectPageScreenshot, waitForNetworkQuiet } from './helpers/common';

/**
 * Patient view cohort navigation screenshots. A TMB-H biomarker
 * screenshot can be added once its study, `msk_impact_50k_2026`, is on
 * the public portal.
 */

test.describe('Patient cohort view screenshot tests', () => {
    const patientUrl =
        '/patient?studyId=coadread_tcga_pub&caseId=TCGA-A6-2670' +
        '#navCaseIds=coadread_tcga_pub:TCGA-A6-2670,coadread_tcga_pub:TCGA-A6-2672';

    test('patient page valid after cohort navigation', async ({ page }) => {
        await page.goto(patientUrl);
        await waitForNetworkQuiet(page);

        // Advance to the next patient in the cohort. The selector also
        // matches per-table pagination buttons lower on the page, so pick
        // the first (cohort) instance.
        await page
            .locator('.nextPageBtn')
            .first()
            .click();
        await page.waitForTimeout(2000);
        await expectPageScreenshot(page, 'patient-cohort-nav-1.png', {
            pauseMs: 500,
        });

        // Reload so the same patient is reached by direct URL (not cohort nav).
        await page.reload();
        await waitForNetworkQuiet(page);
        await expectPageScreenshot(page, 'patient-cohort-nav-2.png', {
            pauseMs: 500,
        });
    });
});
