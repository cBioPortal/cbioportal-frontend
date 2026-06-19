import { assert } from 'chai';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import { makeMutationHeatmapData } from './MutationOncoprintUtils';
import { MutationOncoprintMode } from './MutationOncoprint';
import { generateMutationIdByGeneAndProteinChangeAndEvent } from '../../../../shared/lib/StoreUtils';
import { CoverageInformation } from '../../../../shared/lib/GenePanelUtils';
import { MutationStatus } from '../PatientViewMutationsTabUtils';
import { assertDeepEqualInAnyOrder } from '../../../../shared/lib/SpecUtils';

describe('MutationOncoprintUtils', () => {
    describe('makeMutationHeatmapData', () => {
        function makeSample(i: number) {
            return {
                sampleId: `sample${i}`,
                patientId: 'patient',
                uniqueSampleKey: `uniqueKey${i}`,
                studyId: 'study',
            } as Sample;
        }

        function makeMutation(
            sampleI: number,
            hugoGeneSymbol: string,
            proteinChange: string,
            vafPercent?: number,
            mutationStatus: string = ''
        ) {
            return {
                gene: {
                    hugoGeneSymbol,
                },
                mutationStatus,
                uniqueSampleKey: `uniqueKey${sampleI}`,
                uniquePatientKey: `uniquePatientKey`,
                sampleId: `sample${sampleI}`,
                patientId: 'patient',
                studyId: 'study',
                proteinChange,
                chr: '1',
                startPosition: 0,
                endPosition: 0,
                referenceAllele: '',
                variantAllele: '',
                tumorAltCount: vafPercent,
                tumorRefCount:
                    vafPercent === undefined ? undefined : 100 - vafPercent,
                molecularProfileId: 'mutations',
            } as Mutation;
        }

        function makeOncoprintData(
            sampleI: number,
            hugoGeneSymbol: string,
            proteinChange: string,
            vafPercent: number | undefined,
            mutationStatus: MutationStatus,
            mutationMutationStatus: string = ''
        ) {
            const mutation = makeMutation(
                sampleI,
                hugoGeneSymbol,
                proteinChange,
                vafPercent,
                mutationMutationStatus
            );
            return {
                profile_data:
                    vafPercent === undefined ? null : vafPercent / 100,
                sample: `sample${sampleI}`,
                patient: 'patient',
                study_id: 'study',
                hugo_gene_symbol: '',
                mutation,
                uid: generateMutationIdByGeneAndProteinChangeAndEvent(mutation),
                mutationId: generateMutationIdByGeneAndProteinChangeAndEvent(
                    mutation
                ),
                mutationStatus,
            };
        }

        function makeOncoprintData_NoData(
            sampleI: number,
            mutation: Mutation,
            mutationStatus: MutationStatus
        ) {
            return {
                profile_data: null,
                sample: `sample${sampleI}`,
                patient: 'patient',
                study_id: 'study',
                hugo_gene_symbol: '',
                mutation,
                uid: generateMutationIdByGeneAndProteinChangeAndEvent(mutation),
                mutationId: generateMutationIdByGeneAndProteinChangeAndEvent(
                    mutation
                ),
                mutationStatus,
                na: mutationStatus === MutationStatus.NOT_PROFILED,
            };
        }

        function makeMutationModeOncoprintData(
            sampleI: number,
            hugoGeneSymbol: string,
            proteinChange: string,
            vafPercent: number | undefined,
            mutationStatus: MutationStatus,
            mutationMutationStatus: string = ''
        ) {
            const d = makeOncoprintData(
                sampleI,
                hugoGeneSymbol,
                proteinChange,
                vafPercent,
                mutationStatus,
                mutationMutationStatus
            );
            d.uid = d.sample;
            return d;
        }

        function makeMutationModeOncoprintData_NoData(
            sampleI: number,
            mutation: Mutation,
            mutationStatus: MutationStatus
        ) {
            const d = makeOncoprintData_NoData(
                sampleI,
                mutation,
                mutationStatus
            );
            d.uid = d.sample;
            return d;
        }

        function makeCoverageInfo(
            profiledIs: number[],
            unprofiledIs: number[],
            unprofiledByGene: { i: number; notProfiledByGene: any }[] = []
        ) {
            const ret: CoverageInformation = { samples: {}, patients: {} };
            for (const i of profiledIs) {
                ret.samples[`uniqueKey${i}`] = {
                    byGene: {},
                    allGenes: [
                        {
                            molecularProfileId: 'mutations',
                            patientId: 'patient',
                            profiled: true,
                            sampleId: `sample${i}`,
                            studyId: 'study',
                            uniquePatientKey: `uniquePatientKey`,
                            uniqueSampleKey: `uniqueKey${i}`,
                        },
                    ],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [],
                };
            }
            for (const i of unprofiledIs) {
                ret.samples[`uniqueKey${i}`] = {
                    byGene: {},
                    notProfiledAllGenes: [
                        {
                            molecularProfileId: 'mutations',
                            patientId: 'patient',
                            profiled: false,
                            sampleId: `sample${i}`,
                            studyId: 'study',
                            uniquePatientKey: `uniquePatientKey`,
                            uniqueSampleKey: `uniqueKey${i}`,
                        },
                    ],
                    notProfiledByGene: {},
                    allGenes: [],
                };
            }
            for (const obj of unprofiledByGene) {
                ret.samples[`uniqueKey${obj.i}`] = {
                    byGene: {},
                    allGenes: [],
                    notProfiledByGene: obj.notProfiledByGene,
                    notProfiledAllGenes: [],
                };
            }
            return ret;
        }

        describe('sample track mode', () => {
            it('handles case of empty data', () => {
                assert.deepEqual(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [],
                        makeCoverageInfo([1, 2, 3], []),
                        MutationOncoprintMode.SAMPLE_TRACKS
                    ),
                    {}
                );
            });
            it('returns correct result when every sample has vaf data for every mutation', () => {
                assertDeepEqualInAnyOrder(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(
                                1,
                                'gene2',
                                'proteinchange2',
                                30,
                                'uncalled'
                            ),
                            makeMutation(1, 'gene3', 'proteinchange3', 40),

                            makeMutation(2, 'gene1', 'proteinchange1', 10),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(2, 'gene3', 'proteinchange3', 60),

                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                            makeMutation(3, 'gene2', 'proteinchange2', 25),
                            makeMutation(3, 'gene3', 'proteinchange3', 80),
                        ],
                        makeCoverageInfo([1, 2, 3], []),
                        MutationOncoprintMode.SAMPLE_TRACKS
                    ),
                    {
                        sample1: [
                            makeOncoprintData(
                                1,
                                'gene1',
                                'proteinchange1',
                                20,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                1,
                                'gene2',
                                'proteinchange2',
                                30,
                                MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED,
                                'uncalled'
                            ),
                            makeOncoprintData(
                                1,
                                'gene3',
                                'proteinchange3',
                                40,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                        ],
                        sample2: [
                            makeOncoprintData(
                                2,
                                'gene1',
                                'proteinchange1',
                                10,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                2,
                                'gene2',
                                'proteinchange2',
                                50,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                2,
                                'gene3',
                                'proteinchange3',
                                60,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                        ],
                        sample3: [
                            makeOncoprintData(
                                3,
                                'gene1',
                                'proteinchange1',
                                15,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                3,
                                'gene2',
                                'proteinchange2',
                                25,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                3,
                                'gene3',
                                'proteinchange3',
                                80,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                        ],
                    }
                );
            });
            it('returns correct result when every sample has data for every mutation, but not all have VAF', () => {
                assertDeepEqualInAnyOrder(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(1, 'gene2', 'proteinchange2', 30),
                            makeMutation(1, 'gene3', 'proteinchange3', 40),

                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(2, 'gene3', 'proteinchange3'),

                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                            makeMutation(3, 'gene2', 'proteinchange2'),
                            makeMutation(3, 'gene3', 'proteinchange3', 80),
                        ],
                        makeCoverageInfo([1, 2, 3], []),
                        MutationOncoprintMode.SAMPLE_TRACKS
                    ),
                    {
                        sample1: [
                            makeOncoprintData(
                                1,
                                'gene1',
                                'proteinchange1',
                                20,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                1,
                                'gene2',
                                'proteinchange2',
                                30,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                1,
                                'gene3',
                                'proteinchange3',
                                40,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                        ],
                        sample2: [
                            makeOncoprintData(
                                2,
                                'gene1',
                                'proteinchange1',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeOncoprintData(
                                2,
                                'gene2',
                                'proteinchange2',
                                50,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                2,
                                'gene3',
                                'proteinchange3',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                        ],
                        sample3: [
                            makeOncoprintData(
                                3,
                                'gene1',
                                'proteinchange1',
                                15,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                3,
                                'gene2',
                                'proteinchange2',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeOncoprintData(
                                3,
                                'gene3',
                                'proteinchange3',
                                80,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                        ],
                    }
                );
            });
            it('returns correct result when not every sample has data for every mutation', () => {
                assertDeepEqualInAnyOrder(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(1, 'gene3', 'proteinchange3', 40),

                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(2, 'gene3', 'proteinchange3'),

                            makeMutation(3, 'gene2', 'proteinchange2'),
                        ],
                        makeCoverageInfo([1, 2, 3], []),
                        MutationOncoprintMode.SAMPLE_TRACKS
                    ),
                    {
                        sample1: [
                            makeOncoprintData(
                                1,
                                'gene1',
                                'proteinchange1',
                                20,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                1,
                                'gene3',
                                'proteinchange3',
                                40,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData_NoData(
                                1,
                                makeMutation(3, 'gene2', 'proteinchange2'),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                        ],
                        sample2: [
                            makeOncoprintData(
                                2,
                                'gene1',
                                'proteinchange1',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeOncoprintData(
                                2,
                                'gene2',
                                'proteinchange2',
                                50,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                2,
                                'gene3',
                                'proteinchange3',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                        ],
                        sample3: [
                            makeOncoprintData(
                                3,
                                'gene2',
                                'proteinchange2',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene1', 'proteinchange1'),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                            makeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene3', 'proteinchange3'),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                        ],
                    }
                );
            });
            it('returns correct result when one sample has no data for any mutation', () => {
                assertDeepEqualInAnyOrder(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(1, 'gene3', 'proteinchange3', 40),

                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                        ],
                        makeCoverageInfo([1, 2, 3], []),
                        MutationOncoprintMode.SAMPLE_TRACKS
                    ),
                    {
                        sample1: [
                            makeOncoprintData(
                                1,
                                'gene1',
                                'proteinchange1',
                                20,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                1,
                                'gene3',
                                'proteinchange3',
                                40,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData_NoData(
                                1,
                                makeMutation(2, 'gene2', 'proteinchange2', 50),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                        ],
                        sample2: [
                            makeOncoprintData(
                                2,
                                'gene1',
                                'proteinchange1',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeOncoprintData(
                                2,
                                'gene2',
                                'proteinchange2',
                                50,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                2,
                                'gene3',
                                'proteinchange3',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                        ],
                        sample3: [
                            makeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene1', 'proteinchange1'),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                            makeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene2', 'proteinchange2', 50),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                            makeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene3', 'proteinchange3'),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                        ],
                    }
                );
            });
            it('returns correct result when some not profiled', () => {
                const actual = makeMutationHeatmapData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        makeMutation(1, 'gene1', 'proteinchange1', 20),
                        makeMutation(1, 'gene3', 'proteinchange3', 40),

                        makeMutation(2, 'gene3', 'proteinchange3'),

                        makeMutation(3, 'gene2', 'proteinchange2', 30),
                    ],
                    makeCoverageInfo(
                        [1, 3],
                        [],
                        [
                            {
                                i: 2,
                                notProfiledByGene: {
                                    gene1: {
                                        molecularProfileId: 'mutations',
                                        patientId: 'patient',
                                        profiled: false,
                                        sampleId: `sample2`,
                                        studyId: 'study',
                                        uniquePatientKey: `uniquePatientKey`,
                                        uniqueSampleKey: `uniqueKey2`,
                                    },
                                    gene2: {
                                        molecularProfileId: 'mutations',
                                        patientId: 'patient',
                                        profiled: false,
                                        sampleId: `sample2`,
                                        studyId: 'study',
                                        uniquePatientKey: `uniquePatientKey`,
                                        uniqueSampleKey: `uniqueKey2`,
                                    },
                                },
                            },
                        ]
                    ),
                    MutationOncoprintMode.SAMPLE_TRACKS
                );

                const expected = {
                    sample1: [
                        makeOncoprintData(
                            1,
                            'gene1',
                            'proteinchange1',
                            20,
                            MutationStatus.MUTATED_WITH_VAF
                        ),
                        makeOncoprintData(
                            1,
                            'gene3',
                            'proteinchange3',
                            40,
                            MutationStatus.MUTATED_WITH_VAF
                        ),
                        makeOncoprintData_NoData(
                            1,
                            makeMutation(3, 'gene2', 'proteinchange2', 30),
                            MutationStatus.PROFILED_BUT_NOT_MUTATED
                        ),
                    ],
                    sample2: [
                        makeOncoprintData(
                            2,
                            'gene3',
                            'proteinchange3',
                            undefined,
                            MutationStatus.MUTATED_BUT_NO_VAF
                        ),
                        makeOncoprintData_NoData(
                            2,
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            MutationStatus.NOT_PROFILED
                        ),
                        makeOncoprintData_NoData(
                            2,
                            makeMutation(3, 'gene2', 'proteinchange2', 30),
                            MutationStatus.NOT_PROFILED
                        ),
                    ],
                    sample3: [
                        makeOncoprintData(
                            3,
                            'gene2',
                            'proteinchange2',
                            30,
                            MutationStatus.MUTATED_WITH_VAF
                        ),
                        makeOncoprintData_NoData(
                            3,
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            MutationStatus.PROFILED_BUT_NOT_MUTATED
                        ),
                        makeOncoprintData_NoData(
                            3,
                            makeMutation(2, 'gene3', 'proteinchange3'),
                            MutationStatus.PROFILED_BUT_NOT_MUTATED
                        ),
                    ],
                };

                assertDeepEqualInAnyOrder(actual, expected);
            });
            it('returns correct result when a sample is not profiled at all', () => {
                assertDeepEqualInAnyOrder(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(1, 'gene3', 'proteinchange3', 40),

                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                        ],
                        makeCoverageInfo([1, 2], [3]),
                        MutationOncoprintMode.SAMPLE_TRACKS
                    ),
                    {
                        sample1: [
                            makeOncoprintData(
                                1,
                                'gene1',
                                'proteinchange1',
                                20,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                1,
                                'gene3',
                                'proteinchange3',
                                40,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData_NoData(
                                1,
                                makeMutation(2, 'gene2', 'proteinchange2', 50),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                        ],
                        sample2: [
                            makeOncoprintData(
                                2,
                                'gene1',
                                'proteinchange1',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeOncoprintData(
                                2,
                                'gene2',
                                'proteinchange2',
                                50,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeOncoprintData(
                                2,
                                'gene3',
                                'proteinchange3',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                        ],
                        sample3: [
                            makeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene1', 'proteinchange1'),
                                MutationStatus.NOT_PROFILED
                            ),
                            makeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene2', 'proteinchange2', 50),
                                MutationStatus.NOT_PROFILED
                            ),
                            makeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene3', 'proteinchange3'),
                                MutationStatus.NOT_PROFILED
                            ),
                        ],
                    }
                );
            });
        });
        describe('mutation track mode', () => {
            it('handles case of empty data', () => {
                assert.deepEqual(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [],
                        makeCoverageInfo([1, 2, 3], []),
                        MutationOncoprintMode.MUTATION_TRACKS
                    ),
                    {}
                );
            });
            it('returns correct result when every sample has vaf data for every mutation', () => {
                assertDeepEqualInAnyOrder(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(
                                1,
                                'gene2',
                                'proteinchange2',
                                30,
                                'uncalled'
                            ),
                            makeMutation(1, 'gene3', 'proteinchange3', 40),

                            makeMutation(2, 'gene1', 'proteinchange1', 10),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(2, 'gene3', 'proteinchange3', 60),

                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                            makeMutation(3, 'gene2', 'proteinchange2', 25),
                            makeMutation(3, 'gene3', 'proteinchange3', 80),
                        ],
                        makeCoverageInfo([1, 2, 3], []),
                        MutationOncoprintMode.MUTATION_TRACKS
                    ),
                    {
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene1', 'proteinchange1')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene1',
                                'proteinchange1',
                                20,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene1',
                                'proteinchange1',
                                10,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                3,
                                'gene1',
                                'proteinchange1',
                                15,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                        ],
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene2', 'proteinchange2')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene2',
                                'proteinchange2',
                                30,
                                MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED,
                                'uncalled'
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene2',
                                'proteinchange2',
                                50,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                3,
                                'gene2',
                                'proteinchange2',
                                25,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                        ],
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene3', 'proteinchange3')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene3',
                                'proteinchange3',
                                40,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene3',
                                'proteinchange3',
                                60,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                3,
                                'gene3',
                                'proteinchange3',
                                80,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                        ],
                    }
                );
            });
            it('returns correct result when every sample has data for every mutation, but not all have VAF', () => {
                assertDeepEqualInAnyOrder(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(1, 'gene2', 'proteinchange2', 30),
                            makeMutation(1, 'gene3', 'proteinchange3', 40),

                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(2, 'gene3', 'proteinchange3'),

                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                            makeMutation(3, 'gene2', 'proteinchange2'),
                            makeMutation(3, 'gene3', 'proteinchange3', 80),
                        ],
                        makeCoverageInfo([1, 2, 3], []),
                        MutationOncoprintMode.MUTATION_TRACKS
                    ),
                    {
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene1', 'proteinchange1')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene1',
                                'proteinchange1',
                                20,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene1',
                                'proteinchange1',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeMutationModeOncoprintData(
                                3,
                                'gene1',
                                'proteinchange1',
                                15,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                        ],
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene2', 'proteinchange2')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene2',
                                'proteinchange2',
                                30,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene2',
                                'proteinchange2',
                                50,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                3,
                                'gene2',
                                'proteinchange2',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                        ],
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene3', 'proteinchange3')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene3',
                                'proteinchange3',
                                40,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene3',
                                'proteinchange3',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeMutationModeOncoprintData(
                                3,
                                'gene3',
                                'proteinchange3',
                                80,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                        ],
                    }
                );
            });
            it('returns correct result when not every sample has data for every mutation', () => {
                assertDeepEqualInAnyOrder(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(1, 'gene3', 'proteinchange3', 40),

                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(2, 'gene3', 'proteinchange3'),

                            makeMutation(3, 'gene2', 'proteinchange2'),
                        ],
                        makeCoverageInfo([1, 2, 3], []),
                        MutationOncoprintMode.MUTATION_TRACKS
                    ),
                    {
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene1', 'proteinchange1')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene1',
                                'proteinchange1',
                                20,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene1',
                                'proteinchange1',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeMutationModeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene1', 'proteinchange1'),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                        ],
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene2', 'proteinchange2')
                        )]: [
                            makeMutationModeOncoprintData_NoData(
                                1,
                                makeMutation(3, 'gene2', 'proteinchange2'),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene2',
                                'proteinchange2',
                                50,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                3,
                                'gene2',
                                'proteinchange2',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                        ],
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene3', 'proteinchange3')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene3',
                                'proteinchange3',
                                40,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene3',
                                'proteinchange3',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeMutationModeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene3', 'proteinchange3'),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                        ],
                    }
                );
            });
            it('returns correct result when one sample has no data for any mutation', () => {
                assertDeepEqualInAnyOrder(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(1, 'gene3', 'proteinchange3', 40),

                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                        ],
                        makeCoverageInfo([1, 2, 3], []),
                        MutationOncoprintMode.MUTATION_TRACKS
                    ),
                    {
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene1', 'proteinchange1')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene1',
                                'proteinchange1',
                                20,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene1',
                                'proteinchange1',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeMutationModeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene1', 'proteinchange1'),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                        ],
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene2', 'proteinchange2')
                        )]: [
                            makeMutationModeOncoprintData_NoData(
                                1,
                                makeMutation(2, 'gene2', 'proteinchange2', 50),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene2',
                                'proteinchange2',
                                50,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene2', 'proteinchange2', 50),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                        ],
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene3', 'proteinchange3')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene3',
                                'proteinchange3',
                                40,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene3',
                                'proteinchange3',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeMutationModeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene3', 'proteinchange3'),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                        ],
                    }
                );
            });
            it('returns correct result when some not profiled', () => {
                const actual = makeMutationHeatmapData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        makeMutation(1, 'gene1', 'proteinchange1', 20),
                        makeMutation(1, 'gene3', 'proteinchange3', 40),

                        makeMutation(2, 'gene3', 'proteinchange3'),

                        makeMutation(3, 'gene2', 'proteinchange2', 30),
                    ],
                    makeCoverageInfo(
                        [1, 3],
                        [],
                        [
                            {
                                i: 2,
                                notProfiledByGene: {
                                    gene1: {
                                        molecularProfileId: 'mutations',
                                        patientId: 'patient',
                                        profiled: false,
                                        sampleId: `sample2`,
                                        studyId: 'study',
                                        uniquePatientKey: `uniquePatientKey`,
                                        uniqueSampleKey: `uniqueKey2`,
                                    },
                                    gene2: {
                                        molecularProfileId: 'mutations',
                                        patientId: 'patient',
                                        profiled: false,
                                        sampleId: `sample2`,
                                        studyId: 'study',
                                        uniquePatientKey: `uniquePatientKey`,
                                        uniqueSampleKey: `uniqueKey2`,
                                    },
                                },
                            },
                        ]
                    ),
                    MutationOncoprintMode.MUTATION_TRACKS
                );

                const expected = {
                    [generateMutationIdByGeneAndProteinChangeAndEvent(
                        makeMutation(1, 'gene1', 'proteinchange1')
                    )]: [
                        makeMutationModeOncoprintData(
                            1,
                            'gene1',
                            'proteinchange1',
                            20,
                            MutationStatus.MUTATED_WITH_VAF
                        ),
                        makeMutationModeOncoprintData_NoData(
                            2,
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            MutationStatus.NOT_PROFILED
                        ),
                        makeMutationModeOncoprintData_NoData(
                            3,
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            MutationStatus.PROFILED_BUT_NOT_MUTATED
                        ),
                    ],
                    [generateMutationIdByGeneAndProteinChangeAndEvent(
                        makeMutation(1, 'gene2', 'proteinchange2')
                    )]: [
                        makeMutationModeOncoprintData_NoData(
                            1,
                            makeMutation(3, 'gene2', 'proteinchange2', 30),
                            MutationStatus.PROFILED_BUT_NOT_MUTATED
                        ),
                        makeMutationModeOncoprintData_NoData(
                            2,
                            makeMutation(3, 'gene2', 'proteinchange2', 30),
                            MutationStatus.NOT_PROFILED
                        ),
                        makeMutationModeOncoprintData(
                            3,
                            'gene2',
                            'proteinchange2',
                            30,
                            MutationStatus.MUTATED_WITH_VAF
                        ),
                    ],
                    [generateMutationIdByGeneAndProteinChangeAndEvent(
                        makeMutation(1, 'gene3', 'proteinchange3')
                    )]: [
                        makeMutationModeOncoprintData(
                            1,
                            'gene3',
                            'proteinchange3',
                            40,
                            MutationStatus.MUTATED_WITH_VAF
                        ),
                        makeMutationModeOncoprintData(
                            2,
                            'gene3',
                            'proteinchange3',
                            undefined,
                            MutationStatus.MUTATED_BUT_NO_VAF
                        ),
                        makeMutationModeOncoprintData_NoData(
                            3,
                            makeMutation(2, 'gene3', 'proteinchange3'),
                            MutationStatus.PROFILED_BUT_NOT_MUTATED
                        ),
                    ],
                };

                assertDeepEqualInAnyOrder(actual, expected);
            });
            it('returns correct result when a sample is not profiled at all', () => {
                assertDeepEqualInAnyOrder(
                    makeMutationHeatmapData(
                        [makeSample(1), makeSample(2), makeSample(3)],
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(1, 'gene3', 'proteinchange3', 40),

                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                        ],
                        makeCoverageInfo([1, 2], [3]),
                        MutationOncoprintMode.MUTATION_TRACKS
                    ),
                    {
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene1', 'proteinchange1')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene1',
                                'proteinchange1',
                                20,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene1',
                                'proteinchange1',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeMutationModeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene1', 'proteinchange1'),
                                MutationStatus.NOT_PROFILED
                            ),
                        ],
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene2', 'proteinchange2')
                        )]: [
                            makeMutationModeOncoprintData_NoData(
                                1,
                                makeMutation(2, 'gene2', 'proteinchange2', 50),
                                MutationStatus.PROFILED_BUT_NOT_MUTATED
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene2',
                                'proteinchange2',
                                50,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene2', 'proteinchange2', 50),
                                MutationStatus.NOT_PROFILED
                            ),
                        ],
                        [generateMutationIdByGeneAndProteinChangeAndEvent(
                            makeMutation(1, 'gene3', 'proteinchange3')
                        )]: [
                            makeMutationModeOncoprintData(
                                1,
                                'gene3',
                                'proteinchange3',
                                40,
                                MutationStatus.MUTATED_WITH_VAF
                            ),
                            makeMutationModeOncoprintData(
                                2,
                                'gene3',
                                'proteinchange3',
                                undefined,
                                MutationStatus.MUTATED_BUT_NO_VAF
                            ),
                            makeMutationModeOncoprintData_NoData(
                                3,
                                makeMutation(2, 'gene3', 'proteinchange3'),
                                MutationStatus.NOT_PROFILED
                            ),
                        ],
                    }
                );
            });
        });
        // Based on real patient IM-GBM-33 in glioma_msk_2018.
        // Note: makeMutation uses simplified counts (tumorRefCount = 100 - tumorAltCount),
        // not the actual clinical values. The pattern tested is what matters:
        // called mutations have positive alt counts, uncalled have 0.
        describe('uncalled mutations', () => {
            it('correctly handles called mutation in one sample with uncalled (0 alt reads) in another', () => {
                // ARID1A X721_splice: called in sample1, uncalled with 0 alt reads in sample2
                // The uncalled mutation with 0 alt reads should produce a
                // PROFILED_BUT_NOT_MUTATED entry with its own read counts preserved
                const result = makeMutationHeatmapData(
                    [makeSample(1), makeSample(2)],
                    [
                        makeMutation(
                            1,
                            'ARID1A',
                            'X721_splice',
                            49,
                            ''
                        ),
                        makeMutation(
                            2,
                            'ARID1A',
                            'X721_splice',
                            0,
                            'uncalled'
                        ),
                    ],
                    makeCoverageInfo([1, 2], []),
                    MutationOncoprintMode.SAMPLE_TRACKS
                );
                // sample1 should have the called mutation
                const sample1Data = result['sample1'];
                assert.equal(sample1Data.length, 1);
                assert.equal(
                    sample1Data[0].mutationStatus,
                    MutationStatus.MUTATED_WITH_VAF
                );
                assert.equal(sample1Data[0].mutation.tumorAltCount, 49);
                assert.equal(sample1Data[0].mutation.tumorRefCount, 51);

                // sample2 should have PROFILED_BUT_NOT_MUTATED with its own
                // read counts (from the uncalled mutation entry)
                const sample2Data = result['sample2'];
                assert.equal(sample2Data.length, 1);
                assert.equal(
                    sample2Data[0].mutationStatus,
                    MutationStatus.PROFILED_BUT_NOT_MUTATED
                );
                // The mutation object should be the uncalled mutation's own data
                assert.equal(sample2Data[0].mutation.tumorAltCount, 0);
                assert.equal(sample2Data[0].mutation.tumorRefCount, 100);
                assert.equal(sample2Data[0].mutation.sampleId, 'sample2');
            });

            it('includes uncalled mutation with positive alt reads as PROFILED_WITH_READS_BUT_UNCALLED', () => {
                // When an uncalled mutation has tumorAltCount > 0, it should be included
                const result = makeMutationHeatmapData(
                    [makeSample(1), makeSample(2)],
                    [
                        makeMutation(
                            1,
                            'ARID1A',
                            'G960E',
                            54,
                            ''
                        ),
                        makeMutation(
                            2,
                            'ARID1A',
                            'G960E',
                            5,
                            'uncalled'
                        ),
                    ],
                    makeCoverageInfo([1, 2], []),
                    MutationOncoprintMode.SAMPLE_TRACKS
                );
                const sample1Data = result['sample1'];
                assert.equal(sample1Data.length, 1);
                assert.equal(
                    sample1Data[0].mutationStatus,
                    MutationStatus.MUTATED_WITH_VAF
                );
                assert.equal(sample1Data[0].mutation.tumorAltCount, 54);

                const sample2Data = result['sample2'];
                assert.equal(sample2Data.length, 1);
                assert.equal(
                    sample2Data[0].mutationStatus,
                    MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED
                );
                // The datum should have the uncalled mutation's own read counts
                assert.equal(sample2Data[0].mutation.tumorAltCount, 5);
                assert.equal(sample2Data[0].mutation.tumorRefCount, 95);
            });
        });
    });
});
