import { test, expect } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { setInputText, waitForStudyView } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_GENERIC_ASSAY_TAB =
    '.addChartTabs a.tabAnchor_MUTATIONAL_SIGNATURE_TEST';
const GENERIC_ASSAY_PROFILE_SELECTOR =
    '[data-test="GenericAssayProfileSelection"]';
const GENERIC_ASSAY_ENTITY_SELECTOR =
    '[data-test="GenericAssayEntitySelection"]';
const GENERIC_ASSAY_ENTITY_INPUT = `${GENERIC_ASSAY_ENTITY_SELECTOR} input >> nth=0`;
const CATEGORY_PROFILE_NAME = 'mutational signature category v2 (61 samples)';

test.describe('study view generic assay selector', () => {
    test.beforeEach(async ({ page }) => {
        await goToUrlAndSetLocalStorage(page, studyViewUrl, true);
        await waitForStudyView(page);
        await page.locator(ADD_CHART_BUTTON).click();
        await page.locator(ADD_CHART_GENERIC_ASSAY_TAB).click();
        await page.locator(GENERIC_ASSAY_PROFILE_SELECTOR).click();
        await page
            .locator(GENERIC_ASSAY_PROFILE_SELECTOR)
            .getByText(CATEGORY_PROFILE_NAME, { exact: true })
            .click();
    });

    test('restores the unfiltered warning after clearing a search', async ({
        page,
    }) => {
        const selector = page.locator(GENERIC_ASSAY_ENTITY_SELECTOR);
        const warning = selector.getByText(/^Showing first/);
        await selector.click();
        await expect(warning).toBeVisible();
        const initialWarningText = await warning.innerText();

        await setInputText(
            page,
            GENERIC_ASSAY_ENTITY_INPUT,
            'mutational_signature_category_10'
        );
        await expect(warning).toHaveCount(0);
        await selector
            .locator('div[class$="option"]')
            .getByText('mutational_signature_category_10', { exact: true })
            .click();

        await setInputText(page, GENERIC_ASSAY_ENTITY_INPUT, '');
        await expect(warning).toHaveText(initialWarningText);
    });
});
