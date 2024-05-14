var assert = require('assert');
const {
    waitForOncoprint,
    setSettingsMenuOpen,
} = require('../../../shared/specUtils');
var goToUrlAndSetLocalStorageWithProperty = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorageWithProperty;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&data_priority=0&gene_list=ABLIM1%250ATMEM247&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize';

describe('results view settings/annotation menu', function() {
    const oncoprintCheckbox = '[data-test=annotateOncoKb]';
    const hotspotsCheckbox = '[data-test=annotateHotspots]';
    const customAnnotationCheckbox = '[data-test=annotateCustomBinary]';
    const excludeVusCheckbox = '[data-test=HideVUS]';

    describe('configuration by portal.properties', () => {
        it('does not select oncokb, hotspots, custom drivers by default when property set', () => {
            openOncoprint(oncoprintTabUrl, {
                oncoprint_oncokb_default: false,
                oncoprint_hotspots_default: false,
                oncoprint_custom_driver_annotation_binary_default: false,
            });
            assert(!$(oncoprintCheckbox).isSelected());
            assert(!$(hotspotsCheckbox).isSelected());
            assert(!$(customAnnotationCheckbox).isSelected());
        });

        it('does select oncokb by default when property set', () => {
            openOncoprint(oncoprintTabUrl, {
                oncoprint_oncokb_default: true,
                oncoprint_hotspots_default: false,
                oncoprint_custom_driver_annotation_binary_default: false,
            });
            assert($(oncoprintCheckbox).isSelected());
            assert(!$(hotspotsCheckbox).isSelected());
            assert(!$(customAnnotationCheckbox).isSelected());
        });

        it('does select hotspots by default when property set', () => {
            openOncoprint(oncoprintTabUrl, {
                oncoprint_oncokb_default: false,
                oncoprint_hotspots_default: true,
                oncoprint_custom_driver_annotation_binary_default: false,
            });
            assert(!$(oncoprintCheckbox).isSelected());
            assert($(hotspotsCheckbox).isSelected());
            assert(!$(customAnnotationCheckbox).isSelected());
        });

        it('does select custom driver annotations by default when property set', () => {
            openOncoprint(oncoprintTabUrl, {
                oncoprint_oncokb_default: false,
                oncoprint_hotspots_default: false,
                oncoprint_custom_driver_annotation_binary_default: true,
            });
            assert(!$(oncoprintCheckbox).isSelected());
            assert(!$(hotspotsCheckbox).isSelected());
            assert($(customAnnotationCheckbox).isSelected());
        });

        it('does not select VUS exclusion by default when property set', () => {
            openOncoprint(oncoprintTabUrl, {
                oncoprint_hide_vus_default: false,
            });
            assert(!$(excludeVusCheckbox).isSelected());
        });

        it('does select VUS exclusion by default when property set', () => {
            openOncoprint(oncoprintTabUrl, {
                oncoprint_hide_vus_default: true,
            });
            assert($(excludeVusCheckbox).isSelected());
        });
    });
});

const openOncoprint = (url, property) => {
    goToUrlAndSetLocalStorageWithProperty(url, true, property);
    waitForOncoprint();
    setSettingsMenuOpen(true, 'GlobalSettingsButton');
};
