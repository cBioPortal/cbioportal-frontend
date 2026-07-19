import {
    buildCnaBySample,
    buildMutationMaps,
    buildStructuralVariantBySample,
    mergeClinicalDataIntoSamples,
} from './wsiDataMergeUtils';
import { Sample } from './wsiViewerTypes';

function makeSample(sampleId: string): Sample {
    return {
        sample_id: sampleId,
        cancer_type: '',
        cancer_type_detailed: '',
        oncotree_code: '',
        primary_site: '',
        sample_type: '',
        parts: [],
    };
}

describe('wsiDataMergeUtils', () => {
    describe('mergeClinicalDataIntoSamples', () => {
        it('hydrates sample metadata from aliased clinical attributes', () => {
            const samples = [makeSample('S-1')];

            mergeClinicalDataIntoSamples(samples, [
                {
                    sampleId: 'S-1',
                    clinicalAttributeId: 'CVR_TUMOR_PURITY',
                    value: '0.71',
                },
                {
                    sampleId: 'S-1',
                    clinicalAttributeId: 'TMB_NONSYNONYMOUS',
                    value: '12.3',
                },
                {
                    sampleId: 'S-1',
                    clinicalAttributeId: 'CVR_ONCOGENIC_MUTATIONS',
                    value: 'KRAS G12D',
                },
                {
                    sampleId: 'S-1',
                    clinicalAttributeId: 'CVR_NUM_ONCOGENIC_MUTATIONS',
                    value: '4',
                },
                {
                    sampleId: 'S-1',
                    clinicalAttributeId: 'METASTATIC_SITE',
                    value: 'Liver',
                },
            ]);

            expect(samples[0].tumor_purity).toBe('0.71');
            expect(samples[0].tmb_score).toBe('12.3');
            expect(samples[0].oncogenic_mutations).toBe('KRAS G12D');
            expect(samples[0].num_oncogenic_mutations).toBe('4');
            expect(samples[0].metastatic_site).toBe('Liver');
        });

        it('hydrates sample timepoint fields from clinical attrs and ignores non-numeric days', () => {
            const samples = [makeSample('S-1'), makeSample('S-2')];

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
                {
                    sampleId: 'S-2',
                    clinicalAttributeId: 'WSI_TIMEPOINT_DAYS',
                    value: 'not-a-number',
                },
                {
                    sampleId: 'S-2',
                    clinicalAttributeId: 'WSI_TIMEPOINT_SOURCE',
                    value: 'Sequencing date',
                },
            ]);

            expect(samples[0].sample_timepoint_days).toBe(-18);
            expect(samples[0].sample_timepoint_source).toBe('Procedure date');
            expect(samples[1].sample_timepoint_days).toBeUndefined();
            expect(samples[1].sample_timepoint_source).toBe('Sequencing date');
        });
    });

    describe('molecular merge helpers', () => {
        it('deduplicates duplicate mutation rows per sample and keeps the highest VAF', () => {
            const result = buildMutationMaps([
                {
                    sampleId: 'S-1',
                    gene: { hugoGeneSymbol: 'KRAS', entrezGeneId: 3845 },
                    proteinChange: 'G12D',
                    mutationType: 'Missense_Mutation',
                    tumorAltCount: 2,
                    tumorRefCount: 8,
                    proteinPosStart: 12,
                    proteinPosEnd: 12,
                },
                {
                    sampleId: 'S-1',
                    gene: { hugoGeneSymbol: 'KRAS', entrezGeneId: 3845 },
                    proteinChange: 'G12D',
                    mutationType: 'Missense_Mutation',
                    tumorAltCount: 6,
                    tumorRefCount: 4,
                    proteinPosStart: 12,
                    proteinPosEnd: 12,
                },
            ] as any);

            expect(result.allMutsBySample.get('S-1')).toEqual([
                { token: 'KRAS p.G12D', vaf: 60 },
            ]);
            expect(
                result.detailsBySample.get('S-1')?.get('KRAS p.G12D')?.vaf
            ).toBe(60);
        });

        it('orders equal-VAF mutation rows deterministically', () => {
            const result = buildMutationMaps([
                {
                    sampleId: 'S-1',
                    gene: { hugoGeneSymbol: 'TP53' },
                    proteinChange: 'R248Q',
                    mutationType: 'Missense_Mutation',
                    tumorAltCount: 5,
                    tumorRefCount: 5,
                },
                {
                    sampleId: 'S-1',
                    gene: { hugoGeneSymbol: 'APC' },
                    proteinChange: 'S1465fs',
                    mutationType: 'Frame_Shift_Del',
                    tumorAltCount: 5,
                    tumorRefCount: 5,
                },
            ] as any);

            expect(result.allMutsBySample.get('S-1')).toEqual([
                { token: 'APC p.S1465fs', vaf: 50 },
                { token: 'TP53 p.R248Q', vaf: 50 },
            ]);
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
                ] as any,
                null
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
