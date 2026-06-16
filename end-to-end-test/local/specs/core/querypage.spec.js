const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    getElement,
    getNestedElement,
    clickElement,
    isDisplayed,
    isSelected,
    setInputText,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('study select page', function() {
    describe.skip('error messaging for invalid study id(s)', function() {
        // FIXME: on authenticated portals the alert does not show because the backend throws 403 because
        // the user does not have permission to access a non-existing study.
        // Possibly, run localdb against an unauthenticated portal or as a remote tests against public cbioportal
        it('show error alert and query form for single invalid study id', async function() {
            const url = `${CBIOPORTAL_URL}/results/oncoprint?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`;
            await goToUrlAndSetLocalStorage(url, true);
            await getElement('[data-test="StudySelect"]', {
                waitForExist: true,
            });
            assert(
                await getNestedElement([
                    '[data-test="unkown-study-warning"]',
                    'li=coadread_tcga_pubb',
                ])
            );
        });

        // FIXME: on authenticated portals the alert does not show because the backend throws 403 because
        // the user does not have permission to access a non-existing study.
        // Possibly, run localdb against an unauthenticated portal or as a remote tests against public cbioportal
        it('show error alert and query form for two studies, one invalid', async function() {
            const url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=acc_tcgaa%2Cstudy_es_0&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize`;
            await goToUrlAndSetLocalStorage(url, true);
            await getElement('[data-test="StudySelect"]', {
                waitForExist: true,
            });
            assert(
                await (
                    await getNestedElement([
                        '[data-test="unkown-study-warning"]',
                        'li=acc_tcgaa',
                    ])
                ).isExisting()
            );
            assert(
                !(await (
                    await getNestedElement([
                        '[data-test="unkown-study-warning"]',
                        'li=study_es_0',
                    ])
                ).isExisting())
            );
        });
    });

    describe('study search box', () => {
        const searchTextInput = '[data-test=study-search-input]';
        const searchControlsMenu =
            '[data-test=study-search-controls-container]';
        const referenceGenomeFormSection = '//h3[text()="Reference genome"]';
        const hg38StudyEntry = '//span[text()="Study HG38"]';
        const hg38Checkbox = '#input-hg38';

        before(async () => {
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            await getElement('[data-test=cancerTypeListContainer]', {
                waitForExist: true,
            });
            // NOTE Somehow, we need to reload to load the  external frontend.
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            await getElement('[data-test=cancerTypeListContainer]', {
                waitForExist: true,
            });
        });

        it('shows menu when focussing the text input', async () => {
            assert(!(await isDisplayed(searchControlsMenu)));
            await clickElement(searchTextInput);
            assert(await isDisplayed(searchControlsMenu));
        });

        describe('reference genome', () => {
            it('shows reference genome form elements when studies on different reference genomes are present', async () => {
                assert(await isDisplayed(searchControlsMenu));
                assert(await isDisplayed(referenceGenomeFormSection));
            });
            it('fills text input with search shorthand and filters studies when filtering studies via reference genome form element', async () => {
                assert(await isDisplayed(referenceGenomeFormSection));
                assert(await isDisplayed(hg38StudyEntry));
                await clickElement(hg38Checkbox);
                const textInSearchTextInput = await (
                    await getElement(searchTextInput)
                ).getValue();
                assert.equal(textInSearchTextInput, 'reference-genome:hg19');
                assert(!(await isDisplayed(hg38StudyEntry)));
            });
            it('updates reference genome form elements and study filter when entering search shorthand in text input', async () => {
                await clickElement('.input-group-btn');
                await getElement(referenceGenomeFormSection, {
                    waitForExist: true,
                });
                assert(await isDisplayed(referenceGenomeFormSection));
                assert(!(await isDisplayed(hg38StudyEntry)));
                assert(!(await isSelected(hg38Checkbox)));
                await setInputText(searchTextInput, 'Study'); // empty string does not trigger refresh
                await getElement(hg38StudyEntry, {
                    waitForExist: true,
                });
                assert(await isSelected(hg38Checkbox));
            });
        });
    });

    describe('data type filter', () => {
        const dataTypeFilterBtn =
            '[data-test=dropdown-data-type-filter] button';
        const dataTypeDropdown = '[data-test=dropdown-data-type-filter]';
        const dropdownMenu = `${dataTypeDropdown} .dropdown-menu`;
        const filterBadge = `${dataTypeDropdown} .oncoprintDropdownCount`;

        before(async () => {
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            await getElement('[data-test=cancerTypeListContainer]', {
                waitForExist: true,
            });
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            await getElement('[data-test=cancerTypeListContainer]', {
                waitForExist: true,
            });
            // Wait for resource definitions to load so the button appears
            await getElement(dataTypeFilterBtn, { waitForExist: true });
        });

        it('opens the dropdown when the button is clicked', async () => {
            assert(!(await isDisplayed(dropdownMenu)));
            await clickElement(dataTypeFilterBtn);
            assert(await isDisplayed(dropdownMenu));
        });

        it('shows Mutations checkbox in the dropdown', async () => {
            const mutationsLabel = await getNestedElement([
                dataTypeDropdown,
                '//label[contains(., "Mutations")]',
            ]);
            assert(await mutationsLabel.isDisplayed());
        });

        it('filters studies and shows badge when a data type is selected', async () => {
            assert(!(await isDisplayed(filterBadge)));
            await clickElement(
                `${dataTypeDropdown} //label[contains(., "Mutations")]//input[@type="checkbox"]`
            );
            assert(await isDisplayed(filterBadge));
            const badgeText = await (await getElement(filterBadge)).getText();
            assert(/\d+\s*\/\s*\d+/.test(badgeText));
        });

        it('clears filter and hides badge when data type is unchecked', async () => {
            // Dropdown stays open after checkbox click
            assert(await isDisplayed(dropdownMenu));
            await clickElement(
                `${dataTypeDropdown} //label[contains(., "Mutations")]//input[@type="checkbox"]`
            );
            assert(!(await isDisplayed(filterBadge)));
        });

        it('narrows study list to 3 entries when CNA filter is selected', async () => {
            await clickElement(dataTypeFilterBtn);
            assert(await isDisplayed(dropdownMenu));
            await clickElement(
                `${dataTypeDropdown} //label[contains(., "CNA")]//input[@type="checkbox"]`
            );
            // Close the dropdown
            await clickElement(dataTypeFilterBtn);
            await getElement('[data-test=StudySelect]', { waitForExist: true });
            const studyItems = await browser.$$('[data-test=StudySelect]');
            assert.equal(studyItems.length, 3);
            // Clean up
            await clickElement(dataTypeFilterBtn);
            await clickElement(
                `${dataTypeDropdown} //label[contains(., "CNA")]//input[@type="checkbox"]`
            );
            await clickElement(dataTypeFilterBtn);
        });

        it('closes the dropdown when clicking outside', async () => {
            await clickElement(dataTypeFilterBtn);
            assert(await isDisplayed(dropdownMenu));
            await clickElement('[data-test=cancerTypeListContainer]');
            assert(!(await isDisplayed(dropdownMenu)));
        });
    });
});
