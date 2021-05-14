var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var { jsApiClick } = require('../../../shared/specUtils');

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
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForExist({
                timeout: 20000,
            });
        });

        it('create group button disabled as default', function() {
            assert.equal($(SampleCreateGroupButton).isEnabled(), false);
            assert.equal($(PatientCreateGroupButton).isEnabled(), false);
        });

        it('select from sample venn diagram', function() {
            jsApiClick('rect[data-test="sample0,1VennRegion"]');
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
                'GARS mutant'
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
            jsApiClick('rect[data-test="sample0,1VennRegion"]');
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
                'GARS mutant'
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

describe('group comparison upset diagram tests', function() {
    describe('create new group tests', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison?sessionId=5d0bc0c5e4b0ab4137876bc3`
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
            jsApiClick('.sample_testGroup2_testGroup3_bar');
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
            $('[data-test="sampleGroupNameInputField"]').setValue('testGroup5');
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
            $('path.sample_testGroup2_testGroup3_bar').click();
            $('path.patient_testGroup3_testGroup4_bar').click();
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
            $('[data-test="patientGroupNameInputField"]').setValue(
                'testGroup3'
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
