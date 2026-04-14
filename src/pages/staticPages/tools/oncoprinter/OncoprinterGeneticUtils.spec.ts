import { assert } from 'chai';
import {
    genomicLineToType2,
    parseGeneticInput,
} from './OncoprinterGeneticUtils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';

describe('OncoprinterGeneticUtils', () => {
    describe('parseGeneticInput', () => {
        it('skips header line', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sample gene alteration type\nsample_id TP53 FUSION FUSION\n'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sample_id',
                            hugoGeneSymbol: 'TP53',
                            alteration: 'structuralVariant',
                            eventInfo: 'FUSION',
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses fusion command correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sample_id TP53 FUSION FUSION'),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sample_id',
                            hugoGeneSymbol: 'TP53',
                            alteration: 'structuralVariant',
                            eventInfo: 'FUSION',
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('throws an error if fusion is not specified correctly', () => {
            try {
                const parsed = parseGeneticInput(
                    'sample_id TP53 FUSION apsoidjfpaos'
                );
                assert(false);
            } catch (e) {}
        });
        it('parses germline mutation correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE'),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'BRCA1',
                            alteration: 'missense',
                            proteinChange: 'Q1538A',
                            isGermline: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses driver mutation correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sampleid	BRCA1	Q1538A	TRUNC_DRIVER'),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'BRCA1',
                            alteration: 'trunc',
                            proteinChange: 'Q1538A',
                            isCustomDriver: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses germline & driver mutation correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE_DRIVER'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'BRCA1',
                            alteration: 'missense',
                            proteinChange: 'Q1538A',
                            isGermline: true,
                            isCustomDriver: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('throws an error for an invalid mutation modifier', () => {
            try {
                const parsed = parseGeneticInput(
                    'sample_id TP53 protienchange MISSENSE_JIDFPAOIJFP'
                );
                assert(false);
            } catch (e) {}
        });
        it('parses a line with a given track name correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE_DRIVER	testTrackName'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'BRCA1',
                            alteration: 'missense',
                            proteinChange: 'Q1538A',
                            isGermline: true,
                            isCustomDriver: true,
                            trackName: 'testTrackName',
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses fusion correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sampleid	ACY1-BAP1	ACY1-BAP1_fusion	FUSION'),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'ACY1-BAP1',
                            alteration: 'structuralVariant',
                            eventInfo: 'ACY1-BAP1_fusion',
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses driver fusion correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	ACY1-BAP1	ACY1-BAP1_fusion	FUSION_DRIVER'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'ACY1-BAP1',
                            alteration: 'structuralVariant',
                            eventInfo: 'ACY1-BAP1_fusion',
                            isCustomDriver: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses germline fusion correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	ACY1-BAP1	ACY1-BAP1_fusion	FUSION_GERMLINE'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'ACY1-BAP1',
                            alteration: 'structuralVariant',
                            eventInfo: 'ACY1-BAP1_fusion',
                            isGermline: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses germline & driver fusion correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	ACY1-BAP1	ACY1-BAP1_fusion	FUSION_GERMLINE_DRIVER'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'ACY1-BAP1',
                            alteration: 'structuralVariant',
                            eventInfo: 'ACY1-BAP1_fusion',
                            isGermline: true,
                            isCustomDriver: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });

        // Genomic location format (type 3)
        it('parses genomic location format (type 3) without header', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'TCGA-01-0001\t17\t7577539\t7577539\tG\tA'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'TCGA-01-0001',
                            chromosome: '17',
                            startPosition: 7577539,
                            endPosition: 7577539,
                            referenceAllele: 'G',
                            variantAllele: 'A',
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses genomic location format (type 3) with header', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'Sample\tChromosome\tStart_Position\tEnd_Position\tReference_Allele\tVariant_Allele\nTCGA-01-0001\t17\t7577539\t7577539\tG\tA'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'TCGA-01-0001',
                            chromosome: '17',
                            startPosition: 7577539,
                            endPosition: 7577539,
                            referenceAllele: 'G',
                            variantAllele: 'A',
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses genomic location format (type 3) with chr prefix', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'TCGA-01-0001\tchr17\t7577539\t7577539\tG\tA'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'TCGA-01-0001',
                            chromosome: '17',
                            startPosition: 7577539,
                            endPosition: 7577539,
                            referenceAllele: 'G',
                            variantAllele: 'A',
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses genomic location format with alias header columns (Chr, Start, End, Ref, Alt)', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'Sample\tChr\tStart\tEnd\tRef\tAlt\nTCGA-01-0001\t17\t7577539\t7577539\tG\tA'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'TCGA-01-0001',
                            chromosome: '17',
                            startPosition: 7577539,
                            endPosition: 7577539,
                            referenceAllele: 'G',
                            variantAllele: 'A',
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('returns parse error for invalid start position in genomic format', () => {
            const result = parseGeneticInput(
                'TCGA-01-0001\t17\tNOT_A_NUMBER\t7577539\tG\tA'
            );
            assert.equal(result.parseSuccess, false);
            assert.include(
                result.error!,
                'Start position "NOT_A_NUMBER" is not a valid integer'
            );
        });
        it('mixes type 1 and type 3 lines correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'TCGA-UNALTERED\nTCGA-01-0001\t17\t7577539\t7577539\tG\tA'
                ),
                {
                    parseSuccess: true,
                    result: [
                        { sampleId: 'TCGA-UNALTERED' },
                        {
                            sampleId: 'TCGA-01-0001',
                            chromosome: '17',
                            startPosition: 7577539,
                            endPosition: 7577539,
                            referenceAllele: 'G',
                            variantAllele: 'A',
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses genomic location format with Cancer_Type column (7-col header)', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'Sample_ID\tCancer_Type\tChromosome\tStart_Position\tEnd_Position\tReference_Allele\tVariant_Allele\nTCGA-01-0001\tOvarian\t17\t7577539\t7577539\tG\tA'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'TCGA-01-0001',
                            chromosome: '17',
                            startPosition: 7577539,
                            endPosition: 7577539,
                            referenceAllele: 'G',
                            variantAllele: 'A',
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses genomic location format with multi-word Cancer_Type value (tab-delimited)', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'Sample_ID\tCancer_Type\tChromosome\tStart_Position\tEnd_Position\tReference_Allele\tVariant_Allele\n' +
                        'TCGA-49-4494-01\tLung Adenocarcinoma\t7\t55249071\t55249071\tC\tT\n' +
                        'TCGA-L9-A50W-01\tLung Adenocarcinoma\t7\t55249071\t55249071\tC\tT'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'TCGA-49-4494-01',
                            chromosome: '7',
                            startPosition: 55249071,
                            endPosition: 55249071,
                            referenceAllele: 'C',
                            variantAllele: 'T',
                        },
                        {
                            sampleId: 'TCGA-L9-A50W-01',
                            chromosome: '7',
                            startPosition: 55249071,
                            endPosition: 55249071,
                            referenceAllele: 'C',
                            variantAllele: 'T',
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('skips 7-col header line with Cancer_Type', () => {
            const result = parseGeneticInput(
                'Sample_ID\tCancer_Type\tChromosome\tStart_Position\tEnd_Position\tReference_Allele\tVariant_Allele'
            );
            assert.equal(result.parseSuccess, true);
            assert.deepEqual(result.result, []);
        });
        it('parses 7-col genomic rows without a header (Cancer_Type column unconditionally accepted)', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'TCGA-01-0001\tOvarian\t17\t7577539\t7577539\tG\tA'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'TCGA-01-0001',
                            chromosome: '17',
                            startPosition: 7577539,
                            endPosition: 7577539,
                            referenceAllele: 'G',
                            variantAllele: 'A',
                        },
                    ],
                    error: undefined,
                }
            );
        });
    });

    describe('genomicLineToType2', () => {
        it('converts a type-3 line to type-2 using Genome Nexus annotation', () => {
            const line = {
                sampleId: 'TCGA-01-0001',
                chromosome: '17',
                startPosition: 7577539,
                endPosition: 7577539,
                referenceAllele: 'G',
                variantAllele: 'A',
            };
            const annotation = {
                annotation_summary: {
                    transcriptConsequenceSummary: {
                        hugoGeneSymbol: 'TP53',
                        hgvspShort: 'p.R248W',
                        variantClassification: 'Missense_Mutation',
                        entrezGeneId: '7157',
                        transcriptId: 'ENST00000269305',
                    },
                },
            } as Partial<VariantAnnotation> as VariantAnnotation;

            const result = genomicLineToType2(line, annotation);
            assert.isNotNull(result);
            assert.equal(result!.sampleId, 'TCGA-01-0001');
            assert.equal(result!.hugoGeneSymbol, 'TP53');
            assert.equal(result!.proteinChange, 'p.R248W');
            assert.equal(result!.alteration, 'missense');
        });
        it('returns null when annotation has no transcript consequence', () => {
            const line = {
                sampleId: 'TCGA-01-0001',
                chromosome: '17',
                startPosition: 7577539,
                endPosition: 7577539,
                referenceAllele: 'G',
                variantAllele: 'A',
            };
            const annotation = {
                annotation_summary: {},
            } as Partial<VariantAnnotation> as VariantAnnotation;

            const result = genomicLineToType2(line, annotation);
            assert.isNull(result);
        });
    });
});
