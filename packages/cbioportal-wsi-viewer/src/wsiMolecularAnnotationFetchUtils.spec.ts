/**
 * @jest-environment jsdom
 */
import {
    buildCivicMutationSpecs,
    buildOncoKbCnaItems,
    buildOncoKbMutationItems,
    buildOncoKbStructuralVariantItems,
    mutationOncoKbId,
    oncoKbReferenceGenome,
} from './wsiMolecularAnnotationFetchUtils';
import { MutationDetail } from './wsiViewerTypes';

function mutation(
    gene: string,
    entrezGeneId: number,
    proteinChange: string
): MutationDetail {
    return {
        token: `${gene} ${proteinChange}`,
        gene,
        proteinChange,
        entrezGeneId,
        consequence: 'missense_variant',
    };
}

describe('wsiMolecularAnnotationFetchUtils', () => {
    describe('oncoKbReferenceGenome', () => {
        it("maps the study's reference genome to OncoKB's build", () => {
            expect(oncoKbReferenceGenome('hg19')).toBe('GRCh37');
            expect(oncoKbReferenceGenome('hg38')).toBe('GRCh38');
            expect(oncoKbReferenceGenome('GRCh38')).toBe('GRCh38');
            expect(oncoKbReferenceGenome(null)).toBe('GRCh37');
        });
    });

    describe('buildOncoKbMutationItems', () => {
        it('queries each variant once per tumor type, with the genome', () => {
            const tp53 = mutation('TP53', 7157, 'R175H');
            const items = buildOncoKbMutationItems(
                [
                    { entry: tp53, tumorType: 'COAD' },
                    { entry: tp53, tumorType: 'COAD' },
                    { entry: tp53, tumorType: null },
                    {
                        entry: mutation('BRAF', 673, 'V600E'),
                        tumorType: 'COAD',
                    },
                ],
                'GRCh38'
            );

            expect(items).toEqual([
                {
                    id: '673_V600E_missense_variant_COAD',
                    alteration: 'V600E',
                    consequence: 'missense_variant',
                    gene: { entrezGeneId: 673 },
                    proteinStart: undefined,
                    proteinEnd: undefined,
                    referenceGenome: 'GRCh38',
                    tumorType: 'COAD',
                },
                expect.objectContaining({
                    id: '7157_R175H_missense_variant_',
                    tumorType: null,
                }),
                expect.objectContaining({
                    id: '7157_R175H_missense_variant_COAD',
                    tumorType: 'COAD',
                }),
            ]);
        });

        it('skips mutations without a gene ID or protein change', () => {
            expect(
                mutationOncoKbId({ ...mutation('TERT', 7015, '') }, null)
            ).toBeNull();
            expect(
                buildOncoKbMutationItems(
                    [
                        {
                            entry: {
                                ...mutation('KRAS', 3845, 'G12D'),
                                entrezGeneId: undefined,
                            },
                            tumorType: null,
                        },
                    ],
                    'GRCh37'
                )
            ).toEqual([]);
        });
    });

    describe('buildCivicMutationSpecs', () => {
        it('deduplicates and sorts the specs', () => {
            expect(
                buildCivicMutationSpecs([
                    mutation('TP53', 7157, 'R175H'),
                    mutation('BRAF', 673, 'V600E'),
                    mutation('TP53', 7157, 'R175H'),
                    mutation('NF1', 4763, ''),
                ])
            ).toEqual([
                { gene: { hugoGeneSymbol: 'BRAF' }, proteinChange: 'V600E' },
                { gene: { hugoGeneSymbol: 'TP53' }, proteinChange: 'R175H' },
            ]);
        });
    });

    describe('buildOncoKbCnaItems', () => {
        it('queries each alteration once per tumor type, with the genome', () => {
            expect(
                buildOncoKbCnaItems(
                    [
                        {
                            entry: {
                                gene: 'ERBB2',
                                entrezGeneId: 2064,
                                cnaValue: 2,
                            },
                            tumorType: 'BRCA',
                        },
                        {
                            entry: {
                                gene: 'ERBB2',
                                entrezGeneId: 2064,
                                cnaValue: 2,
                            },
                            tumorType: 'BRCA',
                        },
                        {
                            entry: { gene: 'CDKN2A', cnaValue: -2 },
                            tumorType: 'BRCA',
                        },
                    ],
                    'GRCh37'
                )
            ).toEqual([
                {
                    id: '2064_AMPLIFICATION_BRCA',
                    copyNameAlterationType: 'AMPLIFICATION',
                    gene: { entrezGeneId: 2064 },
                    referenceGenome: 'GRCh37',
                    tumorType: 'BRCA',
                },
            ]);
        });
    });

    describe('buildOncoKbStructuralVariantItems', () => {
        it('queries fusions with both genes and the tumor type', () => {
            const [item] = buildOncoKbStructuralVariantItems(
                [
                    {
                        entry: {
                            gene1: 'EML4',
                            gene2: 'ALK',
                            site1EntrezGeneId: 27436,
                            site2EntrezGeneId: 238,
                            variantClass: 'FUSION',
                        },
                        tumorType: 'LUAD',
                    },
                ],
                'GRCh37'
            );

            expect(item).toEqual(
                expect.objectContaining({
                    geneA: { entrezGeneId: 27436 },
                    geneB: { entrezGeneId: 238 },
                    functionalFusion: true,
                    referenceGenome: 'GRCh37',
                    tumorType: 'LUAD',
                })
            );
            expect(item.id).toContain('LUAD');
        });
    });
});
