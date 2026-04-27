import { test, expect, Page } from '@playwright/test';
import { expectElementScreenshot } from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/coexpression.screenshot.spec.js.
 *
 * Each test toggles one control on the Co-Expression tab (log scale,
 * regression line, mutation visibility, gene/profile selection) and
 * asserts the rendered scatter matches a committed reference.
 *
 * Tests share one Page because each mutation builds on the previous
 * state — a clean URL reload between tests would force us to replay
 * all earlier toggles.
 */

const COEXPRESSION_TIMEOUT = 30000;
const TAB = 'div[data-test="coExpressionTabDiv"]';

const INITIAL_URL =
    '/results/coexpression?tab_index=tab_visualize' +
    '&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
    '&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut' +
    '&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit';

const MANY_GENES_URL =
    '/results/coexpression?Action=Submit&RPPA_SCORE_THRESHOLD=2&Z_SCORE_THRESHOLD=2' +
    '&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub' +
    '&case_set_id=coadread_tcga_pub_hypermut&data_priority=0' +
    '&gene_list=AKR1C3%2520AR%2520CYB5A%2520CYP11A1%2520CYP11B1%2520CYP11B2%2520CYP17A1%2520CYP19A1%2520CYP21A2%2520HSD17B1%2520HSD17B10%2520HSD17B11%2520HSD17B12%2520HSD17B13%2520HSD17B14%2520HSD17B2%2520HSD17B3%2520HSD17B4%2520HSD17B6%2520HSD17B7%2520HSD17B8%2520HSD3B1%2520HSD3B2%2520HSD3B7%2520RDH5%2520SHBG%2520SRD5A1%2520SRD5A2%2520SRD5A3%2520STAR' +
    '&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
    '&profileFilter=0&tab_index=tab_visualize';

const CUSTOM_CASES_URL =
    '/results/coexpression?Action=Submit&cancer_study_list=coadread_tcga_pub' +
    '&case_ids=coadread_tcga_pub%3ATCGA-A6-2672-01%2Bcoadread_tcga_pub%3ATCGA-A6-2678-01%2Bcoadread_tcga_pub%3ATCGA-A6-3809-01%2Bcoadread_tcga_pub%3ATCGA-AA-3502-01%2Bcoadread_tcga_pub%3ATCGA-AA-3510-01%2Bcoadread_tcga_pub%3ATCGA-AA-3672-01%2Bcoadread_tcga_pub%3ATCGA-AA-3673-01%2Bcoadread_tcga_pub%3ATCGA-AA-3850-01%2Bcoadread_tcga_pub%3ATCGA-AA-3852-01%2Bcoadread_tcga_pub%3ATCGA-AA-3862-01%2Bcoadread_tcga_pub%3ATCGA-AA-3877-01%2Bcoadread_tcga_pub%3ATCGA-AA-3986-01%2Bcoadread_tcga_pub%3ATCGA-AA-3989-01%2Bcoadread_tcga_pub%3ATCGA-AA-3994-01%2Bcoadread_tcga_pub%3ATCGA-AA-A00L-01%2Bcoadread_tcga_pub%3ATCGA-AA-A010-01%2Bcoadread_tcga_pub%3ATCGA-AA-A02O-01%2Bcoadread_tcga_pub%3ATCGA-CM-4748-01' +
    '&case_set_id=-1&clinicallist=PROFILED_IN_coadread_tcga_pub_mutations%2CPROFILED_IN_coadread_tcga_pub_gistic' +
    '&gene_list=KRAS%0AAPC&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
    '&show_samples=false&tab_index=tab_visualize';

async function waitForCoexpressionPlot(page: Page) {
    await expect(page.locator('div[data-test="CoExpressionPlot"]')).toBeVisible(
        {
            timeout: COEXPRESSION_TIMEOUT,
        }
    );
}

test.describe.serial('coexpression tab screenshot tests', () => {
    test.describe.configure({ retries: 0 });
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(INITIAL_URL);
        await waitForCoexpressionPlot(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('initial load', async () => {
        await expectElementScreenshot(page, TAB, 'coex-initial.png');
    });

    test('log scale x & y, mutations on', async () => {
        await page.locator(`${TAB} input[data-test="logScale"]`).click();
        await expectElementScreenshot(page, TAB, 'coex-logscale.png');
    });

    test('log scale with regression line', async () => {
        await page.locator('input[data-test="ShowRegressionLine"]').click();
        await expectElementScreenshot(page, TAB, 'coex-regression.png');
    });

    test('log scale with mutations off', async () => {
        await page.locator('input[data-test="ShowRegressionLine"]').click();
        await page.locator(`${TAB} input[data-test="ShowMutations"]`).click();
        await expectElementScreenshot(page, TAB, 'coex-no-mutations.png');
    });

    test('switch genes (NRAS)', async () => {
        await page
            .locator('#coexpressionTabGeneTabs>ul>li:nth-child(2)>a')
            .click();
        await waitForCoexpressionPlot(page);
        await expectElementScreenshot(page, TAB, 'coex-nras.png');
    });

    test('switch profiles to mRNA x/y', async () => {
        await page.evaluate(() => {
            const t = (window as any).resultsViewCoExpressionTab;
            t.onSelectProfileX({ value: 'coadread_tcga_pub_mrna' });
            t.onSelectProfileY({ value: 'coadread_tcga_pub_mrna' });
        });
        await waitForCoexpressionPlot(page);
        await expectElementScreenshot(page, TAB, 'coex-mrna-profiles.png');
    });

    test('mRNA profiles + regression line', async () => {
        await page.locator('input[data-test="ShowRegressionLine"]').click();
        await expectElementScreenshot(
            page,
            TAB,
            'coex-mrna-profiles-regression.png'
        );
    });

    test('many genes (different URL)', async () => {
        await page.goto(MANY_GENES_URL);
        await waitForCoexpressionPlot(page);
        await expectElementScreenshot(page, TAB, 'coex-many-genes.png');
    });

    test('user-defined case list', async () => {
        await page.goto(CUSTOM_CASES_URL);
        await waitForCoexpressionPlot(page);
        await expectElementScreenshot(page, TAB, 'coex-custom-cases.png');
    });
});
