// Source: end-to-end-test/local/specs/namespace-columns-in-struct-var-tables.spec.js
import { test, expect } from '../../fixtures';
import { Locator, Page } from '@playwright/test';
import { goToUrlAndSetLocalStorageWithProperty } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

async function waitForTable(page: Page, table: string) {
    await expect(page.locator(`[data-test=${table}]`)).toBeVisible();
}

async function clickColumnSelectionButton(page: Page, table: string) {
    await page
        .locator(`[data-test=${table}] button`, { hasText: 'Columns' })
        .click();
}

async function selectColumn(page: Page, columnId: string, table: string) {
    const checkbox = page.locator(`[data-id="${columnId}"]`);
    if (!(await checkbox.isVisible())) {
        await clickColumnSelectionButton(page, table);
    }
    await expect(checkbox).toBeVisible({ timeout: 10000 });
    if (!(await checkbox.isChecked())) {
        await checkbox.click({ timeout: 10000, force: true });
        await expect(checkbox).toBeChecked({ timeout: 10000 });
    }
}

async function namespaceColumnsAreDisplayed(
    page: Page,
    columns: string[]
): Promise<boolean> {
    for (const column of columns) {
        const matchingColumn = page
            .locator(
                '[data-test="patientview-structural-variant-table"] span',
                {
                    hasText: new RegExp(`^${column}$`),
                }
            )
            .first();
        if (
            (await matchingColumn.count()) === 0 ||
            !(await matchingColumn.isVisible())
        ) {
            return false;
        }
    }
    return true;
}

async function namespaceColumnsAreNotDisplayed(
    page: Page,
    columns: string[]
): Promise<boolean> {
    return !(await namespaceColumnsAreDisplayed(page, columns));
}

async function getRowByGene(
    page: Page,
    tableName: string,
    gene: string
): Promise<Locator | null> {
    const rows = page.locator(`[data-test="${tableName}"] tr`);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        const cell = row.locator(`xpath=.//td[normalize-space(.)="${gene}"]`);
        if ((await cell.count()) > 0) {
            return row;
        }
    }
    return null;
}

test.describe('namespace columns in struct var tables', () => {
    test.describe.configure({ mode: 'serial' });

    test.describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04P`;
        const namespaceColumn1 = 'StructVarNs Column1';
        const namespaceValue1 = 'value1';
        const namespaceColumn2 = 'StructVarNs Column2';
        const namespaceValue2 = 'value2';
        const namespaceColumns = [namespaceColumn1, namespaceColumn2];
        const patientStructVarTable = 'patientview-structural-variant-table';
        const geneWithCustomNamespaceData = 'KIAA1549';

        let sharedPage: Page;

        test.beforeAll(async ({ browser }) => {
            const context = await browser.newContext();
            sharedPage = await context.newPage();
        });

        test('hides namespace columns when no property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                sharedPage,
                patientViewUrl,
                true,
                {}
            );
            await waitForTable(sharedPage, patientStructVarTable);
            expect(
                await namespaceColumnsAreNotDisplayed(
                    sharedPage,
                    namespaceColumns
                )
            ).toBe(true);
        });

        test('shows columns when column menu is used', async () => {
            await clickColumnSelectionButton(sharedPage, patientStructVarTable);
            await selectColumn(
                sharedPage,
                namespaceColumn1,
                patientStructVarTable
            );
            await selectColumn(
                sharedPage,
                namespaceColumn2,
                patientStructVarTable
            );
            await clickColumnSelectionButton(sharedPage, patientStructVarTable);
            expect(
                await namespaceColumnsAreDisplayed(sharedPage, namespaceColumns)
            ).toBe(true);
        });

        test('displays custom namespace data', async () => {
            const rowWithNamespaceData = await getRowByGene(
                sharedPage,
                patientStructVarTable,
                geneWithCustomNamespaceData
            );
            expect(rowWithNamespaceData).not.toBeNull();
            const text = await rowWithNamespaceData!.innerText();
            expect(text.includes(namespaceValue1)).toBe(true);
            expect(text.includes(namespaceValue2)).toBe(true);
        });
    });
});
