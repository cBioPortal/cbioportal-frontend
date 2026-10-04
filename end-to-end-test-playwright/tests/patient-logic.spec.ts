import { test, expect } from '../fixtures';
import { byTestHandle } from './helpers/common';

/**
 * DOM assertions on the patient page. There's no TMB-H biomarker test
 * yet, because its study `msk_impact_50k_2026` isn't on the public
 * portal.
 */

test.describe('patient page', () => {
    test('shows "all samples button" for single-sample view of multi-sample patient', async ({
        page,
    }) => {
        await page.goto(
            '/patient?studyId=lgg_ucsf_2014&tab=summaryTab&sampleId=P04_Pri'
        );
        await expect(
            page.locator('button', { hasText: 'Show all 4 samples' })
        ).toBeVisible();
    });

    test('shows messaging when a patient has only some profiled samples', async ({
        page,
    }) => {
        await page.goto(
            '/patient?studyId=mpcproject_broad_2021&caseId=MPCPROJECT_0013'
        );
        await expect(
            byTestHandle(page, 'patientview-mutation-table')
        ).toBeVisible();
    });
});
