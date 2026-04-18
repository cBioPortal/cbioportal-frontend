import { test, expect, Page } from '@playwright/test';
import { expectElementScreenshot, waitForNetworkQuiet } from './helpers/common';

/**
 * Standalone screenshot tests that each cold-load their own URL —
 * download/patient/enrichments/pathways views from the original
 * screenshot.spec. These were split out of screenshot.spec.ts so the
 * three results-page configs can run on separate workers.
 */

async function snapshot(
    page: Page,
    selector: string,
    name: string,
    hide: string[] = []
) {
    await expectElementScreenshot(page, selector, name, { hide });
}

test.describe('download tab screenshot tests', () => {
    const downloadCases = [
        {
            name: 'msk_impact_2017-ALK-SOS1',
            url:
                '/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2' +
                '&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all' +
                '&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna',
            clickDownloadTab: true,
        },
        {
            name: 'nsclc_tcga_broad_2016-TP53',
            url:
                '/results/download?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
                '&cancer_study_list=nsclc_tcga_broad_2016&case_set_id=nsclc_tcga_broad_2016_cnaseq' +
                '&data_priority=0&gene_list=TP53&geneset_list=%20' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations' +
                '&tab_index=tab_visualize',
        },
        {
            name: 'nsclc_tcga_broad_2016-merged-track',
            url:
                '/results/download?Action=Submit' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna' +
                '&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0' +
                '&case_set_id=nsclc_tcga_broad_2016_cnaseq' +
                '&gene_list=CDKN2A%2520MDM2%2520%255B%2522MERGED%2522%2520MDM4%2520TP53%255D' +
                '&RPPA_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016' +
                '&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations',
        },
        {
            name: 'nsclc_tcga_broad_2016-EGFR-T790M-AMP',
            url:
                '/results/download?Action=Submit' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna' +
                '&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0' +
                '&case_set_id=nsclc_tcga_broad_2016_cnaseq' +
                '&gene_list=EGFR%253A%2520MUT%253DT790M%2520AMP&RPPA_SCORE_THRESHOLD=2.0' +
                '&cancer_study_list=nsclc_tcga_broad_2016&geneset_list=%20' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations',
        },
        {
            name: 'nsclc_tcga_broad_2016-overlapping-TP53',
            url:
                '/results/download?Action=Submit' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna' +
                '&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0' +
                '&case_set_id=nsclc_tcga_broad_2016_cnaseq' +
                '&gene_list=TP53%250ATP53%253A%2520AMP%250ATP53%253A%2520MUT' +
                '&RPPA_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016' +
                '&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations',
        },
    ];

    for (const c of downloadCases) {
        test(`download tab — ${c.name}`, async ({ browser }) => {
            const page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(c.url);
            if (c.clickDownloadTab) {
                await expect(page.locator('a.tabAnchor_download')).toBeVisible({
                    timeout: 10000,
                });
                await page.locator('a.tabAnchor_download').click();
            }
            await expect(
                page
                    .locator(
                        '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg'
                    )
                    .first()
            ).toBeAttached({ timeout: 30000 });
            await expect(
                page.locator('[data-test="downloadTabDiv"]')
            ).toBeVisible({ timeout: 15000 });
            await snapshot(
                page,
                '[data-test="downloadTabDiv"]',
                `download-${c.name}.png`
            );
            await page.close();
        });
    }
});

test.describe('patient view screenshot tests', () => {
    test('patient view lgg_ucsf_2014 P04', async ({ browser }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto('/patient?studyId=lgg_ucsf_2014&caseId=P04');
        await expect(
            page.locator('[data-test="oncogenic-icon-image"]').first()
        ).toBeAttached({ timeout: 30000 });
        await expect(page.locator('.vafPlotThumbnail').first()).toBeAttached({
            timeout: 30000,
        });
        await snapshot(page, '#mainColumn', 'patient-lgg-ucsf-2014-P04.png');
        await page.close();
    });

    test('patient view with 0 mutations msk_impact_2017 P-0000053-T01-IM3', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/patient?sampleId=P-0000053-T01-IM3&studyId=msk_impact_2017'
        );
        await expect(
            page.locator('span:has-text("0 Mutations")')
        ).toBeAttached();
        await expect(
            page.locator('div:has-text("21.6%")').first()
        ).toBeAttached();
        await snapshot(
            page,
            '#mainColumn',
            'patient-msk-impact-0-mutations.png',
            ['.qtip']
        );
        await page.close();
    });

    test('patient view pathways tab msk_impact_2017 P-0000377', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/patient/pathways?studyId=msk_impact_2017&caseId=P-0000377'
        );
        await expect(page.locator('#cy')).toBeVisible({ timeout: 10000 });
        await snapshot(
            page,
            '[data-test="pathwayMapperTabDiv"]',
            'patient-pathways-P-0000377.png',
            ['.qtip', '.__react_component_tooltip', '.rc-tooltip']
        );
        await page.close();
    });

    test('patient view pathways tab msk_impact_2017 P-0000377-T03-IM3', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/patient/pathways?studyId=msk_impact_2017&sampleId=P-0000377-T03-IM3'
        );
        await expect(page.locator('#cy')).toBeVisible({ timeout: 10000 });
        await snapshot(
            page,
            '[data-test="pathwayMapperTabDiv"]',
            'patient-pathways-P-0000377-T03-IM3.png',
            ['.qtip', '.__react_component_tooltip', '.rc-tooltip']
        );
        await page.close();
    });
});

test.describe('enrichments tab screenshot tests', () => {
    test('enrichments tab coadread_tcga_pub mRNA profile (MERTK)', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/results/enrichments?tab_index=tab_visualize' +
                '&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
                '&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut' +
                '&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit'
        );
        await expect(
            page.locator('.comparisonTabSubTabs .tabAnchor_mrna')
        ).toBeVisible();
        await page.locator('.comparisonTabSubTabs .tabAnchor_mrna').click();
        await expect(
            page.locator('div[data-test="GroupComparisonMRNAEnrichments"]')
        ).toBeVisible();
        await page.locator('b:text-is("MERTK")').click();
        await expect(
            page.locator('div[data-test="MiniBoxPlot"]')
        ).toBeVisible();
        await snapshot(
            page,
            'div[data-test="ComparisonTabDiv"]',
            'enrichments-mrna-MERTK.png'
        );
        await page.close();
    });
});

test.describe('results page pathways tab with unprofiled genes', () => {
    test('renders without runtime errors', async ({ browser }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/results/pathways?cancer_study_list=msk_impact_2017&Z_SCORE_THRESHOLD=2.0' +
                '&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cfusion%2Ccna' +
                '&case_set_id=msk_impact_2017_cnaseq' +
                '&gene_list=EGFR%2520ERBB2%2520PDGFRA%2520MET%2520KRAS%2520NRAS%2520HRAS%2520NF1%2520SPRY2%2520FOXO1%2520FOXO3%2520AKT1%2520AKT2%2520AKT3%2520PIK3R1%2520PIK3CA%2520PTEN' +
                '&geneset_list=%20&tab_index=tab_visualize&Action=Submit'
        );
        await expect(page.locator('#cy')).toBeVisible({ timeout: 30000 });
        await waitForNetworkQuiet(page, 30000);
        await snapshot(
            page,
            '[data-test="pathwayMapperTabDiv"]',
            'pathways-unprofiled-genes.png',
            ['.qtip', '.__react_component_tooltip', '.rc-tooltip']
        );
        await page.close();
    });
});
