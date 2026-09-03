// Source: end-to-end-test/local/specs/core/studyview.screenshot.spec.js
// Split out from study-view-screenshot.spec.ts so Playwright's --shard
// has more files to balance across parallel runners.
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import {
    expectElementScreenshot,
    waitForNetworkQuiet,
} from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const WAIT_FOR_VISIBLE_TIMEOUT = 30000;
const MUTATIONS_GENES_TABLE = "[data-test='mutations-table']";
const CANCER_GENE_FILTER_ICON =
    "[data-test='gene-column-header'] [data-test='header-filter-icon']";

test.describe.serial('cancer gene filter', () => {
    test.describe.configure({ retries: 0 });
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('cancer gene filter should by default be disabled', async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;
        await goToUrlAndSetLocalStorage(page, url, true);
        await expect(
            page.locator(
                `${MUTATIONS_GENES_TABLE} [data-test='gene-column-header']`
            )
        ).toBeVisible({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });
        await expect(
            page.locator(`${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`)
        ).toBeAttached();
        const color = await page
            .locator(`${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`)
            .evaluate((el: Element) => window.getComputedStyle(el).color);
        expect(color).toBe('rgb(190, 190, 190)');
    });

    test('cancer gene filter should remove non cancer genes', async () => {
        await page
            .locator(`${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`)
            .click();
        const color = await page
            .locator(`${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`)
            .evaluate((el: Element) => window.getComputedStyle(el).color);
        expect(color).toBe('rgb(0, 0, 0)');
        await expectElementScreenshot(
            page,
            MUTATIONS_GENES_TABLE,
            'study-view-cancer-gene-filter-removed.png'
        );
    });

    test('reset charts button should revert and disable cancer gene filter', async () => {
        await expect(page.locator(ADD_CHART_BUTTON)).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        for (let attempt = 0; attempt < 5; attempt++) {
            const isOpen =
                (await page.locator('button:text-is("Reset charts")').count()) >
                    0 &&
                (await page
                    .locator('button:text-is("Reset charts")')
                    .isVisible());
            if (isOpen) break;
            await page.locator(ADD_CHART_BUTTON).click();
            await page.waitForTimeout(1000);
        }

        await page.locator('button:text-is("Reset charts")').click();
        await expect(
            page.locator('.modal-content button:text-is("Confirm")')
        ).toBeVisible();
        await page.locator('.modal-content button:text-is("Confirm")').click();
        const color = await page
            .locator(`${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`)
            .evaluate((el: Element) => window.getComputedStyle(el).color);
        expect(color).toBe('rgb(190, 190, 190)');
        await expectElementScreenshot(
            page,
            MUTATIONS_GENES_TABLE,
            'study-view-cancer-gene-filter-reverted.png'
        );
    });
});
