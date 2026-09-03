import { test } from '../fixtures';
import {
    expectOncoprintScreenshot,
    getGroupHeaderOptionsSelectors,
    getNthOncoprintTrackOptionsSelectors,
    setDropdownOpen,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Oncoprint interaction screenshots — each test drives the oncoprint
 * through a menu action (cluster heatmap group, delete track, remove
 * treatment, toggle column gaps) and captures the result.
 *
 * Companion files:
 *   - oncoprint-screenshot-catalog.spec.ts — URL-driven snapshot catalog.
 *   - oncoprint-screenshot-sorting.spec.ts — serial sort-flow sequence.
 */

// --- track group headers ----------------------------------------------

/**
 * Track-group header menu actions: cluster, delete clustered, delete
 * non-clustered, unclustering. Each test navigates fresh (beforeEach)
 * so state is isolated.
 */
test.describe('track group headers', () => {
    const MULTI_HEATMAP_URL =
        '/results/oncoprint?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub' +
        '&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut' +
        '&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list' +
        '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
        '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
        '&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF' +
        '%3Bcoadread_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF&show_samples=false';

    test.beforeEach(async ({ page }) => {
        await page.goto(MULTI_HEATMAP_URL);
        await waitForOncoprint(page);

        // Cluster the mRNA heatmap group (group index 2). Every test in
        // this block starts from this state — the first test asserts it
        // rendered correctly; the others modify it further.
        const mrna = getGroupHeaderOptionsSelectors(2);
        await setDropdownOpen(page, true, mrna.button, mrna.dropdown);
        await page.locator(`${mrna.dropdown} li:nth-child(1)`).click(); // Cluster
        await page.waitForTimeout(500);
    });

    test('oncoprint should cluster heatmap group correctly', async ({
        page,
    }) => {
        await expectOncoprintScreenshot(page, 'headers-clustered.png');
    });

    test('oncoprint should delete clustered heatmap group correctly', async ({
        page,
    }) => {
        const mrna = getGroupHeaderOptionsSelectors(2);
        await setDropdownOpen(page, true, mrna.button, mrna.dropdown);
        await page.locator(`${mrna.dropdown} li:nth-child(4)`).click(); // Delete
        await waitForOncoprint(page);
        await expectOncoprintScreenshot(page, 'headers-delete-clustered.png');
    });

    test('oncoprint should delete non-clustered heatmap group correctly', async ({
        page,
    }) => {
        const methyl = getGroupHeaderOptionsSelectors(3);
        await setDropdownOpen(page, true, methyl.button, methyl.dropdown);
        await page.locator(`${methyl.dropdown} li:nth-child(4)`).click(); // Delete
        await waitForOncoprint(page);
        await expectOncoprintScreenshot(
            page,
            'headers-delete-nonclustered.png'
        );
    });

    test('oncoprint should return to non-clustered state correctly', async ({
        page,
    }) => {
        const mrna = getGroupHeaderOptionsSelectors(2);
        await setDropdownOpen(page, true, mrna.button, mrna.dropdown);
        await page.locator(`${mrna.dropdown} li:nth-child(2)`).click(); // Don't cluster
        await page.waitForTimeout(2000); // sort settle
        await page.mouse.move(0, 0);
        await expectOncoprintScreenshot(page, 'headers-unclustered.png', {
            selector: '#oncoprintDiv',
        });
    });
});

// --- treatment track removal ------------------------------------------

test('removes top treatment track successfully', async ({ page }) => {
    await page.goto(
        '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
            '&cancer_study_list=ccle_broad_2019&case_set_id=ccle_broad_2019_cnaseq' +
            '&data_priority=0&gene_list=TP53&geneset_list=%20' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ccle_broad_2019_cna' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ccle_broad_2019_mutations' +
            '&profileFilter=0&tab_index=tab_visualize' +
            '&heatmap_track_groups=ccle_broad_2019_CCLE_drug_treatment_IC50%2CAfatinib-2%2CAKTinhibitorVIII-1' +
            '&treatment_list=Afatinib-2%3BAKTinhibitorVIII-1'
    );
    await waitForOncoprint(page);

    // Remove the first (top) treatment track via its options menu.
    // Menu item 3 is "Remove track" on treatment tracks.
    const track = getNthOncoprintTrackOptionsSelectors(2);
    await setDropdownOpen(page, true, track.button, track.dropdown);
    await page.locator(`${track.dropdown} li:nth-child(3)`).click();
    await waitForOncoprint(page);

    await expectOncoprintScreenshot(page, 'remove-top-treatment.png');
});

// --- column gaps from clinical track + minimap ------------------------

test('coadread_tcga_pub with column gaps inserted based on clinical track', async ({
    page,
}) => {
    await page.goto(
        '/results?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub' +
            '&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut' +
            '&clinicallist=CANCER_TYPE_DETAILED&gene_list=KRAS%20NRAS%20BRAF' +
            '&gene_set_choice=user-defined-list' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations'
    );
    await waitForOncoprint(page);

    // Enable "show gaps" on the CANCER_TYPE_DETAILED clinical track.
    const cancerType = getNthOncoprintTrackOptionsSelectors(1);
    await setDropdownOpen(page, true, cancerType.button, cancerType.dropdown);
    await page.locator(`${cancerType.dropdown} li:nth-child(10)`).click();
    await page.waitForTimeout(200);

    // Open minimap + zoom-to-fit so the whole partitioned view is captured.
    await page.locator('[data-test="ShowMinimapButton"]').click();
    await page.locator('.oncoprint-zoomtofit-btn').click();
    await page.waitForTimeout(200);

    await expectOncoprintScreenshot(page, 'column-gaps-clinical-track.png');
});
