import {compareNumberLists} from 'shared/lib/SortUtils';
import {initQueryIndicator} from "test/OncoKbMockUtils";
import OncoKB from './OncoKB';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('OncoKB', () => {
    before(() => {

    });

    it('properly calculates OncoKB sort values', () => {

        let queryA = initQueryIndicator({
            oncogenic: 'Oncogenic'
        });

        let queryB = initQueryIndicator({
            oncogenic: 'Oncogenic'
        });

        assert.equal(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'Equal Oncogenicity');

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Inconclusive';
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'Oncogenicity test 2');

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Unknown';
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'Oncogenicity test 3');

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Likely Neutral';
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'Oncogenicity test 4');

        queryA.oncogenic = 'Inconclusive';
        queryB.oncogenic = 'Unknown';
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'Oncogenicity test 5');

        queryA.oncogenic = 'Likely Neutral';
        queryB.oncogenic = 'Inconclusive';
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'Oncogenicity test 6');

        queryA = initQueryIndicator({
            oncogenic: 'Unknown',
            vus: true
        });
        queryB = initQueryIndicator({
            oncogenic: 'Unknown',
            vus: false
        });
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'A is VUS, which should have higher score.');

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: 'LEVEL_1'
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: 'LEVEL_2A'
        });
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'A(LEVEL_1) should be higher than B(LEVEL_2A)');

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestResistanceLevel: 'LEVEL_R1'
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestResistanceLevel: 'LEVEL_R2'
        });
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'A(LEVEL_R1) should be higher than B(LEVEL_R2)');

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: 'LEVEL_2A',
            highestResistanceLevel: ''
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: '',
            highestResistanceLevel: 'LEVEL_R1'
        });
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'A(LEVEL_2A) should be higher than B(LEVEL_R1)');

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic'
        });
        queryB = initQueryIndicator({
            oncogenic: 'Unknown',
            highestSensitiveLevel: 'LEVEL_2A'
        });
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'The score for Oncogenic variant(A) should always higher than other categories(B) even B has treatments.');

        queryA = initQueryIndicator({
            variantExist: true
        });
        queryB = initQueryIndicator({
            variantExist: false
        });
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'variantExist test 1');

        queryA = initQueryIndicator({
            variantExist: true
        });
        queryB = initQueryIndicator({
            variantExist: false,
            highestSensitiveLevel: 'LEVEL_2A'
        });
        assert.isAbove(
            compareNumberLists(OncoKB.sortValue(queryA), OncoKB.sortValue(queryB)),
            0,
            'variantExist test 2');
    });

    after(() => {

    });
});
