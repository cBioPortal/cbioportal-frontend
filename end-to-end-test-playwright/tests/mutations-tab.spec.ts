import { test, expect, Page } from '../fixtures';
import { byTestHandle } from './helpers/common';
import { setSettingsMenuOpen, waitForOncoprint } from './helpers/oncoprint';

/**
 * Port of end-to-end-test/remote/specs/core/mutationsTab.spec.js.
 *
 * Two groups:
 *  - VUS/germline filtering via the global settings menu toggles the
 *    mutation-table row count.
 *  - Alteration badge filters (Missense, Splice) and the OncoKB driver
 *    annotation toggle each independently adjust the mutation count.
 *
 * Counts are asserted as literal strings matching the wdio spec. If the
 * upstream data changes the expected numbers will drift; update them
 * in-place rather than loosening the assertions.
 */

const VUS_URL =
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=acc_tcga_pan_can_atlas_2018&case_set_id=acc_tcga_pan_can_atlas_2018_cnaseq' +
    '&data_priority=0&gene_list=HSD17B4&geneset_list=%20' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_pan_can_atlas_2018_gistic' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_pan_can_atlas_2018_mutations' +
    '&tab_index=tab_visualize';

const GERMLINE_URL =
    '/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=brca_tcga_pub&case_set_id=brca_tcga_pub_cnaseq&data_priority=0' +
    '&gene_list=BRCA1%2520BRCA2&geneset_list=%20' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations' +
    '&tab_index=tab_visualize';

const BADGES_URL =
    '/results/mutations?cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
    '&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=TP53' +
    '&gene_set_choice=user-defined-list&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations' +
    '&geneset_list=%20&tab_index=tab_visualize&Action=Submit&mutations_gene=KRAS';

test.describe('mutations tab — VUS / germline filtering', () => {
    test('hides VUS mutations when the setting is on', async ({ page }) => {
        await page.goto(VUS_URL);
        await waitForOncoprint(page);
        await setSettingsMenuOpen(page, true);
        await page.locator('input[data-test="HideVUS"]').click();
        await setSettingsMenuOpen(page, false);

        await page.locator('a.tabAnchor_mutations').click();
        await expect(
            byTestHandle(page, 'LazyMobXTable_CountHeader')
        ).toContainText('0 Mutations');
    });

    test('hides germline mutations when the setting is on', async ({
        page,
    }) => {
        await page.goto(GERMLINE_URL);
        await expect(
            byTestHandle(page, 'LazyMobXTable_CountHeader')
        ).toContainText('19 Mutations', { timeout: 10000 });

        await setSettingsMenuOpen(page, true);
        await page
            .locator(
                'div[data-test="GlobalSettingsDropdown"] input[data-test="HideGermline"]'
            )
            .click();
        await setSettingsMenuOpen(page, false);

        await expect(
            byTestHandle(page, 'LazyMobXTable_CountHeader')
        ).toContainText('6 Mutations', { timeout: 10000 });
    });
});

test.describe('mutations tab — alteration badges', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BADGES_URL);
        await expect(page.locator('.lollipop-svgnode').first()).toBeVisible({
            timeout: 10000,
        });
    });

    test('clicking a badge filter adjusts mutation-table counts', async ({
        page,
    }) => {
        const count = byTestHandle(page, 'LazyMobXTable_CountHeader');
        await expect(count).toContainText('98 Mutations');

        // "strong=Missense" in wdio = exact text match. There are sibling
        // <strong>Missense Mutations</strong> nodes in the lollipop legend,
        // so scope to the badge filter with :text-is().
        const missense = page.locator('strong:text-is("Missense")');
        const splice = page.locator('strong:text-is("Splice")');

        await missense.click();
        await expect(count).toContainText('31 Mutations');

        await missense.click();
        await expect(count).toContainText('98 Mutations');

        await splice.click();
        await expect(count).toContainText('97 Mutations');

        await missense.click();
        await expect(count).toContainText('30 Mutations');
    });

    test('mutation counts track driver-annotation settings', async ({
        page,
    }) => {
        // Two nodes carry data-test="badge-driver" — an outer wrapper
        // (containing the label "Driver" plus the count) and the inner
        // <span class="badge"> whose textContent is just the number.
        // Target the inner one so toHaveText('98') is an exact match.
        const driverBadge = page.locator(
            'span.badge[data-test="badge-driver"]'
        );

        await expect(driverBadge).toHaveText('98');

        // Toggle off OncoKB annotation → count drops.
        await setSettingsMenuOpen(page, true);
        await byTestHandle(page, 'annotateOncoKb').click();
        await setSettingsMenuOpen(page, false);
        await expect(page.locator('.lollipop-svgnode').first()).toBeVisible();
        await expect(driverBadge).toHaveText('64');

        // Toggle it back on → count restored.
        await setSettingsMenuOpen(page, true);
        await byTestHandle(page, 'annotateOncoKb').click();
        await setSettingsMenuOpen(page, false);
        await expect(page.locator('.lollipop-svgnode').first()).toBeVisible();
        await expect(driverBadge).toHaveText('98');
    });
});
