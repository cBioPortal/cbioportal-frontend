import { test } from '@playwright/test';
import {
    expectOncoprintScreenshot,
    getNthOncoprintTrackOptionsSelectors,
    setDropdownOpen,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Oncoprint gap rendering — port of
 * end-to-end-test/remote/specs/core/oncoprint.gaps.spec.js.
 *
 * A "gap" is a visual break the oncoprint inserts between samples/patients
 * that belong to different subgroups of a given track. Enabling gaps on a
 * track partitions the display and, for clinical tracks, surfaces the
 * per-subgroup altered-percentage labels over each partition.
 *
 * Fixture study: coadread_tcga_pub (colorectal TCGA 2012), four genes
 * (BCHE, CDK8, CTBP1, ACKR3) with SEX and CANCER_TYPE_DETAILED clinical
 * tracks pinned in the URL so gap behavior can be exercised on both a
 * binary (SEX) and a many-valued (CANCER_TYPE_DETAILED) clinical track.
 *
 * The two tests share a single oncoprint session via test.describe.serial
 * + a shared page fixture, because the second test's assertion is "what
 * happens when two tracks both have gaps enabled" — it builds on the
 * state the first test established.
 */

const STUDY_URL =
    '/results/oncoprint?cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
    '&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_cna' +
    '&gene_list=BCHE%252CCDK8%252CCTBP1%252CACKR3&gene_set_choice=user-defined-list' +
    '&clinicallist=SEX,CANCER_TYPE_DETAILED&profileFilter=mutations%2Cgistic' +
    '&geneset_list=%20&tab_index=tab_visualize&Action=Submit';

// "Show gaps" is the 10th item in the track options dropdown. Kept as a
// named constant because raw `li:nth-child(10)` reads like a magic number.
const SHOW_GAPS_MENU_ITEM = 'li:nth-child(10)';

test.describe.serial('oncoprint gap screenshot tests', () => {
    test.describe.configure({ retries: 0 });
    // A single page/oncoprint session shared across both tests.
    let page: import('@playwright/test').Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(STUDY_URL);
        await waitForOncoprint(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    /**
     * Enabling gaps on the SEX clinical track (track 1) should partition
     * the columns by sex and show an altered-percentage label above each
     * partition. We then zoom out twice so the full width fits in the
     * screenshot and the partition labels are legible.
     */
    test('shows gaps for sex track with correct subgroup percentages', async () => {
        const sex = getNthOncoprintTrackOptionsSelectors(1);
        await setDropdownOpen(page, true, sex.button, sex.dropdown);
        await page.locator(`${sex.dropdown} ${SHOW_GAPS_MENU_ITEM}`).click();
        await waitForOncoprint(page);

        // Zoom out twice so the whole partitioned view fits the viewport.
        await page
            .locator('.oncoprint__zoom-controls .fa-search-minus')
            .click();
        await page
            .locator('.oncoprint__zoom-controls .fa-search-minus')
            .click();
        await page.waitForTimeout(200);

        await expectOncoprintScreenshot(page, 'gaps-sex-track.png');
    });

    /**
     * With gaps already enabled on SEX from the prior test, enabling gaps
     * on CANCER_TYPE_DETAILED (track 2) exercises *hierarchical*
     * partitioning: the display should partition first by SEX, then within
     * each sex-partition partition again by cancer subtype. This is the
     * key regression target — a refactor that collapses the two gap
     * tracks into a flat partition would be caught here but not by pure
     * DOM assertions.
     */
    test('hierarchical sorting when two tracks have enabled gaps', async () => {
        const cancerTypeDetailed = getNthOncoprintTrackOptionsSelectors(2);
        await setDropdownOpen(
            page,
            true,
            cancerTypeDetailed.button,
            cancerTypeDetailed.dropdown
        );
        await page
            .locator(`${cancerTypeDetailed.dropdown} ${SHOW_GAPS_MENU_ITEM}`)
            .click();
        await waitForOncoprint(page);

        await expectOncoprintScreenshot(page, 'gaps-hierarchical.png');
    });
});
