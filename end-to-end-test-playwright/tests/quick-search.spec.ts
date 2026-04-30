import { test, expect, Page } from '../fixtures';

/**
 * Port of end-to-end-test/remote/specs/core/quickSearch.spec.js.
 *
 * Exercises the homepage "Quick Search" tab — typing a short query
 * should surface grouped results (studies, genes, patients, samples)
 * and clicking any result navigates to the matching page. "Ad" is
 * chosen because it matches all four entity types.
 */

async function openQuickSearchAndType(page: Page, query: string) {
    await page.goto('/');
    await page.locator('a.tabAnchor_quickSearch').click();

    // The control renders as a styled div; click it to focus the nested input.
    const placeholder = page.locator('div', {
        hasText: 'e.g. Lung, EGFR, TCGA-OR-A5J2',
    });
    await placeholder.first().click();

    await page
        .locator('input')
        .first()
        .fill(query);

    // All four result groups should render.
    await expect(
        page.getByText('Click on a study to open its summary', { exact: true })
    ).toBeVisible();
    await expect(
        page.getByText('Click on a patient to see a summary', { exact: true })
    ).toBeVisible();
    await expect(
        page.getByText('Click on a sample to open its summary', { exact: true })
    ).toBeVisible();
}

test.describe('Quick Search', () => {
    test.beforeEach(async ({ page }) => {
        await openQuickSearchAndType(page, 'Ad');
    });

    test('shows study results', async ({ page }) => {
        const study = 'Adenoid Cystic Carcinoma (FMI, Am J Surg Pathl. 2014)';
        await page.locator('strong', { hasText: study }).click();
        await expect(page.locator('h3', { hasText: study })).toBeVisible();
    });

    test('shows gene results', async ({ page }) => {
        await page.locator('strong', { hasText: 'ADAD1' }).click();
        await expect(page.locator('a', { hasText: 'ADAD1' })).toBeVisible({
            timeout: 60000,
        });
    });

    test('shows patient results', async ({ page }) => {
        await page
            .locator('strong', { hasText: 'AdCC11T' })
            .first()
            .click();
        await expect(page.locator('a', { hasText: 'AdCC11T' })).toBeVisible();
    });
});
