import { test, expect, Page } from '../fixtures';
import {
    byTestHandle,
    setServerConfiguration,
    waitForNetworkQuiet,
    waitForStudyQueryPage,
} from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/expressionComparison.spec.js.
 *
 * Covers the `enable_cross_study_expression` config rule across four
 * contexts:
 *  - Plots tab Y-axis profile dropdown (mRNA option presence)
 *  - Plots tab "cannot be compared" warning div
 *  - Study query form → query-by-gene landing page (mRNA profile offer)
 *  - Custom JS rule that permits expression only when a specific study
 *    is selected
 *
 * Rules are injected via `localStorage.frontendConfig` (which the app
 * reads at boot) so each test group sets the rule *then* navigates.
 */

const PAN_CAN_RULE = `
    (studies)=>studies.filter(s=>/pan_can_atlas/.test(s.studyId) === false).length === 0
`;

const GBM_CPTAC_RULE =
    '(studies)=>studies.filter(s=>/gbm_cptac_2021/.test(s.studyId)).length > 0';

const PLOTS_URL = (studies: string) =>
    `/results/plots?cancer_study_list=${studies}` +
    '&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0' +
    '&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=all' +
    '&gene_list=CDKN2A%2520MDM2&geneset_list=%20&tab_index=tab_visualize&Action=Submit';

const CANNOT_COMPARE_WARNING =
    'Expression data cannot be compared across the selected studies.';

const EXPRESSION_PROMPT = 'mRNA Expression. Select one of the profiles below:';

async function openYAxisDropdown(page: Page) {
    await page
        .locator('.Select-arrow-zone')
        .first()
        .click();
    await expect(page.locator('.Select-option').first()).toBeVisible();
}

async function expressionDataAvailable(page: Page) {
    return (
        (await page.getByText(EXPRESSION_PROMPT, { exact: true }).count()) > 0
    );
}

test.describe('plots tab expression data WITH pan_can rule', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await setServerConfiguration(page, {
            enable_cross_study_expression: PAN_CAN_RULE,
        });
    });

    test('all-pan_can multi study → expression IS available', async ({
        page,
    }) => {
        await page.goto(
            PLOTS_URL(
                'acc_tcga_pan_can_atlas_2018%2Cchol_tcga_pan_can_atlas_2018'
            )
        );
        await waitForNetworkQuiet(page);
        await openYAxisDropdown(page);
        await expect(
            page.locator('.Select-option', { hasText: 'mRNA' }).first()
        ).toBeVisible();
        await expect(
            page.getByText(CANNOT_COMPARE_WARNING, { exact: true })
        ).toHaveCount(0);
    });

    test('mixed multi study (not all pan_can) → no expression', async ({
        page,
    }) => {
        await page.goto(PLOTS_URL('acc_tcga_pan_can_atlas_2018%2Cchol_tcga'));
        await waitForNetworkQuiet(page);
        await openYAxisDropdown(page);
        await expect(
            page.locator('.Select-option', { hasText: 'Mutation' }).first()
        ).toBeVisible();
        await expect(
            page.locator('.Select-option', { hasText: 'mRNA' })
        ).toHaveCount(0);
        await expect(
            page.getByText(CANNOT_COMPARE_WARNING, { exact: true })
        ).toBeVisible();
    });

    test('single (non-pan_can) study → expression IS available', async ({
        page,
    }) => {
        await page.goto(PLOTS_URL('chol_tcga'));
        await waitForNetworkQuiet(page);
        await openYAxisDropdown(page);
        await expect(
            page.locator('.Select-option', { hasText: 'Mutation' }).first()
        ).toBeVisible();
        await expect(
            page.locator('.Select-option', { hasText: 'mRNA' }).first()
        ).toBeVisible();
        await expect(
            page.getByText(CANNOT_COMPARE_WARNING, { exact: true })
        ).toHaveCount(0);
    });
});

test.describe('plots tab expression data WITHOUT rule', () => {
    test('mixed multi study with rule undefined → no expression', async ({
        page,
    }) => {
        await page.goto('/');
        await setServerConfiguration(page, {
            enable_cross_study_expression: undefined,
        });

        await page.goto(PLOTS_URL('acc_tcga_pan_can_atlas_2018%2Cchol_tcga'));
        await waitForNetworkQuiet(page);

        // Mirror the wdio spec: defensively clear the store rule too,
        // since localStorage overrides race with the store boot in some
        // reloads.
        await page.evaluate(() => {
            (window as any).globalStores.appStore.serverConfig.enable_cross_study_expression = undefined;
        });

        await openYAxisDropdown(page);
        await expect(
            page.locator('.Select-option', { hasText: 'Mutation' }).first()
        ).toBeVisible();
        await expect(
            page.locator('.Select-option', { hasText: 'mRNA' })
        ).toHaveCount(0);
        await expect(
            page.getByText(CANNOT_COMPARE_WARNING, { exact: true })
        ).toBeVisible();
    });
});

test.describe('expression data in query form', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await setServerConfiguration(page, {
            enable_cross_study_expression: PAN_CAN_RULE,
        });
        await page.goto('/');
        await waitForStudyQueryPage(page);
    });

    test('single study with expression → offered', async ({ page }) => {
        await page.locator('.studyItem_sarc_tcga_pub').click();
        await byTestHandle(page, 'queryByGeneButton').click();
        expect(await expressionDataAvailable(page)).toBe(true);
    });

    test('single study without expression → not offered', async ({ page }) => {
        await page.locator('.studyItem_chol_nccs_2013').click();
        await byTestHandle(page, 'queryByGeneButton').click();
        expect(await expressionDataAvailable(page)).toBe(false);
    });

    test('two studies, only one pan_can → not offered', async ({ page }) => {
        await page.locator('.studyItem_sarc_tcga_pub').click();
        await page.locator('.studyItem_chol_tcga_pan_can_atlas_2018').click();
        await byTestHandle(page, 'queryByGeneButton').click();
        expect(await expressionDataAvailable(page)).toBe(false);
    });

    test('two pan_can studies → offered', async ({ page }) => {
        await page.locator('.studyItem_brca_tcga_pan_can_atlas_2018').click();
        await page.locator('.studyItem_chol_tcga_pan_can_atlas_2018').click();
        await byTestHandle(page, 'queryByGeneButton').click();
        expect(await expressionDataAvailable(page)).toBe(true);
    });
});

test.describe('cross study expression without rule', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForStudyQueryPage(page);
        await page.evaluate(() => {
            (window as any).globalStores.appStore.serverConfig.enable_cross_study_expression = undefined;
        });
    });

    test('without rule, two studies → no multi-study expression', async ({
        page,
    }) => {
        await page.locator('.studyItem_brca_tcga_pan_can_atlas_2018').click();
        await page.locator('.studyItem_chol_tcga_pan_can_atlas_2018').click();
        await byTestHandle(page, 'queryByGeneButton').click();
        expect(await expressionDataAvailable(page)).toBe(false);
    });
});

test.describe('custom expression comparison rule', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await setServerConfiguration(page, {
            enable_cross_study_expression: GBM_CPTAC_RULE,
        });
        await page.reload();
        await waitForStudyQueryPage(page);
    });

    test('all pan_can → rule NOT satisfied, no expression', async ({
        page,
    }) => {
        await page.locator('.studyItem_brca_tcga_pan_can_atlas_2018').click();
        await page.locator('.studyItem_chol_tcga_pan_can_atlas_2018').click();
        await byTestHandle(page, 'queryByGeneButton').click();
        expect(await expressionDataAvailable(page)).toBe(false);
    });

    test('rule satisfied → cross-study expression', async ({ page }) => {
        await page.locator('.studyItem_chol_tcga').click();
        await page.locator('.studyItem_gbm_cptac_2021').click();
        await byTestHandle(page, 'queryByGeneButton').click();
        expect(await expressionDataAvailable(page)).toBe(true);
    });

    test('single study still offers expression', async ({ page }) => {
        await page.locator('.studyItem_chol_tcga_pan_can_atlas_2018').click();
        await byTestHandle(page, 'queryByGeneButton').click();
        expect(await expressionDataAvailable(page)).toBe(true);
    });
});
