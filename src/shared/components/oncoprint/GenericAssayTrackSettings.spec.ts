import { assert } from 'chai';
import {
    getProfilesWithChartType,
    parseGenericAssayTrackSettings,
    serializeGenericAssayTrackSettings,
} from './GenericAssayTrackSettings';

describe('GenericAssayTrackSettings', () => {
    describe('parseGenericAssayTrackSettings', () => {
        it('reads the settings param', () => {
            assert.deepEqual(
                parseGenericAssayTrackSettings({
                    generic_assay_track_settings:
                        '{"p1":{"chartType":"dominant"},"p2":{"chartType":"composition","sortBy":"E1"}}',
                }),
                {
                    p1: { chartType: 'dominant' },
                    p2: { chartType: 'composition', sortBy: 'E1' },
                }
            );
        });

        it('reads the legacy params when the settings param is missing', () => {
            assert.deepEqual(
                parseGenericAssayTrackSettings({
                    generic_assay_stacked_profiles: 'p1;p2',
                    generic_assay_stacked_absolute_profiles: 'p2',
                    generic_assay_bar_profiles: 'p3',
                    generic_assay_stacked_sortby: 'p1:E1;p2:E2',
                }),
                {
                    p1: { chartType: 'composition', sortBy: 'E1' },
                    p2: { chartType: 'absolute', sortBy: 'E2' },
                    p3: { chartType: 'bars' },
                }
            );
        });

        it('ignores the legacy params when the settings param is present', () => {
            assert.deepEqual(
                parseGenericAssayTrackSettings({
                    generic_assay_track_settings: '{"p1":{"chartType":"bars"}}',
                    generic_assay_stacked_profiles: 'p2',
                }),
                { p1: { chartType: 'bars' } }
            );
        });

        it('returns no settings for invalid JSON', () => {
            assert.deepEqual(
                parseGenericAssayTrackSettings({
                    generic_assay_track_settings: '{not json',
                }),
                {}
            );
        });
    });

    describe('serializeGenericAssayTrackSettings', () => {
        it('writes the settings param and clears the legacy params', () => {
            assert.deepEqual(
                serializeGenericAssayTrackSettings({
                    p1: { chartType: 'dominant' },
                    p2: { chartType: 'heatmap', sortBy: undefined },
                }),
                {
                    generic_assay_track_settings:
                        '{"p1":{"chartType":"dominant"}}',
                    generic_assay_stacked_profiles: undefined,
                    generic_assay_stacked_absolute_profiles: undefined,
                    generic_assay_bar_profiles: undefined,
                    generic_assay_stacked_sortby: undefined,
                }
            );
        });

        it('removes the settings param when no profile has settings', () => {
            assert.isUndefined(
                serializeGenericAssayTrackSettings({ p1: {} })
                    .generic_assay_track_settings
            );
        });
    });

    it('lists the profiles with a chart type', () => {
        assert.deepEqual(
            getProfilesWithChartType(
                {
                    p1: { chartType: 'dominant' },
                    p2: { chartType: 'composition' },
                    p3: { sortBy: 'E1' },
                },
                'dominant'
            ),
            { p1: true }
        );
    });
});
