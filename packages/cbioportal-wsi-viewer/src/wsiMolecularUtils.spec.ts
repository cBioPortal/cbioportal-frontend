/**
 * @jest-environment jsdom
 */
import { assert } from 'chai';

import {
    formatMutationType,
    parseMutationToken,
    parseMutationTokens,
} from './wsiMolecularUtils';

describe('wsiMolecularUtils', () => {
    describe('parseMutationToken', () => {
        it('splits gene and variant tokens', () => {
            assert.deepEqual(parseMutationToken('KRAS p.G13D'), {
                gene: 'KRAS',
                variant: 'p.G13D',
            });
        });
    });

    describe('parseMutationTokens', () => {
        it('splits comma and semicolon separated lists', () => {
            assert.deepEqual(parseMutationTokens('KRAS p.G13D; TP53 p.R175H'), [
                'KRAS p.G13D',
                'TP53 p.R175H',
            ]);
            assert.deepEqual(parseMutationTokens('KRAS p.G13D,TP53 p.R175H'), [
                'KRAS p.G13D',
                'TP53 p.R175H',
            ]);
        });
    });

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
