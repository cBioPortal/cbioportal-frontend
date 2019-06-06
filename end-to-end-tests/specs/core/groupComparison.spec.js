var assert = require('assert');
var goToUrlAndSetLocalStorage = require('./../specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('./../specUtils').waitForNetworkQuiet;
var assertScreenShotMatch = require('../../lib/testUtils').assertScreenShotMatch;
var checkElementWithTemporaryClass = require('./../specUtils').checkElementWithTemporaryClass;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");
const SampleGroupComparisonVennDiagramCreateGroupButton = 'button[data-test="sampleGroupComparisonVennDiagramCreateGroupButton"]';
const PatientGroupComparisonVennDiagramCreateGroupButton = 'button[data-test="patientGroupComparisonVennDiagramCreateGroupButton"]';

describe("group comparison venn diagram tests", function() {
    describe('create new group tests', function() {
        before(function () {
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/comparison/overlap?sessionId=5cf6bcf0e4b0ab413787430c`);
            browser.waitForVisible('div[data-test="ComparisonPageOverlapTabDiv"]', 20000);
        });
    
        it("create group button disabled as default", function () {
            assert.equal(browser.isEnabled(SampleGroupComparisonVennDiagramCreateGroupButton), false);
            assert.equal(browser.isEnabled(PatientGroupComparisonVennDiagramCreateGroupButton), false);
        });
    
        it("select from sample venn diagram", function () {
            browser.leftClick('rect[data-test="#d2644esampleComparisonGroupRegionRect"]');
            browser.pause(100);
            assert.equal(browser.isEnabled(SampleGroupComparisonVennDiagramCreateGroupButton), true);
            assert.equal(browser.isEnabled(PatientGroupComparisonVennDiagramCreateGroupButton), false);
        });
    
        it("click sample venn diagram create group button", function () {
            browser.click(SampleGroupComparisonVennDiagramCreateGroupButton);
            browser.waitForVisible("div.rc-tooltip-inner", 20000);
            browser.pause(100);
            assert.equal(browser.isVisible('[data-test="sampleGroupNameInputField"]'), true, 'group name input exists');
            assert.equal(browser.isEnabled('[data-test="sampleGroupNameSubmitButton"]'), false);
        });
    
        it("sample venn diagram: group name exists, should diable submit button", function () {
            browser.setValue('[data-test="sampleGroupNameInputField"]', 'GARS mutant');
            browser.pause(100);
            browser.waitForVisible('[data-test="sampleDuplicateGroupNameMessage"]', 20000);
            assert.equal(browser.getText('[data-test="sampleDuplicateGroupNameMessage"]'), 'Another group already has this name.');
            assert.equal(browser.isEnabled('[data-test="sampleGroupNameSubmitButton"]'), false);
        });
    
        it("sample venn diagram: new group name, should enable submit button", function () {
            browser.setValue('[data-test="sampleGroupNameInputField"]', 'new group');
            browser.pause(100);
            assert.equal(browser.isEnabled('[data-test="sampleGroupNameSubmitButton"]'), true);
        });
    
        it("select from patient venn diagram", function () {
            // unselect sample venn diagram first
            browser.leftClick('rect[data-test="#d2644esampleComparisonGroupRegionRect"]');
            browser.leftClick('rect[data-test="#d2644epatientComparisonGroupRegionRect"]');
            browser.pause(100);
            assert.equal(browser.isEnabled(SampleGroupComparisonVennDiagramCreateGroupButton), false);
            assert.equal(browser.isEnabled(PatientGroupComparisonVennDiagramCreateGroupButton), true);
        });
    
        it("click patient venn diagram create group button", function () {
            browser.click(PatientGroupComparisonVennDiagramCreateGroupButton);
            browser.waitForVisible("div.rc-tooltip-inner", 20000);
            browser.pause(100);
            assert.equal(browser.isVisible('[data-test="patientGroupNameInputField"]'), true, 'group name input exists');
            assert.equal(browser.isEnabled('[data-test="patientGroupNameSubmitButton"]'), false);
        });
    
        it("patient venn diagram: group name exists, should diable submit button", function () {
            browser.setValue('[data-test="patientGroupNameInputField"]', 'GARS mutant');
            browser.pause(100);
            browser.waitForVisible('[data-test="patientDuplicateGroupNameMessage"]', 20000);
            assert.equal(browser.getText('[data-test="patientDuplicateGroupNameMessage"]'), 'Another group already has this name.');
            assert.equal(browser.isEnabled('[data-test="patientGroupNameSubmitButton"]'), false);
        });
    
        it("patient venn diagram: new group name, should enable submit button", function () {
            browser.setValue('[data-test="patientGroupNameInputField"]', 'new group');
            browser.pause(100);
            assert.equal(browser.isEnabled('[data-test="patientGroupNameSubmitButton"]'), true);
        });
    })

    describe('disjoint diagram', function() {
        before(function () {
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/comparison?sessionId=5cf8b1b3e4b0ab413787436f`);
            browser.waitForVisible('div[data-test="ComparisonPageOverlapTabDiv"]', 20000);
        });

        it("group comparison page overlap tab disjoint venn diagram view", function () {
            var res = checkElementWithTemporaryClass('div[data-test="ComparisonPageOverlapTabDiv"]', 'div[data-test="ComparisonPageOverlapTabDiv"]', "disablePointerEvents", 0);
            assertScreenShotMatch(res);
        });
    
        it("group comparison page overlap tab disjoint venn diagram view with a group selected view", function () {
            browser.waitForVisible('svg#comparison-tab-overlap-svg', 6000);
            browser.leftClick('rect[data-test="#DC3912sampleComparisonGroupRegionRect"]');
            var res = checkElementWithTemporaryClass('div[data-test="ComparisonPageOverlapTabDiv"]', 'div[data-test="ComparisonPageOverlapTabDiv"]', "disablePointerEvents", 0);
            assertScreenShotMatch(res);
        });
    })

    describe('venn diagram with overlap', function() {
        before(function () {
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/comparison/overlap?sessionId=5cf6bcf0e4b0ab413787430c`);
            browser.waitForVisible('div[data-test="ComparisonPageOverlapTabDiv"]', 20000);
        });

        it("group comparison page overlap tab venn diagram with overlap view", function () {
            var res = checkElementWithTemporaryClass('div[data-test="ComparisonPageOverlapTabDiv"]', 'div[data-test="ComparisonPageOverlapTabDiv"]', "disablePointerEvents", 0);
            assertScreenShotMatch(res);
        });
    
        it("group comparison page overlap tab venn diagram view with overlap and session selected view", function () {
            browser.leftClick('rect[data-test="#d2644esampleComparisonGroupRegionRect"]');
            var res = checkElementWithTemporaryClass('div[data-test="ComparisonPageOverlapTabDiv"]', 'div[data-test="ComparisonPageOverlapTabDiv"]', "disablePointerEvents", 0);
            assertScreenShotMatch(res);
        });

        it("group comparison page overlap tab venn diagram view with overlap deselect active group", function () {
            browser.click('button[data-test="groupSelectorButtonC"]');
            var res = checkElementWithTemporaryClass('div[data-test="ComparisonPageOverlapTabDiv"]', 'div[data-test="ComparisonPageOverlapTabDiv"]', "disablePointerEvents", 0);
            assertScreenShotMatch(res);
        });        
    })
});
