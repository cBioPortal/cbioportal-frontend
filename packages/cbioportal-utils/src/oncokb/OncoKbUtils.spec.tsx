import { assert } from 'chai';

import {
    generateAnnotateStructuralVariantQuery,
    generateQueryVariantId,
    StructuralVariantType,
} from './OncoKbUtils';
import { EvidenceType } from '../model/OncoKB';
import { StructuralVariant } from 'cbioportal-ts-api-client';

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
            const query = generateAnnotateStructuralVariantQuery(
                {
                    site1EntrezGeneId: 673,
                    site2EntrezGeneId: 55750,
                    variantClass: 'FUSION',
                } as StructuralVariant,
                'MEL',
                []
            );
            assert.equal(query.geneA.entrezGeneId, 673);
            assert.equal(query.geneB.entrezGeneId, 55750);
            assert.equal(query.functionalFusion, true);
            assert.equal(
                query.structuralVariantType,
                StructuralVariantType.FUSION
            );
        });

        it('Handle fusion with only site 1', () => {
            const query = generateAnnotateStructuralVariantQuery(
                {
                    site1EntrezGeneId: 673,
                    variantClass: 'DELETION',
                } as StructuralVariant,
                'MEL',
                []
            );
            assert.equal(query.geneA.entrezGeneId, 673);
            assert.equal(query.geneB.entrezGeneId, 673);
            assert.equal(query.functionalFusion, false);
            assert.equal(
                query.structuralVariantType,
                StructuralVariantType.DELETION
            );
        });

        it('Handle fusion with only site 2', () => {
            const query = generateAnnotateStructuralVariantQuery(
                {
                    site2EntrezGeneId: 673,
                    variantClass: 'DELETION',
                } as StructuralVariant,
                'MEL',
                []
            );
            assert.equal(query.geneA.entrezGeneId, 673);
            assert.equal(query.geneB.entrezGeneId, 673);
            assert.equal(query.functionalFusion, false);
            assert.equal(
                query.structuralVariantType,
                StructuralVariantType.DELETION
            );
        });

        it('Handle fusion with only one gene', () => {
            const query = generateAnnotateStructuralVariantQuery(
                {
                    site1EntrezGeneId: 673,
                    variantClass: 'INVALID',
                } as StructuralVariant,
                'MEL',
                []
            );
            assert.equal(query.geneA.entrezGeneId, 673);
            assert.equal(query.geneB.entrezGeneId, 673);
            assert.equal(query.functionalFusion, false);
            assert.equal(
                query.structuralVariantType,
                StructuralVariantType.UNKNOWN
            );
        });
    });
});
