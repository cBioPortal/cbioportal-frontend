/**
 * @jest-environment jsdom
 */
import { assert } from 'chai';

import { buildOncoKbUrl, formatMutationType } from './wsiMolecularUtils';

describe('wsiMolecularUtils', () => {
    describe('buildOncoKbUrl', () => {
        it('builds gene-level URLs', () => {
            assert.equal(
                buildOncoKbUrl('TP53'),
                'https://www.oncokb.org/gene/TP53'
            );
        });

        it('builds variant-level URLs with encoding', () => {
            assert.equal(
                buildOncoKbUrl('MTOR', 'E2419K'),
                'https://www.oncokb.org/gene/MTOR/E2419K'
            );
            assert.equal(
                buildOncoKbUrl('EGFR', 'E746_A750del'),
                'https://www.oncokb.org/gene/EGFR/E746_A750del'
            );
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
