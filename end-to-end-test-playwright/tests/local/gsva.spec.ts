// Source: end-to-end-test/local/specs/gsva.spec.js
import { test, expect, Locator, Page } from '../../fixtures';
import {
    goToUrlAndSetLocalStorage,
    goToUrlAndSetLocalStorageWithProperty,
} from './helpers';
import {
    setInputText,
    setServerConfiguration,
    waitForStudyQueryPage,
} from '../helpers/common';
import { waitForOncoprint } from '../helpers/oncoprint';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&tab_index=tab_visualize&show_samples=false&clinicallist=PROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic';

const plotsTabUrl =
    CBIOPORTAL_URL +
    '/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&clinicallist=PROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize';

const coexpressionTabUrl =
    CBIOPORTAL_URL +
    '/results/coexpression?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=CREB3L1%2520RPS11%2520PNMA1%2520MMP2%2520ZHX3%2520ERCC5&geneset_list=GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize%27';

const ADD_TRACKS_HEATMAP_TAB = '.oncoprintAddTracks a.tabAnchor_Heatmap';

async function showGsva(page: Page) {
    await setServerConfiguration(page, { skin_show_gsva: true });
}

async function waitForGeneQueryPage(page: Page, timeout = 20000) {
    await page
        .locator('[data-test=studyList]')
        .waitFor({ state: 'detached', timeout });
    await page
        .locator('div[data-test="molecularProfileSelector"]')
        .waitFor({ state: 'attached', timeout });
}

async function waitForPlotsTab(page: Page, timeout = 20000) {
    await expect(page.locator('div.axisBlock')).toBeVisible({ timeout });
}

async function waitForCoExpressionTab(page: Page, timeout = 20000) {
    await page
        .locator('#coexpressionTabGeneTabs')
        .waitFor({ state: 'attached', timeout });
}

async function clickQueryByGeneButton(page: Page) {
    const btn = page.locator('[data-test=queryByGeneButton]');
    await expect(btn).not.toHaveClass(/disabled/);
    await btn.click();
    await page.evaluate(() => window.scrollTo(0, 0));
}

async function checkTestStudy(page: Page) {
    await page
        .locator('span:text-is("Test study es_0")')
        .waitFor({ state: 'attached' });
    const checkbox = page
        .locator('span:text-is("Test study es_0")')
        .locator('xpath=..')
        .locator('input[type=checkbox]');
    await checkbox.click();
    await clickQueryByGeneButton(page);
    await waitForGeneQueryPage(page);
}

async function checkGSVAprofile(page: Page) {
    await page
        .locator('[data-test=GENESET_SCORE]')
        .waitFor({ state: 'attached' });
    await page.locator('[data-test=GENESET_SCORE]').click();
    await page
        .locator('[data-test=GENESETS_TEXT_AREA]')
        .waitFor({ state: 'attached' });
}

async function openGsvaHierarchyDialog(page: Page) {
    await page.locator('button[data-test=GENESET_HIERARCHY_BUTTON]').click();
    await page.locator('div.modal-dialog').waitFor({ state: 'attached' });
    await page
        .locator('div[data-test=gsva-tree-container] ul')
        .waitFor({ state: 'attached' });
    await waitForModalUpdate(page);
}

async function openGsvaVolcanoDialog(page: Page) {
    await page
        .locator('button[data-test=GENESET_VOLCANO_BUTTON]')
        .waitFor({ state: 'attached' });
    await page.locator('button[data-test=GENESET_VOLCANO_BUTTON]').click();
    await page.locator('div.modal-dialog').waitFor({ state: 'attached' });
}

async function waitForModalUpdate(page: Page) {
    await expect(page.locator('.sk-spinner')).toHaveCount(0, {
        timeout: 10000,
    });
}

async function getReactSelectOptions(parent: Locator) {
    await parent.locator('.Select-control').click();
    return parent.locator('.Select-option');
}

async function reactSelectOption(parent: Locator, optionText: string) {
    await parent.locator('.Select-control').click();
    return parent.locator(`.Select-option:text-is("${optionText}")`);
}

async function selectReactSelectOption(parent: Locator, optionText: string) {
    const opt = await reactSelectOption(parent, optionText);
    await opt.click();
}

test.describe.skip('gsva feature', () => {
    test.describe('query page', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
            await showGsva(page);
            await waitForStudyQueryPage(page);
        });

        test('shows GSVA-profile option when selecting study_es_0', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
            await waitForStudyQueryPage(page);
            await checkTestStudy(page);
            await expect(
                page.locator('[data-test=GENESET_SCORE]')
            ).toBeVisible();
        });

        test('shows gene set entry component when selecting gsva-profile data type', async ({
            page,
        }) => {
            await checkTestStudy(page);
            await checkGSVAprofile(page);

            await expect(
                page.locator('h2:text-is("Enter Gene Sets:")')
            ).toBeVisible();
            await expect(
                page.locator('[data-test=GENESET_HIERARCHY_BUTTON]')
            ).toBeVisible();
            await expect(
                page.locator('[data-test=GENESET_VOLCANO_BUTTON]')
            ).toBeVisible();
            await expect(
                page.locator('[data-test=GENESETS_TEXT_AREA]')
            ).toBeVisible();
        });

        test('adds gene set parameter to url after submit', async ({
            page,
        }) => {
            await checkTestStudy(page);
            await checkGSVAprofile(page);
            await setInputText(
                page,
                '[data-test=GENESETS_TEXT_AREA]',
                'GO_ATP_DEPENDENT_CHROMATIN_REMODELING'
            );
            await setInputText(page, '[data-test=geneSet]', 'TP53');
            const queryButton = page.locator('[data-test=queryButton]');
            await expect(queryButton).toBeEnabled();
            await queryButton.click();
            const url = page.url();
            const regex = /geneset_list=GO_ATP_DEPENDENT_CHROMATIN_REMODELING/;
            expect(url).toMatch(regex);
        });
    });

    test.describe.serial('GenesetsHierarchySelector', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
            await showGsva(page);
            await waitForStudyQueryPage(page);
            await checkTestStudy(page);
            await checkGSVAprofile(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('adds gene set name to entry component from hierachy selector', async () => {
            await openGsvaHierarchyDialog(page);

            const checkBox = page
                .locator(':has-text("GO_ATP_DEPENDENT_CHROMATIN_REMODELING")')
                .first();
            await checkBox.click();

            await expect(checkBox).toHaveClass(/jstree-clicked/);

            await page.locator('button:text-is("Select")').click();

            await page
                .locator(':text("All gene sets are valid")')
                .waitFor({ state: 'attached' });

            const html = await page
                .locator('[data-test=GENESETS_TEXT_AREA]')
                .innerHTML();
            expect(html).toBe('GO_ATP_DEPENDENT_CHROMATIN_REMODELING');
        });

        test('filters gene sets with the GSVA score input field', async () => {
            await openGsvaHierarchyDialog(page);

            await setInputText(page, '[id=GSVAScore]', '0');
            await page.locator('[id=filterButton]').click();
            await waitForModalUpdate(page);

            expect(await page.locator(':text("GO_")').count()).toBe(5);

            await setInputText(page, '[id=GSVAScore]', '0.5');
            await page.locator('[id=filterButton]').click();
            await waitForModalUpdate(page);
        });

        test('filters gene sets with the search input field', async () => {
            await setInputText(page, '[id=GSVAScore]', '0');
            await page.locator('[id=filterButton]').click();
            await waitForModalUpdate(page);

            const hiddenBefore = await page.locator('.jstree-hidden').count();
            expect(
                hiddenBefore,
                'The tree should not have hidden elements at this point'
            ).toBe(0);

            await setInputText(
                page,
                '[id=geneset-hierarchy-search]',
                'GO_ACYLGLYCEROL_HOMEOSTASIS'
            );
            await waitForModalUpdate(page);
            expect(await page.locator('.jstree-hidden').count()).toBe(7);
            await expect(
                page.locator(':text("GO_ACYLGLYCEROL_HOMEOSTASIS")').first()
            ).toBeAttached();

            await setInputText(page, '[id=geneset-hierarchy-search]', '');
            await setInputText(page, '[id=GSVAScore]', '0.5');
            await page.locator('[id=filterButton]').click();
            await waitForModalUpdate(page);
        });

        test('filters gene sets with the gene set pvalue input field', async () => {
            await setInputText(page, '[id=Pvalue]', '0.0005');
            await page.locator('[id=filterButton]').click();
            await waitForModalUpdate(page);
            expect(await page.locator(':text("GO_")').count()).toBe(0);
            await setInputText(page, '[id=Pvalue]', '0.05');
            await page.locator('[id=filterButton]').click();
            await waitForModalUpdate(page);
        });

        test('filters gene sets with the gene set percentile select box', async () => {
            const modal = page.locator('div.modal-body');
            await modal.locator('.Select-value-label').click();
            await modal.locator('.Select-option:text-is("100%")').click();
            await modal.locator('[id=filterButton]').click();
            await waitForModalUpdate(page);

            expect(await page.locator(':text("GO_")').count()).toBe(2);

            await modal.locator('.Select-value-label').click();
            await modal.locator('.Select-option:text-is("75%")').click();
            await modal.locator('[id=filterButton]').click();
            await waitForModalUpdate(page);
        });

        test.describe(
            'skin.geneset_hierarchy.collapse_by_default property',
            () => {
                test('collapses tree on init when property set to true', async ({
                    page,
                }) => {
                    await goToUrlAndSetLocalStorageWithProperty(
                        page,
                        CBIOPORTAL_URL,
                        true,
                        {
                            skin_geneset_hierarchy_collapse_by_default: true,
                        }
                    );
                    await showGsva(page);
                    await waitForStudyQueryPage(page);
                    await checkTestStudy(page);
                    await checkGSVAprofile(page);
                    await openGsvaHierarchyDialog(page);
                    expect(await page.locator(':text("GO_")').count()).toBe(0);
                });

                test('expands tree on init when property set to false', async ({
                    page,
                }) => {
                    await goToUrlAndSetLocalStorageWithProperty(
                        page,
                        CBIOPORTAL_URL,
                        true,
                        {
                            skin_geneset_hierarchy_collapse_by_default: false,
                        }
                    );
                    await showGsva(page);
                    await waitForStudyQueryPage(page);
                    await checkTestStudy(page);
                    await checkGSVAprofile(page);
                    await openGsvaHierarchyDialog(page);
                    expect(
                        await page.locator(':text("GO_")').count()
                    ).toBeGreaterThan(0);
                });

                test('expands tree on init when property not defined', async ({
                    page,
                }) => {
                    await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
                    await showGsva(page);
                    await waitForStudyQueryPage(page);
                    await checkTestStudy(page);
                    await checkGSVAprofile(page);
                    await openGsvaHierarchyDialog(page);
                    expect(
                        await page.locator(':text("GO_")').count()
                    ).toBeGreaterThan(0);
                });
            }
        );
    });

    test.describe.serial('GenesetVolcanoPlotSelector', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
            await showGsva(page);
            await waitForStudyQueryPage(page);
            await checkTestStudy(page);
            await checkGSVAprofile(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('adds gene set name to entry component', async () => {
            await openGsvaVolcanoDialog(page);
            await page
                .locator(
                    'span:text-is("GO_ATP_DEPENDENT_CHROMATIN_REMODELING")'
                )
                .waitFor({ state: 'attached' });
            const checkBoxParent = page
                .locator(
                    'span:text-is("GO_ATP_DEPENDENT_CHROMATIN_REMODELING")'
                )
                .locator('xpath=../..');
            const checkBox = checkBoxParent
                .locator('td')
                .nth(3)
                .locator('label input');
            await expect(checkBox).toBeVisible();

            for (let i = 0; i < 5; i++) {
                await checkBox.click();
                if (await checkBox.isChecked()) break;
            }

            await page
                .locator('button:text-is("Add selection to the query")')
                .waitFor({ state: 'attached' });
            await page
                .locator('button:text-is("Add selection to the query")')
                .click();

            await page
                .locator(':text("All gene sets are valid")')
                .waitFor({ state: 'attached' });

            const html = await page
                .locator('[data-test=GENESETS_TEXT_AREA]')
                .innerHTML();
            expect(html).toBe('GO_ATP_DEPENDENT_CHROMATIN_REMODELING');
        });

        test('selects gene sets from query page text area', async () => {
            await openGsvaVolcanoDialog(page);

            const checkBoxParent = page
                .locator(
                    'span:text-is("GO_ATP_DEPENDENT_CHROMATIN_REMODELING")'
                )
                .locator('xpath=../..');
            const checkBox = checkBoxParent
                .locator('td')
                .nth(3)
                .locator('label input');
            await expect(checkBox).toBeChecked();
        });

        test('reset keeps gene sets from query page text area', async () => {
            const checkBoxParent = page
                .locator(
                    'span:text-is("GO_ATP_DEPENDENT_CHROMATIN_REMODELING")'
                )
                .locator('xpath=../..');
            const checkBox = checkBoxParent
                .locator('td')
                .nth(3)
                .locator('label input');

            await page.locator('button:text-is("Clear selection")').click();
            await expect(checkBox).toBeChecked();
        });

        test('searchbox filters gene set list', async () => {
            const lengthBefore = await page
                .locator('td span', { hasText: 'GO_' })
                .count();
            expect(lengthBefore).toBe(5);

            await page
                .locator('input.tableSearchInput')
                .waitFor({ state: 'attached' });
            await setInputText(page, 'input.tableSearchInput', 'GO_ACYL');

            await expect
                .poll(async () =>
                    page.locator('td span', { hasText: 'GO_' }).count()
                )
                .toBeLessThan(lengthBefore);

            const lengthAfter = await page
                .locator('td span', { hasText: 'GO_' })
                .count();
            expect(lengthAfter).toBe(1);
        });
    });

    test.describe('results view page', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, oncoprintTabUrl, true);
            await waitForOncoprint(page);
        });

        test('shows co-expression tab when genes with expression data selected', async ({
            page,
        }) => {
            await expect(
                page.locator('ul.nav-tabs li.tabAnchor_coexpression')
            ).toBeAttached();
        });
    });

    test.describe('oncoprint tab', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, oncoprintTabUrl, true);
            await waitForOncoprint(page);
        });

        test('has GSVA profile option in heatmap menu', async ({ page }) => {
            await page.locator('button[id=addTracksDropdown]').click();
            await page.locator(ADD_TRACKS_HEATMAP_TAB).click();

            const heatmapDropdown = page.locator('.Select-control').first();
            await heatmapDropdown.waitFor({ state: 'attached' });
            await heatmapDropdown.click();
            await expect(
                page.locator(
                    'div:text-is("GSVA scores on oncogenic signatures gene sets")'
                )
            ).toBeVisible();
        });
    });

    test.describe('plots tab', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, plotsTabUrl, true);
            await waitForPlotsTab(page);
        });

        test('shows gsva option in horizontal data type selection box', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await horzDataSelect.locator('.Select-arrow-zone').click();
            await expect(
                horzDataSelect.locator('.Select-option:text-is("Gene Sets")')
            ).toBeAttached();
        });

        test('shows gsva option in vertical data type selection box', async ({
            page,
        }) => {
            const vertDataSelect = page
                .locator('[name=v-profile-type-selector]')
                .locator('xpath=..')
                .locator('.Select-arrow-zone');
            await vertDataSelect.click();
            await expect(
                page
                    .locator('[name=v-profile-type-selector]')
                    .locator('xpath=..')
                    .locator('.Select-option:text-is("Gene Sets")')
            ).toBeAttached();
        });

        test('horizontal axis menu shows gsva score and pvalue in profile menu', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await horzDataSelect.locator('.Select-arrow-zone').click();
            await horzDataSelect
                .locator('.Select-option:text-is("Gene Sets")')
                .click();

            const horzProfileSelect = page
                .locator('[name=h-profile-name-selector]')
                .locator('xpath=..');
            await horzProfileSelect.locator('.Select-arrow-zone').click();

            await expect(
                horzProfileSelect.locator(
                    '.Select-option:text-is("GSVA scores on oncogenic signatures gene sets")'
                )
            ).toBeAttached();
            await expect(
                horzProfileSelect.locator(
                    '.Select-option:text-is("Pvalues of GSVA scores on oncogenic signatures gene sets")'
                )
            ).toBeAttached();
        });

        test('vertical axis menu shows gsva score and pvalue in profile menu', async ({
            page,
        }) => {
            const vertDataSelect = page
                .locator('[name=v-profile-type-selector]')
                .locator('xpath=..');
            await vertDataSelect.locator('.Select-arrow-zone').click();
            await vertDataSelect
                .locator('.Select-option:text-is("Gene Sets")')
                .click();

            const vertProfileSelect = page
                .locator('[name=v-profile-name-selector]')
                .locator('xpath=..');
            await vertProfileSelect.locator('.Select-arrow-zone').click();

            await expect(
                vertProfileSelect.locator(
                    '.Select-option:text-is("GSVA scores on oncogenic signatures gene sets")'
                )
            ).toBeAttached();
            await expect(
                vertProfileSelect.locator(
                    '.Select-option:text-is("Pvalues of GSVA scores on oncogenic signatures gene sets")'
                )
            ).toBeAttached();
        });

        test('horizontal axis menu shows gene set entry in entity menu', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('xpath=..');
            await horzDataSelect
                .locator('.Select-arrow-zone')
                .waitFor({ state: 'visible' });
            await horzDataSelect.locator('.Select-arrow-zone').click();
            await horzDataSelect
                .locator('.Select-option:text-is("Gene Sets")')
                .waitFor({ state: 'visible' });
            await horzDataSelect
                .locator('.Select-option:text-is("Gene Sets")')
                .click();

            const horzProfileSelect = page
                .locator('[name=h-profile-name-selector]')
                .locator('xpath=..');
            await horzProfileSelect
                .locator('.Select-arrow-zone')
                .waitFor({ state: 'visible' });
            await horzProfileSelect.locator('.Select-arrow-zone').click();
            const profileMenuEntry =
                '.Select-option:text-is("Pvalues of GSVA scores on oncogenic signatures gene sets")';
            await horzProfileSelect
                .locator(profileMenuEntry)
                .waitFor({ state: 'visible' });
            await horzProfileSelect.locator(profileMenuEntry).click();

            const horzEntitySelect = page
                .locator('[name=h-geneset-selector]')
                .locator('xpath=..');
            await horzEntitySelect
                .locator('.Select-arrow-zone')
                .waitFor({ state: 'visible' });
            await horzEntitySelect.locator('.Select-arrow-zone').click();
            const entityMenuEntry =
                '.Select-option:text-is("GO_ATP_DEPENDENT_CHROMATIN_REMODELING")';
            await horzEntitySelect
                .locator(entityMenuEntry)
                .waitFor({ state: 'attached' });

            await expect(
                horzEntitySelect.locator(entityMenuEntry)
            ).toBeAttached();
        });

        test('vertical axis menu shows gene set entry in entity menu', async ({
            page,
        }) => {
            const vertDataSelect = page
                .locator('[name=v-profile-type-selector]')
                .locator('xpath=..');
            await vertDataSelect
                .locator('.Select-arrow-zone')
                .waitFor({ state: 'visible' });
            await vertDataSelect.locator('.Select-arrow-zone').click();
            await vertDataSelect
                .locator('.Select-option:text-is("Gene Sets")')
                .waitFor({ state: 'visible' });
            await vertDataSelect
                .locator('.Select-option:text-is("Gene Sets")')
                .click();

            const vertProfileSelect = page
                .locator('[name=v-profile-name-selector]')
                .locator('xpath=..');
            await vertProfileSelect
                .locator('.Select-arrow-zone')
                .waitFor({ state: 'visible' });
            await vertProfileSelect.locator('.Select-arrow-zone').click();
            const profileMenuEntry =
                '.Select-option:text-is("Pvalues of GSVA scores on oncogenic signatures gene sets")';
            await vertProfileSelect
                .locator(profileMenuEntry)
                .waitFor({ state: 'visible' });
            await vertProfileSelect.locator(profileMenuEntry).click();

            const vertEntitySelect = page
                .locator('[name=v-geneset-selector]')
                .locator('xpath=..');
            await vertEntitySelect
                .locator('.Select-arrow-zone')
                .waitFor({ state: 'visible' });
            await vertEntitySelect.locator('.Select-arrow-zone').click();
            const entityMenuEntry =
                '.Select-option:text-is("GO_ATP_DEPENDENT_CHROMATIN_REMODELING")';
            await vertEntitySelect
                .locator(entityMenuEntry)
                .waitFor({ state: 'attached' });

            await expect(
                vertEntitySelect.locator(entityMenuEntry)
            ).toBeAttached();
        });
    });

    test.describe('co-expression tab', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, coexpressionTabUrl, true);
            await waitForCoExpressionTab(page);
        });

        test('shows buttons for genes', async ({ page }) => {
            const genes = (coexpressionTabUrl.match(
                /gene_list=(.*)\&/
            ) as RegExpMatchArray)[1].split('%20');
            const container = page.locator(
                '//*[@id="coexpressionTabGeneTabs"]'
            );
            for (const g of genes) {
                await expect(
                    container.locator(`a:text-is("${g}")`)
                ).toBeAttached();
            }
        });

        test('shows buttons for genes and gene sets', async ({ page }) => {
            const geneSets = (coexpressionTabUrl.match(
                /geneset_list=(.*)\&/
            ) as RegExpMatchArray)[1].split('%20');
            const container = page.locator(
                '//*[@id="coexpressionTabGeneTabs"]'
            );
            for (const g of geneSets) {
                await expect(
                    container.locator(`a:text-is("${g}")`)
                ).toBeAttached();
            }
        });

        test('shows mRNA expression/GSVA scores in query profile select box when reference gene selected', async ({
            page,
        }) => {
            const icon = page
                .locator('#coexpressionTabGeneTabs')
                .locator('a:text-is("RPS11")');
            await icon.click();
            await page
                .locator('#coexpressionTabGeneTabs')
                .waitFor({ state: 'attached' });

            const opts = await getReactSelectOptions(
                page.locator('.coexpression-select-query-profile')
            );
            expect(await opts.count()).toBe(2);

            const o1 = await reactSelectOption(
                page.locator('.coexpression-select-query-profile'),
                'mRNA expression (microarray) (526 samples)'
            );
            await expect(o1).toBeAttached();
            const o2 = await reactSelectOption(
                page.locator('.coexpression-select-query-profile'),
                'GSVA scores on oncogenic signatures gene sets (5 samples)'
            );
            await expect(o2).toBeAttached();
        });

        test('shows mRNA expression in subject profile select box when reference gene selected', async ({
            page,
        }) => {
            const icon = page
                .locator('//*[@id="coexpressionTabGeneTabs"]')
                .locator('a:text-is("RPS11")');
            await icon.click();
            await page
                .locator('//*[@id="coexpressionTabGeneTabs"]')
                .waitFor({ state: 'attached' });
            const opts = await getReactSelectOptions(
                page.locator('.coexpression-select-subject-profile')
            );
            expect(await opts.count()).toBe(1);
            const o1 = await reactSelectOption(
                page.locator('.coexpression-select-subject-profile'),
                'mRNA expression (microarray) (526 samples)'
            );
            await expect(o1).toBeAttached();
        });

        test('shows name of gene in `correlated with` field when reference gene selected', async ({
            page,
        }) => {
            const icon = page
                .locator('//*[@id="coexpressionTabGeneTabs"]')
                .locator('a:text-is("RPS11")');
            await icon.click();
            await page
                .locator('//*[@id="coexpressionTabGeneTabs"]')
                .waitFor({ state: 'attached' });
            const text = await page
                .locator('span', { hasText: 'that are correlated' })
                .innerText();
            expect(text).toMatch('RPS11');
        });

        test('shows mRNA expression/GSVA scores in subject profile box when reference gene set selected', async ({
            page,
        }) => {
            const icon = page
                .locator('//*[@id="coexpressionTabGeneTabs"]')
                .locator('a:text-is("GO_ACYLGLYCEROL_HOMEOSTASIS")');
            await icon.click();
            await page
                .locator('//*[@id="coexpressionTabGeneTabs"]')
                .waitFor({ state: 'attached' });

            const opts = await getReactSelectOptions(
                page.locator('.coexpression-select-query-profile')
            );
            expect(await opts.count()).toBe(2);

            const o1 = await reactSelectOption(
                page.locator('.coexpression-select-query-profile'),
                'mRNA expression (microarray) (526 samples)'
            );
            await expect(o1).toBeAttached();
            const o2 = await reactSelectOption(
                page.locator('.coexpression-select-query-profile'),
                'GSVA scores on oncogenic signatures gene sets (5 samples)'
            );
            await expect(o2).toBeAttached();
        });

        test('shows disabled subject query select box when reference gene set selected', async ({
            page,
        }) => {
            const icon = page
                .locator('//*[@id="coexpressionTabGeneTabs"]')
                .locator('a:text-is("GO_ACYLGLYCEROL_HOMEOSTASIS")');
            await icon.click();
            await page
                .locator('//*[@id="coexpressionTabGeneTabs"]')
                .waitFor({ state: 'attached' });
            await expect(
                page.locator('.coexpression-select-subject-profile.is-disabled')
            ).toBeAttached();
            await expect(
                page
                    .locator('.coexpression-select-subject-profile')
                    .locator('.Select-value-label', {
                        hasText: 'GSVA scores on oncogenic',
                    })
            ).toBeAttached();
        });

        test('shows gene sets in table when GSVA scores selected in subject profile select box', async ({
            page,
        }) => {
            await selectReactSelectOption(
                page.locator('.coexpression-select-query-profile'),
                'GSVA scores on oncogenic signatures gene sets (5 samples)'
            );
            await page
                .locator('//*[@id="coexpressionTabGeneTabs"]')
                .waitFor({ state: 'attached' });

            expect(
                await page.locator('td span', { hasText: 'GO_' }).count()
            ).toBe(7);
        });

        test('shows `Enter gene set.` placeholder in table search box when GSVA scores selected in first select box', async ({
            page,
        }) => {
            await selectReactSelectOption(
                page.locator('.coexpression-select-query-profile'),
                'GSVA scores on oncogenic signatures gene sets (5 samples)'
            );
            await page
                .locator('//*[@id="coexpressionTabGeneTabs"]')
                .waitFor({ state: 'attached' });
            await expect(
                page.locator(
                    '[data-test=CoExpressionGeneTabContent] input[placeholder="Enter gene set.."]'
                )
            ).toBeAttached();
        });
    });
});
