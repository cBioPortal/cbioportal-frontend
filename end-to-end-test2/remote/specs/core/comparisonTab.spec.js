var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

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
            browser.waitForVisible(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                20000
            );
        });

        it('create group button disabled as default', function() {
            assert.equal(browser.isEnabled(SampleCreateGroupButton), false);
            assert.equal(browser.isEnabled(PatientCreateGroupButton), false);
        });

        it('select from sample venn diagram', function() {
            browser.leftClick('text[data-test="sample0VennLabel"]');
            browser.pause(100);
            assert.equal(browser.isEnabled(SampleCreateGroupButton), true);
            assert.equal(browser.isEnabled(PatientCreateGroupButton), false);
        });

        it('click sample venn diagram create group button', function() {
            browser.click(SampleCreateGroupButton);
            browser.waitForVisible('div.rc-tooltip-inner', 20000);
            browser.pause(100);
            assert.equal(
                browser.isVisible('[data-test="sampleGroupNameInputField"]'),
                true,
                'group name input exists'
            );
            assert.equal(
                browser.isEnabled('[data-test="sampleGroupNameSubmitButton"]'),
                false
            );
        });

        it('sample venn diagram: group name exists, should disable submit button', function() {
            browser.setValue(
                '[data-test="sampleGroupNameInputField"]',
                'Altered group'
            );
            browser.pause(100);
            browser.waitForVisible(
                '[data-test="sampleDuplicateGroupNameMessage"]',
                20000
            );
            assert.equal(
                browser.getText(
                    '[data-test="sampleDuplicateGroupNameMessage"]'
                ),
                'Another group already has this name.'
            );
            assert.equal(
                browser.isEnabled('[data-test="sampleGroupNameSubmitButton"]'),
                false
            );

            browser.setValue('[data-test="sampleGroupNameInputField"]', 'KRAS');
            browser.pause(100);
            browser.waitForVisible(
                '[data-test="sampleDuplicateGroupNameMessage"]',
                20000
            );
            assert.equal(
                browser.getText(
                    '[data-test="sampleDuplicateGroupNameMessage"]'
                ),
                'Another group already has this name.'
            );
            assert.equal(
                browser.isEnabled('[data-test="sampleGroupNameSubmitButton"]'),
                false
            );
        });

        it('sample venn diagram: new group name, should enable submit button', function() {
            browser.setValue(
                '[data-test="sampleGroupNameInputField"]',
                'new group'
            );
            browser.pause(100);
            assert.equal(
                browser.isEnabled('[data-test="sampleGroupNameSubmitButton"]'),
                true
            );
        });

        it('select from patient venn diagram', function() {
            // unselect sample venn diagram first
            browser.leftClick('text[data-test="sample0VennLabel"]');
            browser.leftClick('text[data-test="patient0VennLabel"]');
            browser.pause(100);
            assert.equal(browser.isEnabled(SampleCreateGroupButton), false);
            assert.equal(browser.isEnabled(PatientCreateGroupButton), true);
        });

        it('click patient venn diagram create group button', function() {
            browser.click(PatientCreateGroupButton);
            browser.waitForVisible('div.rc-tooltip-inner', 20000);
            browser.pause(100);
            assert.equal(
                browser.isVisible('[data-test="patientGroupNameInputField"]'),
                true,
                'group name input exists'
            );
            assert.equal(
                browser.isEnabled('[data-test="patientGroupNameSubmitButton"]'),
                false
            );
        });

        it('patient venn diagram: group name exists, should disable submit button', function() {
            browser.setValue(
                '[data-test="patientGroupNameInputField"]',
                'Unaltered group'
            );
            browser.pause(100);
            browser.waitForVisible(
                '[data-test="patientDuplicateGroupNameMessage"]',
                20000
            );
            assert.equal(
                browser.getText(
                    '[data-test="patientDuplicateGroupNameMessage"]'
                ),
                'Another group already has this name.'
            );
            assert.equal(
                browser.isEnabled('[data-test="patientGroupNameSubmitButton"]'),
                false
            );

            browser.setValue(
                '[data-test="patientGroupNameInputField"]',
                'BRAF'
            );
            browser.pause(100);
            browser.waitForVisible(
                '[data-test="patientDuplicateGroupNameMessage"]',
                20000
            );
            assert.equal(
                browser.getText(
                    '[data-test="patientDuplicateGroupNameMessage"]'
                ),
                'Another group already has this name.'
            );
            assert.equal(
                browser.isEnabled('[data-test="patientGroupNameSubmitButton"]'),
                false
            );
        });

        it('patient venn diagram: new group name, should enable submit button', function() {
            browser.setValue(
                '[data-test="patientGroupNameInputField"]',
                'new group'
            );
            browser.pause(100);
            assert.equal(
                browser.isEnabled('[data-test="patientGroupNameSubmitButton"]'),
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
            browser.waitForVisible(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                20000
            );
        });

        it('create group button disabled as default', function() {
            assert.equal(browser.isEnabled(SampleCreateGroupButton), false);
            assert.equal(browser.isEnabled(PatientCreateGroupButton), false);
        });

        it('select from sample upset diagram', function() {
            browser.leftClick('.sample_Altered_group_KRAS_bar');
            browser.pause(100);
            assert.equal(browser.isEnabled(SampleCreateGroupButton), true);
            assert.equal(browser.isEnabled(PatientCreateGroupButton), false);
        });

        it('click sample upset diagram create group button', function() {
            browser.click(SampleCreateGroupButton);
            browser.waitForVisible('div.rc-tooltip-inner', 20000);
            browser.pause(100);
            assert.equal(
                browser.isVisible('[data-test="sampleGroupNameInputField"]'),
                true,
                'group name input exists'
            );
            assert.equal(
                browser.isEnabled('[data-test="sampleGroupNameSubmitButton"]'),
                false
            );
        });

        it('sample upset diagram: group name exists, should disable submit button', function() {
            browser.setValue(
                '[data-test="sampleGroupNameInputField"]',
                'Altered group'
            );
            browser.pause(100);
            browser.waitForVisible(
                '[data-test="sampleDuplicateGroupNameMessage"]',
                20000
            );
            assert.equal(
                browser.getText(
                    '[data-test="sampleDuplicateGroupNameMessage"]'
                ),
                'Another group already has this name.'
            );
            assert.equal(
                browser.isEnabled('[data-test="sampleGroupNameSubmitButton"]'),
                false
            );
        });

        it('sample upset diagram: new group name, should enable submit button', function() {
            browser.setValue(
                '[data-test="sampleGroupNameInputField"]',
                'new group'
            );
            browser.pause(100);
            assert.equal(
                browser.isEnabled('[data-test="sampleGroupNameSubmitButton"]'),
                true
            );
        });

        it('select from patient upset diagram', function() {
            // unselect sample venn diagram first
            browser.leftClick('.sample_Altered_group_KRAS_bar');
            browser.leftClick('.patient_Unaltered_group_bar');
            browser.pause(100);
            assert.equal(browser.isEnabled(SampleCreateGroupButton), false);
            assert.equal(browser.isEnabled(PatientCreateGroupButton), true);
        });

        it('click patient upset diagram create group button', function() {
            browser.click(PatientCreateGroupButton);
            browser.waitForVisible('div.rc-tooltip-inner', 20000);
            browser.pause(100);
            assert.equal(
                browser.isVisible('[data-test="patientGroupNameInputField"]'),
                true,
                'group name input exists'
            );
            assert.equal(
                browser.isEnabled('[data-test="patientGroupNameSubmitButton"]'),
                false
            );
        });

        it('patient upset diagram: group name exists, should disable submit button', function() {
            browser.setValue(
                '[data-test="patientGroupNameInputField"]',
                'BRAF'
            );
            browser.pause(100);
            browser.waitForVisible(
                '[data-test="patientDuplicateGroupNameMessage"]',
                20000
            );
            assert.equal(
                browser.getText(
                    '[data-test="patientDuplicateGroupNameMessage"]'
                ),
                'Another group already has this name.'
            );
            assert.equal(
                browser.isEnabled('[data-test="patientGroupNameSubmitButton"]'),
                false
            );
        });

        it('patient upset diagram: new group name, should enable submit button', function() {
            browser.setValue(
                '[data-test="patientGroupNameInputField"]',
                'new group'
            );
            browser.pause(100);
            assert.equal(
                browser.isEnabled('[data-test="patientGroupNameSubmitButton"]'),
                true
            );
        });
    });
});
