// Source: end-to-end-test/local/specs/study-view-filters-autocommit-toggle.spec.js
import { test, expect, Page } from '../../fixtures';
import { Locator } from '@playwright/test';
import { goToUrlAndSetLocalStorage } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;

const GENOMIC_PROFILES_SAMPLE_COUNT_TABLE = `div[data-test="chart-container-GENOMIC_PROFILES_SAMPLE_COUNT"]`;
const SELECT_SAMPLES_BUTTON = 'button:has-text("Select Samples")';
const ADD_FILTERS_BUTTON = 'button:has-text("Add Filters")';
const STUDY_VIEW_HEADER = `div[data-test="study-view-header"]`;
const SETTINGS_MENU_BUTTON = `button[data-test="study-view-settings-menu"]`;
const DISABLE_AUTOCOMMIT_FIELD = `label:has-text("Manually submit")`;
const SUBMIT_STUDY_FILTERS = `button[data-test="submit-study-filters"]`;
const PUTATIVE_PROFILE =
    "xpath=//span[text() = 'Putative copy-number alterations from GISTIC']";
const LOG2_PROFILE = "xpath=//span[text() = 'Log2 copy-number values']";
const PILL_TAG = 'div[data-test="pill-tag"]';
const DELETE_PILL_TAG = 'span[data-test="pill-tag-delete"]';

async function selectMutationProfile(page: Page, index = 0) {
    const inputs = page
        .locator(GENOMIC_PROFILES_SAMPLE_COUNT_TABLE)
        .locator('input');
    await inputs.nth(index).click();
}

async function queueFilter(page: Page) {
    await page
        .locator(GENOMIC_PROFILES_SAMPLE_COUNT_TABLE)
        .locator(ADD_FILTERS_BUTTON)
        .click();
}

async function selectSamples(page: Page) {
    await page
        .locator(GENOMIC_PROFILES_SAMPLE_COUNT_TABLE)
        .locator(SELECT_SAMPLES_BUTTON)
        .click();
}

async function hasFilterClass(
    page: Page,
    queuedFilterInHeader: Locator,
    toInclude: string
) {
    return await queuedFilterInHeader.evaluate(
        (el: HTMLElement, args: { toInclude: string; PILL_TAG: string }) => {
            return el
                .parentElement!.closest(args.PILL_TAG)!
                .getAttribute('class')!
                .includes(args.toInclude);
        },
        { toInclude, PILL_TAG }
    );
}

async function deleteFilter(page: Page, queuedFilterInHeader: Locator) {
    await queuedFilterInHeader.evaluate(
        (
            el: HTMLElement,
            args: { PILL_TAG: string; DELETE_PILL_TAG: string }
        ) => {
            (el
                .parentElement!.closest(args.PILL_TAG)!
                .querySelector(args.DELETE_PILL_TAG)! as HTMLElement).click();
        },
        { PILL_TAG, DELETE_PILL_TAG }
    );
}

test.describe.serial('Toggling of study view filters autosubmit', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('autocommits filters by default', async () => {
        await goToUrlAndSetLocalStorage(page, studyViewUrl, true);

        await selectMutationProfile(page, 0);
        await selectSamples(page);

        const filterInHeader = page
            .locator(STUDY_VIEW_HEADER)
            .locator(PUTATIVE_PROFILE);
        await expect(filterInHeader).toBeVisible();
        const isFilterQueued = await hasFilterClass(
            page,
            filterInHeader,
            'pending'
        );
        expect(isFilterQueued).toBe(false);
    });

    test('can disable filter submission in settings menu', async () => {
        await expect(page.locator(SETTINGS_MENU_BUTTON)).toBeVisible({
            timeout: 20000,
        });
        await page.locator(SETTINGS_MENU_BUTTON).click();
        await expect(page.locator(DISABLE_AUTOCOMMIT_FIELD)).toBeVisible({
            timeout: 20000,
        });
        await page.locator(DISABLE_AUTOCOMMIT_FIELD).click();
    });

    test('queues new filters when autosubmit disabled', async () => {
        await expect(page.locator(SUBMIT_STUDY_FILTERS)).toHaveCount(0);

        await selectMutationProfile(page, 1);

        await queueFilter(page);

        await expect(page.locator(SUBMIT_STUDY_FILTERS)).toBeVisible();

        const queuedFilterInHeader = page
            .locator(STUDY_VIEW_HEADER)
            .locator(LOG2_PROFILE);
        await expect(queuedFilterInHeader).toBeVisible();
        const isFilterQueued = await hasFilterClass(
            page,
            queuedFilterInHeader,
            'pending'
        );
        expect(isFilterQueued).toBe(true);
    });

    test('queues deleted filters when autosubmit disabled', async () => {
        const submittedFilterInHeader = page
            .locator(STUDY_VIEW_HEADER)
            .locator(PUTATIVE_PROFILE);
        await expect(submittedFilterInHeader).toBeVisible();

        await deleteFilter(page, submittedFilterInHeader);

        await expect(submittedFilterInHeader).toBeVisible();
        const isFilterQueued = await hasFilterClass(
            page,
            submittedFilterInHeader,
            'pending'
        );
        expect(isFilterQueued).toBe(true);
        const isFilterDeleted = await hasFilterClass(
            page,
            submittedFilterInHeader,
            'pendingDelete'
        );
        expect(isFilterDeleted).toBe(true);
    });

    test('submits queued and deleted filters when manually submitting', async () => {
        const queuedDeletedFilterInHeader = page
            .locator(STUDY_VIEW_HEADER)
            .locator(PUTATIVE_PROFILE);
        await expect(queuedDeletedFilterInHeader).toBeVisible();
        const queuedFilterInHeader = page
            .locator(STUDY_VIEW_HEADER)
            .locator(LOG2_PROFILE);
        await expect(queuedFilterInHeader).toBeVisible();

        await page.locator(SUBMIT_STUDY_FILTERS).click();

        await expect(queuedDeletedFilterInHeader).toHaveCount(0);
        await expect(queuedFilterInHeader).toBeVisible();
        const isFilterQueued = await hasFilterClass(
            page,
            queuedFilterInHeader,
            'pending'
        );
        expect(isFilterQueued).toBe(false);
    });
});
