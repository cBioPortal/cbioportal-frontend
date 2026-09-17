import { expect, test } from '@playwright/test';

test.describe('MSK-IMPACT molecular hydration smoke', () => {
    test.skip(
        process.env.MSK_MOLECULAR_SMOKE !== '1',
        'set MSK_MOLECULAR_SMOKE=1 to run against the hydrated deployment'
    );

    test('renders non-empty mutation, CNA, and structural-variant tables', async ({
        page,
    }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', error => pageErrors.push(error.message));

        await page.goto('/study/summary?id=mskimpact', {
            waitUntil: 'domcontentloaded',
            timeout: 90_000,
        });

        for (const [dataTest, expectedText] of [
            ['mutations-table', 'TP53'],
            ['copy number alterations-table', 'CDKN2A'],
            ['structural variants-table', 'TMPRSS2'],
        ] as const) {
            const table = page.locator(`[data-test="${dataTest}"]`);
            await expect(table).toBeVisible({ timeout: 90_000 });
            await expect(table).toContainText(expectedText);
        }

        expect(pageErrors).toEqual([]);
    });
});
