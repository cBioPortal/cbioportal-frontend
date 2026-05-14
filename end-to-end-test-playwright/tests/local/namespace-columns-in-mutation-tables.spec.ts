// Source: end-to-end-test/local/specs/namespace-columns-in-mutation-tables.spec.js
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorageWithProperty } from './helpers';
import { setInputText } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const resultsViewUrl = `${CBIOPORTAL_URL}/results/mutations?cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cfusion%2Cgistic&case_set_id=study_es_0_all&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
const patientViewUrl = `${CBIOPORTAL_URL}/patient?sampleId=TEST_SAMPLE_SOMATIC_HOMOZYGOUS&studyId=study_es_0`;

const ZYGOSITY_CODE = "xpath=//span[text() = 'Zygosity Code']";
const ZYGOSITY_NAME = "xpath=//span[text() = 'Zygosity Name']";

async function waitForMutationTable(page: Page) {
    await expect(
        page.locator('[data-test=LazyMobXTable]').first()
    ).toBeVisible();
}

async function waitForPatientViewMutationTable(page: Page) {
    const mutationTable = page.locator(
        '[data-test="patientview-mutation-table"]'
    );
    await expect(mutationTable).toBeVisible();
    await expect(
        mutationTable.locator('[data-test="LazyMobXTable"]')
    ).toBeVisible();
}

async function namespaceColumnsAreDisplayed(page: Page) {
    return (
        (await page.locator(ZYGOSITY_CODE).isVisible()) &&
        (await page.locator(ZYGOSITY_NAME).isVisible())
    );
}

async function namespaceColumnsAreNotDisplayed(page: Page) {
    return !(
        (await page.locator(ZYGOSITY_CODE).isVisible()) &&
        (await page.locator(ZYGOSITY_NAME).isVisible())
    );
}

function filterIconOfHeader(page: Page, headerXpath: string) {
    return page.locator(
        `${headerXpath}/../..//*[contains(@class, "fa-filter")]`
    );
}

async function numberOfTableRows(page: Page) {
    return await page.locator('.lazy-mobx-table tr').count();
}

test.describe('namespace columns in mutation tables', () => {
    test.describe.serial('results view', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('hides namespace columns when no property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                resultsViewUrl,
                true,
                {}
            );
            await waitForMutationTable(page);
            expect(await namespaceColumnsAreNotDisplayed(page)).toBe(true);
        });

        test('shows columns when column menu is used', async () => {
            await page
                .locator('button:has-text("Columns")')
                .first()
                .click();
            await setInputText(
                page,
                '[data-test=fixed-header-table-search-input]',
                'zygosity'
            );
            await expect(
                page
                    .locator('[data-test=add-by-type]')
                    .locator('div:has-text("Zygosity")')
                    .first()
            ).toBeVisible();
            const checkboxes = page
                .locator('[data-test=add-by-type]')
                .locator('div:has-text("Zygosity")');
            const count = await checkboxes.count();
            for (let i = 0; i < count; i++) {
                const cb = checkboxes.nth(i);
                await expect(cb).toBeVisible();
                await cb.click();
            }
            await page
                .locator('button:has-text("Columns")')
                .first()
                .click();
            expect(await namespaceColumnsAreDisplayed(page)).toBe(true);
        });

        test('shows namespace columns when property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                resultsViewUrl,
                true,
                {
                    skin_mutation_table_namespace_column_show_by_default: true,
                }
            );
            await waitForMutationTable(page);
            expect(await namespaceColumnsAreDisplayed(page)).toBe(true);
        });

        test('has filter icons', async () => {
            await page.locator(ZYGOSITY_CODE).click();
            await expect(filterIconOfHeader(page, ZYGOSITY_CODE)).toBeVisible();
            await page.locator(ZYGOSITY_NAME).click();
            await expect(filterIconOfHeader(page, ZYGOSITY_NAME)).toBeVisible();
        });

        test('filters rows when using numerical filter menu', async () => {
            await page.locator(ZYGOSITY_CODE).click();
            const filterIcon = filterIconOfHeader(page, ZYGOSITY_CODE);
            await expect(filterIcon).toBeVisible();
            await filterIcon.click();
            const numberOfRowsBefore = await numberOfTableRows(page);
            await page.locator('#Zygosity_Code-lowerValue-box').fill('2');
            await page
                .locator('[data-test=numerical-filter-menu-remove-empty-rows]')
                .click();
            await expect
                .poll(async () => await numberOfTableRows(page))
                .toBeLessThan(numberOfRowsBefore);

            await page.locator('#Zygosity_Code-lowerValue-box').fill('1');
            await page
                .locator('[data-test=numerical-filter-menu-remove-empty-rows]')
                .click();
            await expect
                .poll(async () => await numberOfTableRows(page))
                .toBe(numberOfRowsBefore);
        });

        test('filters rows when using categorical filter menu', async () => {
            await page.locator(ZYGOSITY_NAME).click();
            const filterIcon = filterIconOfHeader(page, ZYGOSITY_NAME);
            await expect(filterIcon).toBeVisible();
            await filterIcon.click();
            const numberOfRowsBefore = await numberOfTableRows(page);
            await page
                .locator('[data-test=categorical-filter-menu-search-input]')
                .fill('Homozygous');
            await expect
                .poll(async () => await numberOfTableRows(page))
                .toBeLessThan(numberOfRowsBefore);
        });
    });

    test.describe.serial('patient view', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('hides namespace columns when no property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                patientViewUrl,
                true,
                {}
            );
            await waitForPatientViewMutationTable(page);
            expect(await namespaceColumnsAreNotDisplayed(page)).toBe(true);
        });

        test('shows columns when column menu is used', async () => {
            await page
                .locator('[data-test=patientview-mutation-table]')
                .locator('button:has-text("Columns")')
                .click();
            await page.locator('[data-id="Zygosity Code"]').click();
            await page.locator('[data-id="Zygosity Name"]').click();
            await page
                .locator('[data-test=patientview-mutation-table]')
                .locator('button:has-text("Columns")')
                .click();
            expect(await namespaceColumnsAreDisplayed(page)).toBe(true);
        });

        test('shows namespace columns when property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                patientViewUrl,
                true,
                {
                    skin_mutation_table_namespace_column_show_by_default: true,
                }
            );
            await waitForPatientViewMutationTable(page);
            expect(await namespaceColumnsAreDisplayed(page)).toBe(true);
        });
    });
});
