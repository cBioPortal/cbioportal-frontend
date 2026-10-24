import { assert } from 'chai';
import {
    GenericAssayTypeConstants,
    getGenericAssayCategories,
    getGenericAssayChartTypes,
} from './GenericAssayConfig';

describe('GenericAssayConfig', () => {
    describe('getGenericAssayChartTypes', () => {
        it('offers all chart types except dominant by default', () => {
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
                ['composition', 'dominant']
            );
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
