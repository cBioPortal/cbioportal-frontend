import { Browser, expect, Page } from '@playwright/test';
import { expectElementScreenshot, setDropdownOpen } from './common';

/**
 * Shared selectors, URLs, and small helpers for the group-comparison
 * screenshot specs. Extracted so the original monolithic file can be
 * split into per-topic files that run on separate workers.
 */

export const OVERLAP_DIV = 'div[data-test="ComparisonPageOverlapTabDiv"]';
export const SURVIVAL_DIV = 'div[data-test="ComparisonPageSurvivalTabDiv"]';
export const CLINICAL_DIV = 'div[data-test="ComparisonPageClinicalTabDiv"]';
export const CLINICAL_PLOT_DIV = `${CLINICAL_DIV} div[data-test="ClinicalTabPlotDiv"]`;
export const ALTERATION_ENRICH_DIV =
    'div[data-test="GroupComparisonAlterationEnrichments"]';
export const MRNA_ENRICH_DIV =
    'div[data-test="GroupComparisonMRNAEnrichments"]';
export const PROTEIN_ENRICH_DIV =
    'div[data-test="GroupComparisonProteinEnrichments"]';
export const METHYLATION_ENRICH_DIV =
    'div[data-test="GroupComparisonMethylationEnrichments"]';
export const MUTATIONS_PLOT = '[data-test="ComparisonPageMutationsTabPlot"]';
// Standalone group-comparison page wraps content in a single .msk-tab — but
// the enrichments mini-box-plot opens a nested msk-tab, so :not(.hiddenByPosition)
// can match 2 elements. Use nth=0 to match wdio's `document.querySelector`.
export const MSK_TAB_ACTIVE = '.msk-tab:not(.hiddenByPosition) >> nth=0';

export const GENERAL_URL = '/comparison?sessionId=5ce411c7e4b0ab4137874076';
export const DELETE_GROUP_URL =
    '/comparison?sessionId=5ce411c7e4b0ab4137874076';
export const DISJOINT_VENN_URL =
    '/comparison?sessionId=5cf8b1b3e4b0ab413787436f';
export const THREE_DISJOINT_VENN_URL =
    '/comparison?sessionId=5d28f03be4b0ab413787b1ef';
export const OVERLAP_VENN_URL =
    '/comparison/overlap?sessionId=5cf6bcf0e4b0ab413787430c';
export const COMPLEX_VENN_URL =
    '/comparison/overlap?sessionId=5d1bc517e4b0ab413787924a';
export const UPSET_URL = '/comparison?sessionId=5d0bc0c5e4b0ab4137876bc3';
export const CLINICAL_CATEGORICAL_URL =
    '/comparison?sessionId=67a22dd583e9543d61940572';
export const MUTATIONS_TWO_GROUPS_URL =
    '/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedGene=AR';
export const MUTATIONS_NO_TYPES_URL =
    '/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedEnrichmentEventTypes=%5B"HOMDEL"%2C"AMP"%2C"structural_variant"%5D';
export const MUTATIONS_THREE_GROUPS_URL =
    '/comparison/mutations?comparisonId=634006c24dd45f2bc4c3d4aa&unselectedGroups=%5B"Colon%20Adenocarcinoma"%5D';
export const SAMPLE_CREATE_GROUP_BUTTON =
    'button[data-test="sampleGroupComparisonCreateGroupButton"]';
export const PATIENT_CREATE_GROUP_BUTTON =
    'button[data-test="patientGroupComparisonCreateGroupButton"]';
export const WIDE_VIEWPORT = { width: 1600, height: 1000 } as const;

export async function openWideGroupComparisonPage(
    browser: Browser,
    url: string,
    timeoutMs = 20000
) {
    const page = await browser.newPage({ viewport: WIDE_VIEWPORT });
    await page.goto(url);
    await expect(page.locator(OVERLAP_DIV)).toBeVisible({ timeout: timeoutMs });
    return page;
}

/** SVG <rect>s in the venn diagram ignore ordinary click handlers. */
export async function dispatchSvgClick(page: Page, selector: string) {
    await page.locator(selector).dispatchEvent('click');
    await page.waitForTimeout(100);
}

/**
 * Apply `disablePointerEvents` class to the target before snapshotting —
 * mirrors wdio's `checkElementWithTemporaryClass`, used to freeze hover
 * highlights on the venn diagrams.
 */
export async function snapWithFrozenHover(
    page: Page,
    selector: string,
    snapshotName: string
) {
    await page.evaluate(sel => {
        document
            .querySelectorAll(sel)
            .forEach(el => el.classList.add('disablePointerEvents'));
    }, selector);
    try {
        await expectElementScreenshot(page, selector, snapshotName);
    } finally {
        await page.evaluate(sel => {
            document
                .querySelectorAll(sel)
                .forEach(el => el.classList.remove('disablePointerEvents'));
        }, selector);
    }
}

export async function selectClinicalTabPlotType(page: Page, type: string) {
    await setDropdownOpen(
        page,
        true,
        '[data-test="plotTypeSelector"] .Select-arrow-zone',
        '[data-test="plotTypeSelector"] .Select-menu'
    );
    await page
        .locator(
            `[data-test="plotTypeSelector"] .Select-option[aria-label="${type}"]`
        )
        .click();
}

export async function clickBoldByText(page: Page, text: string) {
    const b = page.locator(`b:text-is("${text}")`).first();
    await expect(b).toBeVisible({ timeout: 15000 });
    await b.click();
}
