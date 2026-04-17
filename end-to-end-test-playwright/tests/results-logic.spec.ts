import { test, expect, Page } from '@playwright/test';
import { setInputText, waitForNetworkQuiet } from './helpers/common';
import {
    clickQueryByGeneButton,
    waitForNumberOfStudyCheckboxes,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Port of end-to-end-test/remote/specs/core/results.logic.spec.js.
 *
 * Non-screenshot logic tests for the results view and the modify-query
 * form: invalid-query handling, tab hiding heuristics (coexpression,
 * cnSegments, survival, mutual-exclusivity), case-set & molecular-
 * profile selector behaviour, and a couple of mutation-mapper sanity
 * checks. These mostly assert presence/absence of elements + a few
 * text contents.
 */

test.describe('Invalid query handling', () => {
    test('shows query form if no genes are submitted', async ({ browser }) => {
        const page = await browser.newPage();
        await page.goto(
            '/results/oncoprint?cancer_study_list=metastatic_solid_tumors_mich_2017'
        );
        await expect(page.locator('[data-test=studyList]')).toBeVisible({
            timeout: 30000,
        });
        // The study label has class `studyItem_<id>` on a <span>; the
        // selection state lives on the preceding-sibling <input>. Both
        // span + input render twice (filtered list + selected list), so
        // scope to the first match.
        const studyCheckbox = page
            .locator('.studyItem_metastatic_solid_tumors_mich_2017')
            .first()
            .locator('xpath=preceding-sibling::input[1]');
        await expect(studyCheckbox).toBeChecked();
        await page.close();
    });
});

test.describe('cross cancer query', () => {
    test('shows TP53 in nav above cancer-types-summary plot for multi-study TP53 query', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(
            '/results/cancerTypesSummary?cancer_study_list=chol_tcga%2Cblca_tcga_pub%2Ccoadread_tcga' +
                '&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0' +
                '&case_set_id=all&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit'
        );
        await waitForNetworkQuiet(page, 60000);
        await expect(
            page.locator('[data-test=cancerTypeSummaryChart]').first()
        ).toBeVisible({ timeout: 60000 });
        await expect(
            page.locator('.nav-pills a:has-text("TP53")').first()
        ).toBeVisible();
        await page.close();
    });
});

test.describe('single study mutation mapper', () => {
    test('shows somatic and germline mutation rate for ovarian nature 2011', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto('/');
        const studyInput = page.locator(
            '[data-test=study-search] input[type=text]'
        );
        await expect(studyInput).toBeVisible({ timeout: 10000 });
        await studyInput.fill('ovarian nature 2011');
        await waitForNumberOfStudyCheckboxes(page, 1);
        await page.locator('[data-test="StudySelect"] input').click();
        await clickQueryByGeneButton(page);

        await setInputText(page, '[data-test="geneSet"]', 'BRCA1 BRCA2');
        const queryBtn = page.locator('[data-test=queryButton]');
        await expect(queryBtn).toBeEnabled({ timeout: 10000 });
        await queryBtn.click();

        await page.locator('a.tabAnchor_mutations').click();
        await page.locator('[data-test=mutation-rate-summary]').click();

        const text = await page
            .locator('[data-test="mutation-rate-summary"]')
            .textContent();
        expect(text).toContain('8.2%');
        expect(text).toContain('3.5%');
        await page.close();
    });

    test('shows lollipop for MUC2 in cellline_nci60', async ({ browser }) => {
        const page = await browser.newPage();
        await page.goto(
            '/index.do?cancer_study_id=cellline_nci60&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
                '&data_priority=0&case_set_id=cellline_nci60_cnaseq&gene_list=MUC2&geneset_list=+' +
                '&tab_index=tab_visualize&Action=Submit' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=cellline_nci60_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=cellline_nci60_cna'
        );
        await waitForNetworkQuiet(page, 60000);
        await page.locator('a.tabAnchor_mutations').click();
        await expect(page.locator('[data-test=LollipopPlot]')).toBeVisible({
            timeout: 30000,
        });
        await page.close();
    });
});

test.describe('single study enrichments', () => {
    test('comparison-tab alterations sub-tab is reachable for ov_tcga_pub BRCA1+BRCA2', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(
            '/results/comparison?cancer_study_id=ov_tcga_pub&Z_SCORE_THRESHOLD=2.0' +
                '&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=ov_tcga_pub_cna_seq' +
                '&gene_list=BRCA1+BRCA2&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ov_tcga_pub_gistic'
        );
        await expect(
            page.locator('.comparisonTabSubTabs .tabAnchor_alterations')
        ).toBeAttached({ timeout: 60000 });
        await page.close();
    });
});

test.describe('results page tab hiding', () => {
    test('hides coexpression and cnSegments tabs for query without those data', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto('/index.do?session_id=5bc64b48498eb8b3d5685af7');
        await waitForOncoprint(page);
        await expect(page.locator('a.tabAnchor_coexpression')).toBeHidden();
        await expect(page.locator('a.tabAnchor_cnSegments')).toBeHidden();
        await page.close();
    });

    test('hides survival tab for query without survival data', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(
            '/results/comparison?session_id=5bc64bb5498eb8b3d5685afb'
        );
        await expect(
            page.locator('div[data-test="ComparisonPageOverlapTabDiv"]')
        ).toBeVisible({ timeout: 30000 });
        await expect(page.locator('a.tabAnchor_survival')).toBeHidden();
        await page.close();
    });
});

test.describe('mutual exclusivity tab', () => {
    test('appears for single study with multiple genes', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(
            '/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
                '&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut' +
                '&gene_list=KRAS%2520NRAS%2520BRAF%250APTEN%253A%2520MUT&geneset_list=+' +
                '&tab_index=tab_visualize&Action=Submit' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic'
        );
        await expect(
            page.locator('a.tabAnchor_mutualExclusivity')
        ).toBeVisible({ timeout: 30000 });
        await page.close();
    });

    test('appears for multi-study with multiple genes', async ({ browser }) => {
        const page = await browser.newPage();
        await page.goto(
            '/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
                '&data_priority=0&case_set_id=all' +
                '&gene_list=KRAS%2520NRAS%2520BRAF%250APTEN%253A%2520MUT&geneset_list=+' +
                '&tab_index=tab_visualize&Action=Submit' +
                '&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga'
        );
        await expect(
            page.locator('a.tabAnchor_mutualExclusivity')
        ).toBeVisible({ timeout: 30000 });
        await page.close();
    });

    test('does not appear for single study with one gene (KRAS:MUT or KRAS)', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(
            '/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
                '&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut' +
                '&gene_list=KRAS%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic'
        );
        await waitForOncoprint(page);
        await expect(
            page.locator('a.tabAnchor_mutualExclusivity')
        ).toBeHidden();

        await page.goto(
            '/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
                '&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut' +
                '&gene_list=KRAS&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic'
        );
        await waitForOncoprint(page);
        await expect(
            page.locator('a.tabAnchor_mutualExclusivity')
        ).toBeHidden();
        await page.close();
    });

    test('does not appear for multi-study with one gene (KRAS or KRAS:MUT)', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(
            '/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
                '&data_priority=0&case_set_id=all&gene_list=KRAS&geneset_list=+' +
                '&tab_index=tab_visualize&Action=Submit' +
                '&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga'
        );
        await expect(page.locator('a.tabAnchor_oncoprint')).toBeVisible({
            timeout: 30000,
        });
        await expect(page.locator('a.tabAnchor_mutualExclusivity')).toBeHidden({
            timeout: 30000,
        });

        await page.goto(
            '/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
                '&data_priority=0&case_set_id=all' +
                '&gene_list=KRAS%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
                '&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga'
        );
        await expect(page.locator('a.tabAnchor_oncoprint')).toBeVisible({
            timeout: 30000,
        });
        await expect(page.locator('a.tabAnchor_mutualExclusivity')).toBeHidden({
            timeout: 30000,
        });
        await page.close();
    });
});

const COADREAD_RPPA_QUERY_URL =
    '/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
    '&data_priority=0&case_set_id=coadread_tcga_pub_rppa&gene_list=KRAS%2520NRAS%2520BRAF' +
    '&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic';

const SELECTED_CASE_SET_SEL =
    'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

const ALL_CASE_SET_REGEXP = /^All \(\d+\)$/;

test.describe('case set selection in modify query form', () => {
    test('case set follows multi-study toggle (RPPA -> All -> default)', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(COADREAD_RPPA_QUERY_URL);
        await expect(page.locator('#modifyQueryBtn')).toBeVisible({
            timeout: 60000,
        });
        await page.locator('#modifyQueryBtn').click();

        await expect(
            page.locator(SELECTED_CASE_SET_SEL)
        ).toHaveText('Samples with protein data (RPPA) (196)', {
            timeout: 10000,
        });

        // Add a second study (ACC TCGA Firehose Legacy).
        await page
            .locator('div[data-test=study-search] input[type=text]')
            .fill('adrenocortical carcinoma tcga firehose legacy');
        await waitForNumberOfStudyCheckboxes(page, 1);
        await page.locator('[data-test="StudySelect"] input').click();

        // With multiple studies, defaults to "All".
        await expect
            .poll(
                async () =>
                    (await page.locator(SELECTED_CASE_SET_SEL).textContent()) ??
                    '',
                { timeout: 10000 }
            )
            .toMatch(ALL_CASE_SET_REGEXP);

        // Uncheck the second study; revert to single-study default.
        await page.locator('[data-test="StudySelect"] input').click();
        await expect(
            page.locator(SELECTED_CASE_SET_SEL)
        ).toHaveText('Samples with mutation and CNA data (212)', {
            timeout: 10000,
        });
        await page.close();
    });

    test('case set follows the "select all filtered studies" checkbox', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(COADREAD_RPPA_QUERY_URL);
        await expect(page.locator('#modifyQueryBtn')).toBeVisible({
            timeout: 60000,
        });
        await page.locator('#modifyQueryBtn').click();

        await expect(
            page.locator(SELECTED_CASE_SET_SEL)
        ).toHaveText('Samples with protein data (RPPA) (196)', {
            timeout: 10000,
        });

        await page
            .locator('div[data-test=study-search] input[type=text]')
            .fill('glioblastoma');
        await page.waitForTimeout(500);
        await page
            .locator(
                'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
            )
            .click();
        await expect(
            page.locator('[data-test=MUTATION_EXTENDED]').first()
        ).toBeVisible({ timeout: 10000 });

        await expect
            .poll(
                async () =>
                    (await page.locator(SELECTED_CASE_SET_SEL).textContent()) ??
                    '',
                { timeout: 10000 }
            )
            .toMatch(ALL_CASE_SET_REGEXP);

        await page
            .locator(
                'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
            )
            .click();
        await expect(
            page.locator(SELECTED_CASE_SET_SEL)
        ).toHaveText('Samples with mutation and CNA data (212)', {
            timeout: 10000,
        });
        await page.close();
    });
});

test.describe('gene list input', () => {
    test('allows gene textarea update from modify query form', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(COADREAD_RPPA_QUERY_URL);
        await expect(page.locator('#modifyQueryBtn')).toBeVisible({
            timeout: 60000,
        });
        await page.locator('#modifyQueryBtn').click();
        const textarea = page.locator('[data-test=geneSet]');
        await expect(textarea).toBeVisible();
        await textarea.fill('TP53 BRAF');
        await expect(textarea).toHaveValue('TP53 BRAF');
        await page.close();
    });
});

const CHOL_TCGA_QUERY_URL =
    '/index.do?cancer_study_id=chol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0' +
    '&data_priority=0&case_set_id=chol_tcga_all&gene_list=EGFR&geneset_list=+' +
    '&tab_index=tab_visualize&Action=Submit' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=chol_tcga_mutations' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=chol_tcga_gistic' +
    '&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=chol_tcga_rppa_Zscores';

test.describe('genetic profile selection in modify query form', () => {
    test('keeps profiles selected through add+remove of a second study', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(CHOL_TCGA_QUERY_URL);
        await expect(page.locator('#modifyQueryBtn')).toBeVisible({
            timeout: 30000,
        });
        await page.locator('#modifyQueryBtn').click();

        const profSel = (handle: string) =>
            page.locator(
                `div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="${handle}"]`
            );

        // Initial state from URL: MUT/CNA/PROTEIN are URL-driven; MRNA
        // is not requested. (The wdio version had no-op `isSelected()`
        // calls without an enclosing `assert`, so it never noticed that
        // MRNA was unchecked here.)
        await expect(profSel('MUTATION_EXTENDED')).toBeChecked({
            timeout: 30000,
        });
        await expect(profSel('COPY_NUMBER_ALTERATION')).toBeChecked();
        await expect(profSel('MRNA_EXPRESSION')).not.toBeChecked();
        await expect(profSel('PROTEIN_LEVEL')).toBeChecked();

        // Add ampullary baylor study.
        await page
            .locator('div[data-test=study-search] input[type=text]')
            .fill('ampullary baylor');
        await waitForNumberOfStudyCheckboxes(page, 1);
        await page.locator('[data-test="StudySelect"] input').click();

        await expect(profSel('MUTATION_EXTENDED')).toBeChecked();
        await expect(profSel('COPY_NUMBER_ALTERATION')).toBeChecked();

        // Remove the second study; profiles unsupported by chol_tcga
        // alone must drop out.
        await page.locator('[data-test="StudySelect"] input').click();

        await expect(profSel('MUTATION_EXTENDED')).toBeChecked();
        await expect(profSel('COPY_NUMBER_ALTERATION')).toBeChecked();
        await expect(profSel('MRNA_EXPRESSION')).not.toBeChecked();
        await expect(profSel('PROTEIN_LEVEL')).not.toBeChecked();
        await page.close();
    });

    test('"select all filtered studies" keeps mutations + CNA selected', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(CHOL_TCGA_QUERY_URL);
        await expect(page.locator('#modifyQueryBtn')).toBeVisible({
            timeout: 30000,
        });
        await page.locator('#modifyQueryBtn').click();

        const profSel = (handle: string) =>
            page.locator(
                `div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="${handle}"]`
            );

        await expect(profSel('MUTATION_EXTENDED')).toBeVisible({
            timeout: 10000,
        });
        await expect(profSel('MUTATION_EXTENDED')).toBeChecked();
        await expect(profSel('COPY_NUMBER_ALTERATION')).toBeChecked();
        await expect(profSel('MRNA_EXPRESSION')).not.toBeChecked();
        await expect(profSel('PROTEIN_LEVEL')).toBeChecked();

        await page
            .locator('div[data-test=study-search] input[type=text]')
            .fill('tcga -firehose');
        await page.waitForTimeout(500);
        await page
            .locator(
                'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
            )
            .click();

        await expect(profSel('MUTATION_EXTENDED')).toBeChecked({
            timeout: 30000,
        });
        await expect(profSel('COPY_NUMBER_ALTERATION')).toBeChecked();

        await page
            .locator(
                'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
            )
            .click();

        await expect(profSel('MUTATION_EXTENDED')).toBeChecked();
        await expect(profSel('COPY_NUMBER_ALTERATION')).toBeChecked();
        await expect(profSel('MRNA_EXPRESSION')).not.toBeChecked();
        await expect(profSel('PROTEIN_LEVEL')).not.toBeChecked();
        await page.close();
    });
});

test.describe.serial('invalid query from URL', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('shows invalid query alert when URL contains invalid gene "RB"', async () => {
        await page.goto(
            '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
                '&cancer_study_list=mixed_pipseq_2017&case_set_id=mixed_pipseq_2017_sequenced' +
                '&clinicallist=NUM_SAMPLES_PER_PATIENT&data_priority=0&gene_list=RB&geneset_list=%20' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=mixed_pipseq_2017_mutations' +
                '&show_samples=false&tab_index=tab_visualize'
        );
        const alert = page.locator('[data-test=invalidQueryAlert]');
        await expect(alert).toBeVisible({ timeout: 60000 });
        const text = (await alert.textContent())?.trim();
        expect(text).toBe(
            'Your query has invalid or out-dated gene symbols. Please correct below.'
        );
    });

    test('correcting RB to RB1 lands on results-view oncoprint', async () => {
        const textarea = page.locator('[data-test=geneSet]');
        await textarea.fill('RB1');
        const queryBtn = page.locator('[data-test=queryButton]');
        await expect(queryBtn).toBeEnabled();
        await queryBtn.click();
        await expect(page.locator('#modifyQueryBtn')).toBeAttached({
            timeout: 30000,
        });
        await waitForOncoprint(page);
    });
});
