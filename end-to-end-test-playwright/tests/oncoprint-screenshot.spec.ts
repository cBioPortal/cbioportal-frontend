import { test, Page } from '@playwright/test';
import {
    byTestHandle,
    expectOncoprintScreenshot,
    getGroupHeaderOptionsSelectors,
    getNthOncoprintTrackOptionsSelectors,
    setDropdownOpen,
    setInputText,
    waitForNumberOfStudyCheckboxes,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Oncoprint visual regression suite — port of
 * end-to-end-test/remote/specs/core/oncoprint.screenshot.spec.js.
 *
 * Three concerns exercised here, each in its own describe block:
 *
 * 1. Independent URL-driven snapshots — a catalog of studies + gene lists
 *    that each render a distinct oncoprint configuration. Any track-type
 *    or renderer regression will show up in at least one of these.
 *
 * 2. Track-group header interactions — clustering / deleting heatmap
 *    track groups. Each test starts from the same URL (beforeEach) and
 *    optionally runs the "cluster mrna" preamble.
 *
 * 3. Sorting flow — a long sequence of sort actions on a shared oncoprint.
 *    Each test builds on the previous test's state; they run serially
 *    against a single shared Page.
 */

// --- describe #1: independent URL-driven snapshots ---------------------

/**
 * A small table drives the "load URL, take screenshot" cases. Kept as
 * data (not 14 copy-pasted tests) so the test list reads as what it
 * actually is: a catalog of configurations.
 */
const URL_CATALOG: Array<{
    title: string;
    url: string;
    snapshot: string;
    /**
     * Explicit intent — what regression would this screenshot catch?
     * Written out so readers don't have to guess from the URL.
     */
    rationale: string;
}> = [
    {
        title: 'ov_tcga_pub with germline mutations',
        url:
            '/results/oncoprint?cancer_study_list=ov_tcga_pub&cancer_study_id=ov_tcga_pub' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations' +
            '&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete' +
            '&gene_list=BRCA1%20BRCA2&gene_set_choice=user-defined-list',
        snapshot: 'ov_tcga_pub-germline.png',
        rationale:
            'BRCA1/BRCA2 in ov_tcga_pub has many germline mutations — guards the germline glyph coloring.',
    },
    {
        title: 'coadread_tcga_pub with clinical and heatmap tracks',
        url:
            '/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=2' +
            '&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut' +
            '&gene_list=KRAS%20NRAS%20BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
            '&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=coadread_tcga_pub_rna_seq_mrna_median_Zscores' +
            '&show_samples=false&clinicallist=0%2C2%2CMETHYLATION_SUBTYPE' +
            '&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF&',
        snapshot: 'coadread-clinical-heatmap.png',
        rationale:
            'Multiple track types (mutation, CNA, mRNA heatmap, clinical) rendered together — layout/ordering regression target.',
    },
    {
        title: 'acc_tcga with clinical and heatmap tracks',
        url:
            '/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1' +
            '&data_priority=0&case_set_id=acc_tcga_all' +
            '&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2' +
            '&geneset_list=%20&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic' +
            '&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=acc_tcga_rna_seq_v2_mrna_median_Zscores' +
            '&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=acc_tcga_rppa_Zscores' +
            '&show_samples=false&clinicallist=0%2C1%2CMETASTATIC_DX_CONFIRMED_BY' +
            '&heatmap_track_groups=acc_tcga_rna_seq_v2_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2',
        snapshot: 'acc-clinical-heatmap.png',
        rationale:
            'Wide 10-gene oncoprint with RPPA + mRNA heatmaps — stresses track count and heatmap track rendering.',
    },
    {
        title: 'blca_tcga with clinical and heatmap tracks',
        url:
            '/index.do?cancer_study_id=blca_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1' +
            '&data_priority=0&case_set_id=blca_tcga_pub_all' +
            '&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2' +
            '&geneset_list=%20&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_gistic' +
            '&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_rna_seq_mrna_median_Zscores' +
            '&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_rppa_Zscores' +
            '&show_samples=false' +
            '&heatmap_track_groups=blca_tcga_pub_rna_seq_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2' +
            '&clinicallist=CANCER_TYPE_DETAILED%2CMETASTATIC_SITE_OTHER%2CNEW_TUMOR_EVENT_AFTER_INITIAL_TREATMENT',
        snapshot: 'blca-clinical-heatmap.png',
        rationale:
            'Same shape as acc_tcga but different study — catches data-source-specific rendering bugs.',
    },
    {
        title: 'hcc_inserm_fr_2015 with TERT promoter mutations',
        url:
            '/index.do?cancer_study_id=hcc_inserm_fr_2015&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0' +
            '&data_priority=0&case_set_id=hcc_inserm_fr_2015_sequenced' +
            '&gene_list=SOX9%2520RAN%2520TNK2%2520EP300%2520PXN%2520NCOA2%2520AR%2520NRIP1%2520NCOR1%2520NCOR2%2520TERT' +
            '&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=hcc_inserm_fr_2015_mutations',
        snapshot: 'hcc-tert-promoter.png',
        rationale:
            'TERT promoter mutations must render as the orange promoter glyph, not the generic mutation glyph.',
    },
    {
        title: 'msk_impact_2017 with SOS1 — not-sequenced',
        url:
            '/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
            '&data_priority=0&case_set_id=msk_impact_2017_all' +
            '&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations',
        snapshot: 'msk-sos1-not-sequenced.png',
        rationale:
            'SOS1 is not on the MSK-IMPACT panel; the column must render as "not sequenced", not "wild-type".',
    },
    {
        title: 'msk_impact_2017 with ALK and SOS1 — SOS1 not sequenced',
        url:
            '/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
            '&data_priority=0&case_set_id=msk_impact_2017_all' +
            '&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations',
        snapshot: 'msk-alk-sos1.png',
        rationale:
            'Mixed-profiling case: ALK is sequenced, SOS1 is not. Each row must reflect its own panel coverage.',
    },
    {
        title: 'msk_impact_2017 with SOS1 + CNA profile — not sequenced',
        url:
            '/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
            '&data_priority=0&case_set_id=msk_impact_2017_all' +
            '&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna',
        snapshot: 'msk-sos1-cna.png',
        rationale:
            'Adding CNA profile must not flip SOS1 to "sequenced" — panel coverage is per alteration type.',
    },
    {
        title: 'brca_tcga_pub with methylation heatmap',
        url:
            '/index.do?cancer_study_id=brca_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
            '&data_priority=0&case_set_id=brca_tcga_pub_cnaseq' +
            '&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic' +
            '&show_samples=false' +
            '&heatmap_track_groups=brca_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF%2CTP53%2CBRCA1%2CBRCA2',
        snapshot: 'brca-methylation-heatmap.png',
        rationale:
            'Methylation heatmap uses a different colorscale than mRNA — regression target for per-datatype colors.',
    },
    {
        title: 'MSK-IMPACT profiled-in tracks with 3 not-profiled genes',
        url:
            '/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0' +
            '&data_priority=0&case_set_id=msk_impact_2017_cnaseq' +
            '&gene_list=AKR1C1%2520AKR1C2%2520AKR1C4&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna',
        snapshot: 'msk-profiled-in-tracks.png',
        rationale:
            'All 3 query genes are off-panel — the profiled-in summary track should show a solid not-sequenced band.',
    },
    {
        title: 'profiled-in tracks in a combined study session',
        url:
            '/results/oncoprint?session_id=5c38e4c0e4b05228701fb0c9&show_samples=false',
        snapshot: 'profiled-in-combined-session.png',
        rationale:
            'Session-driven load path with multiple studies exercises cross-study profiled-in logic.',
    },
    {
        title: 'profiled-in tracks across multiple studies (SOS1)',
        url:
            '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
            '&cancer_study_list=msk_impact_2017%2Cbrca_tcga_pub&case_set_id=all' +
            '&data_priority=0&gene_list=SOS1&geneset_list=%20&tab_index=tab_visualize',
        snapshot: 'profiled-in-multi-study.png',
        rationale:
            'Mixes a panel-sequenced study (MSK) with a WES study (BRCA) — each sample must show its own coverage.',
    },
    {
        title: 'multiple tracks with same gene',
        url:
            '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
            '&cancer_study_list=acc_tcga_pan_can_atlas_2018&case_set_id=acc_tcga_pan_can_atlas_2018_cnaseq' +
            '&data_priority=0&gene_list=EGFR%253AAMP%253BEGFR%253AMUT%253B%2520PTEN%253B%2520EGFR%2520EGFR' +
            '&geneset_list=%20' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_pan_can_atlas_2018_gistic' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_pan_can_atlas_2018_mutations' +
            '&tab_index=tab_visualize',
        snapshot: 'multiple-tracks-same-gene.png',
        rationale:
            'EGFR appears multiple times with different alteration filters — each occurrence must render independently.',
    },
];

test.describe('oncoprint URL catalog', () => {
    for (const entry of URL_CATALOG) {
        test(entry.title, async ({ page }) => {
            await page.goto(entry.url);
            await waitForOncoprint(page);
            // Some of the combined-study / heatmap configs render progressively;
            // a short settle lets the final layout stabilize before capture.
            await page.waitForTimeout(1000);
            await expectOncoprintScreenshot(page, entry.snapshot);
        });
    }
});

// --- describe #2: track group headers ---------------------------------

/**
 * Track-group header menu actions: cluster, delete clustered, delete
 * non-clustered, unclustering, and removal of the top treatment track.
 * Each test navigates fresh (beforeEach) so state is isolated.
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

// --- independent: treatment track removal -----------------------------

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

// --- independent: column gaps from clinical track + minimap -----------

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

// --- describe #3: sorting flow (serial, shared page) ------------------

/**
 * The sorting tests form a long sequence of user actions on a single
 * oncoprint. Each test's starting state is the prior test's ending
 * state, so they run serially against a shared Page. Test names are
 * kept close to the wdio originals for traceability, but each has a
 * docstring describing what sort action is being exercised.
 */
test.describe.serial('sorting flow', () => {
    let page: Page;

    const eventsPerSampleRadio =
        '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]';
    const eventsPerPatientRadio =
        '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="1"]';
    const viewDropdown =
        '.oncoprintContainer .oncoprint__controls #viewDropdownButton';

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
    });

    test.afterAll(async () => {
        await page.close();
    });

    /** Build a coadread_tcga_pub oncoprint through the query wizard. Patient mode by default. */
    test('oncoprint should sort patients correctly in coadread_tcga_pub', async () => {
        await page.goto('/');
        const search = 'div[data-test=study-search] input[type="text"]';
        await setInputText(page, search, 'colorectal tcga nature');
        await waitForNumberOfStudyCheckboxes(page, 1);
        await page.locator('[data-test="StudySelect"] input').click();
        await byTestHandle(page, 'queryByGeneButton').click();
        await setInputText(page, '[data-test="geneSet"]', 'KRAS NRAS BRAF');
        const queryBtn = page.locator('[data-test="queryButton"]');
        await queryBtn.waitFor({ state: 'visible' });
        await queryBtn.click();
        await waitForOncoprint(page);
        await expectOncoprintScreenshot(page, 'sort-coadread-patients.png');
    });

    /** Switch coadread oncoprint to sample mode. */
    test('oncoprint should sort samples correctly in coadread_tcga_pub', async () => {
        await setDropdownOpen(page, true, viewDropdown, eventsPerSampleRadio);
        await page.locator(eventsPerSampleRadio).click();
        await waitForOncoprint(page);
        await setDropdownOpen(page, false, viewDropdown, eventsPerSampleRadio);
        await expectOncoprintScreenshot(page, 'sort-coadread-samples.png');
    });

    /** New navigation: build a gbm_tcga_pub oncoprint through the query wizard. */
    test('oncoprint should sort patients correctly in gbm_tcga_pub', async () => {
        await page.goto('/');
        const search = 'div[data-test=study-search] input[type="text"]';
        await setInputText(page, search, 'glio tcga nature 2008');
        await waitForNumberOfStudyCheckboxes(page, 1);
        await page.locator('[data-test="StudySelect"] input').click();
        await byTestHandle(page, 'queryByGeneButton').click();
        await setInputText(page, '[data-test="geneSet"]', 'TP53 MDM2 MDM4');
        const queryBtn = page.locator('[data-test="queryButton"]');
        await queryBtn.waitFor({ state: 'visible' });
        await queryBtn.click();
        await waitForOncoprint(page);
        await expectOncoprintScreenshot(page, 'sort-gbm-patients.png');
    });

    /** Switch gbm oncoprint to sample mode. */
    test('oncoprint should sort samples correctly in gbm_tcga_pub', async () => {
        await setDropdownOpen(page, true, viewDropdown, eventsPerSampleRadio);
        await page.locator(eventsPerSampleRadio).click();
        await waitForOncoprint(page);
        await setDropdownOpen(page, false, viewDropdown, eventsPerSampleRadio);
        await expectOncoprintScreenshot(page, 'sort-gbm-samples.png');
    });

    /**
     * Reset to a fresh gbm_tcga_pub URL with clinical tracks pinned.
     * Depending on whether a Profiled-in track exists at position 5, we
     * either remove it (so subsequent tests' track indices are stable)
     * or close the menu. This mirrors the branching logic in the wdio
     * original.
     */
    test('initial patient order (clinical tracks sorted flow)', async () => {
        await page.goto(
            '/index.do?cancer_study_id=gbm_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0' +
                '&data_priority=0&case_set_id=gbm_tcga_pub_cnaseq' +
                '&gene_list=TP53%20MDM2%20MDM4&geneset_list=%20&tab_index=tab_visualize&Action=Submit' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae' +
                '&clinicallist=FRACTION_GENOME_ALTERED%2CDFS_MONTHS%2CKARNOFSKY_PERFORMANCE_SCORE%2COS_STATUS' +
                '&heatmap_track_groups=gbm_tcga_pub_mrna_median_Zscores%2CTP53%2CMDM2%2CMDM4' +
                '%3Bgbm_tcga_pub_mrna_merged_median_Zscores%2CTP53%2CMDM2%2CMDM4'
        );
        await waitForOncoprint(page);

        const track5 = getNthOncoprintTrackOptionsSelectors(5);
        await page.locator(track5.button).hover();
        await page.locator(track5.button).click();
        await page.locator(track5.dropdown).waitFor({ state: 'visible' });
        const sortAZ = page.locator(`${track5.dropdown} li`, {
            hasText: 'Sort a-Z',
        });
        if ((await sortAZ.count()) > 0) {
            // Clinical track — remove it so subsequent nth indices stay stable.
            await page.locator(`${track5.dropdown} li:nth-child(3)`).click();
            await waitForOncoprint(page);
        } else {
            // Already a genetic track — just close the menu.
            await page.locator(track5.button).click();
        }
        await expectOncoprintScreenshot(
            page,
            'sort-gbm-clinical-initial-patient.png'
        );
    });

    test('initial sample order (clinical tracks sorted flow)', async () => {
        await setDropdownOpen(page, true, viewDropdown, eventsPerSampleRadio);
        await page.locator(eventsPerSampleRadio).click();
        await waitForOncoprint(page);
        await setDropdownOpen(page, false, viewDropdown, eventsPerSampleRadio);
        await expectOncoprintScreenshot(
            page,
            'sort-gbm-clinical-initial-sample.png'
        );
    });

    /** Sort by Overall Survival (track 4) ascending, back in patient mode. */
    test('sorted patient order 1 — OS a-Z', async () => {
        await setDropdownOpen(page, true, viewDropdown, eventsPerPatientRadio);
        await page.locator(eventsPerPatientRadio).click();
        await waitForOncoprint(page);
        const os = getNthOncoprintTrackOptionsSelectors(4);
        await page.locator(os.button).click();
        await page.locator(os.dropdown).waitFor({ state: 'visible' });
        await page
            .locator(`${os.dropdown} li`, { hasText: 'Sort a-Z' })
            .click();
        await page.waitForTimeout(200);
        await setDropdownOpen(page, false, viewDropdown, eventsPerPatientRadio);
        await expectOncoprintScreenshot(page, 'sort-gbm-patient-1.png');
    });

    test('sorted patient order 2 — OS Z-a', async () => {
        const os = getNthOncoprintTrackOptionsSelectors(4);
        await setDropdownOpen(page, true, os.button, os.dropdown);
        await page
            .locator(`${os.dropdown} li`, { hasText: 'Sort Z-a' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-patient-2.png');
    });

    test('sorted patient order 3 — Karnofsky Z-a', async () => {
        const karn = getNthOncoprintTrackOptionsSelectors(3);
        await page.locator(karn.button).click();
        await page.locator(karn.dropdown).waitFor({ state: 'visible' });
        await page
            .locator(`${karn.dropdown} li`, { hasText: 'Sort Z-a' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-patient-3.png');
    });

    test('sorted patient order 4 — Karnofsky a-Z', async () => {
        const karn = getNthOncoprintTrackOptionsSelectors(3);
        await setDropdownOpen(page, true, karn.button, karn.dropdown);
        await page
            .locator(`${karn.dropdown} li`, { hasText: 'Sort a-Z' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-patient-4.png');
    });

    test('sorted sample order 1 — sample mode', async () => {
        await setDropdownOpen(page, true, viewDropdown, eventsPerSampleRadio);
        await page.locator(eventsPerSampleRadio).click();
        await waitForOncoprint(page);
        await setDropdownOpen(page, false, viewDropdown, eventsPerSampleRadio);
        await expectOncoprintScreenshot(page, 'sort-gbm-sample-1.png');
    });

    test('sorted sample order 2 — DFS_MONTHS a-Z', async () => {
        const dfs = getNthOncoprintTrackOptionsSelectors(2);
        await page.locator(dfs.button).click();
        await page.locator(dfs.dropdown).waitFor({ state: 'visible' });
        await page
            .locator(`${dfs.dropdown} li`, { hasText: 'Sort a-Z' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-sample-2.png');
    });

    test('sorted sample order 3 — DFS_MONTHS Z-a', async () => {
        const dfs = getNthOncoprintTrackOptionsSelectors(2);
        await setDropdownOpen(page, true, dfs.button, dfs.dropdown);
        await page
            .locator(`${dfs.dropdown} li`, { hasText: 'Sort Z-a' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-sample-3.png');
    });

    test('sorted sample order 4 — Fraction Genome Altered Z-a', async () => {
        const fga = getNthOncoprintTrackOptionsSelectors(1);
        await page.locator(fga.button).click();
        await page.locator(fga.dropdown).waitFor({ state: 'visible' });
        await page
            .locator(`${fga.dropdown} li`, { hasText: 'Sort Z-a' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-sample-4.png');
    });

    test('sorted sample order 5 — Fraction Genome Altered a-Z', async () => {
        const fga = getNthOncoprintTrackOptionsSelectors(1);
        await setDropdownOpen(page, true, fga.button, fga.dropdown);
        await page
            .locator(`${fga.dropdown} li`, { hasText: 'Sort a-Z' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-sample-5.png');
    });

    test('sorted sample order 6 — TP53 heatmap track Z-a', async () => {
        const tp53 = getNthOncoprintTrackOptionsSelectors(8);
        await page.locator(tp53.button).click();
        await page.locator(tp53.dropdown).waitFor({ state: 'visible' });
        const sortZA = page.locator(`${tp53.dropdown} li`, {
            hasText: 'Sort Z-a',
        });
        await sortZA.scrollIntoViewIfNeeded();
        await sortZA.click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-sample-6.png');
    });

    /**
     * Full navigation to a fresh gbm oncoprint in sample mode, then sort
     * by TP53 heatmap track Z-a. Starts a new "heatmap tracks sorted"
     * flow; subsequent tests build on this state.
     */
    test('heatmap sort 1 — TP53 heatmap Z-a (fresh navigate)', async () => {
        await page.goto(
            '/index.do?cancer_study_id=gbm_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0' +
                '&data_priority=0&case_set_id=gbm_tcga_pub_cnaseq' +
                '&gene_list=TP53%2520MDM2%2520MDM4&geneset_list=%20&tab_index=tab_visualize&Action=Submit' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae' +
                '&clinicallist=FRACTION_GENOME_ALTERED%2CDFS_MONTHS%2CKARNOFSKY_PERFORMANCE_SCORE%2COS_STATUS' +
                '&heatmap_track_groups=gbm_tcga_pub_mrna_median_Zscores%2CTP53%2CMDM2%2CMDM4' +
                '%3Bgbm_tcga_pub_mrna_merged_median_Zscores%2CTP53%2CMDM2%2CMDM4&show_samples=true'
        );
        await waitForOncoprint(page);
        const tp53 = getNthOncoprintTrackOptionsSelectors(8);
        await page.locator(tp53.button).hover();
        await page.locator(tp53.button).click();
        await page.locator(tp53.dropdown).waitFor({ state: 'visible' });
        await page
            .locator(`${tp53.dropdown} li`, { hasText: 'Sort Z-a' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-heatmap-1.png');
    });

    test('heatmap sort 2 — TP53 heatmap a-Z', async () => {
        const tp53 = getNthOncoprintTrackOptionsSelectors(8);
        await setDropdownOpen(page, true, tp53.button, tp53.dropdown);
        await page
            .locator(`${tp53.dropdown} li`, { hasText: 'Sort a-Z' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-heatmap-2.png');
    });

    test('heatmap sort 3 — MDM4 heatmap a-Z', async () => {
        const tp53 = getNthOncoprintTrackOptionsSelectors(8);
        await setDropdownOpen(page, false, tp53.button, tp53.dropdown);

        const mdm4 = getNthOncoprintTrackOptionsSelectors(13);
        await page.locator(mdm4.button).click();
        await page.locator(mdm4.dropdown).waitFor({ state: 'visible' });
        await page
            .locator(`${mdm4.dropdown} li`, { hasText: 'Sort a-Z' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-heatmap-3.png');
    });

    test('heatmap sort 4 — MDM4 heatmap Z-a', async () => {
        const mdm4 = getNthOncoprintTrackOptionsSelectors(13);
        await setDropdownOpen(page, true, mdm4.button, mdm4.dropdown);
        await page
            .locator(`${mdm4.dropdown} li`, { hasText: 'Sort Z-a' })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-heatmap-4.png');
    });

    test("heatmap sort 5 — TP53 Don't sort", async () => {
        const tp53 = getNthOncoprintTrackOptionsSelectors(8);
        await page.locator(tp53.button).click();
        await page.locator(tp53.dropdown).waitFor({ state: 'visible' });
        await page
            .locator(`${tp53.dropdown} li`, { hasText: "Don't sort track" })
            .click();
        await page.waitForTimeout(200);
        await expectOncoprintScreenshot(page, 'sort-gbm-heatmap-5.png');
    });

    test('heatmap sort 6 — back to patient mode', async () => {
        await setDropdownOpen(page, true, viewDropdown, eventsPerPatientRadio);
        await page.locator(eventsPerPatientRadio).click();
        await waitForOncoprint(page);
        await setDropdownOpen(page, false, viewDropdown, eventsPerPatientRadio);
        await expectOncoprintScreenshot(page, 'sort-gbm-heatmap-patient.png');
    });
});
