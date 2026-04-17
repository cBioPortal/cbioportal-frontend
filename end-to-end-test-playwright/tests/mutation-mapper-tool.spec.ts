import { test, expect, Page } from '@playwright/test';
import { byTestHandle } from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/mutationMapperTool.spec.js.
 *
 * Standalone /mutation_mapper tool: feed example inputs (genomic /
 * protein / both) and assert the Genome Nexus annotation pipeline
 * produces the expected per-gene mutation counts, surfaces all
 * transcript ids, warns on unannotatable rows, and still works when
 * the GRCh38 reference toggle is flipped.
 *
 * Tests that were it.skip in the original are not ported.
 * The "Mutations" heading lives inside a text node; we match it
 * loosely with `text=N Mutations` to stay tolerant of Showing X-Y of N
 * framing.
 */

const MUTATION_MAPPER_URL = '/mutation_mapper';

async function openTool(page: Page, gateSelector: string) {
    await page.goto(MUTATION_MAPPER_URL);
    await expect(page.locator(gateSelector)).toBeVisible({ timeout: 10000 });
}

async function waitForAnnotationTable(page: Page, timeout = 60000) {
    // Annotation + table sort are done when the first row has an
    // oncokb icon. Most tests also need a ~5s quiet window after.
    await expect(
        page.locator('tr:nth-child(1) [data-test=oncogenic-icon-image]').first()
    ).toBeVisible({ timeout });
}

async function waitForGenomeNexus(page: Page) {
    await page.waitForTimeout(5000);
}

test.describe('Mutation Mapper Tool: example genomic changes input', () => {
    test('annotates genomic changes example and breaks down by gene', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await openTool(page, '[data-test=GenomicChangesExampleButton]');

        await page.locator('[data-test=GenomicChangesExampleButton]').click();
        await page
            .locator('[data-test=MutationMapperToolVisualizeButton]')
            .click();
        await waitForGenomeNexus(page);
        await waitForAnnotationTable(page);

        // Two T790M rows (EGFR)
        await expect(page.locator('text=T790M')).toHaveCount(2);
        // EGFR count — total mutations for this default transcript
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("122 Mutations")'
            )
        ).toBeVisible();

        // Per-gene nav pill counts
        await page.locator('.nav-pills a:has-text("BRCA1")').click();
        await expect(
            page.locator('[data-test=oncogenic-icon-image]').first()
        ).toBeVisible({ timeout: 60000 });
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("85 Mutations")'
            )
        ).toBeVisible();

        await page.locator('.nav-pills a:has-text("BRCA2")').click();
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("113 Mutations")'
            )
        ).toBeVisible({
            timeout: 60000,
        });

        await page.locator('.nav-pills a:has-text("PTEN")').click();
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("136 Mutations")'
            )
        ).toBeVisible({
            timeout: 60000,
        });

        await page.close();
    });

    test('switching transcript updates mutation count', async ({ browser }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await openTool(page, '[data-test=GenomicChangesExampleButton]');

        await page.locator('[data-test=GenomicChangesExampleButton]').click();
        await page
            .locator('[data-test=MutationMapperToolVisualizeButton]')
            .click();
        await waitForGenomeNexus(page);
        await expect(
            page.locator('[data-test=oncogenic-icon-image]').first()
        ).toBeVisible({ timeout: 60000 });

        // Open transcript dropdown then pick a different transcript.
        await expect(page.locator('text=NM_005228').first()).toBeVisible();
        await page
            .locator('text=NM_005228')
            .first()
            .click();
        await page
            .locator('text=NM_201283')
            .first()
            .click();

        // Transcript-scoped count (27 for NM_201283)
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("27 Mutations")'
            )
        ).toBeVisible({
            timeout: 60000,
        });

        await page.close();
    });

    test('protein-only input surfaces all EGFR transcripts', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await openTool(page, '[data-test=GenomicChangesExampleButton]');

        await page.locator('[data-test=ProteinChangesExampleButton]').click();
        await page
            .locator('[data-test=MutationMapperToolVisualizeButton]')
            .click();
        await waitForGenomeNexus(page);
        await expect(
            byTestHandle(page, 'oncogenic-icon-image').first()
        ).toBeVisible({ timeout: 60000 });
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("124 Mutations")'
            )
        ).toBeVisible();

        await expect(page.locator('text=NM_005228').first()).toBeVisible();
        await page
            .locator('text=NM_005228')
            .first()
            .click();

        for (const tx of [
            'NM_201284',
            'NM_201282',
            'NM_201283',
            'ENST00000454757',
            'ENST00000455089',
            'ENST00000442591',
            'ENST00000450046',
        ]) {
            await expect(page.locator(`text=${tx}`).first()).toBeVisible();
        }

        // Protein-only input keeps the count (user's input had no
        // transcript context to scope against).
        await page
            .locator('text=NM_201283')
            .first()
            .click();
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("124 Mutations")'
            )
        ).toBeVisible();

        await page.close();
    });

    test('genomic+protein input surfaces all transcripts and keeps count', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await openTool(page, '[data-test=GenomicChangesExampleButton]');

        await page
            .locator('[data-test=GenomicAndProteinChangesExampleButton]')
            .click();
        await page
            .locator('[data-test=MutationMapperToolVisualizeButton]')
            .click();
        await waitForGenomeNexus(page);
        await expect(
            page.locator('[data-test=oncogenic-icon-image]').first()
        ).toBeVisible({ timeout: 60000 });
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("122 Mutations")'
            )
        ).toBeVisible();

        await expect(page.locator('text=NM_005228').first()).toBeVisible();
        await page
            .locator('text=NM_005228')
            .first()
            .click();

        for (const tx of [
            'NM_201284',
            'NM_201282',
            'NM_201283',
            'ENST00000454757',
            'ENST00000455089',
            'ENST00000442591',
            'ENST00000450046',
        ]) {
            await expect(page.locator(`text=${tx}`).first()).toBeVisible();
        }

        await page
            .locator('text=NM_201283')
            .first()
            .click();
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("122 Mutations")'
            )
        ).toBeVisible();

        await page.close();
    });

    test('protein changes example annotates and shows expected genes', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await openTool(page, '[data-test=GenomicChangesExampleButton]');

        await page.locator('[data-test=ProteinChangesExampleButton]').click();
        await page
            .locator('[data-test=MutationMapperToolVisualizeButton]')
            .click();
        await waitForGenomeNexus(page);
        await waitForAnnotationTable(page);

        await expect(page.locator('text=T790M')).toHaveCount(2);
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("124 Mutations")'
            )
        ).toBeVisible();
        // Gene nav pills present
        await expect(
            page.locator('.nav-pills a:has-text("BRCA1")')
        ).toBeVisible();
        await expect(
            page.locator('.nav-pills a:has-text("BRCA2")')
        ).toBeVisible();
        await expect(
            page.locator('.nav-pills a:has-text("PTEN")')
        ).toBeVisible();

        await page.close();
    });

    test('warns when some lines fail annotation', async ({ browser }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await openTool(page, '[data-test=GenomicChangesExampleButton]');

        await page
            .locator('#standaloneMutationTextInput')
            .fill(
                'Sample_ID Cancer_Type Chromosome Start_Position End_Position Reference_Allele Variant_Allele\n' +
                    'TCGA-O2-A52N-01 Lung_Squamous_Cell_Carcinoma 7 -1 -1 NA\n' +
                    'TCGA-33-4566-01 Lung_Squamous_Cell_Carcinoma 7 55269425 55269425 C T'
            );
        await page
            .locator('[data-test=MutationMapperToolVisualizeButton]')
            .click();

        await expect(page.locator('[class="borderedChart"]')).toBeVisible({
            timeout: 20000,
        });
        await expect(page.locator('text=Failed to annotate')).toBeVisible();

        await page.locator('[data-test=ShowWarningsButton]').click();
        await expect(page.locator('text=TCGA-33-4566-01')).toBeVisible();

        await page.close();
    });
});

test.describe('Mutation Mapper Tool: GRCh38', () => {
    test('annotates with GRCh38 and breaks down by gene', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await openTool(page, '[data-test=MutationMapperToolGRCh38Button]');

        await page
            .locator('[data-test=MutationMapperToolGRCh38Button]')
            .click();
        // Page reloads after genome-build change; wait for example button.
        await expect(
            byTestHandle(page, 'GenomicChangesExampleButton')
        ).toBeVisible({ timeout: 10000 });
        await page.locator('[data-test=GenomicChangesExampleButton]').click();
        await page
            .locator('[data-test=MutationMapperToolVisualizeButton]')
            .click();
        await waitForGenomeNexus(page);
        await waitForAnnotationTable(page);

        await expect(page.locator('text=T790M')).toHaveCount(2);
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("122 Mutations")'
            )
        ).toBeVisible();

        await page.locator('.nav-pills a:has-text("BRCA1")').click();
        await expect(
            page.locator('[data-test=oncogenic-icon-image]').first()
        ).toBeVisible({ timeout: 60000 });
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("85 Mutations")'
            )
        ).toBeVisible();

        await page.locator('.nav-pills a:has-text("BRCA2")').click();
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("113 Mutations")'
            )
        ).toBeVisible({
            timeout: 60000,
        });

        await page.locator('.nav-pills a:has-text("PTEN")').click();
        await expect(
            page.locator(
                '[data-test="LazyMobXTable_CountHeader"]:has-text("136 Mutations")'
            )
        ).toBeVisible({
            timeout: 60000,
        });

        await page.close();
    });

    test('dbSNP column populates with GRCh38', async ({ browser }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await openTool(page, '[data-test=MutationMapperToolGRCh38Button]');

        await page
            .locator('[data-test=MutationMapperToolGRCh38Button]')
            .click();
        await expect(
            page.locator('[data-test=GenomicChangesExampleButton]')
        ).toBeVisible({ timeout: 10000 });
        await page.locator('[data-test=GenomicChangesExampleButton]').click();
        await page
            .locator('[data-test=MutationMapperToolVisualizeButton]')
            .click();
        await waitForGenomeNexus(page);
        await expect(
            byTestHandle(page, 'oncogenic-icon-image').first()
        ).toBeVisible({ timeout: 60000 });

        // Mutation-mapper-tool uses a generic columns-visibility
        // dropdown (not #addColumnsDropdown). Match the button by
        // its leading "Columns" text, excluding "Reset columns".
        await page
            .locator('button')
            .filter({ hasText: /^Columns/ })
            .click();
        await page.locator(':text-is("dbSNP")').scrollIntoViewIfNeeded();
        await page.locator(':text-is("dbSNP")').click();
        await expect(page.locator('text=rs121434568').first()).toBeVisible({
            timeout: 60000,
        });

        await page.close();
    });
});
