import {
    buildCivicMutationSpecs,
    buildOncoKbCnaItems,
    buildOncoKbMutationItems,
    buildOncoKbStructuralVariantItems,
} from './wsiAnnotationFetchUtils';
import {
    CNADetail,
    MutationDetail,
    StructuralVariantDetail,
} from './wsiViewerTypes';

describe('wsiAnnotationFetchUtils', () => {
    describe('buildOncoKbMutationItems', () => {
        it('deduplicates and sorts mutation items deterministically', () => {
            const details: MutationDetail[] = [
                {
                    token: 'TP53 p.R175H',
                    entrezGeneId: 7157,
                    consequence: 'missense_variant',
                    proteinStart: 175,
                    proteinEnd: 175,
                },
                {
                    token: 'BRAF p.V600E',
                    entrezGeneId: 673,
                    consequence: 'missense_variant',
                    proteinStart: 600,
                    proteinEnd: 600,
                },
                {
                    token: 'TP53 p.R175H',
                    entrezGeneId: 7157,
                    consequence: 'missense_variant',
                    proteinStart: 175,
                    proteinEnd: 175,
                },
                {
                    token: 'TP53 p.R248Q',
                    entrezGeneId: 7157,
                    consequence: 'missense_variant',
                    proteinStart: 248,
                    proteinEnd: 248,
                },
            ];

            expect(buildOncoKbMutationItems(details)).toEqual([
                expect.objectContaining({
                    id: '673_V600E_missense_variant',
                    alteration: 'V600E',
                    gene: { entrezGeneId: 673 },
                }),
                expect.objectContaining({
                    id: '7157_R175H_missense_variant',
                    alteration: 'R175H',
                    gene: { entrezGeneId: 7157 },
                }),
                expect.objectContaining({
                    id: '7157_R248Q_missense_variant',
                    alteration: 'R248Q',
                    gene: { entrezGeneId: 7157 },
                }),
            ]);
        });
    });

    describe('buildCivicMutationSpecs', () => {
        it('deduplicates and sorts CIViC mutation specs deterministically', () => {
            const details: MutationDetail[] = [
                {
                    token: 'TP53 p.R175H',
                    entrezGeneId: 7157,
                    consequence: 'missense_variant',
                },
                {
                    token: 'BRAF p.V600E',
                    entrezGeneId: 673,
                    consequence: 'missense_variant',
                },
                {
                    token: 'TP53 p.R175H',
                    entrezGeneId: 7157,
                    consequence: 'missense_variant',
                },
            ];

            expect(buildCivicMutationSpecs(details)).toEqual([
                {
                    gene: { hugoGeneSymbol: 'BRAF' },
                    proteinChange: 'V600E',
                },
                {
                    gene: { hugoGeneSymbol: 'TP53' },
                    proteinChange: 'R175H',
                },
            ]);
        });
    });

    describe('buildOncoKbCnaItems', () => {
        it('deduplicates and sorts CNA items deterministically', () => {
            const cnas: CNADetail[] = [
                { gene: 'TP53', entrezGeneId: 7157, cnaValue: 2 },
                { gene: 'BRAF', entrezGeneId: 673, cnaValue: -2 },
                { gene: 'TP53', entrezGeneId: 7157, cnaValue: 2 },
                { gene: 'TP53', entrezGeneId: 7157, cnaValue: 1 },
            ];

            expect(buildOncoKbCnaItems(cnas)).toEqual([
                expect.objectContaining({
                    id: '673_DELETION',
                    copyNameAlterationType: 'DELETION',
                    gene: { entrezGeneId: 673 },
                }),
                expect.objectContaining({
                    id: '7157_AMPLIFICATION',
                    copyNameAlterationType: 'AMPLIFICATION',
                    gene: { entrezGeneId: 7157 },
                }),
                expect.objectContaining({
                    id: '7157_GAIN',
                    copyNameAlterationType: 'GAIN',
                    gene: { entrezGeneId: 7157 },
                }),
            ]);
        });
    });

    describe('buildOncoKbStructuralVariantItems', () => {
        it('deduplicates and sorts structural variant items deterministically', () => {
            const variants: StructuralVariantDetail[] = [
                {
                    gene1: 'ALK',
                    gene2: 'EML4',
                    site1EntrezGeneId: 238,
                    site2EntrezGeneId: 27436,
                    variantClass: 'FUSION',
                },
                {
                    gene1: 'BCR',
                    gene2: 'ABL1',
                    site1EntrezGeneId: 613,
                    site2EntrezGeneId: 25,
                    variantClass: 'FUSION',
                },
                {
                    gene1: 'ALK',
                    gene2: 'EML4',
                    site1EntrezGeneId: 238,
                    site2EntrezGeneId: 27436,
                    variantClass: 'FUSION',
                },
            ];

            expect(buildOncoKbStructuralVariantItems(variants)).toEqual([
                expect.objectContaining({
                    geneA: { entrezGeneId: 238 },
                    geneB: { entrezGeneId: 27436 },
                    structuralVariantType: 'FUSION',
                }),
                expect.objectContaining({
                    geneA: { entrezGeneId: 613 },
                    geneB: { entrezGeneId: 25 },
                    structuralVariantType: 'FUSION',
                }),
            ]);
        });
    });
});
