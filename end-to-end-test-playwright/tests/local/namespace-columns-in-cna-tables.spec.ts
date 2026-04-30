// Source: end-to-end-test/local/specs/namespace-columns-in-cna-tables.spec.js
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

async function selectColumn(page: Page, columnId: string) {
    await page.locator(`[data-id="${columnId}"]`).click();
}

async function namespaceColumnsAreDisplayed(
    page: Page,
    columns: string[]
): Promise<boolean> {
    for (const column of columns) {
        const loc = page.locator(`xpath=//span[text()='${column}']`);
        if ((await loc.count()) === 0 || !(await loc.first().isVisible())) {
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
        const cell = row.locator(
            `xpath=.//td[normalize-space(text())="${gene}"]`
        );
        if ((await cell.count()) > 0) {
            return row;
        }
    }
    return null;
}

test.describe('namespace columns in cna tables', () => {
    test.describe.configure({ mode: 'serial' });

    test.describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04U`;
        const namespaceColumn1 = 'MyNamespace Column1';
        const namespaceValue1 = 'value1b';
        const namespaceColumn2 = 'MyNamespace Column2';
        const namespaceValue2 = 'value2b';
        const namespaceColumns = [namespaceColumn1, namespaceColumn2];
        const patientCnaTable = 'patientview-copynumber-table';
        const geneWithCustomNamespaceData = 'ACAP3';

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
            await waitForTable(sharedPage, patientCnaTable);
            expect(
                await namespaceColumnsAreNotDisplayed(
                    sharedPage,
                    namespaceColumns
                )
            ).toBe(true);
        });

        test('shows columns when column menu is used', async () => {
            await clickColumnSelectionButton(sharedPage, patientCnaTable);
            await selectColumn(sharedPage, namespaceColumn1);
            await selectColumn(sharedPage, namespaceColumn2);
            await clickColumnSelectionButton(sharedPage, patientCnaTable);
            expect(
                await namespaceColumnsAreDisplayed(sharedPage, namespaceColumns)
            ).toBe(true);
        });

        test('displays custom namespace data', async () => {
            const rowWithNamespaceData = await getRowByGene(
                sharedPage,
                patientCnaTable,
                geneWithCustomNamespaceData
            );
            expect(rowWithNamespaceData).not.toBeNull();
            const text = await rowWithNamespaceData!.innerText();
            expect(text.includes(namespaceValue1)).toBe(true);
            expect(text.includes(namespaceValue2)).toBe(true);
        });
    });
});
