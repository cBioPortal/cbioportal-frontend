import { test, expect, Page } from '@playwright/test';
import { byTestHandle, waitForNetworkQuiet } from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/genomicEvolution.spec.js.
 *
 * DOM assertions for the patient-view Genomic Evolution tab:
 * - "Show only highlighted" checkbox filters the mutation table based
 *   on which rows are selected.
 * - Sequential-mode VAF checkbox is hidden when the data can't support it.
 */

const TABLE =
    'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]';

async function readMutationCount(page: Page): Promise<number> {
    const text = (await page.locator(TABLE).textContent()) ?? '';
    return parseInt(text, 10);
}

test.describe('Patient-view Genomic Evolution tab — mutation table', () => {
    test('show-only-highlighted filter reflects row selection', async ({
        page,
    }) => {
        await page.goto(
            '/patient/genomicEvolution?caseId=P04&studyId=lgg_ucsf_2014'
        );
        await waitForNetworkQuiet(page, 10000);

        // Checkbox starts unchecked — table shows every mutation.
        const highlightedToggle = page.locator(
            'input[data-test="TableShowOnlyHighlighted"]'
        );
        await expect(highlightedToggle).not.toBeChecked();
        await expect(page.locator(TABLE)).toBeVisible();
        expect(await readMutationCount(page)).toBeGreaterThan(2);

        // Highlight two rows — count is unaffected until "show only" is toggled.
        const row = (n: number) =>
            page.locator(
                `div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(${n})`
            );
        await row(1).click();
        await row(4).click();
        expect(await readMutationCount(page)).toBeGreaterThan(2);

        // Toggle "show only highlighted" — only the two selected remain.
        await highlightedToggle.click();
        await expect
            .poll(() => readMutationCount(page), { timeout: 5000 })
            .toBe(2);

        // Click-to-deselect the first highlighted row — down to 1.
        await row(1).click();
        await expect
            .poll(() => readMutationCount(page), { timeout: 5000 })
            .toBe(1);

        // Click-to-deselect the remaining highlighted row — filter falls
        // back to showing all mutations (since nothing is explicitly highlighted).
        await row(1).click();
        await expect
            .poll(() => readMutationCount(page), { timeout: 5000 })
            .toBeGreaterThan(2);
    });

    test('sequential VAF mode is hidden when samples have no equivalent clinical events', async ({
        page,
    }) => {
        await page.goto(
            '/patient/genomicEvolution?studyId=nsclc_ctdx_msk_2022&caseId=P-0016223'
        );
        await expect(byTestHandle(page, 'VAFSequentialMode')).toHaveCount(0);
    });
});
