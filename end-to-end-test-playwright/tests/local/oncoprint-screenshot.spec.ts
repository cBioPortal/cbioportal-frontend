// Source: end-to-end-test/local/specs/core/oncoprint.screenshot.spec.js
import { test, expect, Page } from '../../fixtures';
import {
    goToUrlAndSetLocalStorage,
    goToUrlAndSetLocalStorageWithProperty,
} from './helpers';
import {
    expectOncoprintScreenshot,
    waitForOncoprint,
    getNthOncoprintTrackOptionsSelectors,
} from '../helpers/oncoprint';

const USER_SETTINGS_QUERY_PARAM = 'userSettingsJson';
const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const studyes0_oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint' +
    '?Action=Submit' +
    '&RPPA_SCORE_THRESHOLD=2.0' +
    '&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=study_es_0' +
    '&case_set_id=study_es_0_all' +
    '&data_priority=0' +
    '&gene_list=ABLIM1%250ATMEM247' +
    '&geneset_list=%20' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations' +
    '&profileFilter=0' +
    '&tab_index=tab_visualize';

const genericArrayUrl =
    CBIOPORTAL_URL +
    '/results?cancer_study_list=lgg_ucsf_2014_test_generic_assay&tab_index=tab_visualize&case_set_id=lgg_ucsf_2014_test_generic_assay_all&Action=Submit&gene_list=IDH1%250ATP53&generic_assay_groups=lgg_ucsf_2014_test_generic_assay_mutational_signature_binary_SBS%2Cmutational_signature_binary_SBS1%2Cmutational_signature_binary_SBS9%3Blgg_ucsf_2014_test_generic_assay_mutational_signature_category_SBS%2Cmutational_signature_category_SBS1%2Cmutational_signature_category_SBS9';

const SERVER_CLINICAL_TRACK_CONFIG = [
    {
        stableId: 'SUBTYPE',
        sortOrder: 'ASC',
        gapOn: true,
        gapMode: 'HIDE_GAPS',
    },
    {
        stableId: 'OS_STATUS',
        sortOrder: 'DESC',
        gapOn: false,
    },
    {
        stableId: 'DFS_STATUS',
        sortOrder: null,
        gapOn: null,
    },
];

const MANUAL_TRACK_CONFIG = [
    {
        stableId: 'SUBTYPE',
        sortOrder: 'ASC',
        gapOn: false,
        gapMode: 'HIDE_GAPS',
    },
    {
        stableId: 'OS_STATUS',
        sortOrder: 'ASC',
        gapOn: false,
    },
    {
        stableId: 'DFS_STATUS',
        sortOrder: 'ASC',
        gapOn: true,
    },
];

const ONCOPRINT_TIMEOUT = 100000;

function createUrlWithSettingsQueryParam(config: any) {
    const jsonConfig = encodeURIComponent(
        JSON.stringify({ clinicallist: config })
    );
    return `${studyes0_oncoprintTabUrl}#${USER_SETTINGS_QUERY_PARAM}=${jsonConfig}`;
}

async function changeNthTrack(
    page: Page,
    n: number,
    menuOptionButtonText: string
) {
    const sels = getNthOncoprintTrackOptionsSelectors(n);
    await page.locator(sels.button).click();
    await expect(page.locator(sels.dropdown)).toBeVisible({ timeout: 1000 });
    await page.locator(`li:text-is("${menuOptionButtonText}")`).click();
    await waitForOncoprint(page);
}

async function getBookmarkUrl(page: Page): Promise<string> {
    const showBookmarkButtonSelector = '[data-test=bookmark-link]';
    await page
        .locator(showBookmarkButtonSelector)
        .waitFor({ state: 'attached' });
    await page.locator(showBookmarkButtonSelector).click();
    const bookmarkUrlInputFieldSelector = '[data-test=bookmark-url]';
    await page
        .locator(bookmarkUrlInputFieldSelector)
        .waitFor({ state: 'attached' });
    return await page.locator(bookmarkUrlInputFieldSelector).inputValue();
}

async function getTracksFromBookmark(page: Page): Promise<any> {
    const bookmarkUrl = await getBookmarkUrl(page);
    let params = new URLSearchParams(
        new URL(bookmarkUrl).hash.replace(/^#/, '')
    );
    const settings = JSON.parse(
        params.get(USER_SETTINGS_QUERY_PARAM) as string
    );
    return settings.clinicallist;
}

async function createOncoprintFromLegacyFormat(page: Page): Promise<string> {
    const legacyFormatQueryParam = MANUAL_TRACK_CONFIG.map(
        track => track.stableId
    ).join(',');
    const legacyUrl = `${studyes0_oncoprintTabUrl}&clinicallist=${legacyFormatQueryParam}`;
    await goToUrlAndSetLocalStorage(page, legacyUrl, false);
    await waitForOncoprint(page);
    return legacyFormatQueryParam;
}

test.describe('oncoprint', () => {
    test.describe.configure({ retries: 0 });

    test.describe('generic assay categorical tracks', () => {
        test('shows binary and multiple category tracks', async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, genericArrayUrl, true);
            await waitForOncoprint(page);
            await expectOncoprintScreenshot(
                page,
                'oncoprint-generic-assay-categorical-tracks.png'
            );
        });
    });

    test.describe('clinical tracks', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorageWithProperty(
                page,
                studyes0_oncoprintTabUrl,
                true,
                {
                    oncoprint_clinical_tracks_config_json: JSON.stringify(
                        SERVER_CLINICAL_TRACK_CONFIG
                    ),
                }
            );
            await waitForOncoprint(page);
        });

        test('initializes as configured by default', async ({ page }) => {
            await expectOncoprintScreenshot(
                page,
                'oncoprint-clinical-tracks-default.png'
            );
        });

        test('updates url when changing gaps', async ({ page }) => {
            await changeNthTrack(page, 1, 'Hide gaps (w/%)');
            const clinicalTracksUrlParam = await getTracksFromBookmark(page);
            expect(clinicalTracksUrlParam).toEqual(
                SERVER_CLINICAL_TRACK_CONFIG
            );
        });

        test('updates url when sorting', async ({ page }) => {
            await changeNthTrack(page, 1, 'Sort Z-a');

            const clinicallist = await getTracksFromBookmark(page);

            expect(SERVER_CLINICAL_TRACK_CONFIG[0].sortOrder === 'ASC');
            const updatedTrackConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            updatedTrackConfig[0].sortOrder = 'DESC';
            expect(clinicallist).toEqual(updatedTrackConfig);
        });

        test('initializes correctly when clinicallist config present in url', async ({
            page,
        }) => {
            const urlWithUserConfig = createUrlWithSettingsQueryParam(
                MANUAL_TRACK_CONFIG
            );
            await goToUrlAndSetLocalStorage(page, urlWithUserConfig, false);
            await waitForOncoprint(page);

            await expectOncoprintScreenshot(
                page,
                'oncoprint-clinical-tracks-from-url.png'
            );

            const clinicallist = await getTracksFromBookmark(page);
            expect(clinicallist).toEqual(MANUAL_TRACK_CONFIG);
        });

        test('still supports legacy clinicallist format', async ({ page }) => {
            const legacyFormatUrlParam = await createOncoprintFromLegacyFormat(
                page
            );

            await changeNthTrack(page, 1, 'Sort a-Z');

            await expectOncoprintScreenshot(
                page,
                'oncoprint-clinical-tracks-legacy-format.png'
            );

            const clinicallist = await getTracksFromBookmark(page);
            const stableIds = clinicallist.map(
                (tracks: any) => tracks.stableId
            );
            expect(stableIds.join(',')).toEqual(legacyFormatUrlParam);
            expect(clinicallist[0].sortOrder).toEqual('ASC');
        });

        test.skip('stores config in user session when save button clicked', async ({
            page,
        }) => {
            const customConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            customConfig.pop();
            const urlWithUserConfig = createUrlWithSettingsQueryParam(
                customConfig
            );
            await goToUrlAndSetLocalStorage(page, urlWithUserConfig, false);
            await waitForOncoprint(page);

            await page.locator('#addTracksDropdown').click();
            await waitForOncoprint(page);
            const saveBtn = page.locator('#save-oncoprint-config-to-session');
            const classes = ((await saveBtn.getAttribute('class')) ?? '').split(
                ' '
            );
            const saveBtnIsEnabled = !classes.includes('disabled');
            expect(saveBtnIsEnabled).toBe(true);

            await saveBtn.click();
            await waitForOncoprint(page);
            const classesAfter = (
                (await saveBtn.getAttribute('class')) ?? ''
            ).split(' ');
            const saveBtnIsDisabled = classesAfter.includes('disabled');
            expect(saveBtnIsDisabled).toBe(true);
        });

        test.skip('uses configuration stored in session when available', async ({
            page,
        }) => {
            const expected = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            expected.pop();
            const clinicallist = await getTracksFromBookmark(page);
            expect(clinicallist).toEqual(expected);
        });
    });

    test.describe('oql structural variant tracks', () => {
        test.beforeEach(async ({ page }) => {
            const oql =
                'KIAA1549: FUSION::\n' +
                'KIAA1549: FUSION::-\n' +
                'BRAF: FUSION::\n' +
                'BRAF: ::FUSION\n' +
                'ERG: TMPRSS2::FUSION\n';
            const encodedOql = encodeURI(encodeURIComponent(oql));

            const stuctVarUrl =
                CBIOPORTAL_URL +
                '/results/oncoprint' +
                '?Action=Submit' +
                '&RPPA_SCORE_THRESHOLD=2.0' +
                '&Z_SCORE_THRESHOLD=2.0' +
                '&cancer_study_list=study_es_0' +
                '&case_set_id=study_es_0_all' +
                '&data_priority=0' +
                '&gene_list=' +
                encodedOql +
                '&geneset_list=%20' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations' +
                '&profileFilter=0' +
                '&tab_index=tab_visualize';

            await goToUrlAndSetLocalStorageWithProperty(
                page,
                stuctVarUrl,
                true,
                {
                    oncoprint_clinical_tracks_config_json: JSON.stringify(
                        SERVER_CLINICAL_TRACK_CONFIG
                    ),
                }
            );
            await waitForOncoprint(page);
        });

        test('shows oql structural variant variations', async ({ page }) => {
            await expectOncoprintScreenshot(
                page,
                'oncoprint-oql-structural-variant-variations.png'
            );
        });
    });
});
