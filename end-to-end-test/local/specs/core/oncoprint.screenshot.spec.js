var {
    goToUrlAndSetLocalStorage,
    waitForOncoprint,
    checkOncoprintElement,
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../../shared/specUtils');
var {
    getNthOncoprintTrackOptionsElements,
} = require('../../../shared/specUtils');
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

var _ = require('lodash');
const { parse } = require('query-string');

const USER_SETTINGS_QUERY_PARAM = 'userSettingsJson';
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

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
    '/results/oncoprint' +
    '?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations' +
    '&cancer_study_list=lgg_ucsf_2014_test_generic_assay' +
    '&Z_SCORE_THRESHOLD=2.0' +
    '&RPPA_SCORE_THRESHOLD=2.0' +
    '&data_priority=0' +
    '&profileFilter=0' +
    '&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced' +
    '&gene_list=IDH1' +
    '&geneset_list=%20' +
    '&tab_index=tab_visualize' +
    '&Action=Submit' +
    '&show_samples=true' +
    '&generic_assay_groups=lgg_ucsf_2014_test_generic_assay_mutational_signature_binary_v2%2Cmutational_signature_binary_2%2Cmutational_signature_binary_1%3Blgg_ucsf_2014_test_generic_assay_mutational_signature_category_v2%2Cmutational_signature_category_6%2Cmutational_signature_category_8%2Cmutational_signature_category_9';

const SERVER_CLINICAL_TRACK_CONFIG = [
    {
        stableId: 'SUBTYPE',
        sortOrder: 'ASC',
        gapOn: true,
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

describe('oncoprint', function() {
    describe('generic assay categorical tracks', () => {
        it('shows binary and multiple category tracks', () => {
            goToUrlAndSetLocalStorage(genericArrayUrl, true);
            waitForOncoprint(ONCOPRINT_TIMEOUT);
            const res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });
    });

    describe('clinical tracks', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorageWithProperty(
                studyes0_oncoprintTabUrl,
                true,
                {
                    oncoprint_clinical_tracks_config_json: JSON.stringify(
                        SERVER_CLINICAL_TRACK_CONFIG
                    ),
                }
            );
            waitForOncoprint(ONCOPRINT_TIMEOUT);
        });

        it('initializes as configured by default', () => {
            const res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });

        it('updates url when changing gaps', () => {
            changeNthTrack(1, "Don't show gaps");
            const clinicalTracksUrlParam = getTracksFromBookmark(browser);

            const expectedConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            expectedConfig[0].gapOn = false;

            expect(clinicalTracksUrlParam).toEqual(expectedConfig);
        });

        it('updates url when sorting', () => {
            changeNthTrack(1, 'Sort Z-a');

            const clinicallist = getTracksFromBookmark(browser);

            expect(SERVER_CLINICAL_TRACK_CONFIG[0].sortOrder === 'ASC');
            const updatedTrackConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            updatedTrackConfig[0].sortOrder = 'DESC';
            expect(clinicallist).toEqual(updatedTrackConfig);
        });

        it('initializes correctly when clinicallist config present in url', () => {
            const urlWithUserConfig = createUrlWithSettingsQueryParam(
                MANUAL_TRACK_CONFIG
            );
            goToUrlAndSetLocalStorage(urlWithUserConfig, false);
            waitForOncoprint(ONCOPRINT_TIMEOUT);

            const res = checkOncoprintElement();
            assertScreenShotMatch(res);

            const clinicallist = getTracksFromBookmark(browser);
            expect(clinicallist).toEqual(MANUAL_TRACK_CONFIG);
        });

        it('still supports legacy clinicallist format', () => {
            const legacyFormatUrlParam = createOncoprintFromLegacyFormat();

            changeNthTrack(1, 'Sort a-Z');

            const res = checkOncoprintElement();
            assertScreenShotMatch(res);

            const clinicallist = getTracksFromBookmark(browser);

            const stableIds = clinicallist.map(tracks => tracks.stableId);
            expect(stableIds.join(',')).toEqual(legacyFormatUrlParam);
            expect(clinicallist[0].sortOrder).toEqual('ASC');
        });

        /**
         * Note: to rerun test locally, first clean user session
         */
        it('stores config in user session when save button clicked', () => {
            // Load page with a default config that differs from SERVER_CLINICAL_TRACK_CONFIG
            const customConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            // Remove track to create diff
            customConfig.pop();
            const urlWithUserConfig = createUrlWithSettingsQueryParam(
                customConfig
            );
            browser.url(urlWithUserConfig);

            waitForOncoprint(ONCOPRINT_TIMEOUT);

            // Check save button enabled
            openTracksMenu();
            const $saveSessionBtn = $('#save-oncoprint-config-to-session');
            let classes = $saveSessionBtn.getAttribute('class').split(' ');
            const saveBtnIsEnabled = !classes.includes('disabled');
            expect(saveBtnIsEnabled).toBe(true);

            // Click save button
            $saveSessionBtn.click();
            waitForOncoprint(ONCOPRINT_TIMEOUT);
            // Check save button disabled
            classes = $saveSessionBtn.getAttribute('class').split(' ');
            const saveBtnIsDisabled = classes.includes('disabled');
            expect(saveBtnIsDisabled).toBe(true);
        });

        /**
         * Uses session from previous test
         * to differentiate between default and custom config
         */
        it('uses configuration stored in session when available', () => {
            // Expected should match custom config of previous test
            const expected = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            expected.pop(); // <-- remove track
            const clinicallist = getTracksFromBookmark(browser);
            expect(clinicallist).toEqual(expected);
        });
    });

    describe('oql structural variant tracks', () => {
        it('shows oql structural variant variations', function() {
            const oql =
                // Downstream KIAA1549 has one struct var events (0.1%):
                'KIAA1549: FUSION::\n' +
                // Downstream KIAA1549 (using NULL special value) has no struct vars events:
                'KIAA1549: FUSION::-\n' +
                // Downstream BRAF one struct var events (0.1%):
                'BRAF: FUSION::\n' +
                // Upstream BRAF has one 35 struct var events (4%):
                'BRAF: ::FUSION';

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

            goToUrlAndSetLocalStorageWithProperty(stuctVarUrl, true, {});
            waitForOncoprint(ONCOPRINT_TIMEOUT);

            const res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });
    });
});

function createUrlWithSettingsQueryParam(config) {
    const jsonConfig = encodeURIComponent(
        JSON.stringify({ clinicallist: config })
    );
    return `${studyes0_oncoprintTabUrl}#${USER_SETTINGS_QUERY_PARAM}=${jsonConfig}`;
}

function openTracksMenu() {
    const $tracksDropdown = $('#addTracksDropdown');
    $tracksDropdown.click();
    waitForOncoprint(2000);
}

function changeNthTrack(track, menuOptionButtonText) {
    const firstTrack = getNthOncoprintTrackOptionsElements(1);
    $(firstTrack.button_selector).click();
    $(firstTrack.dropdown_selector).waitForDisplayed({
        timeout: 1000,
    });
    $(`li=${menuOptionButtonText}`).click();
    waitForOncoprint(2000);
}

function getBookmarkUrl(browser) {
    const showBookmarkButtonSelector = '[data-test=bookmark-link]';
    browser.waitUntil(() => $(showBookmarkButtonSelector).isExisting());
    $(showBookmarkButtonSelector).click();
    const bookmarkUrlInputFieldSelector = '[data-test=bookmark-url]';
    browser.waitUntil(() => $(bookmarkUrlInputFieldSelector).isExisting());
    const $bookMarkUrl = $('[data-test=bookmark-url]');
    return $bookMarkUrl.getValue();
}

function getTracksFromBookmark(browser) {
    const bookmarkUrl = getBookmarkUrl(browser);
    const userSettings = getUserSettingsFrom(bookmarkUrl);
    return userSettings.clinicallist;
}

function getUserSettingsFrom(bookmarkUrl) {
    let params = parse(new URL(bookmarkUrl).hash);
    return JSON.parse(params[USER_SETTINGS_QUERY_PARAM]);
}

/**
 * @returns {string} legacy format
 */
function createOncoprintFromLegacyFormat() {
    const legacyFormatQueryParam = MANUAL_TRACK_CONFIG.map(
        track => track.stableId
    ).join(',');
    const legacyUrl = `${studyes0_oncoprintTabUrl}&clinicallist=${legacyFormatQueryParam}`;
    goToUrlAndSetLocalStorage(legacyUrl, false);
    waitForOncoprint(ONCOPRINT_TIMEOUT);
    return legacyFormatQueryParam;
}
