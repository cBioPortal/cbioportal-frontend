const { goToUrlAndSetLocalStorage } = require('../../shared/specUtils');
const assert = require('assert');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;

const GENOMIC_PROFILES_SAMPLE_COUNT_TABLE = `div[data-test="chart-container-GENOMIC_PROFILES_SAMPLE_COUNT"]`;
const SELECT_SAMPLES_BUTTON = 'button=Select Samples';
const ADD_FILTERS_BUTTON = 'button=Add Filters';
const STUDY_VIEW_HEADER = `div[data-test="study-view-header"]`;
const SETTINGS_MENU_BUTTON = `button[data-test="study-view-settings-menu"]`;
const DISABLE_AUTOCOMMIT_FIELD = `label=Manually submit`;
const SUBMIT_STUDY_FILTERS = `button[data-test="submit-study-filters"]`;
const PUTATIVE_PROFILE =
    "//span[text() = 'Putative copy-number alterations from GISTIC']";
const LOG2_PROFILE = "//span[text() = 'Log2 copy-number values']";
const PILL_TAG = 'div[data-test="pill-tag"]';
const DELETE_PILL_TAG = 'span[data-test="pill-tag-delete"]';

describe('Toggling of study view filters autosubmit', function() {
    it('autocommits filters by default', () => {
        goToUrlAndSetLocalStorage(studyViewUrl, true);

        //this seems to fix issue with intermittent fail of test due to
        //menu not being clickeable
        browser.setWindowSize(1600, 1000);

        selectMutationProfile(0);
        selectSamples();

        const filterInHeader = $(STUDY_VIEW_HEADER).$(PUTATIVE_PROFILE);
        assert(filterInHeader.isDisplayed());
        const isFilterQueued = hasFilterClass(filterInHeader, 'pending');
        assert(!isFilterQueued);
    });

    it('can disable filter submission in settings menu', () => {
        $(SETTINGS_MENU_BUTTON).waitForDisplayed({ timeout: 20000 });
        $(SETTINGS_MENU_BUTTON).click();
        $(DISABLE_AUTOCOMMIT_FIELD).waitForDisplayed({ timeout: 20000 });
        $(DISABLE_AUTOCOMMIT_FIELD).click();
    });

    it('queues new filters when autosubmit disabled', () => {
        // no submit button
        assert.equal($(SUBMIT_STUDY_FILTERS).isExisting(), false);

        selectMutationProfile(1);

        queueFilter();

        // now we see the submit button
        $(SUBMIT_STUDY_FILTERS).waitForDisplayed();

        const queuedFilterInHeader = $(STUDY_VIEW_HEADER).$(LOG2_PROFILE);
        assert(queuedFilterInHeader.isDisplayed());
        const isFilterQueued = hasFilterClass(queuedFilterInHeader, 'pending');
        assert(isFilterQueued);
    });
    //
    it('queues deleted filters when autosubmit disabled', () => {
        const submittedFilterInHeader = $(STUDY_VIEW_HEADER).$(
            PUTATIVE_PROFILE
        );
        assert(submittedFilterInHeader.isDisplayed());

        deleteFilter(submittedFilterInHeader);

        assert(submittedFilterInHeader.isDisplayed());
        const isFilterQueued = hasFilterClass(
            submittedFilterInHeader,
            'pending'
        );
        assert(isFilterQueued);
        const isFilterDeleted = hasFilterClass(
            submittedFilterInHeader,
            'pendingDelete'
        );
        assert(isFilterDeleted);
    });
    //
    it('submits queued and deleted filters when manually submitting', () => {
        const queuedDeletedFilterInHeader = $(STUDY_VIEW_HEADER).$(
            PUTATIVE_PROFILE
        );
        assert(queuedDeletedFilterInHeader.isDisplayed());
        const queuedFilterInHeader = $(STUDY_VIEW_HEADER).$(LOG2_PROFILE);
        assert(queuedFilterInHeader.isDisplayed());

        $(SUBMIT_STUDY_FILTERS).click();

        browser.waitUntil(() => !queuedDeletedFilterInHeader.isDisplayed());
        assert(queuedFilterInHeader.isDisplayed());
        const isFilterQueued = hasFilterClass(queuedFilterInHeader, 'pending');
        assert(!isFilterQueued);
    });
});

function selectMutationProfile(index = 0) {
    $(GENOMIC_PROFILES_SAMPLE_COUNT_TABLE)
        .$$('input')
        [index].click();
}

function queueFilter() {
    $(GENOMIC_PROFILES_SAMPLE_COUNT_TABLE)
        .$(ADD_FILTERS_BUTTON)
        .click();
}

function selectSamples() {
    $(GENOMIC_PROFILES_SAMPLE_COUNT_TABLE)
        .$(SELECT_SAMPLES_BUTTON)
        .click();
}

/**
 * Execute in browser to be able to use parentElement.closest()
 */
function hasFilterClass(queuedFilterInHeader, toInclude) {
    return browser.execute(
        (queuedFilterInHeader, toInclude, PILL_TAG) => {
            return queuedFilterInHeader.parentElement
                .closest(PILL_TAG)
                .getAttribute('class')
                .includes(toInclude);
        },
        queuedFilterInHeader,
        toInclude,
        PILL_TAG
    );
}

function deleteFilter(queuedFilterInHeader) {
    browser.execute(
        (queuedFilterInHeader, PILL_TAG, DELETE_PILL_TAG) => {
            return queuedFilterInHeader.parentElement
                .closest(PILL_TAG)
                .querySelector(DELETE_PILL_TAG)
                .click();
        },
        queuedFilterInHeader,
        PILL_TAG,
        DELETE_PILL_TAG
    );
}
