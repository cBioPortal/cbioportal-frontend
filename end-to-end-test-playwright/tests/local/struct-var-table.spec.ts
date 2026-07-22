// Source: end-to-end-test/local/specs/struct-var-table.spec.js
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorageWithProperty } from './helpers';
import { waitForStudyView } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;
const structVarTable = 'xpath=//*[@data-test="structural variant pairs-table"]';
const filterCheckBox = '[data-test=labeledCheckbox]';
const structVarFilterPillTag = '[data-test=pill-tag]';

async function showSvPane(page: Page) {
    const chartsBtn = page.locator('[data-test=add-charts-button]');
    const chartsGenomicTab = page.locator('.tabAnchor_Genomic');
    await expect(chartsBtn).toBeVisible();

    // The add-charts dropdown occasionally fails to open on the first
    // click (button stays in its hover state with no menu appearing).
    // Retry the click until the Genomic tab is confirmed visible instead
    // of asserting after a single click.
    await expect(async () => {
        await chartsBtn.click();
        await expect(chartsGenomicTab).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30000 });

    const svChartCheckbox = page
        .locator('[data-test="add-chart-option-structural-variants"]')
        .locator('[data-test="labeledCheckbox"]');

    await expect(async () => {
        await chartsGenomicTab.click();
        await expect(svChartCheckbox).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30000 });

    if (!(await svChartCheckbox.isChecked())) {
        await svChartCheckbox.click();
    }

    // Close the dropdown, retrying until it's actually gone — otherwise
    // the still-open menu can intercept subsequent clicks on the page.
    await expect(async () => {
        await chartsBtn.click();
        await expect(chartsGenomicTab).toBeHidden({ timeout: 2000 });
    }).toPass({ timeout: 30000 });

    await waitForStudyView(page);
}

test.describe('study view structural variant table', () => {
    test.beforeEach(async ({ page }) => {
        await goToUrlAndSetLocalStorageWithProperty(page, studyViewUrl, true, {
            skin_study_view_show_sv_table: true,
        });
        await waitForStudyView(page);
        await showSvPane(page);
    });

    test('adds structural variant to study view filter', async ({ page }) => {
        await page
            .locator(structVarTable)
            .locator(filterCheckBox)
            .first()
            .click();
        await expect(
            page.locator('[data-test=selectSamplesButton]')
        ).toBeAttached();
        await page.locator('[data-test=selectSamplesButton]').click();
        await expect(page.locator(structVarFilterPillTag)).toBeAttached();
    });
});
