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

    describe.only('clinical tracks', () => {
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

        it('stores configuration in url param "clinicallist" during initialization', () => {
            const clinicalList = getClinicallistConfigFromUrl(browser);
            expect(clinicalList).toEqual(SERVER_CLINICAL_TRACK_CONFIG);
        });

        it('updates url when changing gaps', () => {
            changeNthTrack(1, "Don't show gaps");

            const clinicalTracksUrlParam = getClinicallistConfigFromUrl(
                browser
            );
            expect(SERVER_CLINICAL_TRACK_CONFIG[0].gapOn === true);
            const updatedTrackConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            updatedTrackConfig[0].gapOn = false;
            expect(clinicalTracksUrlParam).toEqual(updatedTrackConfig);
        });

        it('updates url when sorting', () => {
            changeNthTrack(1, 'Sort Z-a');

            const clinicalTracksUrlParam = getClinicallistConfigFromUrl(
                browser
            );
            expect(SERVER_CLINICAL_TRACK_CONFIG[0].sortOrder === 'ASC');
            const updatedTrackConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            updatedTrackConfig[0].sortOrder = 'DESC';
            expect(clinicalTracksUrlParam).toEqual(updatedTrackConfig);
        });

        it('initializes correctly when clinicallist config present in url', () => {
            const urlConfig = encodeURIComponent(
                JSON.stringify(MANUAL_TRACK_CONFIG)
            );
            const urlWithUserConfig = `${studyes0_oncoprintTabUrl}&clinicallist=${urlConfig}`;
            goToUrlAndSetLocalStorage(urlWithUserConfig, false);
            waitForOncoprint(ONCOPRINT_TIMEOUT);

            const clinicalList = getClinicallistConfigFromUrl(browser);
            expect(clinicalList).toEqual(MANUAL_TRACK_CONFIG);
            const res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });

        it('still supports legacy clinicallist format', () => {
            const legacyFormatUrlParam = createOncoprintFromLegacyFormat();

            changeNthTrack(1, 'Sort a-Z');

            // Legacy format should be converted to config json:
            const url = browser.getUrl();

            const clinicalList = getClinicallistConfigFromUrl(browser);
            const stableIds = clinicalList.map(tracks => tracks.stableId);
            expect(stableIds.join(',')).toEqual(legacyFormatUrlParam);
            expect(clinicalList[0].sortOrder).toEqual('ASC');
            const res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });

        /**
         * Note: to rerun test locally, first clean user session
         */
        it('stores config in user session when save button clicked', () => {
            // Load page with a default config that differs from SERVER_CLINICAL_TRACK_CONFIG:
            const customConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            customConfig.pop();
            browser.url(
                studyes0_oncoprintTabUrl +
                '&clinicallist=' +
                encodeURIComponent(JSON.stringify(customConfig))
            );
            waitForOncoprint(ONCOPRINT_TIMEOUT);

            // Check save button enabled
            openTracksMenu();
            const $saveSessionBtn = $('#save-oncoprint-config-to-session');
            const saveBtnIsEnabled =
                $saveSessionBtn.getAttribute('disabled') === null;
            expect(saveBtnIsEnabled).toBe(true);

            // Click save button
            $saveSessionBtn.click();
            waitForOncoprint(ONCOPRINT_TIMEOUT);

            // Check save button disabled
            const saveBtnIsDisabled =
                $saveSessionBtn.getAttribute('disabled') === '';
            expect(saveBtnIsDisabled).toBe(true);
        });

        /**
         * Uses session from previous test
         * to differentiate between default and custom config
         */
        it('uses configuration stored in session when available', () => {
            const customConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            customConfig.pop();
            const urlConfig = getClinicallistConfigFromUrl(browser);
            expect(urlConfig).toEqual(customConfig);
        });

        /**
         * Load page with a default config that differs
         * from SERVER_CLINICAL_TRACK_CONFIG and session config
         */
        it('prefers url when session and url configuration differ', () => {
            const customUrlConfig = _.cloneDeep(SERVER_CLINICAL_TRACK_CONFIG);
            customUrlConfig[0].gapOn = !customUrlConfig[0].gapOn;
            browser.url(
                studyes0_oncoprintTabUrl +
                '&clinicallist=' +
                encodeURIComponent(JSON.stringify(customUrlConfig))
            );
            waitForOncoprint(ONCOPRINT_TIMEOUT);

            const res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });
    });
});

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

function getClinicallistConfigFromUrl(browser) {
    const url = browser.getUrl();
    return JSON.parse(
        decodeURIComponent(new URLSearchParams(url).get('clinicallist'))
    );
}
