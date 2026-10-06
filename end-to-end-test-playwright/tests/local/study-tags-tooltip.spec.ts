import { expect, Locator } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

/**
 * Text of each cell in each row of a json-to-table table. With `key`, reads
 * the sub-table labelled `key` instead.
 */
async function rowTexts(table: Locator, key?: string): Promise<string[][]> {
    return table.evaluate((t, key) => {
        let target: Element | undefined = t;
        if (key !== undefined) {
            const cell = Array.from(
                t.querySelectorAll(':scope > tbody > tr > td')
            ).find(
                td =>
                    td.querySelector(':scope > div > strong')?.textContent ===
                    key
            );
            target = cell?.querySelector(':scope > table') ?? undefined;
        }
        if (!target) {
            return [];
        }
        return Array.from(
            target.querySelectorAll(':scope > tbody > tr')
        ).map(tr =>
            Array.from(tr.querySelectorAll(':scope > td')).map(td =>
                (td.textContent || '').trim()
            )
        );
    }, key);
}

// study_es_0's tags_file (cbioportal-test data/studies/study_es_0/study_tags.yml)
// mixes plain values, a nested object and an array of objects.
test.describe('study tags tooltip', () => {
    test('renders nested study tags as tables', async ({ page }) => {
        // The second load picks up the locally served frontend, as in
        // query-page.spec.ts.
        for (let i = 0; i < 2; i++) {
            await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
            await page
                .locator('[data-test=cancerTypeListContainer]')
                .waitFor({ state: 'attached' });
        }

        await page
            .locator(
                '[aria-label="Display study info tooltip for Test study es_0"]'
            )
            .hover();

        const root = page.locator('.studyTagsTooltip .json-to-table');
        await expect(root).toBeVisible();
        const table = root.locator(':scope > table');

        const rows = await rowTexts(table);
        expect(rows).toContainEqual(['Loaded by', 'Jill']);
        expect(rows).toContainEqual(['Load id', '34']);

        expect(await rowTexts(table, 'Analyst')).toEqual([
            ['name', 'Jack'],
            ['email', 'jack@xyz.com'],
        ]);

        expect(await rowTexts(table, 'Study sponsors')).toEqual([
            ['name', 'email'],
            ['john', 'john@@xyz.com'],
            ['jane', 'jane@@xyz.com'],
        ]);
    });
});
