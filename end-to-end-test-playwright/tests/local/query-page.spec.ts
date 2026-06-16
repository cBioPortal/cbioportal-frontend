// Source: end-to-end-test/local/specs/core/querypage.spec.js
import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { setInputText } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

test.describe('study select page', () => {
    test.describe('study search box', () => {
        const searchTextInput = '[data-test=study-search-input]';
        const searchControlsMenu =
            '[data-test=study-search-controls-container]';
        const referenceGenomeFormSection = '//h3[text()="Reference genome"]';
        const hg38StudyEntry = '//span[text()="Study HG38"]';
        const hg38Checkbox = '#input-hg38';

        // Mirrors the wdio describe.serial: tests in this block share the
        // study-list state (the hg38 filter from the previous test
        // persists into the next). Use a single page across all tests in
        // this describe and serialize.
        test.describe.configure({ mode: 'serial' });

        let sharedPage: import('@playwright/test').Page;

        test.beforeAll(async ({ browser }) => {
            sharedPage = await browser.newPage();
            await goToUrlAndSetLocalStorage(sharedPage, CBIOPORTAL_URL, true);
            await sharedPage
                .locator('[data-test=cancerTypeListContainer]')
                .waitFor({ state: 'attached' });
            // NOTE Somehow, we need to reload to load the external frontend.
            await goToUrlAndSetLocalStorage(sharedPage, CBIOPORTAL_URL, true);
            await sharedPage
                .locator('[data-test=cancerTypeListContainer]')
                .waitFor({ state: 'attached' });
        });

        test.afterAll(async () => {
            await sharedPage.close();
        });

        test('shows menu when focussing the text input', async () => {
            await expect(
                sharedPage.locator(searchControlsMenu)
            ).not.toBeVisible();
            await sharedPage.locator(searchTextInput).click();
            await expect(sharedPage.locator(searchControlsMenu)).toBeVisible();
        });

        test.describe('reference genome', () => {
            test('shows reference genome form elements when studies on different reference genomes are present', async () => {
                await expect(
                    sharedPage.locator(searchControlsMenu)
                ).toBeVisible();
                await expect(
                    sharedPage.locator(referenceGenomeFormSection)
                ).toBeVisible();
            });

            test('fills text input with search shorthand and filters studies when filtering studies via reference genome form element', async () => {
                await expect(
                    sharedPage.locator(referenceGenomeFormSection)
                ).toBeVisible();
                await expect(sharedPage.locator(hg38StudyEntry)).toBeVisible();
                await sharedPage.locator(hg38Checkbox).click();
                const textInSearchTextInput = await sharedPage
                    .locator(searchTextInput)
                    .inputValue();
                expect(textInSearchTextInput).toBe('reference-genome:hg19');
                await expect(
                    sharedPage.locator(hg38StudyEntry)
                ).not.toBeVisible();
            });

            test('updates reference genome form elements and study filter when entering search shorthand in text input', async () => {
                await sharedPage.locator('.input-group-btn').click();
                await sharedPage
                    .locator(referenceGenomeFormSection)
                    .waitFor({ state: 'attached' });
                await expect(
                    sharedPage.locator(referenceGenomeFormSection)
                ).toBeVisible();
                await expect(
                    sharedPage.locator(hg38StudyEntry)
                ).not.toBeVisible();
                await expect(
                    sharedPage.locator(hg38Checkbox)
                ).not.toBeChecked();
                await setInputText(sharedPage, searchTextInput, 'Study');
                await sharedPage
                    .locator(hg38StudyEntry)
                    .waitFor({ state: 'attached' });
                await expect(sharedPage.locator(hg38Checkbox)).toBeChecked();
            });
        });
    });

    test.describe('data type filter', () => {
        const dataTypeFilterBtn =
            '[data-test=dropdown-data-type-filter] button';
        const dataTypeDropdown = '[data-test=dropdown-data-type-filter]';
        const filterBadge = `${dataTypeDropdown} .oncoprintDropdownCount`;

        test.describe.configure({ mode: 'serial' });

        let page: import('@playwright/test').Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
            await page
                .locator('[data-test=cancerTypeListContainer]')
                .waitFor({ state: 'attached' });
            await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
            await page
                .locator('[data-test=cancerTypeListContainer]')
                .waitFor({ state: 'attached' });
            await page.locator(dataTypeFilterBtn).waitFor({ state: 'visible' });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('opens the dropdown when the button is clicked', async () => {
            await expect(
                page.locator(`${dataTypeDropdown} .dropdown-menu`)
            ).not.toBeVisible();
            await page.locator(dataTypeFilterBtn).click();
            await expect(
                page.locator(`${dataTypeDropdown} .dropdown-menu`)
            ).toBeVisible();
        });

        test('shows data type checkboxes in the dropdown', async () => {
            await expect(
                page.locator(`${dataTypeDropdown} input[type=checkbox]`).first()
            ).toBeVisible();
            await expect(
                page.locator(`${dataTypeDropdown} label`, {
                    hasText: 'Mutations',
                })
            ).toBeVisible();
        });

        test('filters studies and shows badge when a data type is selected', async () => {
            await expect(page.locator(filterBadge)).not.toBeVisible();
            await page
                .locator(`${dataTypeDropdown} label`, { hasText: 'Mutations' })
                .locator('input[type=checkbox]')
                .click();
            // Badge format: "N / total" — verify it appears
            await expect(page.locator(filterBadge)).toBeVisible();
            const badgeText = await page.locator(filterBadge).textContent();
            expect(badgeText).toMatch(/^\s*\d+\s*\/\s*\d+\s*$/);
        });

        test('clears filter and hides badge when data type is unchecked', async () => {
            // Re-open the dropdown (it stays open after checkbox click)
            await expect(
                page.locator(`${dataTypeDropdown} .dropdown-menu`)
            ).toBeVisible();
            await page
                .locator(`${dataTypeDropdown} label`, { hasText: 'Mutations' })
                .locator('input[type=checkbox]')
                .click();
            await expect(page.locator(filterBadge)).not.toBeVisible();
            // Close the dropdown so the next test can open it cleanly
            await page.locator(dataTypeFilterBtn).click();
            await expect(
                page.locator(`${dataTypeDropdown} .dropdown-menu`)
            ).not.toBeVisible();
        });

        test('narrows study list to 3 entries when CNA filter is selected', async () => {
            // Open the dropdown
            await page.locator(dataTypeFilterBtn).click();
            await expect(
                page.locator(`${dataTypeDropdown} .dropdown-menu`)
            ).toBeVisible();
            // Select the CNA filter
            await page
                .locator(`${dataTypeDropdown} label`, { hasText: 'CNA' })
                .locator('input[type=checkbox]')
                .click();
            // Close the dropdown by clicking outside
            await page.locator(dataTypeFilterBtn).click();
            // Wait for the study list to update
            await page
                .locator('[data-test=StudySelect]')
                .first()
                .waitFor({ state: 'visible' });
            const studyCount = await page
                .locator('[data-test=StudySelect]')
                .count();
            expect(studyCount).toBe(3);
            // Clean up — uncheck CNA filter
            await page.locator(dataTypeFilterBtn).click();
            await page
                .locator(`${dataTypeDropdown} label`, { hasText: 'CNA' })
                .locator('input[type=checkbox]')
                .click();
            await page.locator(dataTypeFilterBtn).click();
        });

        test('closes the dropdown when clicking outside', async () => {
            await page.locator(dataTypeFilterBtn).click();
            await expect(
                page.locator(`${dataTypeDropdown} .dropdown-menu`)
            ).toBeVisible();
            // Click somewhere outside the dropdown
            await page.locator('[data-test=cancerTypeListContainer]').click({
                position: { x: 5, y: 5 },
            });
            await expect(
                page.locator(`${dataTypeDropdown} .dropdown-menu`)
            ).not.toBeVisible();
        });
    });
});
