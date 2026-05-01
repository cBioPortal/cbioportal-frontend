// Source: end-to-end-test/local/specs/core/comparison-alterations-tab.spec.js
import { Page, expect } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const resultsViewComparisonTab = `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=BRCA1%2520BRCA2&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize&comparison_subtab=alterations`;

// The loading of the tabs in comparison view is extremely fragile.
// Multiple loading attempts are needed in some cases to show the
// enrichment panels and make the tests pass reliably.
async function loadAlterationsTab(page: Page) {
    const timeIntervals = [3000, 4000, 5000, 5000, 10000, 30000, 100000];
    for (const timeInterval of timeIntervals) {
        await goToUrlAndSetLocalStorage(page, resultsViewComparisonTab, true);
        await page.waitForTimeout(timeInterval);
        if (
            await page
                .locator('[data-test=GroupComparisonAlterationEnrichments]')
                .first()
                .isVisible()
        )
            break;
    }
}

async function openAlterationTypeSelectionMenu(page: Page) {
    await page
        .locator('[data-test=AlterationEnrichmentTypeSelectorButton]')
        .waitFor({ state: 'attached' });
    await page
        .locator('[data-test=AlterationEnrichmentTypeSelectorButton]')
        .click();
    await expect(
        page.locator('[data-test=AlterationTypeSelectorMenu]')
    ).toBeVisible();
}

async function selectAlteredCount(page: Page, gene: string) {
    const row = page
        .locator(`span`, { hasText: new RegExp(`^${gene}$`) })
        .locator('..')
        .locator('..')
        .locator('..')
        .first();
    return await row
        .locator('td')
        .nth(2)
        .locator('span')
        .innerText();
}

async function selectUnalteredCount(page: Page, gene: string) {
    const row = page
        .locator(`span`, { hasText: new RegExp(`^${gene}$`) })
        .locator('..')
        .locator('..')
        .locator('..')
        .first();
    return await row
        .locator('td')
        .nth(3)
        .locator('span')
        .innerText();
}

async function clickAlterationTypeCheckBox(page: Page, name: string) {
    // Mirror the wdio `label=<name>` selector exactly. Scope to the
    // alteration-type menu — the same name (e.g. "Mutations") may
    // appear in other parts of the page (track legend, count column).
    await page
        .locator('[data-test=AlterationTypeSelectorMenu]')
        .locator(`label:text-is("${name}")`)
        .locator('input')
        .click();
}

async function submitEnrichmentRequest(page: Page) {
    await page.locator('[data-test=buttonSelectAlterations]').click();
    await page
        .locator('[data-test=GroupComparisonAlterationEnrichments]')
        .first()
        .waitFor({ state: 'attached' });
}

test.describe('comparison alterations tab', () => {
    test.beforeEach(async ({ page }) => {
        await loadAlterationsTab(page);
        await openAlterationTypeSelectionMenu(page);
    });

    test('shows basic counts', async ({ page }) => {
        const alteredCount = await selectAlteredCount(page, 'ALK');
        expect(alteredCount).toBe('2 (18.18%)');
    });

    test('shows banner when no results retrieved', async ({ page }) => {
        await clickAlterationTypeCheckBox(page, 'Mutations');
        await clickAlterationTypeCheckBox(
            page,
            'Structural Variants / Fusions'
        );
        await clickAlterationTypeCheckBox(page, 'Copy Number Alterations');
        await page.locator('[data-test=buttonSelectAlterations]').click();
        await expect(
            page
                .locator('div', { hasText: /^No data\/result available$/ })
                .first()
        ).toBeVisible();
    });

    test('filters mutation types', async ({ page }) => {
        await clickAlterationTypeCheckBox(page, 'Copy Number Alterations');
        await clickAlterationTypeCheckBox(
            page,
            'Structural Variants / Fusions'
        );
        await submitEnrichmentRequest(page);
        await expect(
            page.locator('[data-test=LazyMobXTable]').first()
        ).toBeVisible();
        let rows = page
            .locator('[data-test=LazyMobXTable]')
            .first()
            .locator('tbody tr');
        expect(await rows.count()).toBe(8);
        await clickAlterationTypeCheckBox(page, 'Mutations');
        await clickAlterationTypeCheckBox(page, 'Frameshift Deletion');
        await submitEnrichmentRequest(page);
        await expect(
            page.locator('[data-test=LazyMobXTable]').first()
        ).toBeVisible();
        rows = page
            .locator('[data-test=LazyMobXTable]')
            .first()
            .locator('tbody tr');
        expect(await rows.count()).toBe(2);
    });

    test('filters CNA types', async ({ page }) => {
        await clickAlterationTypeCheckBox(page, 'Mutations');
        await clickAlterationTypeCheckBox(
            page,
            'Structural Variants / Fusions'
        );

        await submitEnrichmentRequest(page);
        await expect(
            page.locator('[data-test=LazyMobXTable]').first()
        ).toBeVisible();
        expect(await selectUnalteredCount(page, 'ACAP3')).toBe('9 (1.17%)');

        await clickAlterationTypeCheckBox(page, 'Deletion');
        await submitEnrichmentRequest(page);
        await expect(
            page.locator('[data-test=LazyMobXTable]').first()
        ).toBeVisible();
        expect(await selectUnalteredCount(page, 'ACAP3')).toBe('7 (0.91%)');
    });
});
