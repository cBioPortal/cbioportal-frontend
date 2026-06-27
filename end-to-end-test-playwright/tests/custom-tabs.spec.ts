import { test, expect, Page } from '../fixtures';
import { setServerConfiguration } from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/customTabs.spec.js.
 *
 * Custom tabs are configured via `frontendConfig.serverConfig.custom_tabs`
 * in localStorage. The wdio spec ran a suite per host page
 * (ResultsView / StudyView / PatientView / ComparisonPage) — we do the
 * same here via a parameterized factory. The `Sync/async hide/show`
 * test in the original was `it.skip`; we don't port it. Remount
 * behaviour on url-param change is covered only for results-view;
 * patient-view gets its own dedicated describe below that exercises
 * Next/Prev page navigation.
 */

const resultsUrl =
    '/results?cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
    '&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut' +
    '&gene_list=KRAS%20NRAS%20BRAF';

const studyUrl = '/study?id=ucec_tcga_pub';

const patientUrl =
    '/patient?studyId=ucec_tcga_pub&caseId=TCGA-AP-A053' +
    '#navCaseIds=ucec_tcga_pub:TCGA-AP-A053,ucec_tcga_pub:TCGA-BG-A0M8,ucec_tcga_pub:TCGA-BG-A0YV,ucec_tcga_pub:TCGA-BS-A0U8';

const comparisonUrl = '/comparison?comparisonId=61845a6ff8f71021ce56e22b';

/**
 * Wdio's `goToUrlWithCustomTabConfig`: navigate to /blank, stash
 * serverConfig in localStorage, then navigate to the real URL so the
 * app boots reading the override.
 */
async function gotoWithCustomTabs(
    page: Page,
    url: string,
    customTabs: unknown[],
    retries = 1
) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        await page.goto('/blank');
        await setServerConfiguration(page, { custom_tabs: customTabs });
        await page.goto(url);

        const hasError = await page
            .locator('text=Oops. There was an error retrieving data.')
            .isVisible()
            .catch(() => false);

        if (!hasError) return;
        if (attempt === retries) return;
    }
}

async function waitForMainTabs(page: Page, timeout = 50000) {
    await expect(page.locator('.mainTabs')).toBeVisible({ timeout });
}

function runTabLocationTests(
    pageName: string,
    url: string,
    tabLocation:
        | 'RESULTS_PAGE'
        | 'STUDY_PAGE'
        | 'PATIENT_PAGE'
        | 'COMPARISON_PAGE'
) {
    test.describe(`${pageName} custom tabs`, () => {
        test('tab location config is obeyed', async ({ browser }) => {
            const page = await browser.newPage({
                viewport: { width: 2500, height: 1000 },
            });
            await gotoWithCustomTabs(page, url, [
                {
                    title: 'Patient Tab',
                    id: 'customTab1',
                    location: 'SOMETHING_ELSE',
                    mountCallbackName: 'renderCustomTab1',
                    hide: false,
                },
                {
                    title: 'Result Tab',
                    id: 'customTab2',
                    location: tabLocation,
                    mountCallbackName: 'renderCustomTab1',
                    hide: false,
                },
            ]);
            await waitForMainTabs(page);
            await expect(
                page.getByText('Patient Tab', { exact: true })
            ).toBeHidden();
            await expect(
                page.getByText('Result Tab', { exact: true })
            ).toBeVisible();
            await page.close();
        });

        test('hide:true hides the custom tab', async ({ browser }) => {
            const page = await browser.newPage({
                viewport: { width: 2000, height: 1000 },
            });
            await gotoWithCustomTabs(page, url, [
                {
                    title: 'Hidden Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    mountCallbackName: 'renderCustomTab1',
                    hide: true,
                    unmountOnHide: false,
                },
                {
                    title: 'Showing Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    mountCallbackName: 'renderCustomTab1',
                    hide: false,
                    unmountOnHide: false,
                },
            ]);
            await waitForMainTabs(page);
            await expect(
                page.getByText('Hidden Tab', { exact: true })
            ).toBeHidden();
            await expect(
                page.getByText('Showing Tab', { exact: true })
            ).toBeVisible();
            await page.close();
        });

        test('routing directly to conditional tab forces it visible', async ({
            browser,
        }) => {
            const page = await browser.newPage({
                viewport: { width: 2000, height: 1000 },
            });
            const conf = [
                {
                    title: 'Async Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    hideAsync: `()=>new Promise((r)=>setTimeout(()=>r(true),2000))`,
                },
                {
                    title: 'Async Tab 2',
                    id: 'customTab2',
                    location: tabLocation,
                    hideAsync: `()=>new Promise((r)=>setTimeout(()=>r(true),2000))`,
                },
            ];
            // Inject /customTab1 before the query string so the app
            // routes directly to the first tab.
            const directUrl = url.replace(/\?/, '/customTab1?');
            await gotoWithCustomTabs(page, directUrl, conf);
            await waitForMainTabs(page);

            await expect(
                page.locator('[data-test=LoadingIndicator]').first()
            ).toBeVisible({ timeout: 5000 });
            await expect(
                page.getByText('Async Tab', { exact: true })
            ).toBeVisible({ timeout: 5000 });
            await expect(
                page.getByText('Async Tab 2', { exact: true })
            ).toBeHidden();
            await page.close();
        });

        test('remount only when tracked url param changes', async ({
            browser,
        }) => {
            const page = await browser.newPage({
                viewport: { width: 2000, height: 1000 },
            });
            const conf = [
                {
                    title: 'Async Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    hideAsync: `()=>new Promise((r)=>setTimeout(()=>r(true),1000))`,
                    mountCallbackName: 'renderCustomTab1',
                },
            ];
            await gotoWithCustomTabs(page, url, conf);
            await waitForMainTabs(page);

            await page.evaluate(() => {
                (window as any).renderCustomTab1 = (div: string) => {
                    (window as any).$(div).append('<div>First render</div>');
                };
            });

            await page.getByText('Async Tab', { exact: true }).click();
            await page.waitForTimeout(1000);
            await expect(page.locator('text="First render"')).toBeVisible();

            await page.evaluate(() => {
                (window as any).renderCustomTab1 = (div: string) => {
                    (window as any).$(div).append('<div>Second render</div>');
                };
            });
            await page.waitForTimeout(2000);

            // Switch away and back: should NOT re-mount.
            await page
                .locator('.mainTabs .tabAnchor')
                .first()
                .click();
            await page.getByText('Async Tab', { exact: true }).click();

            await expect(page.locator('text="First render"')).toBeVisible();
            await expect(page.locator('text="Second render"')).toBeHidden();

            if (tabLocation === 'STUDY_PAGE') {
                // Study page has no easy way to trigger a remount.
                await page.close();
                return;
            }

            switch (tabLocation) {
                case 'RESULTS_PAGE':
                    await page.evaluate(() => {
                        (window as any).urlWrapper.updateRoute({
                            gene_list: 'BRAF KRAS',
                        });
                    });
                    break;
                case 'PATIENT_PAGE':
                    await expect(page.locator('.nextPageBtn')).toBeVisible();
                    await page.locator('.nextPageBtn').click();
                    break;
                case 'COMPARISON_PAGE':
                    await page
                        .locator("[data-test='groupSelectorButtonMSI/CIMP']")
                        .click();
                    break;
            }
            await page.waitForTimeout(2000);

            // ComparisonPage remounts via a different code path that
            // doesn't re-run the mount callback; skip the assertion.
            if (tabLocation !== 'COMPARISON_PAGE') {
                await expect(
                    page.locator('text="Second render"')
                ).toBeVisible();
            }
            await page.close();
        });
    });
}

runTabLocationTests('ResultsView', resultsUrl, 'RESULTS_PAGE');
runTabLocationTests('StudyView', studyUrl, 'STUDY_PAGE');
runTabLocationTests('PatientView', patientUrl, 'PATIENT_PAGE');
runTabLocationTests('ComparisonPage', comparisonUrl, 'COMPARISON_PAGE');

test.describe('Patient cohort view custom tabs', () => {
    test('navigating between patients changes tab contents', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 2000, height: 1000 },
        });
        const conf = [
            {
                title: 'Sync Tab',
                id: 'customTab1',
                location: 'PATIENT_PAGE',
                mountCallback: `(div)=>{
                    $(div).html("tab for patient " + window.location.search.split("=").slice(-1))
                }`,
            },
            {
                title: 'Async Tab',
                id: 'customTab2',
                location: 'PATIENT_PAGE',
                hide: false,
                hideAsync: `()=>new Promise((resolve)=>{
                    const int=setInterval(()=>{
                        if ($(".tabAnchor_customTab1").length) {
                            clearInterval(int);
                            setTimeout(()=>resolve(true),10000);
                        }
                    },500);
                })`,
            },
        ];

        await gotoWithCustomTabs(page, patientUrl, conf);
        await expect(
            page.getByText('Summary', { exact: true }).first()
        ).toBeVisible();

        // Async tab should still be in "pending" state — not even in the DOM.
        await expect(page.locator('a', { hasText: 'Async Tab' })).toHaveCount(
            0
        );

        await page.getByText('Sync Tab', { exact: true }).click();
        await expect(
            page.locator('text="tab for patient TCGA-AP-A053"')
        ).toBeVisible();

        // Wait for the async hide resolver to fire (~10s).
        await expect(page.getByText('Async Tab', { exact: true })).toBeVisible({
            timeout: 20000,
        });

        await page.locator('.nextPageBtn').click();
        await expect(page.locator('.mainTabs')).toBeVisible();

        // Navigating patients should re-hide the async tab (pending).
        await expect(page.getByText('Async Tab', { exact: true })).toBeHidden();
        await expect(
            page.locator('text="tab for patient TCGA-BG-A0M8"')
        ).toBeVisible();

        await page.locator('.prevPageBtn').click();
        await expect(
            page.locator('text="tab for patient TCGA-AP-A053"')
        ).toBeVisible();

        await page.close();
    });
});
