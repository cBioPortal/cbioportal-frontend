// Source: end-to-end-test/local/specs/core/patientview.screenshot.spec.js
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { expectElementScreenshot, setDropdownOpen } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const patientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=teststudy_genepanels&caseId=patientA';
const ascnPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=ascn_test_study&caseId=FAKE_P001';
const genericAssayPatientViewUrl =
    CBIOPORTAL_URL +
    '/patient/mutationalSignatures?studyId=lgg_ucsf_2014_test_generic_assay&caseId=P01';

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

async function switchGeneFilter(page: Page, selectedOption: string) {
    const selectMenu = '.rc-tooltip';
    const filterIcon =
        'div[data-test=patientview-mutation-table] i[data-test=gene-filter-icon]';
    await setDropdownOpen(page, true, filterIcon, selectMenu);
    const allGenesRadio = page.locator(
        `${selectMenu} input[value=${selectedOption}]`
    );
    await allGenesRadio.click();
    await setDropdownOpen(page, false, filterIcon, selectMenu);
}

async function doVafPlotScreenshotTest(page: Page, snapshotName: string) {
    await page.locator('button:has-text("Columns")').click();
    await page.locator('//*[text()="Annotation"]').click();
    await page.locator('button:has-text("Columns")').click();
    await page.locator('.vafPlotThumbnail').hover();
    await page
        .locator('div[role=tooltip] [data-test=vaf-plot]')
        .first()
        .waitFor({ state: 'attached' });
    await expectElementScreenshot(
        page,
        'div[role=tooltip] [data-test=vaf-plot] >> nth=0',
        snapshotName
    );
}

async function selectMutationalSignaturesVersionID(page: Page) {
    await expect(
        page.locator('div.mutationalSignaturesVersionSelector__indicators')
    ).toBeVisible({ timeout: 10000 });
    await page
        .locator('div.mutationalSignaturesVersionSelector__indicators')
        .click();
    await expect(
        page.locator('div:text-is("Mutational Signature ID")')
    ).toBeVisible({ timeout: 10000 });
    await page.locator('div:text-is("Mutational Signature ID")').click();
}

async function selectMutationalSignaturesVersionDBS(page: Page) {
    await expect(
        page.locator('div.mutationalSignaturesVersionSelector__indicators')
    ).toBeVisible({ timeout: 10000 });
    await page
        .locator('div.mutationalSignaturesVersionSelector__indicators')
        .click();
    await expect(
        page.locator('div:text-is("Mutational Signature DBS")')
    ).toBeVisible({ timeout: 10000 });
    await page.locator('div:text-is("Mutational Signature DBS")').click();
}

async function selectPercentageYAxis(page: Page) {
    await page.locator('[data-test="AxisScaleSwitch%"]').click();
}

async function selectSampleMutationalSignature(page: Page) {
    await expect(
        page.locator('div.mutationalSignatureSampleSelector__indicators')
    ).toBeVisible({ timeout: 10000 });
    await page
        .locator('div.mutationalSignatureSampleSelector__indicators')
        .click();
    await expect(page.locator('div:text-is("P01_Rec")')).toBeVisible({
        timeout: 10000,
    });
    await page.locator('div:text-is("P01_Rec")').click();
}

test.describe('patient view page', () => {
    test.describe('mutation table for study with ASCN data', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, ascnPatientViewUrl, true);
            await waitForPatientView(page);
        });

        test('displays ASCN columns', async ({ page }) => {
            await expectElementScreenshot(
                page,
                'div[data-test=patientview-mutation-table] table',
                'patient-view-ascn-columns.png'
            );
        });
    });

    test.describe('mutation table for study with no ASCN data', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, patientViewUrl, true);
            await waitForPatientView(page);
        });

        test('does not display ASCN columns for studies with no ASCN data', async ({
            page,
        }) => {
            await expectElementScreenshot(
                page,
                'div[data-test=patientview-mutation-table] table',
                'patient-view-no-ascn-columns.png'
            );
        });
    });

    test.describe('gene panel icons', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, patientViewUrl, true);
            await waitForPatientView(page);
        });

        test('shows gene panel icons behind mutation and CNA genomic tracks', async ({
            page,
        }) => {
            await expectElementScreenshot(
                page,
                'div.genomicOverviewTracksContainer',
                'patient-view-gene-panel-icons.png'
            );
        });

        test('filters mutation tracks based on gene filter setting', async ({
            page,
        }) => {
            await switchGeneFilter(page, 'allSamples');
            await expectElementScreenshot(
                page,
                'div.genomicOverviewTracksContainer',
                'patient-view-gene-panel-icons-filtered.png'
            );
        });

        test('filters VAF plot based on gene filter setting when switching to _all samples_', async ({
            page,
        }) => {
            await switchGeneFilter(page, 'allSamples');
            await doVafPlotScreenshotTest(
                page,
                'patient-view-vaf-plot-all-samples.png'
            );
        });

        test('filters VAF plot based on gene filter setting when switching to _any sample_', async ({
            page,
        }) => {
            await switchGeneFilter(page, 'anySample');
            await doVafPlotScreenshotTest(
                page,
                'patient-view-vaf-plot-any-sample.png'
            );
        });
    });

    test.describe('patient view mutational signatures', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(
                page,
                genericAssayPatientViewUrl,
                true
            );
            await expect(
                page.locator('div[data-test="MutationalSignaturesContainer"]')
            ).toBeVisible({ timeout: 20000 });
        });

        test('show stacked bar chart for patient who has significant SBS signatures', async ({
            page,
        }) => {
            await expect(page.locator('div.patientSamples')).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                'div.patientSamples',
                'patient-view-mut-sig-sbs-stacked-bar.png'
            );
        });

        test('show tooltip for patient who has significant SBS signatures', async ({
            page,
        }) => {
            await expect(page.locator('div.progress')).toBeVisible({
                timeout: 20000,
            });
            await page.locator('div.progress').hover();
            await expectElementScreenshot(
                page,
                'div.patientViewPage',
                'patient-view-mut-sig-sbs-tooltip.png'
            );
        });

        test('show mutational signatures table for patient who has significant SBS signatures', async ({
            page,
        }) => {
            await page.mouse.move(0, 0);
            await page
                .locator(
                    'div[data-test="SignificantMutationalSignaturesTooltip"]'
                )
                .waitFor({ state: 'hidden', timeout: 5000 })
                .catch(() => {});
            await expectElementScreenshot(
                page,
                'div[data-test="MutationalSignaturesContainer"]',
                'patient-view-mut-sig-sbs-table.png'
            );
        });

        test('show stacked bar chart for patient who has significant ID signatures', async ({
            page,
        }) => {
            await selectMutationalSignaturesVersionID(page);
            await expect(page.locator('div.patientSamples')).toBeVisible({
                timeout: 20000,
            });
            await page.waitForTimeout(5000);
            await expectElementScreenshot(
                page,
                'div.patientSamples',
                'patient-view-mut-sig-id-stacked-bar.png'
            );
        });

        test('show tooltip for patient who has significant ID signatures', async ({
            page,
        }) => {
            await selectMutationalSignaturesVersionID(page);
            await expect(page.locator('div.progress')).toBeVisible({
                timeout: 20000,
            });
            await page.locator('div.progress').hover();
            await expect(
                page.locator(
                    'div[data-test="SignificantMutationalSignaturesTooltip"]'
                )
            ).toBeVisible();
            await expectElementScreenshot(
                page,
                'div.patientViewPage',
                'patient-view-mut-sig-id-tooltip.png'
            );
        });

        test('show stacked bar chart for patient who has significant DBS signatures', async ({
            page,
        }) => {
            await page.mouse.move(0, 0);
            await page
                .locator(
                    'div[data-test="SignificantMutationalSignaturesTooltip"]'
                )
                .waitFor({ state: 'hidden', timeout: 5000 })
                .catch(() => {});
            await selectMutationalSignaturesVersionDBS(page);
            await expect(page.locator('div.patientSamples')).toBeVisible({
                timeout: 20000,
            });
            await page.waitForTimeout(5000);
            await expectElementScreenshot(
                page,
                'div.patientSamples',
                'patient-view-mut-sig-dbs-stacked-bar.png'
            );
        });

        test('show tooltip for patient who has significant DBS signatures', async ({
            page,
        }) => {
            await selectMutationalSignaturesVersionDBS(page);
            await expect(page.locator('div.progress')).toBeVisible({
                timeout: 20000,
            });
            await page.locator('div.progress').hover();
            await expect(
                page.locator(
                    'div[data-test="SignificantMutationalSignaturesTooltip"]'
                )
            ).toBeVisible();
            await expectElementScreenshot(
                page,
                'div.patientViewPage',
                'patient-view-mut-sig-dbs-tooltip.png'
            );
        });

        test('show mutational signatures table for patient who has significant ID signatures', async ({
            page,
        }) => {
            await page.mouse.move(0, 0);
            await page
                .locator(
                    'div[data-test="SignificantMutationalSignaturesTooltip"]'
                )
                .waitFor({ state: 'hidden', timeout: 5000 })
                .catch(() => {});
            await selectMutationalSignaturesVersionID(page);
            await expectElementScreenshot(
                page,
                'div[data-test="MutationalSignaturesContainer"]',
                'patient-view-mut-sig-id-table.png'
            );
        });
    });

    test.describe.serial('test the mutational bar chart', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(
                page,
                genericAssayPatientViewUrl,
                true
            );
            await expect(
                page.locator('div[data-test="MutationalSignaturesContainer"]')
            ).toBeVisible({ timeout: 20000 });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('show mutational bar chart sbs', async () => {
            await expectElementScreenshot(
                page,
                'div[data-test=MutationalSignaturesContainer]',
                'patient-view-mut-bar-chart-sbs.png'
            );
        });

        test('show mutational bar chart id', async () => {
            await selectMutationalSignaturesVersionID(page);
            await expectElementScreenshot(
                page,
                'div[data-test=MutationalSignaturesContainer]',
                'patient-view-mut-bar-chart-id.png'
            );
        });

        test('show mutational bar chart dbs', async () => {
            await selectMutationalSignaturesVersionDBS(page);
            await expectElementScreenshot(
                page,
                'div[data-test=MutationalSignaturesContainer]',
                'patient-view-mut-bar-chart-dbs.png'
            );
        });

        test('show the bar chart with percentage on y axis', async () => {
            await selectPercentageYAxis(page);
            await expectElementScreenshot(
                page,
                'div[data-test=MutationalSignaturesContainer]',
                'patient-view-mut-bar-chart-pct.png'
            );
        });

        test('switch between samples to update mutational bar chart', async () => {
            await selectSampleMutationalSignature(page);
            await expectElementScreenshot(
                page,
                'div[data-test=MutationalSignaturesContainer]',
                'patient-view-mut-bar-chart-sample-switch.png'
            );
        });
    });
});
