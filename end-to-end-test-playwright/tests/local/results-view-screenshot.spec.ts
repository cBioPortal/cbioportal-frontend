// Source: end-to-end-test/local/specs/core/resultsview.screenshot.spec.js
import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { expectElementScreenshot } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const COEXPRESSION_TIMEOUT = 200000;

test.describe('results view mutation table', () => {
    test('shows ASCN columns for study with ASCN data', async ({ page }) => {
        const url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=ascn_test_study&case_set_id=ascn_test_study_cnaseq&data_priority=0&gene_list=PIK3R1&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ascn_test_study_cna&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ascn_test_study_mutations&profileFilter=0&tab_index=tab_visualize`;
        await goToUrlAndSetLocalStorage(page, url, true);
        await page
            .locator(
                'table[class="simple-table table table-striped table-border-top"]'
            )
            .waitFor({ state: 'attached' });
        await expectElementScreenshot(
            page,
            'table[class="simple-table table table-striped table-border-top"]',
            'shows-ascn-columns-for-study-with-ascn-data.png'
        );
    });

    test('shows ASCN columns for study where some samples have ASCN data and some do not', async ({
        page,
    }) => {
        const url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=ascn_test_study%2Cstudy_es_0&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&profileFilter=0&tab_index=tab_visualize`;
        await goToUrlAndSetLocalStorage(page, url, true);
        await page
            .locator(
                'table[class="simple-table table table-striped table-border-top"]'
            )
            .waitFor({ state: 'attached' });

        await page.evaluate(() => {
            document
                .querySelectorAll('th')
                .forEach(th => ((th as HTMLElement).style.color = 'red'));
        });

        await expectElementScreenshot(
            page,
            'table[class="simple-table table table-striped table-border-top"]',
            'shows-ascn-columns-mixed-samples.png'
        );
    });

    test('does not show ASCN columns study with no ASCN data', async ({
        page,
    }) => {
        const url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize`;
        await goToUrlAndSetLocalStorage(page, url, true);
        await page
            .locator(
                'table[class="simple-table table table-striped table-border-top"]'
            )
            .waitFor({ state: 'attached' });
        await expectElementScreenshot(
            page,
            'table[class="simple-table table table-striped table-border-top"]',
            'does-not-show-ascn-columns-study-with-no-ascn-data.png'
        );
    });
});

test.describe('cnsegments tab', () => {
    test('renders cnsegments tab', async ({ page }) => {
        const url = `${CBIOPORTAL_URL}/results/cnSegments?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize`;
        await goToUrlAndSetLocalStorage(page, url, true);
        await expect(page.locator('.igv-viewport-content').first()).toBeVisible(
            {
                timeout: 60000,
            }
        );
        await expectElementScreenshot(
            page,
            '.cnSegmentsMSKTab',
            'renders-cnsegments-tab.png',
            { hide: ['.qtip'] }
        );
    });
});

test.describe('coexpression tab', () => {
    test.use({ viewport: { width: 1600, height: 2000 } });

    test('renders coexpression tab', async ({ page }) => {
        const url = `${CBIOPORTAL_URL}/results/coexpression?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=ERCC5&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize`;
        await goToUrlAndSetLocalStorage(page, url, true);
        await expect(
            page.locator('div[data-test="CoExpressionPlot"]')
        ).toBeVisible({
            timeout: COEXPRESSION_TIMEOUT,
        });
        await expectElementScreenshot(
            page,
            '[data-test="coExpressionTabDiv"]',
            'renders-coexpression-tab.png',
            { hide: ['.qtip'] }
        );
    });
});
