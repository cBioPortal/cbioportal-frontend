import { assert } from 'chai';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import { MutationStatus } from './PatientViewMutationsTabUtils';
import { generateMutationIdByGeneAndProteinChangeAndEvent } from '../../../shared/lib/StoreUtils';
import { CoverageInformation } from '../../../shared/lib/GenePanelUtils';
import { makeMutationHeatmapData } from './oncoprint/MutationOncoprintUtils';
import { MutationOncoprintMode } from './oncoprint/MutationOncoprint';
import { assertDeepEqualInAnyOrder } from '../../../shared/lib/SpecUtils';
import { computeRenderData, IPoint } from './VAFLineChartUtils';
import _ from 'lodash';

describe('VAFLineChartUtils', () => {
    describe('computeRenderData', () => {
        function roughlyDeepEqualPoints(
            actual: IPoint[],
            expected: IPoint[],
            message?: string
        ) {
            // theres no other way to do this in chai
            actual.forEach(d => {
                d.y = d.y.toFixed(5) as any;
            });
            expected.forEach(d => {
                d.y = d.y.toFixed(5) as any;
            });
            assert.deepEqual(actual, expected, message);
        }

        function checkResult(
            actual: { grayPoints: IPoint[]; lineData: IPoint[][] },
            expected: { grayPoints: IPoint[]; lineData: IPoint[][] },
            messagePrefix?: string
        ) {
            // gray points in any order
            roughlyDeepEqualPoints(
                actual.grayPoints,
                expected.grayPoints,
                `${messagePrefix || ''}grayPoints`
            );

            // lines in any order, but the actual order of each line internally does matter
            assert.equal(
                actual.lineData.length,
                expected.lineData.length,
                `${messagePrefix || ''}lineData length`
            );
            const mutationKeyToLineData = _.keyBy(actual.lineData, d =>
                generateMutationIdByGeneAndProteinChangeAndEvent(d[0].mutation)
            );
            for (const line of expected.lineData) {
                const mutationKey = generateMutationIdByGeneAndProteinChangeAndEvent(
                    line[0].mutation
                );
                roughlyDeepEqualPoints(
                    mutationKeyToLineData[mutationKey],
                    line,
                    `${messagePrefix || ''}mutation with key ${mutationKey}`
                );
            }
        }

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

        const sampleIdIndex = { sample1: 0, sample2: 1, sample3: 2 };

        it('handles case of empty data', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], [])
                ),
                {
                    grayPoints: [],
                    lineData: [],
                }
            );
        });
        it('returns correct result when every sample has vaf data for every mutation', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(2, 'gene1', 'proteinchange1', 10),
                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                        ],

                        [
                            makeMutation(
                                1,
                                'gene2',
                                'proteinchange2',
                                30,
                                'uncalled'
                            ),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(3, 'gene2', 'proteinchange2', 25),
                        ],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3', 60),
                            makeMutation(3, 'gene3', 'proteinchange3', 80),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], [])
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene1',
                                    'proteinchange1',
                                    10
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 10 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene1',
                                    'proteinchange1',
                                    15
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 15 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene2',
                                    'proteinchange2',
                                    30,
                                    'uncalled'
                                ),
                                mutationStatus:
                                    MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED,
                                x: 0,
                                y: 30 / 100,
                            },
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene2',
                                    'proteinchange2',
                                    25
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 25 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene3',
                                    'proteinchange3',
                                    60
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 60 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene3',
                                    'proteinchange3',
                                    80
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 80 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when every sample has data for every mutation, but not all have VAF', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                        ],

                        [
                            makeMutation(1, 'gene2', 'proteinchange2', 30),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(3, 'gene2', 'proteinchange2'),
                        ],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                            makeMutation(3, 'gene3', 'proteinchange3', 80),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], [])
                ),
                {
                    grayPoints: [
                        {
                            sampleId: 'sample2',
                            mutation: makeMutation(
                                2,
                                'gene1',
                                'proteinchange1'
                            ),
                            mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                            x: 1,
                            y: 17.5 / 100,
                        },
                        {
                            sampleId: 'sample2',
                            mutation: makeMutation(
                                2,
                                'gene3',
                                'proteinchange3'
                            ),
                            mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                            x: 1,
                            y: 60 / 100,
                        },
                    ],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene1',
                                    'proteinchange1',
                                    15
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 15 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene2',
                                    'proteinchange2',
                                    30
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 30 / 100,
                            },
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene3',
                                    'proteinchange3',
                                    80
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 80 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when not every sample has data for every mutation', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(3, 'gene1', 'proteinchange1', 60),
                        ],

                        [
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(3, 'gene2', 'proteinchange2'),
                        ],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], [])
                ),
                {
                    grayPoints: [
                        {
                            sampleId: 'sample2',
                            mutation: makeMutation(
                                2,
                                'gene1',
                                'proteinchange1'
                            ),
                            mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                            x: 1,
                            y: 40 / 100,
                        },
                    ],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene1',
                                    'proteinchange1',
                                    60
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 60 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when one sample has no data for any mutation', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(3, 'gene1', 'proteinchange1'),
                        ],

                        [makeMutation(3, 'gene2', 'proteinchange2', 50)],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(3, 'gene3', 'proteinchange3', 65),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], [])
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus:
                                    MutationStatus.PROFILED_BUT_NOT_MUTATED,
                                x: 1,
                                y: 0,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene3',
                                    'proteinchange3',
                                    65
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 65 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when some not profiled', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [makeMutation(1, 'gene1', 'proteinchange1', 20)],

                        [
                            makeMutation(1, 'gene2', 'proteinchange2', 20),
                            makeMutation(3, 'gene2', 'proteinchange2', 30),
                        ],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
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
                    )
                ),
                {
                    grayPoints: [
                        {
                            sampleId: 'sample2',
                            mutation: makeMutation(
                                1,
                                'gene2',
                                'proteinchange2',
                                20
                            ),
                            mutationStatus: MutationStatus.NOT_PROFILED,
                            x: 1,
                            y: 25 / 100,
                        },
                    ],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene2',
                                    'proteinchange2',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene2',
                                    'proteinchange2',
                                    30
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 30 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when a sample is not profiled at all', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(2, 'gene1', 'proteinchange1'),
                        ],

                        [makeMutation(2, 'gene2', 'proteinchange2', 50)],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2], [3])
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                        ],
                    ],
                }
            );
        });
    });
});
