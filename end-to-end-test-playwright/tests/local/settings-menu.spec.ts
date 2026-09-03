// Source: end-to-end-test/local/specs/core/settings-menu.spec.js
import { test, expect } from '../../fixtures';
import { Page } from '@playwright/test';
import { goToUrlAndSetLocalStorageWithProperty } from './helpers';
import { setResultsPageSettingsMenuOpen } from '../helpers/common';
import { waitForOncoprint } from '../helpers/oncoprint';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&data_priority=0&gene_list=ABLIM1%250ATMEM247&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize';

async function isSelected(page: Page, selector: string): Promise<boolean> {
    return page.locator(selector).isChecked();
}

const openOncoprint = async (
    page: Page,
    url: string,
    property: Record<string, unknown>
) => {
    await goToUrlAndSetLocalStorageWithProperty(page, url, true, property);
    await waitForOncoprint(page);
    await setResultsPageSettingsMenuOpen(page, true);
};

test.describe('results view settings/annotation menu', () => {
    const oncoprintCheckbox = '[data-test=annotateOncoKb]';
    const hotspotsCheckbox = '[data-test=annotateHotspots]';
    const customAnnotationCheckbox = '[data-test=annotateCustomBinary]';
    const excludeVusCheckbox = '[data-test=HideVUS]';

    test.describe('configuration by portal.properties', () => {
        test('does not select oncokb, hotspots, custom drivers by default when property set', async ({
            page,
        }) => {
            await openOncoprint(page, oncoprintTabUrl, {
                oncoprint_oncokb_default: false,
                oncoprint_hotspots_default: false,
                oncoprint_custom_driver_annotation_binary_default: false,
            });
            expect(await isSelected(page, oncoprintCheckbox)).toBe(false);
            expect(await isSelected(page, hotspotsCheckbox)).toBe(false);
            expect(await isSelected(page, customAnnotationCheckbox)).toBe(
                false
            );
        });

        test('does select oncokb by default when property set', async ({
            page,
        }) => {
            await openOncoprint(page, oncoprintTabUrl, {
                oncoprint_oncokb_default: true,
                oncoprint_hotspots_default: false,
                oncoprint_custom_driver_annotation_binary_default: false,
            });
            expect(await isSelected(page, oncoprintCheckbox)).toBe(true);
            expect(await isSelected(page, hotspotsCheckbox)).toBe(false);
            expect(await isSelected(page, customAnnotationCheckbox)).toBe(
                false
            );
        });

        test('does select hotspots by default when property set', async ({
            page,
        }) => {
            await openOncoprint(page, oncoprintTabUrl, {
                oncoprint_oncokb_default: false,
                oncoprint_hotspots_default: true,
                oncoprint_custom_driver_annotation_binary_default: false,
            });
            expect(await isSelected(page, oncoprintCheckbox)).toBe(false);
            expect(await isSelected(page, hotspotsCheckbox)).toBe(true);
            expect(await isSelected(page, customAnnotationCheckbox)).toBe(
                false
            );
        });

        test('does select custom driver annotations by default when property set', async ({
            page,
        }) => {
            await openOncoprint(page, oncoprintTabUrl, {
                oncoprint_oncokb_default: false,
                oncoprint_hotspots_default: false,
                oncoprint_custom_driver_annotation_binary_default: true,
            });
            expect(await isSelected(page, oncoprintCheckbox)).toBe(false);
            expect(await isSelected(page, hotspotsCheckbox)).toBe(false);
            expect(await isSelected(page, customAnnotationCheckbox)).toBe(true);
        });

        test('does not select VUS exclusion by default when property set', async ({
            page,
        }) => {
            await openOncoprint(page, oncoprintTabUrl, {
                oncoprint_hide_vus_default: false,
            });
            expect(await isSelected(page, excludeVusCheckbox)).toBe(false);
        });

        test('does select VUS exclusion by default when property set', async ({
            page,
        }) => {
            await openOncoprint(page, oncoprintTabUrl, {
                oncoprint_hide_vus_default: true,
            });
            expect(await isSelected(page, excludeVusCheckbox)).toBe(true);
        });
    });
});
