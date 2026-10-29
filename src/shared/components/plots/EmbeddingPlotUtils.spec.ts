import { assert } from 'chai';
import {
    makeEmbeddingScatterPlotData,
    EmbeddingPlotPoint,
    ExpressionColoring,
} from './EmbeddingPlotUtils';
import {
    preComputeClinicalDataMaps,
    createSampleLookupMap,
    createSampleIdLookupMap,
    aggregateMolecularDataByPatient,
} from '../../lib/PatientMolecularDataUtils';
import { Sample } from 'cbioportal-ts-api-client';
import {
    PatientEmbeddingData,
    SampleEmbeddingData,
} from '../embeddings/EmbeddingTypes';

describe('EmbeddingPlotUtils', () => {
    describe('preComputeClinicalDataMaps', () => {
        it('returns correct maps for sample-level attributes', () => {
            const clinicalData = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    value: 'Yes',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample2',
                    patientId: 'patient1',
                    value: 'No',
                },
            ];

            const categoryToColor = { Yes: '#00FF00', No: '#FF0000' };

            const result = preComputeClinicalDataMaps(
                clinicalData,
                categoryToColor,
                undefined,
                false // sample-level attribute
            );

            assert.equal(result.colorMap.get('study1:sample1'), '#00FF00');
            assert.equal(result.colorMap.get('study1:sample2'), '#FF0000');
            assert.equal(result.valueMap.get('study1:sample1'), 'Yes');
            assert.equal(result.valueMap.get('study1:sample2'), 'No');

            // patient1's two samples disagree (Yes/No) -> reduced to "Mixed"
            assert.equal(result.patientValueMap.get('patient1'), 'Mixed');
            assert.equal(result.patientColorMap.get('patient1'), '#3061C2');
        });

        it('reduces a sample-level attribute to the shared value when samples agree', () => {
            const clinicalData = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    value: 'Yes',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample2',
                    patientId: 'patient1',
                    value: 'Yes',
                },
            ];

            const result = preComputeClinicalDataMaps(
                clinicalData,
                { Yes: '#00FF00', No: '#FF0000' },
                undefined,
                false
            );

            assert.equal(result.patientValueMap.get('patient1'), 'Yes');
            assert.equal(result.patientColorMap.get('patient1'), '#00FF00');
        });

        it("averages a numeric sample-level attribute across a patient's samples", () => {
            const clinicalData = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    value: '50',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample2',
                    patientId: 'patient1',
                    value: '100',
                },
            ];

            // color threshold at 75; the average (75) is NOT > 75 -> low color
            const numericalValueToColor = (value: number) =>
                value > 75 ? '#FF0000' : '#00FF00';

            const result = preComputeClinicalDataMaps(
                clinicalData,
                undefined,
                numericalValueToColor,
                false
            );

            assert.equal(result.patientValueMap.get('patient1'), '75');
            assert.equal(result.patientColorMap.get('patient1'), '#00FF00');
        });

        it('returns correct maps for patient-level attributes', () => {
            const clinicalData = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    value: 'Male',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample2',
                    patientId: 'patient1',
                    value: 'Male',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample3',
                    patientId: 'patient2',
                    value: 'Female',
                },
            ];

            const categoryToColor = { Male: '#0000FF', Female: '#FF00FF' };

            const result = preComputeClinicalDataMaps(
                clinicalData,
                categoryToColor,
                undefined,
                true // patient-level attribute
            );

            // Sample-level maps should still be populated
            assert.equal(result.colorMap.get('study1:sample1'), '#0000FF');
            assert.equal(result.colorMap.get('study1:sample3'), '#FF00FF');

            // Patient-level maps should be populated
            assert.equal(result.patientColorMap!.get('patient1'), '#0000FF');
            assert.equal(result.patientColorMap!.get('patient2'), '#FF00FF');
            assert.equal(result.patientValueMap!.get('patient1'), 'Male');
            assert.equal(result.patientValueMap!.get('patient2'), 'Female');
        });

        it('handles empty clinical data array', () => {
            const result = preComputeClinicalDataMaps([], {}, undefined, false);

            assert.equal(result.colorMap.size, 0);
            assert.equal(result.valueMap.size, 0);
        });

        it('uses default color for missing category', () => {
            const clinicalData = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    value: 'Unknown',
                },
            ];

            const categoryToColor = { Yes: '#00FF00', No: '#FF0000' };

            const result = preComputeClinicalDataMaps(
                clinicalData,
                categoryToColor,
                undefined,
                false
            );

            // Should use default color #BEBEBE for missing category
            assert.equal(result.colorMap.get('study1:sample1'), '#BEBEBE');
        });

        it('handles numerical value to color function', () => {
            const clinicalData = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    value: '50',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample2',
                    patientId: 'patient2',
                    value: '100',
                },
            ];

            const numericalValueToColor = (value: number) => {
                return value > 75 ? '#FF0000' : '#00FF00';
            };

            const result = preComputeClinicalDataMaps(
                clinicalData,
                undefined,
                numericalValueToColor,
                false
            );

            assert.equal(result.colorMap.get('study1:sample1'), '#00FF00');
            assert.equal(result.colorMap.get('study1:sample2'), '#FF0000');
        });
    });

    describe('createSampleLookupMap', () => {
        it('creates correct patient to sample mapping', () => {
            const samples: Sample[] = [
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                    uniqueSampleKey: 'study1:sample1',
                    uniquePatientKey: 'study1:patient1',
                } as Sample,
                {
                    sampleId: 'sample2',
                    patientId: 'patient2',
                    studyId: 'study1',
                    uniqueSampleKey: 'study1:sample2',
                    uniquePatientKey: 'study1:patient2',
                } as Sample,
            ];

            const result = createSampleLookupMap(samples);

            assert.equal(result.size, 2);
            assert.equal(result.get('patient1')?.sampleId, 'sample1');
            assert.equal(result.get('patient2')?.sampleId, 'sample2');
        });
    });

    describe('createSampleIdLookupMap', () => {
        it('creates correct sampleId to sample mapping', () => {
            const samples: Sample[] = [
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                    uniqueSampleKey: 'study1:sample1',
                    uniquePatientKey: 'study1:patient1',
                } as Sample,
                {
                    sampleId: 'sample2',
                    patientId: 'patient2',
                    studyId: 'study1',
                    uniqueSampleKey: 'study1:sample2',
                    uniquePatientKey: 'study1:patient2',
                } as Sample,
            ];

            const result = createSampleIdLookupMap(samples);

            assert.equal(result.size, 2);
            assert.equal(result.get('sample1')?.patientId, 'patient1');
            assert.equal(result.get('sample2')?.patientId, 'patient2');
        });
    });

    describe('aggregateMolecularDataByPatient', () => {
        it('correctly unions mutations across patient samples', () => {
            const samples: Sample[] = [
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                } as Sample,
                {
                    sampleId: 'sample2',
                    patientId: 'patient1',
                    studyId: 'study1',
                } as Sample,
            ];

            const mutations = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    mutationType: 'Missense_Mutation',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample2',
                    mutationType: 'Nonsense_Mutation',
                },
            ];

            const result = aggregateMolecularDataByPatient(
                samples,
                mutations,
                [],
                []
            );

            assert.equal(result.size, 1);
            const patientData = result.get('patient1');
            assert.equal(patientData!.mutations.length, 2);
            assert.equal(patientData!.hasAnyAlteration, true);
        });

        it('handles patients with no alterations', () => {
            const samples: Sample[] = [
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                } as Sample,
            ];

            const result = aggregateMolecularDataByPatient(samples, [], [], []);

            assert.equal(result.size, 1);
            const patientData = result.get('patient1');
            assert.equal(patientData!.mutations.length, 0);
            assert.equal(patientData!.hasAnyAlteration, false);
        });
    });

    describe('makeEmbeddingScatterPlotData - basic functionality', () => {
        // Create a minimal mock store
        const categoryToColor = {
            Treated: '#00FF00',
            Untreated: '#FF0000',
        };
        const clinicalData = [
            {
                studyId: 'study1',
                sampleId: 'sample1',
                patientId: 'patient1',
                uniqueSampleKey: 'study1:sample1',
                uniquePatientKey: 'study1:patient1',
                value: 'Treated',
            },
            {
                studyId: 'study1',
                sampleId: 'sample2',
                patientId: 'patient2',
                uniqueSampleKey: 'study1:sample2',
                uniquePatientKey: 'study1:patient2',
                value: 'Untreated',
            },
        ];

        const createMockStore = (selectedSamples: Sample[] = []) => {
            return {
                samples: {
                    result: [
                        {
                            sampleId: 'sample1',
                            patientId: 'patient1',
                            studyId: 'study1',
                            uniqueSampleKey: 'study1:sample1',
                            uniquePatientKey: 'study1:patient1',
                        } as Sample,
                        {
                            sampleId: 'sample2',
                            patientId: 'patient2',
                            studyId: 'study1',
                            uniqueSampleKey: 'study1:sample2',
                            uniquePatientKey: 'study1:patient2',
                        } as Sample,
                    ],
                },
                selectedSamples: {
                    result: selectedSamples,
                },
                filteredSamplesByDetailedCancerType: {
                    result: {
                        'Colorectal Cancer': [
                            {
                                sampleId: 'sample1',
                                patientId: 'patient1',
                                studyId: 'study1',
                            } as Sample,
                        ],
                        Melanoma: [
                            {
                                sampleId: 'sample2',
                                patientId: 'patient2',
                                studyId: 'study1',
                            } as Sample,
                        ],
                    },
                },
                clinicalDataCache: {
                    // Mirrors the real cache: `get` narrows to the study view
                    // filter, `unfilteredClinicalDataCache` does not.
                    get: () => ({
                        isComplete: true,
                        result: {
                            data: clinicalData.filter(d =>
                                selectedSamples.some(
                                    sel => sel.patientId === d.patientId
                                )
                            ),
                            categoryToColor,
                        },
                    }),
                    unfilteredClinicalDataCache: {
                        get: () => ({
                            isComplete: true,
                            result: { data: clinicalData, categoryToColor },
                        }),
                    },
                },
                annotatedMutationCache: undefined,
                annotatedCnaCache: undefined,
                structuralVariantCache: undefined,
            } as any;
        };

        it('marks non-cohort samples correctly', () => {
            const embeddingData: PatientEmbeddingData = {
                embedding_type: 'patients',
                title: 'Test UMAP',
                studyIds: ['study1'],
                description: 'Test embedding',
                totalPatients: 2,
                sampleSize: 2,
                data: [
                    { patientId: 'patient1', x: 1.0, y: 2.0 },
                    { patientId: 'patient_not_in_cohort', x: 3.0, y: 4.0 },
                ],
            };

            const store = createMockStore();
            const result = makeEmbeddingScatterPlotData(
                embeddingData,
                store,
                undefined
            );

            assert.equal(result.length, 2);

            // First point should be in cohort
            assert.equal(result[0].isInCohort, true);
            assert.equal(result[0].patientId, 'patient1');

            // Second point should NOT be in cohort
            assert.equal(result[1].isInCohort, false);
            assert.equal(result[1].patientId, 'patient_not_in_cohort');
            assert.include(
                result[1].displayLabel!,
                'not in this cohort' as any
            );
        });

        it('keeps category colors for points outside the selection', () => {
            const embeddingData: PatientEmbeddingData = {
                embedding_type: 'patients',
                title: 'Test UMAP',
                studyIds: ['study1'],
                description: 'Test embedding',
                totalPatients: 2,
                sampleSize: 2,
                data: [
                    { patientId: 'patient1', x: 1.0, y: 2.0 },
                    { patientId: 'patient2', x: 3.0, y: 4.0 },
                ],
            };

            // Only select patient1
            const selectedSamples = [
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                } as Sample,
            ];

            const store = createMockStore(selectedSamples);
            const result = makeEmbeddingScatterPlotData(
                embeddingData,
                store,
                undefined
            );

            assert.equal(result.length, 2);

            // Selection state never reaches the point data - the panel dims
            // or removes the remainder.
            assert.equal(result[0].patientId, 'patient1');
            assert.equal(result[0].displayLabel, 'Colorectal Cancer');

            assert.equal(result[1].patientId, 'patient2');
            assert.equal(result[1].displayLabel, 'Melanoma');
            assert.notEqual(result[1].color, '#C8C8C8');
        });

        it('colors points outside the study view filter by clinical attribute', () => {
            const embeddingData: PatientEmbeddingData = {
                embedding_type: 'patients',
                title: 'Test UMAP',
                studyIds: ['study1'],
                description: 'Test embedding',
                totalPatients: 2,
                sampleSize: 2,
                data: [
                    { patientId: 'patient1', x: 1.0, y: 2.0 },
                    { patientId: 'patient2', x: 3.0, y: 4.0 },
                ],
            };

            // Only patient1 survives the study view filter, so the filtered
            // clinical data cache holds nothing for patient2.
            const store = createMockStore([
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                } as Sample,
            ]);

            const coloringOption = {
                info: {
                    clinicalAttribute: {
                        clinicalAttributeId: 'TREATMENT',
                        displayName: 'Treatment',
                        datatype: 'STRING',
                        patientAttribute: true,
                    },
                },
            } as any;

            const result = makeEmbeddingScatterPlotData(
                embeddingData,
                store,
                coloringOption
            );

            assert.equal(result.length, 2);

            // The unfiltered cache is what keeps patient2 out of a grey
            // 'No data' bucket.
            assert.equal(result[0].displayLabel, 'Treated');
            assert.equal(result[1].displayLabel, 'Untreated');
            assert.notEqual(result[1].displayLabel, 'No data');
        });

        it("colors out-of-cohort samples from the embedding's referenceData", () => {
            const embeddingData: SampleEmbeddingData = {
                embedding_type: 'samples',
                title: 'Test reference map',
                studyIds: ['study1'],
                description: 'Test embedding',
                totalPatients: 3,
                sampleSize: 3,
                data: [
                    {
                        sampleId: 'sample1',
                        x: 1.0,
                        y: 2.0,
                        referenceData: { TREATMENT: 'Untreated' },
                    },
                    {
                        sampleId: 'reference_only',
                        x: 3.0,
                        y: 4.0,
                        referenceData: { TREATMENT: 'Untreated' },
                    },
                    { sampleId: 'unlabelled', x: 5.0, y: 6.0 },
                ],
            };
            const coloringOption = {
                info: {
                    clinicalAttribute: {
                        clinicalAttributeId: 'TREATMENT',
                        displayName: 'Treatment',
                        datatype: 'STRING',
                        patientAttribute: false,
                    },
                },
            } as any;

            const result = makeEmbeddingScatterPlotData(
                embeddingData,
                createMockStore(),
                coloringOption
            );

            // The portal's own value wins for a sample it has.
            assert.equal(result[0].displayLabel, 'Treated');
            assert.isUndefined(result[0].referenceLabel);

            // Still out of cohort for selection and the legend, but colored.
            assert.equal(result[1].isInCohort, false);
            assert.include(result[1].displayLabel!, 'not in this cohort');
            assert.equal(result[1].referenceLabel, 'Untreated');
            assert.equal(result[1].referenceColor, '#FF0000');

            assert.equal(result[2].isInCohort, false);
            assert.isUndefined(result[2].referenceColor);
        });

        it('ignores referenceData when not coloring by a clinical attribute', () => {
            const embeddingData: SampleEmbeddingData = {
                embedding_type: 'samples',
                title: 'Test reference map',
                studyIds: ['study1'],
                description: 'Test embedding',
                totalPatients: 1,
                sampleSize: 1,
                data: [
                    {
                        sampleId: 'reference_only',
                        x: 3.0,
                        y: 4.0,
                        referenceData: { TREATMENT: 'Untreated' },
                    },
                ],
            };
            const result = makeEmbeddingScatterPlotData(
                embeddingData,
                createMockStore(),
                undefined
            );
            assert.isUndefined(result[0].referenceColor);
        });

        it('uses default cancer type coloring when no coloring option specified', () => {
            const embeddingData: PatientEmbeddingData = {
                embedding_type: 'patients',
                title: 'Test UMAP',
                studyIds: ['study1'],
                description: 'Test embedding',
                totalPatients: 2,
                sampleSize: 2,
                data: [
                    { patientId: 'patient1', x: 1.0, y: 2.0 },
                    { patientId: 'patient2', x: 3.0, y: 4.0 },
                ],
            };

            const store = createMockStore();
            const result = makeEmbeddingScatterPlotData(
                embeddingData,
                store,
                undefined
            );

            assert.equal(result.length, 2);
            assert.equal(result[0].displayLabel, 'Colorectal Cancer');
            assert.equal(result[1].displayLabel, 'Melanoma');
        });
    });
    describe('makeEmbeddingScatterPlotData - expression coloring', () => {
        const store = {
            samples: {
                result: [
                    {
                        sampleId: 'sample1',
                        patientId: 'patient1',
                        studyId: 'study1',
                        uniqueSampleKey: 'study1:sample1',
                        uniquePatientKey: 'study1:patient1',
                    } as Sample,
                    {
                        sampleId: 'sample2',
                        patientId: 'patient1',
                        studyId: 'study1',
                        uniqueSampleKey: 'study1:sample2',
                        uniquePatientKey: 'study1:patient1',
                    } as Sample,
                    {
                        sampleId: 'sample3',
                        patientId: 'patient2',
                        studyId: 'study1',
                        uniqueSampleKey: 'study1:sample3',
                        uniquePatientKey: 'study1:patient2',
                    } as Sample,
                ],
            },
            selectedSamples: { result: [] },
            filteredSamplesByDetailedCancerType: { result: {} },
            clinicalDataCache: { get: () => ({ isComplete: false }) },
            annotatedMutationCache: undefined,
            annotatedCnaCache: undefined,
            structuralVariantCache: undefined,
        } as any;

        const expressionColoring: ExpressionColoring = {
            valueBySampleKey: new Map([
                ['study1:sample1', 0],
                ['study1:sample2', 10],
                ['study1:sample3', 5],
            ]),
            colorFn: (x: number) => `c${x}`,
            label: 'MYC expression',
        };

        const sampleEmbedding: SampleEmbeddingData = {
            embedding_type: 'samples',
            title: 'Test UMAP',
            studyIds: ['study1'],
            description: 'Test embedding',
            totalPatients: 2,
            sampleSize: 3,
            data: [
                { sampleId: 'sample1', x: 1, y: 1 },
                { sampleId: 'sample3', x: 2, y: 2 },
                { sampleId: 'missing', x: 3, y: 3 },
            ],
        };

        it('colors samples by their expression value', () => {
            const result = makeEmbeddingScatterPlotData(
                sampleEmbedding,
                store,
                undefined,
                true,
                true,
                true,
                undefined,
                expressionColoring
            );

            assert.equal(result[0].color, 'c0');
            assert.equal(result[0].displayLabel, 'MYC expression');
            assert.equal(result[1].color, 'c5');
            assert.equal(result[1].displayLabel, 'MYC expression');
        });

        it('leaves samples without an expression value as No data', () => {
            const embedding: SampleEmbeddingData = {
                ...sampleEmbedding,
                data: [{ sampleId: 'sample2', x: 1, y: 1 }],
            };
            const coloring: ExpressionColoring = {
                ...expressionColoring,
                valueBySampleKey: new Map([['study1:sample1', 3]]),
            };

            const result = makeEmbeddingScatterPlotData(
                embedding,
                store,
                undefined,
                true,
                true,
                true,
                undefined,
                coloring
            );

            assert.equal(result[0].displayLabel, 'No data');
        });

        it('takes precedence over alteration coloring for the same gene', () => {
            // annotatedMutationCache is undefined, so any attempt to colour by
            // alteration would fall through to 'No data'.
            const result = makeEmbeddingScatterPlotData(
                sampleEmbedding,
                store,
                { info: { entrezGeneId: 4609 } } as any,
                true,
                true,
                true,
                undefined,
                expressionColoring
            );

            assert.equal(result[0].color, 'c0');
            assert.equal(result[0].displayLabel, 'MYC expression');
        });

        it('averages expression across a patient samples for patient embeddings', () => {
            const patientEmbedding: PatientEmbeddingData = {
                embedding_type: 'patients',
                title: 'Test UMAP',
                studyIds: ['study1'],
                description: 'Test embedding',
                totalPatients: 2,
                sampleSize: 3,
                data: [
                    { patientId: 'patient1', x: 1, y: 1 },
                    { patientId: 'patient2', x: 2, y: 2 },
                ],
            };

            const result = makeEmbeddingScatterPlotData(
                patientEmbedding,
                store,
                undefined,
                true,
                true,
                true,
                undefined,
                expressionColoring
            );

            // patient1 has samples at 0 and 10, so the mean is 5
            assert.equal(result[0].color, 'c5');
            assert.equal(result[1].color, 'c5');
        });
    });
});
