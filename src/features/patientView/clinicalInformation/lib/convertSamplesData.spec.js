import Immutable from 'immutable';
import { mockData } from './mockData';
import convertSampleData from './convertSamplesData';
import { assert } from 'chai';
import _ from 'lodash';

describe('', () => {
    it('api data is properly transformed into table data', () => {
        const result = convertSampleData(mockData.samples);

        assert.isTrue('OCT_EMBEDDED' in result.items);
        assert.equal(_.size(result.items), 4);
        assert.equal(result.items.DAYS_TO_COLLECTION['TCGA-P6-A5OH-01'], 276);
        assert.equal(result.items.DAYS_TO_COLLECTION['TCGA-OR-A5LI-01'], 312);
    });
});

