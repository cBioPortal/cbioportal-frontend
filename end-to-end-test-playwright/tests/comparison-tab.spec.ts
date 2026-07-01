import { test, expect, Page } from '../fixtures';
import { byTestHandle, setInputText } from './helpers/common';
import {
    dispatchSvgClick,
    openWideGroupComparisonPage,
    PATIENT_CREATE_GROUP_BUTTON,
    SAMPLE_CREATE_GROUP_BUTTON,
} from './helpers/group-comparison';

/**
 * Port of end-to-end-test/remote/specs/core/comparisonTab.spec.js.
 *
 * Same create-group UX as group-comparison.spec.ts but driven from
 * the results-view comparison tab rather than a standalone
 * /comparison session. The URLs query coadread_tcga_pub so the groups
 * are KRAS/NRAS/BRAF/Altered/Unaltered rather than the testGroupN
 * fixtures used in the standalone session.
 */

const VENN_URL =
    '/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub' +
    '&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut' +
    '&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations';

// Same URL + comparison_selectedGroups pre-selecting four groups so the
// overlap view renders as an UpSet plot instead of a Venn diagram.
const UPSET_URL =
    '/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub' +
    '&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut' +
    '&comparison_selectedGroups=%5B%22Altered%20group%22%2C%22Unaltered%20group%22%2C%22KRAS%22%2C%22NRAS%22%5D' +
    '&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations';

test.describe.serial('results view comparison tab venn diagram', () => {
    test.describe.configure({ retries: 0 });
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await openWideGroupComparisonPage(browser, VENN_URL);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('both create-group buttons start disabled', async () => {
        await expect(page.locator(SAMPLE_CREATE_GROUP_BUTTON)).toBeDisabled();
        await expect(page.locator(PATIENT_CREATE_GROUP_BUTTON)).toBeDisabled();
    });

    test('selecting a sample venn region enables sample button', async () => {
        await dispatchSvgClick(page, 'rect[data-test="sample0VennRegion"]');
        await expect(page.locator(SAMPLE_CREATE_GROUP_BUTTON)).toBeEnabled();
        await expect(page.locator(PATIENT_CREATE_GROUP_BUTTON)).toBeDisabled();
    });

    test('sample create-group opens the name input', async () => {
        await page.locator(SAMPLE_CREATE_GROUP_BUTTON).click();
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

    test('sample: duplicate names ("Altered group", "KRAS") disable submit', async () => {
        await setInputText(
            page,
            '[data-test="sampleGroupNameInputField"]',
            'Altered group'
        );
        await expect(
            byTestHandle(page, 'sampleDuplicateGroupNameMessage')
        ).toHaveText('Another group already has this name.', {
            timeout: 20000,
        });
        await expect(
            byTestHandle(page, 'sampleGroupNameSubmitButton')
        ).toBeDisabled();

        await setInputText(
            page,
            '[data-test="sampleGroupNameInputField"]',
            'KRAS'
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
        await dispatchSvgClick(page, 'rect[data-test="sample0VennRegion"]');
        await dispatchSvgClick(page, 'rect[data-test="patient0VennRegion"]');
        await expect(page.locator(SAMPLE_CREATE_GROUP_BUTTON)).toBeDisabled();
        await expect(page.locator(PATIENT_CREATE_GROUP_BUTTON)).toBeEnabled();
    });

    test('patient create-group opens the name input', async () => {
        await page.locator(PATIENT_CREATE_GROUP_BUTTON).click();
        // Prior sample tooltip may linger; scope to the last tooltip.
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

    test('patient: duplicate names ("Unaltered group", "BRAF") disable submit', async () => {
        await setInputText(
            page,
            '[data-test="patientGroupNameInputField"]',
            'Unaltered group'
        );
        await expect(
            byTestHandle(page, 'patientDuplicateGroupNameMessage')
        ).toHaveText('Another group already has this name.', {
            timeout: 20000,
        });
        await expect(
            byTestHandle(page, 'patientGroupNameSubmitButton')
        ).toBeDisabled();

        await setInputText(
            page,
            '[data-test="patientGroupNameInputField"]',
            'BRAF'
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

test.describe.serial('results view comparison tab upset diagram', () => {
    test.describe.configure({ retries: 0 });
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await openWideGroupComparisonPage(browser, UPSET_URL);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('both create-group buttons start disabled', async () => {
        await expect(page.locator(SAMPLE_CREATE_GROUP_BUTTON)).toBeDisabled();
        await expect(page.locator(PATIENT_CREATE_GROUP_BUTTON)).toBeDisabled();
    });

    test('selecting a sample bar enables sample button', async () => {
        await dispatchSvgClick(page, '.sample_Altered_group_KRAS_bar');
        await expect(page.locator(SAMPLE_CREATE_GROUP_BUTTON)).toBeEnabled();
        await expect(page.locator(PATIENT_CREATE_GROUP_BUTTON)).toBeDisabled();
    });

    test('sample create-group opens the name input', async () => {
        await page.locator(SAMPLE_CREATE_GROUP_BUTTON).click();
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
            'Altered group'
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
        // Unselect sample, select a patient bar. Use dispatchEvent
        // because the sample-create tooltip lingers and intercepts
        // ordinary pointer events on the bar.
        await dispatchSvgClick(page, '.sample_Altered_group_KRAS_bar');
        await dispatchSvgClick(page, '.patient_Unaltered_group_bar');
        await expect(page.locator(SAMPLE_CREATE_GROUP_BUTTON)).toBeDisabled();
        await expect(page.locator(PATIENT_CREATE_GROUP_BUTTON)).toBeEnabled();
    });

    test('patient create-group opens the name input', async () => {
        await page.locator(PATIENT_CREATE_GROUP_BUTTON).click();
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
            'BRAF'
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
