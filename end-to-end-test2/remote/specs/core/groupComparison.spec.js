var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const SampleCreateGroupButton =
    'button[data-test="sampleGroupComparisonCreateGroupButton"]';
const PatientCreateGroupButton =
    'button[data-test="patientGroupComparisonCreateGroupButton"]';

describe('group comparison venn diagram tests', function() {
    describe('create new group tests', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/overlap?sessionId=5cf6bcf0e4b0ab413787430c`
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
            browser.leftClick('rect[data-test="sample0,1VennRegion"]');
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
                'GARS mutant'
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
            browser.leftClick('rect[data-test="sample0,1VennRegion"]');
            browser.leftClick('rect[data-test="patient0VennRegion"]');
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
                'GARS mutant'
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

describe('group comparison upset diagram tests', function() {
    describe('create new group tests', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison?sessionId=5d0bc0c5e4b0ab4137876bc3`
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
            browser.leftClick('.sample_testGroup2_testGroup3_bar');
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
                'testGroup5'
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
            browser.leftClick('path.sample_testGroup2_testGroup3_bar');
            browser.leftClick('path.patient_testGroup3_testGroup4_bar');
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
                'testGroup3'
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
