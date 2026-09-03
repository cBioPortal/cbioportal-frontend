import { test, Page } from '../fixtures';
import {
    byTestHandle,
    expectOncoprintScreenshot,
    getNthOncoprintTrackOptionsSelectors,
    setDropdownOpen,
    setInputText,
    waitForNumberOfStudyCheckboxes,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Oncoprint sorting flow — a long sequence of sort actions on a single
 * shared Page. Each test's starting state is the prior test's ending
 * state, so the whole block is marked describe.serial and runs on one
 * Page fixture that is created in beforeAll and closed in afterAll.
 *
 * Kept in its own spec file so the 13-test URL catalog and 6 header /
 * track-interaction tests can run on separate workers in parallel.
 *
 * Companion files:
 *   - oncoprint-screenshot-catalog.spec.ts — URL-driven snapshot catalog.
 *   - oncoprint-screenshot-interactions.spec.ts — track header / treatment /
 *     column-gap interactions.
 */
test.describe.serial('sorting flow', () => {
    test.describe.configure({ retries: 0 });
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
