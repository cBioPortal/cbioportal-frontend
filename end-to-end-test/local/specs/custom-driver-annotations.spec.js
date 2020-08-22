var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var reactSelectOption = require('../../shared/specUtils').reactSelectOption;
var getReactSelectOptions = require('../../shared/specUtils')
    .getReactSelectOptions;
var selectReactSelectOption = require('../../shared/specUtils')
    .selectReactSelectOption;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;
var setResultsPageSettingsMenuOpen = require('../../shared/specUtils')
    .setResultsPageSettingsMenuOpen;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&data_priority=0&gene_list=ABLIM1%250ATMEM247&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize';

const oncoprintTabUrlCna =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=ACAP3%2520AGRN&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize&show_samples=true';

describe('custom driver annotations feature', function() {
    if (useExternalFrontend) {
        describe('oncoprint tab - mutations', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(oncoprintTabUrl);
                waitForOncoprint(100000);
                setResultsPageSettingsMenuOpen(true);
            });

            it('shows custom driver annotation elements in config menu', () => {
                var topCheckBox = $('input[data-test=annotateCustomBinary]');
                assert(topCheckBox.isSelected());

                var tiersCheckboxes = $(
                    'span[data-test=annotateCustomTiers]'
                ).$$('input');
                assert(tiersCheckboxes[0].isSelected());
                assert(tiersCheckboxes[1].isSelected());
            });

            it('allows deselection of Tiers checkboxes', () => {
                var class1Checkbox = $('label*=Class 1').$('input');
                class1Checkbox.click();
                waitForOncoprint();
                assert(!class1Checkbox.isSelected());

                var class2Checkbox = $('label*=Class 2').$('input');
                class2Checkbox.click();
                waitForOncoprint();
                assert(!class2Checkbox.isSelected());
            });

            it('updates selected samples when VUS alterations are excluded', () => {
                // deselected all checkboxes except Custom driver annotation
                $('input[data-test=annotateHotspots]').click();
                $('label*=Class 1')
                    .$('input')
                    .click();
                $('label*=Class 2')
                    .$('input')
                    .click();

                $('input[data-test=HideVUS]').click();
                waitForOncoprint();
                assert($('div.alert-info*=1 mutation').isExisting());

                $('label*=Class 1')
                    .$('input')
                    .click();
                waitForOncoprint();
                assert($('div.alert-info*=1 mutation').isExisting());

                $('label*=Class 2')
                    .$('input')
                    .click();
                waitForOncoprint();
                assert(!$('div.alert-info').isExisting());
            });

            it('(de-)selects custom driver checkboxes with main annotation select option', () => {
                var topCheckBox = $('input[data-test=annotateCustomBinary]');
                var tiersCheckboxes = $(
                    'span[data-test=annotateCustomTiers]'
                ).$$('input');

                $('input[data-test=ColorByDriver]').click();
                assert(!topCheckBox.isSelected());
                assert(!tiersCheckboxes[0].isSelected());
                assert(!tiersCheckboxes[1].isSelected());

                $('input[data-test=ColorByDriver]').click();
                    assert(topCheckBox.isSelected());
                    assert(tiersCheckboxes[0].isSelected());
                    assert(tiersCheckboxes[1].isSelected());
                });
            });
        }
        
        describe('oncoprint tab - discete CNA', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(oncoprintTabUrlCna);
                waitForOncoprint();
                setResultsPageSettingsMenuOpen(true);
            });
    
            it('shows custom driver annotation elements in config menu', () => {
                var topCheckBox = $('input[data-test=annotateCustomBinary]');
                assert(topCheckBox.isSelected());
    
                var tiersCheckboxes = $(
                'span[data-test=annotateCustomTiers]'
            ).$$('input');
            assert(tiersCheckboxes[0].isSelected());
            assert(tiersCheckboxes[1].isSelected());
        });

        it('allows deselection of Tiers checkboxes', () => {
            var class1Checkbox = $('label*=Class 1').$('input');
            class1Checkbox.click();
            waitForOncoprint();
            assert(!class1Checkbox.isSelected());

            var class2Checkbox = $('label*=Class 2').$('input');
            class2Checkbox.click();
            waitForOncoprint();
            assert(!class2Checkbox.isSelected());
        });

        it('updates selected samples when VUS alterations are excluded', () => {
            // deselected all checkboxes except Custom driver annotation
            $('input[data-test=annotateHotspots]').click();
            $('label*=Class 1')
                .$('input')
                .click();
            $('label*=Class 2')
                .$('input')
                .click();

            $('input[data-test=HideVUS]').click();
            waitForOncoprint();
            assert($('div.alert-info*=17 mutations').isExisting());

            $('label*=Class 1')
                .$('input')
                .click();
            waitForOncoprint();
            assert($('div.alert-info*=17 mutations').isExisting());

            $('label*=Class 2')
                .$('input')
                .click();
            waitForOncoprint();
            assert($('div.alert-info*=16 mutations').isExisting());
        });

        it('(de-)selects custom driver checkboxes with main annotation select option', () => {
            var topCheckBox = $('input[data-test=annotateCustomBinary]');
            var tiersCheckboxes = $(
                'span[data-test=annotateCustomTiers]'
            ).$$('input');

            $('input[data-test=ColorByDriver]').click();
            assert(!topCheckBox.isSelected());
            assert(!tiersCheckboxes[0].isSelected());
            assert(!tiersCheckboxes[1].isSelected());

            $('input[data-test=ColorByDriver]').click();
            assert(topCheckBox.isSelected());
            assert(tiersCheckboxes[0].isSelected());
            assert(tiersCheckboxes[1].isSelected());
        });
    });
    
});
