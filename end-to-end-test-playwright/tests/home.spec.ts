import { test, expect, Page } from '@playwright/test';
import { setInputText } from './helpers/common';
import {
    byTestHandle,
    clickQueryByGeneButton,
    waitForNumberOfStudyCheckboxes,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Port of end-to-end-test/remote/specs/core/home.spec.js.
 *
 * Covers:
 *  - homepage study list, filter, case-set selection when a single study
 *    is picked, and multi-study OQL rules (EXP/PROT).
 *  - select-all / deselect-all behaviour.
 *  - default case-set selection across single->multiple->single flows.
 *  - default genetic-profile selection (mutations + CNA, MRNA off) across
 *    modify-study flows.
 *  - OQL-driven auto-selection of mrna/protein profiles.
 *  - results-page quick-OQL edit rejecting unsupported PROT queries.
 */

const SEARCH_INPUT = 'div[data-test=study-search] input[type=text]';
const STUDY_SELECT_INPUT = '[data-test="StudySelect"] input';
const SELECTED_CASE_SET =
    'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';
const MOLECULAR_CHECKBOX =
    'div[data-test="molecularProfileSelector"] input[type="checkbox"]';

async function countCheckedStudies(page: Page): Promise<number> {
    return await page
        .locator('[data-test="StudySelect"] input[type=checkbox]:checked')
        .count();
}

async function clickModifyStudy(page: Page) {
    await page.locator('[data-test="modifyStudySelectionButton"]').click();
}

test.describe('homepage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('shows some (>0) studies listed', async ({ page }) => {
        const selector = '[data-test="cancerTypeListContainer"] > ul > ul';
        await expect(page.locator(selector).first()).toBeAttached({
            timeout: 10000,
        });
        expect(await page.locator(selector).count()).toBeGreaterThan(0);
    });

    test('filters the study list on text input', async ({ page }) => {
        await expect(page.locator(SEARCH_INPUT)).toBeVisible({
            timeout: 10000,
        });
        await setInputText(page, SEARCH_INPUT, 'bladder');
        await expect(async () => {
            const count = await page
                .locator('[data-test="StudySelect"] input[type=checkbox]')
                .count();
            expect(count).toBeGreaterThan(1);
        }).toPass({ timeout: 10000 });
    });

    test('shows case-set selector when a single study is selected', async ({
        page,
    }) => {
        await expect(byTestHandle(page, 'StudySelect').first()).toBeVisible({
            timeout: 10000,
        });
        await expect(page.locator('[data-test="CaseSetSelector"]')).toHaveCount(
            0
        );
        await page
            .locator(STUDY_SELECT_INPUT)
            .first()
            .click();
        await clickQueryByGeneButton(page);
        await expect(
            page.locator('[data-test="CaseSetSelector"]')
        ).toBeVisible({ timeout: 10000 });
    });

    test('blocks submission when OQL contains EXP or PROT across multi-study query', async ({
        page,
    }) => {
        await expect(page.locator(SEARCH_INPUT)).toBeVisible({
            timeout: 20000,
        });
        await setInputText(page, SEARCH_INPUT, 'breast -invasive');
        await page.waitForTimeout(500);
        await expect(byTestHandle(page, 'StudySelect').first()).toBeVisible({
            timeout: 10000,
        });
        await page.locator('[data-test="selectAllStudies"]').click();
        await clickQueryByGeneButton(page);

        const oqlEntry = 'textarea[data-test="geneSet"]';
        await setInputText(page, oqlEntry, 'PTEN: EXP>1');
        await expect(
            byTestHandle(page, 'oqlErrorMessage')
        ).toHaveText(
            'Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.',
            { timeout: 10000 }
        );
        await expect(
            page.locator('button[data-test="queryButton"]')
        ).toBeDisabled();

        await setInputText(page, oqlEntry, 'PTEN: PROT>1');
        await expect(
            byTestHandle(page, 'oqlErrorMessage')
        ).toHaveText(
            'Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.',
            { timeout: 10000 }
        );
        await expect(
            page.locator('button[data-test="queryButton"]')
        ).toBeDisabled();
    });
});

test.describe('select all/deselect all functionality in study selector', () => {
    test('select-all then global deselect clears everything', async ({
        page,
    }) => {
        await page.goto('/');
        await page.waitForTimeout(1000);
        expect(await countCheckedStudies(page)).toBe(0);

        await page
            .locator('button:text-is("TCGA PanCancer Atlas Studies")')
            .click();
        expect(await countCheckedStudies(page)).toBe(32);

        await page
            .locator('[data-test=globalDeselectAllStudiesButton]')
            .first()
            .click();
        expect(await countCheckedStudies(page)).toBe(0);
    });

    test('global deselect clears everything even during filter', async ({
        page,
    }) => {
        await page.goto('/');
        await expect(
            byTestHandle(page, 'globalDeselectAllStudiesButton')
        ).toHaveCount(0);

        await page.waitForTimeout(500);
        await setInputText(page, SEARCH_INPUT, 'ovarian nature 2011');
        await waitForNumberOfStudyCheckboxes(page, 1);
        await page
            .locator(STUDY_SELECT_INPUT)
            .first()
            .click();
        await page.waitForTimeout(200);

        await expect(
            byTestHandle(page, 'globalDeselectAllStudiesButton').first()
        ).toBeVisible();
        expect(await countCheckedStudies(page)).toBe(1);

        await setInputText(page, SEARCH_INPUT, 'breast');
        await page
            .locator('[data-test=globalDeselectAllStudiesButton]')
            .first()
            .click();
        await page.locator('[data-test=clearStudyFilter]').click();

        expect(await countCheckedStudies(page)).toBe(0);
    });
});

test.describe('case set selection in front page query form', () => {
    test('default case set for single-study selection', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator(SEARCH_INPUT)).toBeVisible({
            timeout: 20000,
        });
        await setInputText(page, SEARCH_INPUT, 'ovarian nature 2011');
        await waitForNumberOfStudyCheckboxes(page, 1);
        await page
            .locator(STUDY_SELECT_INPUT)
            .first()
            .click();

        await clickQueryByGeneButton(page);

        await expect(page.locator(SELECTED_CASE_SET)).toHaveText(
            'Samples with mutation and CNA data (316)',
            {
                timeout: 10000,
            }
        );
    });

    test('default case sets across single->multi->single flow', async ({
        page,
    }) => {
        test.setTimeout(180_000);
        await page.goto('/');

        const searchAndSelect = async (
            studyName: string,
            checkboxSel: string,
            expected: string
        ) => {
            await expect(page.locator(SEARCH_INPUT)).toBeVisible({
                timeout: 20000,
            });
            await setInputText(page, SEARCH_INPUT, studyName);
            await page
                .locator('[data-test="study-search"] .dropdown-toggle')
                .click();
            await waitForNumberOfStudyCheckboxes(page, 1);
            await page
                .locator(checkboxSel)
                .first()
                .click();
            await page.waitForTimeout(2000);

            await clickQueryByGeneButton(page);
            await expect(page.locator(SELECTED_CASE_SET)).toHaveText(expected, {
                timeout: 30000,
            });
        };

        await searchAndSelect(
            'ampullary baylor',
            STUDY_SELECT_INPUT,
            'Samples with mutation data (160)'
        );

        await page.waitForTimeout(2000);
        await clickModifyStudy(page);

        await searchAndSelect(
            'adrenocortical carcinoma tcga firehose legacy',
            '.studyItem_acc_tcga',
            'All (252)'
        );

        await clickModifyStudy(page);
        await page.waitForTimeout(500);

        await page.locator('[data-test="clearStudyFilter"]').click();
        await page.waitForTimeout(2000);

        await page
            .locator('.studyItem_ampca_bcm_2016')
            .first()
            .click();
        await clickQueryByGeneButton(page);

        await expect(page.locator(SELECTED_CASE_SET)).toHaveText(
            'Samples with mutation and CNA data (88)',
            {
                timeout: 15000,
            }
        );
    });
});

test.describe.serial(
    'default case sets across single->select-all-filtered->single flow',
    () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await page.goto('/');
        });

        test.afterAll(async () => {
            await page.close();
        });

        const selectAllSelector =
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]';
        const searchForStudy = async (
            studyName: string,
            expected: number | 'any' = 1
        ) => {
            await expect(page.locator(SEARCH_INPUT)).toBeVisible({
                timeout: 20000,
            });
            await setInputText(page, SEARCH_INPUT, studyName);
            await page
                .locator('[data-test="study-search"] .dropdown-toggle')
                .click();
            if (expected === 'any') {
                await page.waitForTimeout(1000);
            } else {
                await waitForNumberOfStudyCheckboxes(page, expected);
            }
        };

        test('step 1: select Ampullary Carcinoma', async () => {
            await searchForStudy('ampullary baylor');
            await page
                .locator(STUDY_SELECT_INPUT)
                .first()
                .click();
            await clickQueryByGeneButton(page);
            await expect(page.locator(SELECTED_CASE_SET)).toHaveText(
                'Samples with mutation data (160)',
                {
                    timeout: 10000,
                }
            );
        });

        test('step 2: select all TCGA non-provisional studies', async () => {
            test.setTimeout(120_000);
            await clickModifyStudy(page);
            await searchForStudy('tcga -provisional', 'any');
            await page.waitForTimeout(500);
            await page.locator(selectAllSelector).click();
            await clickQueryByGeneButton(page);
            await expect(
                byTestHandle(page, 'MUTATION_EXTENDED').first()
            ).toBeVisible({ timeout: 20000 });
            await expect(
                byTestHandle(page, 'COPY_NUMBER_ALTERATION').first()
            ).toBeVisible({ timeout: 10000 });
            await expect
                .poll(
                    async () => page.locator(SELECTED_CASE_SET).textContent(),
                    {
                        timeout: 10000,
                    }
                )
                .toMatch(/All \(\d+\)/);
        });

        test('step 3: deselect all TCGA non-provisional', async () => {
            await clickModifyStudy(page);
            await page
                .locator(
                    '[data-tour="cancer-study-list-container"] input[data-test="selectAllStudies"]'
                )
                .click();
            await clickQueryByGeneButton(page);
            await expect(page.locator(SELECTED_CASE_SET)).toHaveText(
                'Samples with mutation data (160)',
                {
                    timeout: 10000,
                }
            );
        });

        test('step 4: select Adrenocortical Carcinoma', async () => {
            await page.waitForTimeout(2000);
            await clickModifyStudy(page);
            await searchForStudy(
                'adrenocortical carcinoma tcga firehose legacy'
            );
            await page
                .locator(STUDY_SELECT_INPUT)
                .first()
                .click();
            await clickQueryByGeneButton(page);
            await expect(
                page.locator(SELECTED_CASE_SET)
            ).toHaveText('All (252)', { timeout: 10000 });
        });

        test('step 5: deselect Ampullary Carcinoma', async () => {
            await clickModifyStudy(page);
            await searchForStudy('ampullary baylor');
            await page.waitForTimeout(2000);
            await page
                .locator(
                    '[data-tour="cancer-study-list-container"] input[data-test="selectAllStudies"]'
                )
                .click();
            await clickQueryByGeneButton(page);
            await expect(page.locator(SELECTED_CASE_SET)).toHaveText(
                'Samples with mutation and CNA data (88)',
                {
                    timeout: 10000,
                }
            );
        });
    }
);

test.describe.serial(
    'genetic profile selection in front page query form',
    () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await page.goto('/');
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('default profiles after selecting initial study', async () => {
            await expect(page.locator(SEARCH_INPUT)).toBeVisible({
                timeout: 20000,
            });
            await setInputText(page, SEARCH_INPUT, 'ovarian nature 2011');
            await waitForNumberOfStudyCheckboxes(page, 1);
            await page
                .locator(STUDY_SELECT_INPUT)
                .first()
                .click();
            await page.waitForTimeout(200);

            await clickQueryByGeneButton(page);
            await expect(page.locator(MOLECULAR_CHECKBOX).first()).toBeAttached(
                {
                    timeout: 6000,
                }
            );

            await expect(
                page.locator(
                    `${MOLECULAR_CHECKBOX}[data-test="MUTATION_EXTENDED"]`
                )
            ).toBeChecked();
            await expect(
                page.locator(
                    `${MOLECULAR_CHECKBOX}[data-test="COPY_NUMBER_ALTERATION"]`
                )
            ).toBeChecked();
            await expect(
                page.locator(
                    `${MOLECULAR_CHECKBOX}[data-test="MRNA_EXPRESSION"]`
                )
            ).not.toBeChecked();
        });

        test('modify study selection keeps default profiles checked', async () => {
            await clickModifyStudy(page);
            await expect(page.locator(SEARCH_INPUT)).toBeVisible({
                timeout: 10000,
            });
            await setInputText(page, SEARCH_INPUT, 'ampullary baylor');
            await waitForNumberOfStudyCheckboxes(page, 1);
            await expect(
                page.locator('.studyItem_ampca_bcm_2016').first()
            ).toBeVisible();
            await page
                .locator('.studyItem_ampca_bcm_2016')
                .first()
                .click();

            await clickQueryByGeneButton(page);

            await expect(byTestHandle(page, 'MUTATION_EXTENDED')).toBeChecked({
                timeout: 10000,
            });
            await expect(
                byTestHandle(page, 'COPY_NUMBER_ALTERATION')
            ).toBeAttached({ timeout: 10000 });
        });

        test('deselect study reverts to prior study defaults', async () => {
            await clickModifyStudy(page);
            await expect(
                page.locator('.studyItem_ampca_bcm_2016').first()
            ).toBeVisible();
            await page
                .locator('.studyItem_ampca_bcm_2016')
                .first()
                .click();

            await clickQueryByGeneButton(page);
            await expect(page.locator(MOLECULAR_CHECKBOX).first()).toBeAttached(
                {
                    timeout: 10000,
                }
            );

            await expect(
                page.locator(
                    `${MOLECULAR_CHECKBOX}[data-test="MUTATION_EXTENDED"]`
                )
            ).toBeChecked();
            await expect(
                page.locator(
                    `${MOLECULAR_CHECKBOX}[data-test="COPY_NUMBER_ALTERATION"]`
                )
            ).toBeChecked();
            await expect(
                page.locator(
                    `${MOLECULAR_CHECKBOX}[data-test="MRNA_EXPRESSION"]`
                )
            ).not.toBeChecked();
        });

        test('select all TCGA firehose legacy studies keeps defaults', async () => {
            await clickModifyStudy(page);
            await expect(page.locator(SEARCH_INPUT)).toBeVisible({
                timeout: 10000,
            });
            await setInputText(page, SEARCH_INPUT, 'tcga firehose');
            await page.waitForTimeout(500);
            await page
                .locator(
                    'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
                )
                .click();

            await clickQueryByGeneButton(page);

            await expect(byTestHandle(page, 'MUTATION_EXTENDED')).toBeVisible({
                timeout: 10000,
            });
            await expect(
                byTestHandle(page, 'COPY_NUMBER_ALTERATION')
            ).toBeVisible({ timeout: 10000 });
            await expect(byTestHandle(page, 'MUTATION_EXTENDED')).toBeChecked();
            await expect(
                byTestHandle(page, 'COPY_NUMBER_ALTERATION')
            ).toBeChecked();
        });

        test('deselect all TCGA firehose legacy reverts to single-study defaults', async () => {
            await clickModifyStudy(page);
            await page
                .locator(
                    'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
                )
                .click();
            await page.waitForTimeout(100);

            await clickQueryByGeneButton(page);
            await expect(page.locator(MOLECULAR_CHECKBOX).first()).toBeAttached(
                {
                    timeout: 6000,
                }
            );

            await expect(
                page.locator(
                    `${MOLECULAR_CHECKBOX}[data-test="MUTATION_EXTENDED"]`
                )
            ).toBeChecked();
            await expect(
                page.locator(
                    `${MOLECULAR_CHECKBOX}[data-test="COPY_NUMBER_ALTERATION"]`
                )
            ).toBeChecked();
            await expect(
                page.locator(
                    `${MOLECULAR_CHECKBOX}[data-test="MRNA_EXPRESSION"]`
                )
            ).not.toBeChecked();
        });
    }
);

test.describe('auto-selecting needed profiles for oql in query form', () => {
    test('PROT oql with no protein profile blocks submit', async ({ page }) => {
        await page.goto('/');
        await expect(
            page.locator('.studyItem_nsclc_mskcc_2018').first()
        ).toBeVisible({ timeout: 20000 });
        await page
            .locator('.studyItem_nsclc_mskcc_2018')
            .first()
            .click();
        await clickQueryByGeneButton(page);

        await expect(
            page.locator('textarea[data-test="geneSet"]')
        ).toBeVisible({ timeout: 5000 });
        await setInputText(
            page,
            'textarea[data-test="geneSet"]',
            'BRCA1: PROT>1'
        );
        await expect(
            byTestHandle(page, 'oqlErrorMessage')
        ).toHaveText(
            'Protein level data query specified in OQL, but no protein level profile is available in the selected study.',
            { timeout: 20000 }
        );
        await expect(
            page.locator('button[data-test="queryButton"]')
        ).toBeDisabled();
    });

    test('EXP oql auto-picks an mrna profile', async ({ page }) => {
        await page.goto('/');
        await expect(
            page.locator('.studyItem_chol_tcga_pan_can_atlas_2018').first()
        ).toBeVisible({ timeout: 20000 });
        await page
            .locator('.studyItem_chol_tcga_pan_can_atlas_2018')
            .first()
            .click();
        await clickQueryByGeneButton(page);

        await expect(page.locator(MOLECULAR_CHECKBOX).first()).toBeAttached({
            timeout: 5000,
        });
        await expect(
            page.locator(`${MOLECULAR_CHECKBOX}[data-test="MUTATION_EXTENDED"]`)
        ).toBeChecked();
        await expect(
            page.locator(
                `${MOLECULAR_CHECKBOX}[data-test="COPY_NUMBER_ALTERATION"]`
            )
        ).toBeChecked();
        await expect(
            page.locator(`${MOLECULAR_CHECKBOX}[data-test="MRNA_EXPRESSION"]`)
        ).not.toBeChecked();

        await setInputText(
            page,
            'textarea[data-test="geneSet"]',
            'TP53 BRCA1: EXP>1'
        );

        const queryBtn = page.locator('button[data-test="queryButton"]');
        await expect(queryBtn).toBeEnabled({ timeout: 5000 });
        await queryBtn.click();

        await waitForOncoprint(page);

        const profileFilter = await page.evaluate(() => {
            return ((window as any).urlWrapper.query.profileFilter ?? '').split(
                ','
            );
        });
        expect(profileFilter).toContain('mutations');
        expect(profileFilter).toContain('gistic');
        expect(profileFilter).toContain('rna_seq_v2_mrna_median_Zscores');
    });
});

test.describe('results page quick oql edit', () => {
    test('PROT oql with no protein profile blocks quick-edit submit', async ({
        page,
    }) => {
        await page.goto(
            '/results/oncoprint?cancer_study_list=ccrcc_dfci_2019&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations&case_set_id=ccrcc_dfci_2019_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit'
        );
        await waitForOncoprint(page);

        await expect(byTestHandle(page, 'oqlQuickEditButton')).toBeVisible({
            timeout: 20000,
        });
        await byTestHandle(page, 'oqlQuickEditButton').click();

        await expect(
            page.locator('.quick_oql_edit [data-test="geneSet"]')
        ).toBeVisible({ timeout: 5000 });
        await setInputText(
            page,
            '.quick_oql_edit [data-test="geneSet"]',
            'PTEN: PROT>0'
        );

        await expect(
            page.locator('.quick_oql_edit [data-test="oqlErrorMessage"]')
        ).toHaveText(
            'Protein level data query specified in OQL, but no protein level profile is available in the selected study.',
            { timeout: 20000 }
        );

        await expect(
            page.locator('button[data-test="oqlQuickEditSubmitButton"]')
        ).toBeDisabled();
    });
});
