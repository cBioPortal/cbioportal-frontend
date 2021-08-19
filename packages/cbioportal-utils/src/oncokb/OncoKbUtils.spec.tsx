import { assert } from 'chai';

import {
    generateAnnotateStructuralVariantQueryFromGenes,
    generateQueryVariantId,
    StructuralVariantType,
} from './OncoKbUtils';

describe('OncoKbUtils', () => {
    describe('generateQueryVariantId', () => {
        it('properly generates query variant id when both entrezGeneId and tumor type are valid', () => {
            assert.equal(generateQueryVariantId(451, 'two'), '451_two');
        });

        it('properly generates query variant id when only entrezGeneId is valid', () => {
            assert.equal(generateQueryVariantId(451, null), '451');
        });
    });

    describe('generateAnnotateStructuralVariantQueryFromGenes', () => {
        it('Handle regular fusion', () => {
            const query = generateAnnotateStructuralVariantQueryFromGenes(
                673,
                55750,
                'MEL',
                StructuralVariantType.FUSION
            );
            assert.equal(query.geneA.entrezGeneId, 673);
            assert.equal(query.geneB.entrezGeneId, 55750);
            assert.equal(query.functionalFusion, true);
            assert.equal(
                query.structuralVariantType,
                StructuralVariantType.FUSION
            );
        });
        it('Handle intragenic alteration query', () => {
            const query = generateAnnotateStructuralVariantQueryFromGenes(
                673,
                undefined,
                'MEL',
                StructuralVariantType.DELETION
            );
            assert.equal(query.geneA.entrezGeneId, 673);
            assert.equal(query.geneB.entrezGeneId, 673);
            assert.equal(query.functionalFusion, false);
        });
        it('Handle fusion when one gene is missing', () => {
            const query = generateAnnotateStructuralVariantQueryFromGenes(
                673,
                undefined,
                'MEL',
                StructuralVariantType.FUSION
            );
            assert.equal(query.geneA.entrezGeneId, 673);
            assert.isTrue(query.geneB.entrezGeneId === undefined);
            assert.equal(query.functionalFusion, true);
        });
    });
});
