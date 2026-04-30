// Source: end-to-end-test/local/specs/core/patientview.spec.js
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { setCheckboxChecked, setDropdownOpen } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const genePanelPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=teststudy_genepanels&caseId=patientA';
const ascnPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=ascn_test_study&caseId=FAKE_P001';

const ALLELE_FREQ_CELL_DATA_TEST = 'allele-freq-cell';
const ALLELE_FREQ_PATIENT_VIEW_URL = `${CBIOPORTAL_URL}/patient?studyId=ascn_test_study&caseId=FAKE_P001`;
const ALLELE_FREQ_SAMPLE_VIEW_URL = `${CBIOPORTAL_URL}/patient?studyId=ascn_test_study&sampleId=FAKE_P001_S3`;

async function waitForPatientView(page: Page, timeout = 20000) {
    await page
        .locator('#patientViewPageTabs')
        .waitFor({ state: 'attached', timeout });
    await expect(
        page.locator('[data-test=patientview-copynumber-table]')
    ).toBeVisible({ timeout });
    await expect(
        page.locator('[data-test=patientview-mutation-table]')
    ).toBeVisible({ timeout });
}

function strIsNumeric(str: string): boolean {
    if (typeof str != 'string') return false;
    return !isNaN(Number(str)) && !isNaN(parseFloat(str));
}

async function testSampleIcon(
    page: Page,
    geneSymbol: string,
    tableTag: string,
    sampleIconTypes: string[],
    sampleVisibilities: boolean[]
) {
    const geneCell = page
        .locator(`div[data-test=${tableTag}] table`)
        .locator(`span:text-is("${geneSymbol}")`);
    // wdio: geneCell -> .. -> .. -> div[data-test=samples-cell] ul
    const samplesCell = geneCell
        .locator('xpath=../..')
        .locator('div[data-test=samples-cell] ul');
    const icons = samplesCell.locator('li');

    for (let i = 0; i < sampleIconTypes.length; i++) {
        const desiredDataType = sampleIconTypes[i];
        const isExpectedIcon =
            (await icons
                .nth(i)
                .locator(`svg[data-test=${desiredDataType}]`)
                .count()) > 0;
        expect(
            isExpectedIcon,
            `Gene ${geneSymbol}: icon type at position ${i} is not \`${desiredDataType}\``
        ).toBe(true);
    }

    for (let i = 0; i < sampleVisibilities.length; i++) {
        const desiredVisibility = sampleVisibilities[i];
        const actualVisibility = await icons.nth(i).isVisible();
        expect(
            actualVisibility,
            `Gene ${geneSymbol}: icon visibility at position ${i} is not \`${desiredVisibility}\`, but is \`${actualVisibility}\``
        ).toBe(desiredVisibility);
    }
}

test.describe('patient view page', () => {
    test.describe.serial('gene panel information', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(
                page,
                genePanelPatientViewUrl,
                true
            );
            await waitForPatientView(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        const p = 'sample-icon';
        const n = 'not-profiled-icon';

        test('mutation table shows correct sample icons, non-profiled icons and invisible icons', async () => {
            const sampleIcon: Record<string, string[]> = {
                ERBB2: [n, n, n, p, p],
                ABLIM1: [p, p, n, p, p],
                PIEZO1: [n, n, p, p, p],
                CADM2: [p, p, p, p, p],
            };

            const sampleVisibility: Record<string, boolean[]> = {
                ERBB2: [true, true, true, true, false],
                ABLIM1: [true, true, true, false, false],
                PIEZO1: [true, true, true, false, false],
                CADM2: [false, true, true, false, false],
            };

            const genes = Object.keys(sampleIcon);
            for (const gene of genes) {
                await testSampleIcon(
                    page,
                    gene,
                    'patientview-mutation-table',
                    sampleIcon[gene],
                    sampleVisibility[gene]
                );
            }
        });

        test('CNA table shows correct sample icons, non-profiled icons and invisible icons', async () => {
            const sampleIcon: Record<string, string[]> = {
                ERBB2: [n, n, p, p, n],
                CADM2: [p, p, p, p, p],
                PIEZO1: [n, p, p, p, n],
            };

            const sampleVisibility: Record<string, boolean[]> = {
                ERBB2: [true, true, false, true, true],
                CADM2: [false, true, false, false, true],
                PIEZO1: [true, true, false, false, true],
            };

            const genes = Object.keys(sampleIcon);
            for (const gene of genes) {
                await testSampleIcon(
                    page,
                    gene,
                    'patientview-copynumber-table',
                    sampleIcon[gene],
                    sampleVisibility[gene]
                );
            }
        });
    });

    test.describe.serial('filtering of mutation table', () => {
        let page: Page;
        const filterIconSel =
            'div[data-test=patientview-mutation-table] i[data-test=gene-filter-icon]';
        const selectMenuSel = '.rc-tooltip';

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(
                page,
                genePanelPatientViewUrl,
                true
            );
            await waitForPatientView(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('filter menu icon is shown when gene panels are used', async () => {
            await expect(page.locator(filterIconSel)).toBeVisible();
        });

        test('opens selection menu when filter icon clicked', async () => {
            await setDropdownOpen(page, true, filterIconSel, selectMenuSel);
            await expect(page.locator(selectMenuSel)).toBeVisible();
        });

        test('removes genes profiles profiled in some samples then `all genes` option selected', async () => {
            await setDropdownOpen(page, true, filterIconSel, selectMenuSel);
            const allGenesRadio = page
                .locator(selectMenuSel)
                .locator('input[value=allSamples]');
            await allGenesRadio.click();
            const geneEntries = page.locator(
                '[data-test=mutation-table-gene-column]'
            );
            expect(await geneEntries.count()).toBe(1);
            const geneName = await geneEntries.first().innerText();
            expect(geneName).toBe('CADM2');
        });

        test('re-adds genes when `any genes` option selected', async () => {
            const anyGenesRadio = page
                .locator(selectMenuSel)
                .locator('input[value=anySample]');
            await anyGenesRadio.click();
            const geneEntries = page.locator(
                '[data-test=mutation-table-gene-column]'
            );
            expect(await geneEntries.count()).toBe(4);
        });

        test('closes selection menu when filter icon clicked again', async () => {
            await setDropdownOpen(page, false, filterIconSel, selectMenuSel);
            await expect(page.locator(selectMenuSel)).not.toBeVisible();
        });

        test('filter menu icon is not shown when gene panels are not used', async () => {
            await goToUrlAndSetLocalStorage(
                page,
                CBIOPORTAL_URL +
                    '/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK',
                true
            );
            await waitForPatientView(page);
            await expect(page.locator(filterIconSel)).not.toBeVisible();
        });
    });

    test.describe.serial('filtering of CNA table', () => {
        let page: Page;
        const filterIconSel =
            'div[data-test=patientview-copynumber-table] i[data-test=gene-filter-icon]';
        const selectMenuSel = '.rc-tooltip';

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(
                page,
                genePanelPatientViewUrl,
                true
            );
            await waitForPatientView(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('filter menu icon is shown when gene panels are used', async () => {
            await expect(page.locator(filterIconSel)).toBeVisible();
        });

        test('opens selection menu when filter icon clicked', async () => {
            await setDropdownOpen(page, true, filterIconSel, selectMenuSel);
            await expect(page.locator(selectMenuSel)).toBeVisible();
        });

        test('removes genes profiles profiled in some samples then `all genes` option selected', async () => {
            await setDropdownOpen(page, true, filterIconSel, selectMenuSel);
            const allGenesRadio = page
                .locator(selectMenuSel)
                .locator('input[value=allSamples]');
            await allGenesRadio.click();
            const geneEntries = page.locator(
                '[data-test=cna-table-gene-column]'
            );
            expect(await geneEntries.count()).toBe(1);
            const geneName = await geneEntries.first().innerText();
            expect(geneName).toBe('CADM2');
        });

        test('re-adds genes when `any genes` option selected', async () => {
            await setDropdownOpen(page, true, filterIconSel, selectMenuSel);
            const anyGenesRadio = page
                .locator(selectMenuSel)
                .locator('input[value=anySample]');
            await anyGenesRadio.click();
            const geneEntries = page.locator(
                '[data-test=cna-table-gene-column]'
            );
            expect(await geneEntries.count()).toBe(3);
        });

        test('closes selection menu when filter icon clicked again', async () => {
            await setDropdownOpen(page, false, filterIconSel, selectMenuSel);
            await expect(page.locator(selectMenuSel)).not.toBeVisible();
        });

        test('filter menu icon is not shown when gene panels are not used', async () => {
            await goToUrlAndSetLocalStorage(
                page,
                CBIOPORTAL_URL +
                    '/patient?studyId=study_es_0&caseId=TCGA-A2-A04U',
                true
            );
            await waitForPatientView(page);
            await expect(page.locator(filterIconSel)).not.toBeVisible();
        });
    });

    test.describe.serial('genomic tracks', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(
                page,
                genePanelPatientViewUrl,
                true
            );
            await waitForPatientView(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test.skip('shows gene panel icon when gene panels are used for patient samples', async () => {
            await expect(
                page.locator('[data-test=cna-track-genepanel-icon-0]')
            ).toBeAttached();
            await expect(
                page.locator('[data-test=mut-track-genepanel-icon-5]')
            ).toBeAttached();
        });

        test.skip('shows mouse-over tooltip for gene panel icons with gene panel id', async () => {
            await expect(
                page.locator('[data-test=cna-track-genepanel-icon-1]')
            ).toBeVisible();
            await page
                .locator('[data-test=cna-track-genepanel-icon-1]')
                .hover();
            await expect(page.locator('.genover-tooltip')).toBeVisible();
            const text = await page.locator('div.qtip-content').innerText();
            expect(text).toBe('Gene panel: TESTPANEL1');
        });

        test.skip('shows mouse-over tooltip for gene panel icons with NA for whole-genome analyzed sample', async () => {
            const curNumToolTips = await page
                .locator('div.qtip-content')
                .count();
            await page
                .locator('[data-test=cna-track-genepanel-icon-4]')
                .hover();
            await expect
                .poll(
                    async () => await page.locator('div.qtip-content').count()
                )
                .toBeGreaterThan(curNumToolTips);
            const tooltips = page.locator('div.qtip-content');
            const text = await tooltips
                .nth((await tooltips.count()) - 1)
                .innerText();
            expect(text).toBe(
                'Gene panel information not found. Sample is presumed to be whole exome/genome sequenced.'
            );
        });

        test('hides gene panel icons when no gene panels are used for patient samples', async () => {
            await goToUrlAndSetLocalStorage(
                page,
                CBIOPORTAL_URL +
                    '/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK',
                true
            );
            await waitForPatientView(page);
            await expect(
                page.locator('[data-test=mut-track-genepanel-icon-0]')
            ).toHaveCount(0);
        });
    });

    test.describe.serial('VAF plot', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(
                page,
                genePanelPatientViewUrl,
                true
            );
            await waitForPatientView(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('shows gene panel icons when gene panels are used', async () => {
            await page.locator('.vafPlotThumbnail').hover();
            await expect(
                page.locator('div[role=tooltip] svg[data-test=vaf-plot]')
            ).toBeVisible();
            await expect(
                page.locator('svg[data-test=vaf-plot] rect.genepanel-icon')
            ).toBeAttached();
        });
    });

    test.describe('gene panel modal', () => {
        async function clickOnGenePanelLinks(page: Page) {
            const el = page.locator('.rc-tooltip td a');
            await expect(el).toBeVisible();
            await el.click();
        }

        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(
                page,
                genePanelPatientViewUrl,
                true
            );
            await waitForPatientView(page);
        });

        test('toggles gene panel modal from patient header', async ({
            page,
        }) => {
            await page
                .locator('[data-test="patientSamplesClinicalSpans"] svg')
                .hover();
            await clickOnGenePanelLinks(page);
            await expect(
                page.locator('#patient-view-gene-panel')
            ).toBeVisible();
        });

        test.skip('toggles gene panel modal from sample icon in genomic tracks', async ({
            page,
        }) => {
            await page
                .locator(
                    '.genomicOverviewTracksContainer svg[data-test=sample-icon]'
                )
                .hover();
            await clickOnGenePanelLinks(page);
            await expect(
                page.locator('#patient-view-gene-panel')
            ).toBeVisible();
        });

        test.skip('toggles gene panel modal from gene panel icon in genomic tracks', async ({
            page,
        }) => {
            await page
                .locator(
                    '.genomicOverviewTracksContainer [data-test=cna-track-genepanel-icon-0]'
                )
                .hover();
            await page.locator('.qtip-content a').click();
            await expect(
                page.locator('#patient-view-gene-panel')
            ).toBeVisible();
        });

        test('toggles gene panel modal from sample icon in mutations table', async ({
            page,
        }) => {
            const mutationsTable = '[data-test=patientview-mutation-table]';
            await page
                .locator(
                    `${mutationsTable} table td li:not(.invisible) [data-test=not-profiled-icon]`
                )
                .first()
                .hover();
            await clickOnGenePanelLinks(page);
            await expect(
                page.locator('#patient-view-gene-panel')
            ).toBeAttached();
        });

        test('toggles gene panel modal from gene panel id in mutations table', async ({
            page,
        }) => {
            const mutationsTable = '[data-test=patientview-mutation-table]';

            await page
                .locator(`${mutationsTable} button#dropdown-custom-1`)
                .click();
            await page
                .locator(`${mutationsTable} ul.dropdown-menu li`)
                .nth(2)
                .click();

            await page
                .locator(`${mutationsTable} table a`)
                .first()
                .click();
            await expect(
                page.locator('#patient-view-gene-panel')
            ).toBeAttached();
        });

        test('toggles gene panel modal from sample icon in copy number table', async ({
            page,
        }) => {
            const copyNumberTable = '[data-test=patientview-copynumber-table]';
            await page
                .locator(
                    `${copyNumberTable} table td li:not(.invisible) [data-test=not-profiled-icon]`
                )
                .first()
                .dispatchEvent('mouseover');
            await page.waitForTimeout(500);
            await clickOnGenePanelLinks(page);
            await expect(
                page.locator('#patient-view-gene-panel')
            ).toBeAttached();
        });

        test('toggles gene panel modal from gene panel id in copy number table', async ({
            page,
        }) => {
            const copyNumberTable = '[data-test=patientview-copynumber-table]';

            await page
                .locator(`${copyNumberTable} button#dropdown-custom-1`)
                .click();
            await page
                .locator(`${copyNumberTable} ul.dropdown-menu li`)
                .nth(2)
                .click();

            await page
                .locator(`${copyNumberTable} table a`)
                .first()
                .click();
            await expect(
                page.locator('#patient-view-gene-panel')
            ).toBeAttached();
        });
    });

    test.describe.serial('mutation table ASCN columns', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(page, ascnPatientViewUrl, true);
            await waitForPatientView(page);
            const mutationsTable = '[data-test=patientview-mutation-table]';

            await page
                .locator(`${mutationsTable} button#dropdown-custom-1`)
                .click();

            const clonalCheckboxSelector = `${mutationsTable} ul.dropdown-menu li label input[data-id="Clonal"]`;
            if (!(await page.locator(clonalCheckboxSelector).isChecked())) {
                await setCheckboxChecked(page, true, clonalCheckboxSelector);
            }
            const mutantIntCopyCheckboxSelector = `${mutationsTable} ul.dropdown-menu li label input[data-id="Mutant Integer Copy #"]`;
            if (
                !(await page.locator(mutantIntCopyCheckboxSelector).isChecked())
            ) {
                await setCheckboxChecked(
                    page,
                    true,
                    mutantIntCopyCheckboxSelector
                );
            }
            const ccfCheckboxSelector = `${mutationsTable} ul.dropdown-menu li label input[data-id="CCF"]`;
            if (!(await page.locator(ccfCheckboxSelector).isChecked())) {
                await setCheckboxChecked(page, true, ccfCheckboxSelector);
            }
            const totalIntCopyCheckboxSelector = `${mutationsTable} ul.dropdown-menu li label input[data-id="Total Integer Copy #"]`;
            if (
                !(await page.locator(totalIntCopyCheckboxSelector).isChecked())
            ) {
                await setCheckboxChecked(
                    page,
                    true,
                    totalIntCopyCheckboxSelector
                );
            }

            await page
                .locator(`${mutationsTable} button#dropdown-custom-1`)
                .click();
        });

        test.afterEach(async () => {
            await page.mouse.move(0, 0);
            await page.waitForTimeout(200);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('shows correct clonal icons, subclonal icons, NA/indeterminate icons, and invisible icons', async () => {
            const gene = await page.evaluate(() => {
                const row = document.querySelector(
                    '[data-test=patientview-mutation-table] tbody tr'
                );
                const geneCol = row?.querySelector(
                    '[data-test=mutation-table-gene-column]'
                );
                return (geneCol as HTMLElement)?.innerText;
            });

            expect(gene).toBe('PIK3R1');

            const clonalCells = await page.evaluate(() => {
                const row = document.querySelector(
                    '[data-test=patientview-mutation-table] tbody tr'
                );
                return Array.from(
                    row?.querySelectorAll(
                        '[data-test=clonal-cell] svg[data-test]'
                    ) ?? []
                ).map(e => e.getAttribute('data-test'));
            });

            expect(clonalCells.join(',')).toBe(
                'clonal-icon,subclonal-icon,na-icon,clonal-icon,clonal-icon,na-icon'
            );

            const sampleVisiblity = await page.evaluate(() => {
                const row = document.querySelector(
                    '[data-test=patientview-mutation-table] tbody tr'
                );
                return Array.from(
                    row?.querySelectorAll('td:first-child li') ?? []
                ).map(e => (e as HTMLElement).className);
            });

            expect(sampleVisiblity).toEqual([
                '',
                '',
                'invisible',
                '',
                '',
                'invisible',
            ]);
        });

        test('displays clonal column tooltip on mouseover element', async () => {
            await page
                .locator('span[data-test=clonal-cell] span span svg circle')
                .first()
                .dispatchEvent('mouseover');
            await page
                .locator('div[role=tooltip] div[data-test=clonal-tooltip]')
                .waitFor({ state: 'attached' });
        });

        test('displays expected alt copies column tooltip on mouseover element', async () => {
            await page
                .locator('span[data-test=eac-cell] span span svg g rect')
                .first()
                .dispatchEvent('mouseover');
            await page
                .locator('div[role=tooltip] span[data-test=eac-tooltip]')
                .waitFor({ state: 'attached' });
        });

        test('displays integer copy number column tooltip on mouseover element', async () => {
            await page
                .locator(
                    'span[data-test=ascn-copy-number-cell] span span svg g rect'
                )
                .first()
                .dispatchEvent('mouseover');
            await page
                .locator(
                    'div[role=tooltip] span[data-test=ascn-copy-number-tooltip]'
                )
                .waitFor({ state: 'attached' });
        });

        test('displays ccf column tooltip on mouseover element', async () => {
            await page
                .locator('span[data-test=ccf-cell] span')
                .first()
                .dispatchEvent('mouseover');
            await page
                .locator('div[role=tooltip] span[data-test=ccf-tooltip]')
                .waitFor({ state: 'attached' });
        });
    });

    test.describe('allele frequency', () => {
        test('should show number under allele frequency column for multiple samples patient in one sample view', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorage(
                page,
                ALLELE_FREQ_SAMPLE_VIEW_URL,
                true
            );
            await waitForPatientView(page);

            const cell = page
                .locator(`div[data-test="${ALLELE_FREQ_CELL_DATA_TEST}"]`)
                .first()
                .locator('span');
            const text = await cell.innerText();
            expect(strIsNumeric(text)).toBe(true);
        });

        test('should show bars(svg) under allele frequency column for multiple samples patient in patient view', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorage(
                page,
                ALLELE_FREQ_PATIENT_VIEW_URL,
                true
            );
            await waitForPatientView(page);
            const svg = page
                .locator(`div[data-test="${ALLELE_FREQ_CELL_DATA_TEST}"]`)
                .first()
                .locator('svg');
            await expect(svg).toBeAttached();
        });
    });
});
