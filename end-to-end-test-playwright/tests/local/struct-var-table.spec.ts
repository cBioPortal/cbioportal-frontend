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
    await expect(chartsBtn).toBeVisible();
    await chartsBtn.click();
    const chartsGenomicTab = page.locator('.tabAnchor_Genomic');
    await expect(chartsGenomicTab).toBeVisible();
    await chartsGenomicTab.click();
    const svChartCheckbox = page
        .locator('[data-test="add-chart-option-structural-variants"]')
        .locator('[data-test="labeledCheckbox"]');
    await expect(svChartCheckbox).toBeVisible();
    if (!(await svChartCheckbox.isChecked())) {
        await svChartCheckbox.click();
    }
    await chartsBtn.click();
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
