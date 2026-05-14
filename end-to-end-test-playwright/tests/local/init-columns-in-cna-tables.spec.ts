// Source: end-to-end-test/local/specs/init-columns-in-cna-tables.spec.js
import { Page, expect } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorageWithProperty } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const DEFAULT_COLS = {
    GENE: 'Gene',
    CNA: 'CNA',
    ANNOTATION: 'Annotation',
    CYTOBAND: 'Cytoband',
    COHORT: 'Cohort',
};

const patientCnaTable = '[data-test="patientview-copynumber-table"]';

async function waitForTable(page: Page, table: string) {
    await expect(page.locator(`[data-test=${table}]`)).toBeVisible();
}

async function columnIsDisplayed(page: Page, column: string) {
    await expect(
        page
            .locator(`${patientCnaTable} span`, {
                hasText: new RegExp(`^${column}$`),
            })
            .first()
    ).toBeVisible();
}

async function columnIsNotDisplayed(page: Page, column: string) {
    await expect(
        page
            .locator(patientCnaTable)
            .locator(`xpath=.//span[normalize-space(text())='${column}']`)
    ).toHaveCount(0);
}

async function expectDefaultColumns(page: Page) {
    await columnIsDisplayed(page, DEFAULT_COLS.GENE);
    await columnIsDisplayed(page, DEFAULT_COLS.CNA);
    await columnIsDisplayed(page, DEFAULT_COLS.ANNOTATION);
    await columnIsDisplayed(page, DEFAULT_COLS.CYTOBAND);
    await columnIsDisplayed(page, DEFAULT_COLS.COHORT);
    await columnIsNotDisplayed(page, 'Gene panel');
}

test.describe('namespace columns in cna tables', () => {
    test.describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04U`;
        const patientCnaTableHandle = 'patientview-copynumber-table';

        test('shows default columns when property is not set', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                patientViewUrl,
                true,
                {}
            );
            await waitForTable(page, patientCnaTableHandle);
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
                    skin_patient_view_copy_number_table_columns_show_on_init:
                        'Gene,Annotation,Gene panel',
                }
            );
            await waitForTable(page, patientCnaTableHandle);
            await columnIsDisplayed(page, DEFAULT_COLS.GENE);
            await columnIsNotDisplayed(page, DEFAULT_COLS.CNA);
            await columnIsDisplayed(page, DEFAULT_COLS.ANNOTATION);
            await columnIsNotDisplayed(page, DEFAULT_COLS.CYTOBAND);
            await columnIsNotDisplayed(page, DEFAULT_COLS.COHORT);
            await columnIsDisplayed(page, 'Gene panel');
        });
    });
});
