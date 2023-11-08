var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var assert = require('assert');
var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var getNthOncoprintTrackOptionsElements = require('../../../shared/specUtils')
    .getNthOncoprintTrackOptionsElements;
var {
    checkOncoprintElement,
    getElementByTestHandle,
} = require('../../../shared/specUtils.js');

const ONCOPRINT_TIMEOUT = 60000;
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('oncoprint colors', () => {
    describe('clinical tracks color configuration', () => {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=gbm_tcga&case_set_id=gbm_tcga_all&data_priority=0&gene_list=EGFR%250APTEN%250AIDH1%250ATP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=gbm_tcga_mrna_median_all_sample_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_mutations&hide_unprofiled_samples=false&profileFilter=0&tab_index=tab_visualize&show_samples=false`
            );
            waitForOncoprint(ONCOPRINT_TIMEOUT);
        });

        it('color configuration modal reflects user selected colors', () => {
            // add "Mutation spectrum" track
            const $tracksDropdown = $('#addTracksDropdown');
            $tracksDropdown.click();
            getElementByTestHandle('add-chart-option-mutation-spectrum')
                .$('label')
                .click();
            waitForOncoprint(ONCOPRINT_TIMEOUT);
            $tracksDropdown.click();

            var trackOptionsElts = getNthOncoprintTrackOptionsElements(5);
            // open menu
            $(trackOptionsElts.button_selector).click();
            $(trackOptionsElts.dropdown_selector).waitForDisplayed({
                timeout: 1000,
            });
            // click "Edit Colors"
            $(trackOptionsElts.dropdown_selector + ' li:nth-child(8)').click();
            $('[data-test="color-picker-icon"]').waitForDisplayed();

            // select new colors for track values
            $('[data-test="color-picker-icon"]').click();
            $('.circle-picker [title="#990099"]').click();
            waitForOncoprint(ONCOPRINT_TIMEOUT);
            $('[data-test="color-picker-icon"]').click();
            $('.circle-picker').waitForDisplayed({ reverse: true });

            $$('[data-test="color-picker-icon"]')[1].click();
            $('.circle-picker [title="#109618"]').click();
            waitForOncoprint(ONCOPRINT_TIMEOUT);
            $$('[data-test="color-picker-icon"]')[1].click();
            $('.circle-picker').waitForDisplayed({ reverse: true });

            $$('[data-test="color-picker-icon"]')[2].click();
            $('.circle-picker [title="#8b0707"]').click();
            waitForOncoprint(ONCOPRINT_TIMEOUT);
            $$('[data-test="color-picker-icon"]')[2].click();
            $('.circle-picker').waitForDisplayed({ reverse: true });

            assert.strictEqual(
                $('[data-test="color-picker-icon"] rect').getAttribute('fill'),
                '#990099'
            );
            assert.strictEqual(
                $$('[data-test="color-picker-icon"] rect')[1].getAttribute(
                    'fill'
                ),
                '#109618'
            );
            assert.strictEqual(
                $$('[data-test="color-picker-icon"] rect')[2].getAttribute(
                    'fill'
                ),
                '#8b0707'
            );
        });

        it('oncoprint reflects user selected colors', () => {
            // close modal
            $('.modal-header [class="close"]').click();
            var res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });

        it('reset colors button is enabled when default colors not used', () => {
            // check "Reset Colors" button in modal
            var trackOptionsElts = getNthOncoprintTrackOptionsElements(5);
            $(trackOptionsElts.button_selector).click();
            $(trackOptionsElts.dropdown_selector).waitForDisplayed({
                timeout: 1000,
            });
            $(trackOptionsElts.dropdown_selector + ' li:nth-child(8)').click();
            getElementByTestHandle('resetColors').waitForExist();

            assert.strictEqual(
                getElementByTestHandle('resetColors').isEnabled(),
                true
            );
        });

        it('color configuration modal reflects default colors', () => {
            // click "Reset Colors" track
            getElementByTestHandle('resetColors').click();
            waitForOncoprint(ONCOPRINT_TIMEOUT);

            assert.strictEqual(
                $('[data-test="color-picker-icon"] rect').getAttribute('fill'),
                '#3d6eb1'
            );
            assert.strictEqual(
                $$('[data-test="color-picker-icon"] rect')[1].getAttribute(
                    'fill'
                ),
                '#8ebfdc'
            );
            assert.strictEqual(
                $$('[data-test="color-picker-icon"] rect')[2].getAttribute(
                    'fill'
                ),
                '#dff1f8'
            );
        });

        it('oncoprint reflects default colors', () => {
            // close modal
            $('.modal-header [class="close"]').click();
            var res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });

        it('reset colors button is disabled when default colors are used', () => {
            // check "Reset Colors" button in modal
            var trackOptionsElts = getNthOncoprintTrackOptionsElements(5);
            $(trackOptionsElts.button_selector).click();
            $(trackOptionsElts.dropdown_selector).waitForDisplayed({
                timeout: 1000,
            });
            $(trackOptionsElts.dropdown_selector + ' li:nth-child(8)').click();
            getElementByTestHandle('resetColors').waitForExist();

            assert.strictEqual(
                getElementByTestHandle('resetColors').isEnabled(),
                false
            );
        });
    });

    describe('enable white background for glyphs', () => {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=gbm_tcga&case_set_id=gbm_tcga_all&data_priority=0&gene_list=EGFR%250APTEN%250AIDH1%250ATP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=gbm_tcga_mrna_median_all_sample_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_mutations&hide_unprofiled_samples=false&profileFilter=0&tab_index=tab_visualize&show_samples=false`
            );
            waitForOncoprint(ONCOPRINT_TIMEOUT);
        });
        it('oncoprint uses white background for glyphs when option toggled', () => {
            // toggle on white backgrounds for glyphs
            const $viewDropdown = $('#viewDropdownButton');
            $viewDropdown.click();
            waitForOncoprint(2000);
            getElementByTestHandle('toggleWhiteBackgroundForGlyphs').click();
            $viewDropdown.click();

            var res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });

        it('oncoprint uses default background for glyphs when option not toggled', () => {
            // toggle off white backgrounds for glyphs
            const $viewDropdown = $('#viewDropdownButton');
            $viewDropdown.click();
            waitForOncoprint(2000);
            getElementByTestHandle('toggleWhiteBackgroundForGlyphs').click();
            $viewDropdown.click();

            var res = checkOncoprintElement();
            assertScreenShotMatch(res);
        });
    });
});
