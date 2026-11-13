/**
 * @jest-environment jsdom
 */
import {
    applyVariantCounts,
    buildCnaBySample,
    buildMutationsBySample,
    buildStructuralVariantBySample,
    mergeClinicalDataIntoSamples,
} from './wsiDataMergeUtils';
import { Sample } from './wsiViewerTypes';

function makeSample(sampleId: string): Sample {
    return { sample_id: sampleId, parts: [] };
}

describe('wsiDataMergeUtils', () => {
    describe('mergeClinicalDataIntoSamples', () => {
        it('reads the standard cBioPortal sample attributes', () => {
            const samples = [makeSample('S-1')];
            const datum = (clinicalAttributeId: string, value: string) => ({
                sampleId: 'S-1',
                clinicalAttributeId,
                value,
            });

            mergeClinicalDataIntoSamples(samples, [
                datum('TUMOR_PURITY', '0.71'),
                datum('TMB_NONSYNONYMOUS', '12.3'),
                datum('MSI_TYPE', 'Stable'),
                datum('MSI_SCORE', '0.4'),
                datum('METASTATIC_SITE', 'Liver'),
                datum('ONCOTREE_CODE', 'COAD'),
                datum('SAMPLE_TYPE', ''),
            ]);

            expect(samples[0]).toEqual({
                sample_id: 'S-1',
                parts: [],
                tumor_purity: '0.71',
                tmb_score: '12.3',
                msi_type: 'Stable',
                msi_score: '0.4',
                metastatic_site: 'Liver',
                oncotree_code: 'COAD',
            });
        });

        it('ignores other attributes', () => {
            const samples = [makeSample('S-1')];

            mergeClinicalDataIntoSamples(
                samples,
                ['PURITY_ESTIMATE', 'TMB_SCORE', 'MUTATIONS'].map(
                    clinicalAttributeId => ({
                        sampleId: 'S-1',
                        clinicalAttributeId,
                        value: '1',
                    })
                )
            );

            expect(samples[0]).toEqual(makeSample('S-1'));
        });

        it('ignores legacy WSI timing attributes', () => {
            const samples = [makeSample('S-1')];

            mergeClinicalDataIntoSamples(samples, [
                {
                    sampleId: 'S-1',
                    clinicalAttributeId: 'WSI_TIMEPOINT_DAYS',
                    value: '-18',
                },
                {
                    sampleId: 'S-1',
                    clinicalAttributeId: 'WSI_TIMEPOINT_SOURCE',
                    value: 'Procedure date',
                },
            ]);

            expect(samples[0]).not.toHaveProperty('WSI_TIMEPOINT_DAYS');
            expect(samples[0]).not.toHaveProperty('sample_timepoint_days');
        });
    });

    describe('molecular merge helpers', () => {
        it('deduplicates duplicate mutation rows per sample and keeps the highest VAF', () => {
            const row = {
                sampleId: 'S-1',
                gene: { hugoGeneSymbol: 'KRAS', entrezGeneId: 3845 },
                proteinChange: 'G12D',
                mutationType: 'Missense_Mutation',
                proteinPosStart: 12,
                proteinPosEnd: 12,
            };
            const result = buildMutationsBySample([
                { ...row, tumorAltCount: 2, tumorRefCount: 8 },
                { ...row, tumorAltCount: 6, tumorRefCount: 4 },
            ]);

            expect(result.get('S-1')).toEqual([
                expect.objectContaining({
                    token: 'KRAS G12D',
                    gene: 'KRAS',
                    proteinChange: 'G12D',
                    vaf: 60,
                    type: 'Missense',
                }),
            ]);
        });

        it('orders equal-VAF mutation rows deterministically', () => {
            const result = buildMutationsBySample([
                {
                    sampleId: 'S-1',
                    gene: { hugoGeneSymbol: 'TP53' },
                    proteinChange: 'p.R248Q',
                    tumorAltCount: 5,
                    tumorRefCount: 5,
                },
                {
                    sampleId: 'S-1',
                    gene: { hugoGeneSymbol: 'APC' },
                    proteinChange: 'S1465fs',
                    tumorAltCount: 5,
                    tumorRefCount: 5,
                },
            ]);

            expect(result.get('S-1')!.map(mutation => mutation.token)).toEqual([
                'APC S1465fs',
                'TP53 R248Q',
            ]);
        });

        it('keeps non-protein changes as they are and tolerates a missing one', () => {
            const result = buildMutationsBySample([
                {
                    sampleId: 'S-1',
                    gene: { hugoGeneSymbol: 'TERT' },
                    proteinChange: 'Promoter',
                },
                {
                    sampleId: 'S-1',
                    gene: { hugoGeneSymbol: 'MET' },
                    proteinChange: 'MUTATED',
                },
                {
                    sampleId: 'S-1',
                    gene: { hugoGeneSymbol: 'NF1' },
                    proteinChange: null,
                },
            ]);

            expect(
                result
                    .get('S-1')!
                    .map(mutation => [mutation.token, mutation.proteinChange])
            ).toEqual([
                ['MET MUTATED', 'MUTATED'],
                ['NF1', ''],
                ['TERT Promoter', 'Promoter'],
            ]);
            expect(result.get('S-1')![0].vaf).toBeUndefined();
        });

        it('sets the study counts of mutations', () => {
            const sample: Sample = {
                ...makeSample('S-1'),
                mutations: buildMutationsBySample([
                    {
                        sampleId: 'S-1',
                        gene: { hugoGeneSymbol: 'KRAS', entrezGeneId: 3845 },
                        proteinChange: 'G12D',
                        keyword: 'KRAS G12 missense',
                    },
                ]).get('S-1'),
            };

            applyVariantCounts([sample], mutation => ({
                entrezGeneId: mutation.entrezGeneId!,
                keyword: mutation.keyword!,
                numberOfSamples: 120,
                numberOfSamplesWithKeyword: 3,
            }));

            expect(sample.mutations![0]).toEqual(
                expect.objectContaining({
                    cohortAlteredCount: 3,
                    cohortProfiledCount: 120,
                })
            );
        });

        it('deduplicates duplicate CNA rows per sample', () => {
            const result = buildCnaBySample(
                [
                    {
                        sampleId: 'S-1',
                        value: 2,
                        gene: {
                            hugoGeneSymbol: 'EGFR',
                            entrezGeneId: 1956,
                        },
                    },
                    {
                        sampleId: 'S-1',
                        value: 2,
                        gene: {
                            hugoGeneSymbol: 'EGFR',
                            entrezGeneId: 1956,
                        },
                    },
                ],
                () => undefined
            );

            expect(result.get('S-1')).toHaveLength(1);
            expect(result.get('S-1')?.[0].gene).toBe('EGFR');
        });

        it('deduplicates duplicate structural variant rows per sample', () => {
            const result = buildStructuralVariantBySample([
                {
                    sampleId: 'S-1',
                    site1HugoSymbol: 'EML4',
                    site2HugoSymbol: 'ALK',
                    site1EntrezGeneId: 27436,
                    site2EntrezGeneId: 238,
                    variantClass: 'Fusion',
                    tumorVariantCount: 5,
                },
                {
                    sampleId: 'S-1',
                    site1HugoSymbol: 'EML4',
                    site2HugoSymbol: 'ALK',
                    site1EntrezGeneId: 27436,
                    site2EntrezGeneId: 238,
                    variantClass: 'Fusion',
                    tumorVariantCount: 5,
                },
            ] as any);

            expect(result.get('S-1')).toHaveLength(1);
            expect(result.get('S-1')?.[0].gene1).toBe('EML4');
            expect(result.get('S-1')?.[0].gene2).toBe('ALK');
        });
    });
});
