// Source: end-to-end-test/local/specs/init-columns-in-struct-var-tables.spec.js
import { Page, expect } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorageWithProperty } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const DEFAULT_COLS = {
    GENE_1: 'Gene 1',
    GENE_2: 'Gene 2',
    STATUS: 'Status',
    ANNOTATION: 'Annotation',
    VARIANT_CLASS: 'Variant Class',
    EVENT_INFO: 'Event Info',
    CONNECTION_TYPE: 'Connection Type',
};

const tableSel = '[data-test="patientview-structural-variant-table"]';

async function waitForTable(page: Page, table: string) {
    await expect(page.locator(`[data-test=${table}]`)).toBeVisible();
}

async function columnIsDisplayed(page: Page, column: string) {
    await expect(
        page
            .locator(`${tableSel} span`, { hasText: new RegExp(`^${column}$`) })
            .first()
    ).toBeVisible();
}

async function columnIsNotDisplayed(page: Page, column: string) {
    await expect(
        page
            .locator(tableSel)
            .locator(`xpath=.//span[normalize-space(text())='${column}']`)
    ).toHaveCount(0);
}

async function expectDefaultColumns(page: Page) {
    await columnIsDisplayed(page, DEFAULT_COLS.GENE_1);
    await columnIsDisplayed(page, DEFAULT_COLS.GENE_2);
    await columnIsDisplayed(page, DEFAULT_COLS.STATUS);
    await columnIsDisplayed(page, DEFAULT_COLS.ANNOTATION);
    await columnIsDisplayed(page, DEFAULT_COLS.VARIANT_CLASS);
    await columnIsDisplayed(page, DEFAULT_COLS.EVENT_INFO);
    await columnIsDisplayed(page, DEFAULT_COLS.CONNECTION_TYPE);
    await columnIsDisplayed(page, 'Breakpoint Type');
}

test.describe('namespace columns in structural variant tables', () => {
    test.describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04P`;
        const patientStructVarTable = 'patientview-structural-variant-table';

        test('shows default columns when property is not set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                patientViewUrl,
                true,
                {}
            );
            await waitForTable(page, patientStructVarTable);
            await expectDefaultColumns(page);
        });

        test('shows selected columns when property is set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                patientViewUrl,
                true,
                {
                    skin_patient_view_structural_variant_table_columns_show_on_init:
                        'Gene 1,Annotation,Breakpoint Type',
                }
            );
            await waitForTable(page, patientStructVarTable);
            await columnIsDisplayed(page, DEFAULT_COLS.GENE_1);
            await columnIsNotDisplayed(page, DEFAULT_COLS.GENE_2);
            await columnIsNotDisplayed(page, DEFAULT_COLS.STATUS);
            await columnIsDisplayed(page, DEFAULT_COLS.ANNOTATION);
            await columnIsNotDisplayed(page, DEFAULT_COLS.VARIANT_CLASS);
            await columnIsNotDisplayed(page, DEFAULT_COLS.EVENT_INFO);
            await columnIsNotDisplayed(page, DEFAULT_COLS.CONNECTION_TYPE);
            await columnIsDisplayed(page, 'Breakpoint Type');
        });
    });
});
