// Source: end-to-end-test/local/specs/custom-driver-annotations-in-study-view.spec.js
import { Page, expect } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { waitForNetworkQuiet } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const STUDY_VIEW_URL = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;
const ALTERATION_MENU_BTN = `button[data-test="AlterationFilterButton"]`;
const SHOW_UNKNOWN_TIER = `input[data-test="ShowUnknownTier"]`;
const SV_TABLE = `div[data-test="structural variants-table"]`;
const ANY_ROW = `div[aria-rowindex]`;
const BRAF_ROW = `div[aria-rowindex="1"]`;
const BRAF_ROW_EXCLUDE_UNKNOWN = `div[aria-rowindex="8"]`;
const GENE_NAME = `div[data-test="geneNameCell"]`;
const ALTERATIONS_TOTAL = `span[data-test="numberOfAlterations"]`;
const ALTERATION_CASES = `span[data-test="numberOfAlteredCasesText"]`;
const SHOW_CLASS_3 = `input[data-test="Class_3"]`;
const SHOW_CLASS_4 = `input[data-test="Class_4"]`;
const SHOW_PUTATIVE_DRIVERS = `input[data-test="ShowDriver"]`;
const SHOW_UNKNOWN_ONCOGENICITY = `input[data-test="ShowUnknownOncogenicity"]`;

async function getAllGeneNames(page: Page) {
    const rows = page.locator(`${SV_TABLE} ${ANY_ROW}`);
    const count = await rows.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
        names.push(
            await rows
                .nth(i)
                .locator(GENE_NAME)
                .innerText()
        );
    }
    return names.sort().join();
}

test.describe('custom driver annotations feature in study view', () => {
    test.describe('structural variants', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, STUDY_VIEW_URL, true);
            await waitForNetworkQuiet(page);
        });

        test('shows all structural variants', async ({ page }) => {
            await expect(page.locator(`${SV_TABLE} ${BRAF_ROW}`)).toBeVisible();

            await expect(page.locator(`${SV_TABLE} ${ANY_ROW}`)).toHaveCount(
                21
            );
            const geneName = await page
                .locator(`${SV_TABLE} ${BRAF_ROW} ${GENE_NAME}`)
                .innerText();
            expect(geneName).toBe('BRAF');

            const alterations = await page
                .locator(`${SV_TABLE} ${BRAF_ROW} ${ALTERATIONS_TOTAL}`)
                .innerText();
            expect(alterations).toBe('37');

            const alterationCases = await page
                .locator(`${SV_TABLE} ${BRAF_ROW} ${ALTERATION_CASES}`)
                .innerText();
            expect(alterationCases).toBe('35');
        });

        test('can exclude unknown (and NULL) driver tiers', async ({
            page,
        }) => {
            await page.locator(ALTERATION_MENU_BTN).click();
            await expect(page.locator(SHOW_UNKNOWN_TIER)).toBeVisible({
                timeout: 5000,
            });
            await expect(page.locator(SHOW_UNKNOWN_TIER)).toBeChecked();
            await page.locator(SHOW_UNKNOWN_TIER).click();

            await expect(
                page.locator(`${SV_TABLE} ${BRAF_ROW_EXCLUDE_UNKNOWN}`)
            ).toBeVisible();

            await expect(page.locator(`${SV_TABLE} ${ANY_ROW}`)).toHaveCount(
                10
            );
            const alterations = await page
                .locator(
                    `${SV_TABLE} ${BRAF_ROW_EXCLUDE_UNKNOWN} ${ALTERATIONS_TOTAL}`
                )
                .innerText();
            expect(alterations).toBe('1');
            const brafCases = await page
                .locator(
                    `${SV_TABLE} ${BRAF_ROW_EXCLUDE_UNKNOWN} ${ALTERATION_CASES}`
                )
                .innerText();
            expect(brafCases).toBe('1');
        });

        test('can exclude custom driver tiers', async ({ page }) => {
            await page.locator(ALTERATION_MENU_BTN).click();
            await expect(page.locator(SHOW_UNKNOWN_TIER)).toBeVisible({
                timeout: 5000,
            });
            await expect(page.locator(SHOW_UNKNOWN_TIER)).toBeChecked();
            await page.locator(SHOW_UNKNOWN_TIER).click();

            await expect(page.locator(SHOW_CLASS_3)).toBeChecked();
            await page.locator(SHOW_CLASS_3).click();

            await expect(page.locator(SHOW_CLASS_4)).toBeChecked();
            await page.locator(SHOW_CLASS_4).click();
            await waitForNetworkQuiet(page);
            await expect(
                page.locator(`${SV_TABLE} ${ANY_ROW}`).first()
            ).toBeVisible({ timeout: 20000 });

            await expect(page.locator(`${SV_TABLE} ${ANY_ROW}`)).toHaveCount(5);
            expect(await getAllGeneNames(page)).toBe(
                'ALK,EGFR,EML4,ERG,TMPRSS2'
            );
        });

        test('can exclude custom drivers', async ({ page }) => {
            await page.locator(ALTERATION_MENU_BTN).click();
            await expect(page.locator(SHOW_UNKNOWN_TIER)).toBeVisible({
                timeout: 5000,
            });

            await expect(page.locator(SHOW_PUTATIVE_DRIVERS)).toBeChecked();
            await page.locator(SHOW_PUTATIVE_DRIVERS).click();

            await expect(page.locator(SHOW_UNKNOWN_ONCOGENICITY)).toBeChecked();
            await page.locator(SHOW_UNKNOWN_ONCOGENICITY).click();

            await expect(
                page.locator(`${SV_TABLE} ${ANY_ROW}`).first()
            ).toBeVisible();

            await expect(page.locator(`${SV_TABLE} ${ANY_ROW}`)).toHaveCount(2);
            expect(await getAllGeneNames(page)).toBe('NCOA4,RET');
        });
    });
});
