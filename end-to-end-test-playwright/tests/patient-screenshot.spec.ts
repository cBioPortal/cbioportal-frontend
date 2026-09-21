import { test, expect } from '../fixtures';
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
        const readMutationGenes = () =>
            page
                .locator(
                    '[data-test="patientview-mutation-table"] [data-test="mutation-table-gene-column"]'
                )
                .allTextContents();

        await page.goto(patientUrl);
        await waitForNetworkQuiet(page);

        const mutationRows = page.locator(
            '[data-test="patientview-mutation-table"] tbody tr'
        );
        await expect(mutationRows.first()).toBeVisible();
        const initialGenes = await readMutationGenes();

        // Advance to the next patient in the cohort. The selector also
        // matches per-table pagination buttons lower on the page, so pick
        // the first (cohort) instance.
        await page
            .locator('.nextPageBtn')
            .first()
            .click();
        await expect(page).toHaveURL(/caseId=TCGA-A6-2672/);
        await waitForNetworkQuiet(page);
        const mutationTable = page.locator(
            '[data-test="patientview-mutation-table"]'
        );
        await mutationTable.waitFor({ state: 'visible' });
        await expect(mutationRows.first()).toBeVisible();
        await expect
            .poll(async () => (await readMutationGenes()).length)
            .toBeGreaterThan(0);
        const destinationGenes = await readMutationGenes();
        expect(destinationGenes.length).toBeGreaterThan(0);
        expect(destinationGenes).not.toEqual(initialGenes);
        // Mutation rows arrive from a live request and are intentionally masked.
        await expectPageScreenshot(page, 'patient-cohort-nav-1.png', {
            pauseMs: 500,
            hide: ['[data-test="patientview-mutation-table"] tbody'],
        });

        // Reload so the same patient is reached by direct URL (not cohort nav).
        await page.reload();
        await waitForNetworkQuiet(page);
        await mutationTable.waitFor({ state: 'visible' });
        await expect(page).toHaveURL(/caseId=TCGA-A6-2672/);
        await expect(mutationRows.first()).toBeVisible();
        await expect
            .poll(async () => {
                const genes = await readMutationGenes();
                return (
                    genes.length > 0 &&
                    genes.some(gene => !initialGenes.includes(gene))
                );
            })
            .toBe(true);
        await expectPageScreenshot(page, 'patient-cohort-nav-2.png', {
            pauseMs: 500,
            hide: ['[data-test="patientview-mutation-table"] tbody'],
        });
    });
});
