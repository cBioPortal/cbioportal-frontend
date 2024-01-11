var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;
var setSettingsMenuOpen = require('../../shared/specUtils').setSettingsMenuOpen;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&data_priority=0&gene_list=ABLIM1%250ATMEM247&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize';

const oncoprintTabUrlCna =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=ACAP3%2520AGRN&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize&show_samples=true';

const oncoprintTabUrlStructVar =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=study_es_0_cnaseq&gene_list=TMPRSS2&geneset_list=%20&tab_index=tab_visualize';

describe('custom driver annotations feature in result view', function() {
    describe('oncoprint tab - mutations', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(oncoprintTabUrl, true);
            waitForOncoprint(100000);
            setSettingsMenuOpen(true, 'GlobalSettingsButton');
        });

        it('shows custom driver annotation elements in config menu', () => {
            var topCheckBox = $('input[data-test=annotateCustomBinary]');
            assert(topCheckBox.isSelected());

            var tiersCheckboxes = $('span[data-test=annotateCustomTiers]').$$(
                'input'
            );
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
    });

    describe('oncoprint tab - discrete CNA', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(oncoprintTabUrlCna, true);
            waitForOncoprint();
            setSettingsMenuOpen(true, 'GlobalSettingsButton');
        });

        it('shows custom driver annotation elements in config menu', () => {
            var topCheckBox = $('input[data-test=annotateCustomBinary]');
            assert(topCheckBox.isSelected());

            var tiersCheckboxes = $('span[data-test=annotateCustomTiers]').$$(
                'input'
            );
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
            assert(
                $('div.alert-info*=17 copy number alterations').isExisting()
            );

            $('label*=Class 1')
                .$('input')
                .click();
            waitForOncoprint();
            assert(
                $('div.alert-info*=17 copy number alterations').isExisting()
            );

            $('label*=Class 2')
                .$('input')
                .click();
            waitForOncoprint();
            assert(
                $('div.alert-info*=16 copy number alterations').isExisting()
            );
        });
    });

    describe('oncoprint tab - structural variants', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(oncoprintTabUrlStructVar, true);
            waitForOncoprint();
            setSettingsMenuOpen(true, 'GlobalSettingsButton');
        });

        it('shows custom driver annotation elements in config menu', () => {
            var topCheckBox = $('input[data-test=annotateCustomBinary]');
            assert(topCheckBox.isSelected());

            var tiersCheckboxes = $('span[data-test=annotateCustomTiers]').$$(
                'input'
            );
            assert(tiersCheckboxes[0].isSelected());
        });

        it('allows deselection of Tiers checkboxes', () => {
            var class1Checkbox = $('label*=Class 1').$('input');
            class1Checkbox.click();
            waitForOncoprint();
            assert(!class1Checkbox.isSelected());
        });

        it('updates selected samples when VUS alterations are excluded', () => {
            $('input[data-test=annotateHotspots]').click();
            $('input[data-test=annotateOncoKb]').click();
            $('input[data-test=HideVUS]').click();
            waitForOncoprint();
            assert($('div.alert-info*=1 structural variant').isExisting());

            $('label*=Class 1')
                .$('input')
                .click();
            waitForOncoprint();
            assert($('div.alert-info*=2 structural variants').isExisting());
        });
    });
});
