var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils')
    .useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('study select page', function() {
    describe.skip('error messaging for invalid study id(s)', function() {
        // FIXME: on authenticated portals the alert does not show because the backend throws 403 because
        // the user does not have permission to access a non-existing study.
        // Possibly, run localdb against an unauthenticated portal or as a remote tests against public cbioportal
        it('show error alert and query form for single invalid study id', function() {
            var url = `${CBIOPORTAL_URL}/results/oncoprint?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`;
            goToUrlAndSetLocalStorage(url, true);
            $('[data-test="StudySelect"]').waitForExist();
            assert(
                $('[data-test="unkown-study-warning"]').$(
                    'li=coadread_tcga_pubb'
                )
            );
        });

        // FIXME: on authenticated portals the alert does not show because the backend throws 403 because
        // the user does not have permission to access a non-existing study.
        // Possibly, run localdb against an unauthenticated portal or as a remote tests against public cbioportal
        it('show error alert and query form for two studies, one invalid', function() {
            var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=acc_tcgaa%2Cstudy_es_0&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize`;
            goToUrlAndSetLocalStorage(url, true);
            $('[data-test="StudySelect"]').waitForExist();
            assert(
                $('[data-test="unkown-study-warning"]')
                    .$('li=acc_tcgaa')
                    .isExisting()
            );
            assert(
                !$('[data-test="unkown-study-warning"]')
                    .$('li=study_es_0')
                    .isExisting()
            );
        });
    });

    describe('study search box', () => {
        const searchTextInput = '[data-test=study-search-input]';
        const searchControlsMenu =
            '[data-test=study-search-controls-container]';
        const referenceGenomeFormSection = '//h5[text()="Reference genome"]';
        const hg38StudyEntry = '//span[text()="Study HG38"]';
        const placeSomeWhereOutsideSearchElement = 'a.tabAnchor_advanced';
        const hg38Checkbox = '#input-hg38';

        before(() => {
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            $('[data-test=cancerTypeListContainer]').waitForExist();
            // NOTE Somehow, we need to reload to load the  external frontend.
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            $('[data-test=cancerTypeListContainer]').waitForExist();
        });

        it('shows menu when focussing the text input', () => {
            assert(!$(searchControlsMenu).isDisplayed());
            $(searchTextInput).click();
            assert($(searchControlsMenu).isDisplayed());
        });

        it('keeps showing menu after un-focussing the text input', () => {
            assert($(searchControlsMenu).isDisplayed());
            $(placeSomeWhereOutsideSearchElement).click();
            assert($(searchControlsMenu).isDisplayed());
        });

        describe('reference genome', () => {
            it('shows reference genome form elements when studies on different reference genomes are present', () => {
                assert($(searchControlsMenu).isDisplayed());
                assert($(referenceGenomeFormSection).isDisplayed());
            });
            it('fills text input with search shorthand and filters studies when filtering studies via reference genome form element', () => {
                assert($(referenceGenomeFormSection).isDisplayed());
                assert($(hg38StudyEntry).isDisplayed());
                $(hg38Checkbox).click();
                const textInSeachTextInput = $(searchTextInput).getValue();
                assert.equal(textInSeachTextInput, 'reference-genome:hg19');
                assert(!$(hg38StudyEntry).isDisplayed());
            });
            it('updates reference genome form elements and study filter when entering search shorthand in text input', () => {
                $(searchTextInput).click();
                $(referenceGenomeFormSection).waitForExist();
                assert($(referenceGenomeFormSection).isDisplayed());
                assert(!$(hg38StudyEntry).isDisplayed());
                assert(!$(hg38Checkbox).isSelected());
                $(searchTextInput).setValue('Study'); // empty string does not trigger refresh
                $(hg38StudyEntry).waitForExist();
                assert($(hg38Checkbox).isSelected());
            });
        });
    });
});
