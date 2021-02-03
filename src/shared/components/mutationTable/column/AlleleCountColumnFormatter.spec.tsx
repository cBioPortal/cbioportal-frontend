import AlleleCountColumnFormatter from './AlleleCountColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import Enzyme, { shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import sinon from 'sinon';

Enzyme.configure({ adapter: new Adapter() });

import { Mutation } from 'cbioportal-ts-api-client';
import { initMutation } from 'test/MutationMockUtils';

describe('AlleleCountColumnFormatter', () => {
    it('ignores invalid allele count values', () => {
        const samples = [
            'SAMPLE1',
            'SAMPLE2',
            'SAMPLE3',
            'SAMPLE4',
            'SAMPLE5',
            'SAMPLE6',
        ];

        const mutations: Mutation[] = [
            initMutation({
                sampleId: 'SAMPLE1',
                tumorAltCount: -1,
            }),
            initMutation({
                sampleId: 'SAMPLE2',
            }),
            initMutation({
                sampleId: 'SAMPLE3',
                tumorAltCount: 2,
            }),
            initMutation({
                sampleId: 'SAMPLE4',
                tumorAltCount: 'N/A',
            }),
            initMutation({
                sampleId: 'SAMPLE5',
                tumorAltCount: 6,
            }),
            initMutation({
                sampleId: 'SAMPLE6',
                tumorAltCount: null,
            }),
        ];

        assert.deepEqual(
            AlleleCountColumnFormatter.getValues(
                mutations,
                samples,
                'tumorAltCount'
            ),
            ['SAMPLE3: 2', 'SAMPLE5: 6']
        );

        assert.deepEqual(
            AlleleCountColumnFormatter.getValues(
                mutations.slice(0, 4),
                samples,
                'tumorAltCount'
            ),
            ['2']
        );
    });
});
