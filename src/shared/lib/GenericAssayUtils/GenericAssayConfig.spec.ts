import { assert } from 'chai';
import {
    chartTypeShowsAllCategories,
    GenericAssayTypeConstants,
    getGenericAssayCategories,
    getGenericAssayChartTypes,
} from './GenericAssayConfig';

describe('GenericAssayConfig', () => {
    describe('getGenericAssayChartTypes', () => {
        it('offers the single-track chart types except dominant by default', () => {
            assert.deepEqual(getGenericAssayChartTypes('UNCONFIGURED_TYPE'), [
                'heatmap',
                'bars',
                'composition',
                'absolute',
            ]);
        });

        it('leaves out absolute for fraction-like data', () => {
            assert.notInclude(
                getGenericAssayChartTypes('UNCONFIGURED_TYPE', true),
                'absolute'
            );
        });

        it('offers only the configured chart types', () => {
            assert.deepEqual(
                getGenericAssayChartTypes(
                    GenericAssayTypeConstants.ISIG_PROBABILITY
                ),
                ['composition_dominant']
            );
        });
    });

    describe('chartTypeShowsAllCategories', () => {
        it('is true for the stacked bar and dominant category types', () => {
            assert.isTrue(chartTypeShowsAllCategories('composition'));
            assert.isTrue(chartTypeShowsAllCategories('dominant'));
            assert.isTrue(chartTypeShowsAllCategories('composition_dominant'));
            assert.isFalse(chartTypeShowsAllCategories('absolute'));
            assert.isFalse(chartTypeShowsAllCategories('heatmap'));
        });
    });

    describe('getGenericAssayCategories', () => {
        it('returns the configured categories in order', () => {
            assert.deepEqual(
                getGenericAssayCategories(
                    GenericAssayTypeConstants.ISIG_PROBABILITY
                )!.map(c => c.stableId),
                ['ISIG_PROB_D', 'ISIG_PROB_F', 'ISIG_PROB_IE', 'ISIG_PROB_IE_F']
            );
        });

        it('returns undefined for a type without categories', () => {
            assert.isUndefined(getGenericAssayCategories('UNCONFIGURED_TYPE'));
        });
    });
});
