import AnnotationColumnFormatter from './AnnotationColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import {
    getCivicGenes,
    getMutationCivicVariants,
    getMutationData,
    getExpectedCivicEntry,
} from 'test/CivicMockUtils';
import { ICivicEntry } from 'shared/model/Civic';

describe('AnnotationColumnFormatter', () => {
    before(() => {});

    after(() => {});

    it('properly creates a civic entry', () => {
        let civicGenes = getCivicGenes();

        let civicVariants = getMutationCivicVariants();

        let mutation = getMutationData();

        let expectedCivicEntry = getExpectedCivicEntry();

        assert.deepEqual(
            AnnotationColumnFormatter.getCivicEntry(mutation, civicGenes, civicVariants),
            expectedCivicEntry,
            'Equal Civic Entry'
        );
    });
});
