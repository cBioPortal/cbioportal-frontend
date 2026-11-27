/**
 * @jest-environment jsdom
 */
import { assert } from 'chai';

import { formatMutationType } from './wsiMolecularUtils';

describe('wsiMolecularUtils', () => {
    describe('formatMutationType', () => {
        it('reuses shared canonical mutation aliases', () => {
            assert.equal(formatMutationType('Missense_Mutation'), 'Missense');
            assert.equal(formatMutationType('stop_gained'), 'Nonsense');
            assert.equal(
                formatMutationType('splice_region_variant'),
                'Splice site'
            );
            assert.equal(formatMutationType('inframe_ins'), 'In-frame ins');
        });

        it('falls back to underscore replacement for unmapped values', () => {
            assert.equal(
                formatMutationType('Custom_Mutation_Type'),
                'Custom Mutation Type'
            );
        });
    });
});
