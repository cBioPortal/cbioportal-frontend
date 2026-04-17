import { test } from '@playwright/test';
import { expectPageScreenshot, waitForNetworkQuiet } from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/patient.screenshot.spec.js.
 *
 * The wdio suite had two describe blocks — the second targeted
 * `msk_impact_50k_2026`, a study not yet on the public portal, so it
 * was skip-effectively (TMB-H biomarker). We port only the cohort
 * navigation test here; the TMB-H one can be re-added when the data is
 * public.
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
