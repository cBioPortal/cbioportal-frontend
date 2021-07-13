var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var { jsApiClick } = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const SampleCreateGroupButton =
    'button[data-test="sampleGroupComparisonCreateGroupButton"]';
const PatientCreateGroupButton =
    'button[data-test="patientGroupComparisonCreateGroupButton"]';

describe('results view comparison tab venn diagram tests', function() {
    describe('create new group tests', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForExist({
                timeout: 20000,
            });
        });

        it('create group button disabled as default', function() {
            assert.equal($(SampleCreateGroupButton).isEnabled(), false);
            assert.equal($(PatientCreateGroupButton).isEnabled(), false);
        });

        it('select from sample venn diagram', function() {
            jsApiClick('rect[data-test="sample0VennRegion"]');
            browser.pause(100);
            assert.equal($(SampleCreateGroupButton).isEnabled(), true);
            assert.equal($(PatientCreateGroupButton).isEnabled(), false);
        });

        it('click sample venn diagram create group button', function() {
            $(SampleCreateGroupButton).click();
            $('div.rc-tooltip-inner').waitForExist({ timeout: 20000 });
            browser.pause(100);
            assert.equal(
                $('[data-test="sampleGroupNameInputField"]').isDisplayed(),
                true,
                'group name input exists'
            );
            assert.equal(
                $('[data-test="sampleGroupNameSubmitButton"]').isEnabled(),
                false
            );
        });

        it('sample venn diagram: group name exists, should disable submit button', function() {
            $('[data-test="sampleGroupNameInputField"]').setValue(
                'Altered group'
            );
            browser.pause(100);
            $('[data-test="sampleDuplicateGroupNameMessage"]').waitForExist({
                timeout: 20000,
            });
            assert.equal(
                $('[data-test="sampleDuplicateGroupNameMessage"]').getText(),
                'Another group already has this name.'
            );
            assert.equal(
                $('[data-test="sampleGroupNameSubmitButton"]').isEnabled(),
                false
            );

            $('[data-test="sampleGroupNameInputField"]').setValue('KRAS');
            browser.pause(100);
            $('[data-test="sampleDuplicateGroupNameMessage"]').waitForExist({
                timeout: 20000,
            });
            assert.equal(
                $('[data-test="sampleDuplicateGroupNameMessage"]').getText(),
                'Another group already has this name.'
            );
            assert.equal(
                $('[data-test="sampleGroupNameSubmitButton"]').isEnabled(),
                false
            );
        });

        it('sample venn diagram: new group name, should enable submit button', function() {
            $('[data-test="sampleGroupNameInputField"]').setValue('new group');
            browser.pause(100);
            assert.equal(
                $('[data-test="sampleGroupNameSubmitButton"]').isEnabled(),
                true
            );
        });

        it('select from patient venn diagram', function() {
            // unselect sample venn diagram first
            jsApiClick('rect[data-test="sample0VennRegion"]');
            jsApiClick('rect[data-test="patient0VennRegion"]');
            browser.pause(100);
            assert.equal($(SampleCreateGroupButton).isEnabled(), false);
            assert.equal($(PatientCreateGroupButton).isEnabled(), true);
        });

        it('click patient venn diagram create group button', function() {
            $(PatientCreateGroupButton).click();
            $('div.rc-tooltip-inner').waitForExist({ timeout: 20000 });
            browser.pause(100);
            assert.equal(
                $('[data-test="patientGroupNameInputField"]').isDisplayed(),
                true,
                'group name input exists'
            );
            assert.equal(
                $('[data-test="patientGroupNameSubmitButton"]').isEnabled(),
                false
            );
        });

        it('patient venn diagram: group name exists, should disable submit button', function() {
            $('[data-test="patientGroupNameInputField"]').setValue(
                'Unaltered group'
            );
            browser.pause(100);
            $('[data-test="patientDuplicateGroupNameMessage"]').waitForExist({
                timeout: 20000,
            });
            assert.equal(
                $('[data-test="patientDuplicateGroupNameMessage"]').getText(),
                'Another group already has this name.'
            );
            assert.equal(
                $('[data-test="patientGroupNameSubmitButton"]').isEnabled(),
                false
            );

            $('[data-test="patientGroupNameInputField"]').setValue('BRAF');
            browser.pause(100);
            $('[data-test="patientDuplicateGroupNameMessage"]').waitForExist({
                timeout: 20000,
            });
            assert.equal(
                $('[data-test="patientDuplicateGroupNameMessage"]').getText(),
                'Another group already has this name.'
            );
            assert.equal(
                $('[data-test="patientGroupNameSubmitButton"]').isEnabled(),
                false
            );
        });

        it('patient venn diagram: new group name, should enable submit button', function() {
            $('[data-test="patientGroupNameInputField"]').setValue('new group');
            browser.pause(100);
            assert.equal(
                $('[data-test="patientGroupNameSubmitButton"]').isEnabled(),
                true
            );
        });
    });
});

describe('results view comparison tab upset diagram tests', function() {
    describe('create new group tests', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B%22Altered%20group%22%2C%22Unaltered%20group%22%2C%22KRAS%22%2C%22NRAS%22%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForExist({
                timeout: 20000,
            });
        });

        it('create group button disabled as default', function() {
            assert.equal($(SampleCreateGroupButton).isEnabled(), false);
            assert.equal($(PatientCreateGroupButton).isEnabled(), false);
        });

        it('select from sample upset diagram', function() {
            jsApiClick('.sample_Altered_group_KRAS_bar');
            browser.pause(100);
            assert.equal($(SampleCreateGroupButton).isEnabled(), true);
            assert.equal($(PatientCreateGroupButton).isEnabled(), false);
        });

        it('click sample upset diagram create group button', function() {
            $(SampleCreateGroupButton).click();
            $('div.rc-tooltip-inner').waitForExist({ timeout: 20000 });
            browser.pause(100);
            assert.equal(
                $('[data-test="sampleGroupNameInputField"]').isDisplayed(),
                true,
                'group name input exists'
            );
            assert.equal(
                $('[data-test="sampleGroupNameSubmitButton"]').isEnabled(),
                false
            );
        });

        it('sample upset diagram: group name exists, should disable submit button', function() {
            $('[data-test="sampleGroupNameInputField"]').setValue(
                'Altered group'
            );
            browser.pause(100);
            $('[data-test="sampleDuplicateGroupNameMessage"]').waitForExist({
                timeout: 20000,
            });
            assert.equal(
                $('[data-test="sampleDuplicateGroupNameMessage"]').getText(),
                'Another group already has this name.'
            );
            assert.equal(
                $('[data-test="sampleGroupNameSubmitButton"]').isEnabled(),
                false
            );
        });

        it('sample upset diagram: new group name, should enable submit button', function() {
            $('[data-test="sampleGroupNameInputField"]').setValue('new group');
            browser.pause(100);
            assert.equal(
                $('[data-test="sampleGroupNameSubmitButton"]').isEnabled(),
                true
            );
        });

        it('select from patient upset diagram', function() {
            // unselect sample venn diagram first
            jsApiClick('.sample_Altered_group_KRAS_bar');
            jsApiClick('.patient_Unaltered_group_bar');
            browser.pause(100);
            assert.equal($(SampleCreateGroupButton).isEnabled(), false);
            assert.equal($(PatientCreateGroupButton).isEnabled(), true);
        });

        it('click patient upset diagram create group button', function() {
            $(PatientCreateGroupButton).click();
            $('div.rc-tooltip-inner').waitForExist({ timeout: 20000 });
            browser.pause(100);
            assert.equal(
                $('[data-test="patientGroupNameInputField"]').isDisplayed(),
                true,
                'group name input exists'
            );
            assert.equal(
                $('[data-test="patientGroupNameSubmitButton"]').isEnabled(),
                false
            );
        });

        it('patient upset diagram: group name exists, should disable submit button', function() {
            $('[data-test="patientGroupNameInputField"]').setValue('BRAF');
            browser.pause(100);
            $('[data-test="patientDuplicateGroupNameMessage"]').waitForExist({
                timeout: 20000,
            });
            assert.equal(
                $('[data-test="patientDuplicateGroupNameMessage"]').getText(),
                'Another group already has this name.'
            );
            assert.equal(
                $('[data-test="patientGroupNameSubmitButton"]').isEnabled(),
                false
            );
        });

        it('patient upset diagram: new group name, should enable submit button', function() {
            $('[data-test="patientGroupNameInputField"]').setValue('new group');
            browser.pause(100);
            assert.equal(
                $('[data-test="patientGroupNameSubmitButton"]').isEnabled(),
                true
            );
        });
    });
});
