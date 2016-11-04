import exampleState from './../mock/exampleState';
import convertSampleData from './convertSamplesData';
import { assert } from 'chai';
import { size } from 'lodash';

describe('', () => {
    it('api data is properly transformed into table data', () => {
        const result = convertSampleData(exampleState.samples);

        assert.isTrue('CANCER_TYPE' in result.items);
        // 8 clinical attributes
        assert.equal(size(result.items), 8);
        // 4 samples, clinicalAttribute meta data and row id
        assert.equal(size(result.items.SAMPLE_TYPE), 6);
        assert.equal(result.items.SAMPLE_TYPE['P04_Pri'], 'Primary');
        assert.equal(result.items.SAMPLE_TYPE['P04_Rec1'], 'Recurrence');
    });
});

