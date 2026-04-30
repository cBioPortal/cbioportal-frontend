import { test, expect, Page } from '../fixtures';
import {
    byTestHandle,
    setInputText,
    waitForGroupComparisonTabOpen,
} from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/groupComparison.spec.js.
 *
 * Drives the Overlap tab "Create Group" flow across two session types:
 *  - Venn diagram session (≤3 groups): click a venn region, create-group.
 *  - UpSet diagram session (>3 groups): click a bar, create-group.
 *
 * Each flow asserts:
 *  - Sample/Patient create buttons start disabled.
 *  - Selecting enables the matching button but not the other.
 *  - Duplicate group names trigger the error + keep submit disabled.
 *  - A fresh name enables submit.
 *
 * wdio used `jsApiClick` to dispatch synthetic click events — the venn
 * regions are SVG <rect>s that ignore ordinary click handlers. Playwright
 * gets the same effect via `dispatchEvent('click')`.
 */

const SampleCreateGroupButton =
    'button[data-test="sampleGroupComparisonCreateGroupButton"]';
const PatientCreateGroupButton =
    'button[data-test="patientGroupComparisonCreateGroupButton"]';

const VENN_URL = '/comparison/overlap?sessionId=5cf6bcf0e4b0ab413787430c';
const UPSET_URL = '/comparison?sessionId=5d0bc0c5e4b0ab4137876bc3';

async function dispatchSvgClick(page: Page, selector: string) {
    await page.locator(selector).dispatchEvent('click');
    await page.waitForTimeout(100);
}

test.describe.serial('group comparison venn diagram create-group', () => {
    test.describe.configure({ retries: 0 });
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(VENN_URL);
        await waitForGroupComparisonTabOpen(page, 20000);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('both create-group buttons start disabled', async () => {
        await expect(page.locator(SampleCreateGroupButton)).toBeDisabled();
        await expect(page.locator(PatientCreateGroupButton)).toBeDisabled();
    });

    test('selecting a sample region enables sample button only', async () => {
        await dispatchSvgClick(page, 'rect[data-test="sample0,1VennRegion"]');
        await expect(page.locator(SampleCreateGroupButton)).toBeEnabled();
        await expect(page.locator(PatientCreateGroupButton)).toBeDisabled();
    });

    test('sample create-group opens the name input', async () => {
        await page.locator(SampleCreateGroupButton).click();
        await expect(page.locator('div.rc-tooltip-inner')).toBeVisible({
            timeout: 20000,
        });
        await expect(
            byTestHandle(page, 'sampleGroupNameInputField')
        ).toBeVisible();
        await expect(
            byTestHandle(page, 'sampleGroupNameSubmitButton')
        ).toBeDisabled();
    });

    test('sample: duplicate name disables submit', async () => {
        await setInputText(
            page,
            '[data-test="sampleGroupNameInputField"]',
            'GARS mutant'
        );
        await expect(
            byTestHandle(page, 'sampleDuplicateGroupNameMessage')
        ).toHaveText('Another group already has this name.', {
            timeout: 20000,
        });
        await expect(
            byTestHandle(page, 'sampleGroupNameSubmitButton')
        ).toBeDisabled();
    });

    test('sample: fresh name enables submit', async () => {
        await setInputText(
            page,
            '[data-test="sampleGroupNameInputField"]',
            'new group'
        );
        await expect(
            byTestHandle(page, 'sampleGroupNameSubmitButton')
        ).toBeEnabled();
    });

    test('switching to patient venn region toggles the buttons', async () => {
        // Unselect sample first, then pick a patient region.
        await dispatchSvgClick(page, 'rect[data-test="sample0,1VennRegion"]');
        await dispatchSvgClick(page, 'rect[data-test="patient0VennRegion"]');
        await expect(page.locator(SampleCreateGroupButton)).toBeDisabled();
        await expect(page.locator(PatientCreateGroupButton)).toBeEnabled();
    });

    test('patient create-group opens the name input', async () => {
        await page.locator(PatientCreateGroupButton).click();
        // The sample tooltip from the previous test may still linger in
        // the DOM; match the last one to scope to the patient dialog.
        await expect(page.locator('div.rc-tooltip-inner').last()).toBeVisible({
            timeout: 20000,
        });
        await expect(
            byTestHandle(page, 'patientGroupNameInputField')
        ).toBeVisible();
        await expect(
            byTestHandle(page, 'patientGroupNameSubmitButton')
        ).toBeDisabled();
    });

    test('patient: duplicate name disables submit', async () => {
        await setInputText(
            page,
            '[data-test="patientGroupNameInputField"]',
            'GARS mutant'
        );
        await expect(
            byTestHandle(page, 'patientDuplicateGroupNameMessage')
        ).toHaveText('Another group already has this name.', {
            timeout: 20000,
        });
        await expect(
            byTestHandle(page, 'patientGroupNameSubmitButton')
        ).toBeDisabled();
    });

    test('patient: fresh name enables submit', async () => {
        await setInputText(
            page,
            '[data-test="patientGroupNameInputField"]',
            'new group'
        );
        await expect(
            byTestHandle(page, 'patientGroupNameSubmitButton')
        ).toBeEnabled();
    });
});

test.describe.serial('group comparison upset diagram create-group', () => {
    test.describe.configure({ retries: 0 });
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(UPSET_URL);
        await waitForGroupComparisonTabOpen(page, 20000);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('both create-group buttons start disabled', async () => {
        await expect(page.locator(SampleCreateGroupButton)).toBeDisabled();
        await expect(page.locator(PatientCreateGroupButton)).toBeDisabled();
    });

    test('selecting a sample bar enables sample button', async () => {
        await dispatchSvgClick(page, '.sample_testGroup2_testGroup3_bar');
        await expect(page.locator(SampleCreateGroupButton)).toBeEnabled();
        await expect(page.locator(PatientCreateGroupButton)).toBeDisabled();
    });

    test('sample create-group opens the name input', async () => {
        await page.locator(SampleCreateGroupButton).click();
        await expect(page.locator('div.rc-tooltip-inner')).toBeVisible({
            timeout: 20000,
        });
        await expect(
            byTestHandle(page, 'sampleGroupNameInputField')
        ).toBeVisible();
        await expect(
            byTestHandle(page, 'sampleGroupNameSubmitButton')
        ).toBeDisabled();
    });

    test('sample: duplicate name disables submit', async () => {
        await setInputText(
            page,
            '[data-test="sampleGroupNameInputField"]',
            'testGroup5'
        );
        await expect(
            byTestHandle(page, 'sampleDuplicateGroupNameMessage')
        ).toHaveText('Another group already has this name.', {
            timeout: 20000,
        });
        await expect(
            byTestHandle(page, 'sampleGroupNameSubmitButton')
        ).toBeDisabled();
    });

    test('sample: fresh name enables submit', async () => {
        await setInputText(
            page,
            '[data-test="sampleGroupNameInputField"]',
            'new group'
        );
        await expect(
            byTestHandle(page, 'sampleGroupNameSubmitButton')
        ).toBeEnabled();
    });

    test('switching to patient bar toggles the buttons', async () => {
        // Unselect sample, select a patient bar. These are regular
        // <path> elements, so a real click works (no dispatchEvent).
        await page.locator('path.sample_testGroup2_testGroup3_bar').click();
        await page.locator('path.patient_testGroup3_testGroup4_bar').click();
        await expect(page.locator(SampleCreateGroupButton)).toBeDisabled();
        await expect(page.locator(PatientCreateGroupButton)).toBeEnabled();
    });

    test('patient create-group opens the name input', async () => {
        await page.locator(PatientCreateGroupButton).click();
        // The sample tooltip from the previous test may still linger in
        // the DOM; match the last one to scope to the patient dialog.
        await expect(page.locator('div.rc-tooltip-inner').last()).toBeVisible({
            timeout: 20000,
        });
        await expect(
            byTestHandle(page, 'patientGroupNameInputField')
        ).toBeVisible();
        await expect(
            byTestHandle(page, 'patientGroupNameSubmitButton')
        ).toBeDisabled();
    });

    test('patient: duplicate name disables submit', async () => {
        await setInputText(
            page,
            '[data-test="patientGroupNameInputField"]',
            'testGroup3'
        );
        await expect(
            byTestHandle(page, 'patientDuplicateGroupNameMessage')
        ).toHaveText('Another group already has this name.', {
            timeout: 20000,
        });
        await expect(
            byTestHandle(page, 'patientGroupNameSubmitButton')
        ).toBeDisabled();
    });

    test('patient: fresh name enables submit', async () => {
        await setInputText(
            page,
            '[data-test="patientGroupNameInputField"]',
            'new group'
        );
        await expect(
            byTestHandle(page, 'patientGroupNameSubmitButton')
        ).toBeEnabled();
    });
});
