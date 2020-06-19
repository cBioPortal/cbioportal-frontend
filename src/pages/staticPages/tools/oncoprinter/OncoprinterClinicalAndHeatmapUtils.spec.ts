import { assert } from 'chai';
import {
    ClinicalTrackDataType,
    getClinicalAndHeatmapOncoprintData,
    HeatmapTrackDataType,
    parseClinicalAndHeatmapDataHeader,
} from './OncoprinterClinicalAndHeatmapUtils';

describe('OncoprinterClinicalAndHeatmapUtils', () => {
    describe('parseClinicalAndHeatmapDataHeader', () => {
        it('parses zero attributes correctly', () => {
            assert.deepEqual(parseClinicalAndHeatmapDataHeader(['sample']), []);
        });
        it('parses clinical attribute definitions correctly', () => {
            assert.deepEqual(
                parseClinicalAndHeatmapDataHeader([
                    'sample',
                    'age(number)',
                    'mutcount(lognumber)',
                    'cancer_type',
                    'cancer_type2(string)',
                    'spectrum(a/b)',
                    'pten(heatmap01)',
                    'brca1(heatmapZscores)',
                    'tp53_heatmap(heatmap)',
                ]),
                [
                    {
                        trackName: 'age',
                        datatype: ClinicalTrackDataType.NUMBER,
                        countsCategories: undefined,
                    },
                    {
                        trackName: 'mutcount',
                        datatype: ClinicalTrackDataType.LOG_NUMBER,
                        countsCategories: undefined,
                    },
                    {
                        trackName: 'cancer_type',
                        datatype: ClinicalTrackDataType.STRING,
                        countsCategories: undefined,
                    },
                    {
                        trackName: 'cancer_type2',
                        datatype: ClinicalTrackDataType.STRING,
                        countsCategories: undefined,
                    },
                    {
                        trackName: 'spectrum',
                        datatype: ClinicalTrackDataType.COUNTS,
                        countsCategories: ['a', 'b'],
                    },
                    {
                        trackName: 'pten',
                        datatype: HeatmapTrackDataType.HEATMAP_01,
                        countsCategories: undefined,
                    },
                    {
                        trackName: 'brca1',
                        datatype: HeatmapTrackDataType.HEATMAP_ZSCORE,
                        countsCategories: undefined,
                    },
                    {
                        trackName: 'tp53_heatmap',
                        datatype: HeatmapTrackDataType.HEATMAP,
                        countsCategories: undefined,
                    },
                ]
            );
        });
        it('throws error for misformatted attribute name', () => {
            let errorMessage: any = null;
            try {
                parseClinicalAndHeatmapDataHeader(['sample', 'test()']);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(errorMessage, 'misformatted attribute name test');
        });
        it('throws error for invalid data type', () => {
            let errorMessage: any = null;
            try {
                parseClinicalAndHeatmapDataHeader(['sample', 'test(asdf)']);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(errorMessage, 'invalid track data type asdf');
        });
        it('throws error for duplicate track names', () => {
            let errorMessage: any = null;
            try {
                parseClinicalAndHeatmapDataHeader(['sample', 'test', 'test']);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(errorMessage, 'duplicate track name test');
        });
    });

    describe('getClinicalAndHeatmapOncoprintData', () => {
        it('parses data correctly', () => {
            const tracks = [
                {
                    trackName: 'Age',
                    datatype: ClinicalTrackDataType.NUMBER,
                },
                {
                    trackName: 'Cancer_Type',
                    datatype: ClinicalTrackDataType.STRING,
                },
                {
                    trackName: 'Mutation_Count',
                    datatype: ClinicalTrackDataType.LOG_NUMBER,
                },
                {
                    trackName: 'Mutation_Spectrum',
                    datatype: ClinicalTrackDataType.COUNTS,
                    countsCategories: [
                        'C>A',
                        'C>G',
                        'C>T',
                        'T>A',
                        'T>C',
                        'T>G',
                    ],
                },
                {
                    trackName: 'PTEN_heatmap01',
                    datatype: HeatmapTrackDataType.HEATMAP_01,
                },
                {
                    trackName: 'PTEN_heatmap_zscores',
                    datatype: HeatmapTrackDataType.HEATMAP_ZSCORE,
                },
                {
                    trackName: 'PTEN_heatmap',
                    datatype: HeatmapTrackDataType.HEATMAP,
                },
            ];
            const parsedLines = [
                {
                    sampleId: 'TCGA-25-2392-01',
                    orderedValues: [
                        '24',
                        'Prostate',
                        '63',
                        '190/54/416/661/392/708',
                        '0.1',
                        '1.7',
                        '5',
                    ],
                },
                {
                    sampleId: 'TCGA-25-2393-01',
                    orderedValues: [
                        '33',
                        'Lung',
                        '83',
                        '51/651/765/956/106/552',
                        '0.6',
                        'N/A',
                        '-1',
                    ],
                },
                {
                    sampleId: 'TCGA-04-1331-01',
                    orderedValues: [
                        '22',
                        'Lung',
                        '15',
                        'N/A',
                        '0.9',
                        '-0.3',
                        '2',
                    ],
                },
                {
                    sampleId: 'TCGA-04-1365-01',
                    orderedValues: [
                        '33',
                        'Lung',
                        'N/A',
                        '895/513/515/709/598/911',
                        '0.5',
                        '-1',
                        '3',
                    ],
                },
            ];
            assert.deepEqual(
                getClinicalAndHeatmapOncoprintData(tracks, parsedLines),
                {
                    heatmapTracks: {
                        PTEN_heatmap01: [
                            {
                                sample: 'TCGA-25-2392-01',
                                profile_data: 0.1,
                                uid: 'TCGA-25-2392-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-25-2393-01',
                                profile_data: 0.6,
                                uid: 'TCGA-25-2393-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1331-01',
                                profile_data: 0.9,
                                uid: 'TCGA-04-1331-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1365-01',
                                profile_data: 0.5,
                                uid: 'TCGA-04-1365-01',
                                na: false,
                            },
                        ],
                        PTEN_heatmap_zscores: [
                            {
                                sample: 'TCGA-25-2392-01',
                                profile_data: 1.7,
                                uid: 'TCGA-25-2392-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-25-2393-01',
                                profile_data: null,
                                uid: 'TCGA-25-2393-01',
                                na: true,
                            },
                            {
                                sample: 'TCGA-04-1331-01',
                                profile_data: -0.3,
                                uid: 'TCGA-04-1331-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1365-01',
                                profile_data: -1,
                                uid: 'TCGA-04-1365-01',
                                na: false,
                            },
                        ],
                        PTEN_heatmap: [
                            {
                                sample: 'TCGA-25-2392-01',
                                profile_data: 5,
                                uid: 'TCGA-25-2392-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-25-2393-01',
                                profile_data: -1,
                                uid: 'TCGA-25-2393-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1331-01',
                                profile_data: 2,
                                uid: 'TCGA-04-1331-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1365-01',
                                profile_data: 3,
                                uid: 'TCGA-04-1365-01',
                                na: false,
                            },
                        ],
                    },
                    clinicalTracks: {
                        Age: [
                            {
                                sample: 'TCGA-25-2392-01',
                                attr_id: 'Age',
                                attr_val_counts: { 24: 1 },
                                attr_val: 24,
                                uid: 'TCGA-25-2392-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-25-2393-01',
                                attr_id: 'Age',
                                attr_val_counts: { 33: 1 },
                                attr_val: 33,
                                uid: 'TCGA-25-2393-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1331-01',
                                attr_id: 'Age',
                                attr_val_counts: { 22: 1 },
                                attr_val: 22,
                                uid: 'TCGA-04-1331-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1365-01',
                                attr_id: 'Age',
                                attr_val_counts: { 33: 1 },
                                attr_val: 33,
                                uid: 'TCGA-04-1365-01',
                                na: false,
                            },
                        ],
                        Cancer_Type: [
                            {
                                sample: 'TCGA-25-2392-01',
                                attr_id: 'Cancer_Type',
                                attr_val_counts: { Prostate: 1 },
                                attr_val: 'Prostate',
                                uid: 'TCGA-25-2392-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-25-2393-01',
                                attr_id: 'Cancer_Type',
                                attr_val_counts: { Lung: 1 },
                                attr_val: 'Lung',
                                uid: 'TCGA-25-2393-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1331-01',
                                attr_id: 'Cancer_Type',
                                attr_val_counts: { Lung: 1 },
                                attr_val: 'Lung',
                                uid: 'TCGA-04-1331-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1365-01',
                                attr_id: 'Cancer_Type',
                                attr_val_counts: { Lung: 1 },
                                attr_val: 'Lung',
                                uid: 'TCGA-04-1365-01',
                                na: false,
                            },
                        ],
                        Mutation_Count: [
                            {
                                sample: 'TCGA-25-2392-01',
                                attr_id: 'Mutation_Count',
                                attr_val_counts: { 63: 1 },
                                attr_val: 63,
                                uid: 'TCGA-25-2392-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-25-2393-01',
                                attr_id: 'Mutation_Count',
                                attr_val_counts: { 83: 1 },
                                attr_val: 83,
                                uid: 'TCGA-25-2393-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1331-01',
                                attr_id: 'Mutation_Count',
                                attr_val_counts: { 15: 1 },
                                attr_val: 15,
                                uid: 'TCGA-04-1331-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1365-01',
                                attr_id: 'Mutation_Count',
                                attr_val_counts: {},
                                attr_val: '',
                                uid: 'TCGA-04-1365-01',
                                na: true,
                            },
                        ],
                        Mutation_Spectrum: [
                            {
                                sample: 'TCGA-25-2392-01',
                                attr_id: 'Mutation_Spectrum',
                                attr_val_counts: {
                                    'C>A': 190,
                                    'C>G': 54,
                                    'C>T': 416,
                                    'T>A': 661,
                                    'T>C': 392,
                                    'T>G': 708,
                                },
                                attr_val: {
                                    'C>A': 190,
                                    'C>G': 54,
                                    'C>T': 416,
                                    'T>A': 661,
                                    'T>C': 392,
                                    'T>G': 708,
                                },
                                uid: 'TCGA-25-2392-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-25-2393-01',
                                attr_id: 'Mutation_Spectrum',
                                attr_val_counts: {
                                    'C>A': 51,
                                    'C>G': 651,
                                    'C>T': 765,
                                    'T>A': 956,
                                    'T>C': 106,
                                    'T>G': 552,
                                },
                                attr_val: {
                                    'C>A': 51,
                                    'C>G': 651,
                                    'C>T': 765,
                                    'T>A': 956,
                                    'T>C': 106,
                                    'T>G': 552,
                                },
                                uid: 'TCGA-25-2393-01',
                                na: false,
                            },
                            {
                                sample: 'TCGA-04-1331-01',
                                attr_id: 'Mutation_Spectrum',
                                attr_val_counts: {},
                                attr_val: '',
                                uid: 'TCGA-04-1331-01',
                                na: true,
                            },
                            {
                                sample: 'TCGA-04-1365-01',
                                attr_id: 'Mutation_Spectrum',
                                attr_val_counts: {
                                    'C>A': 895,
                                    'C>G': 513,
                                    'C>T': 515,
                                    'T>A': 709,
                                    'T>C': 598,
                                    'T>G': 911,
                                },
                                attr_val: {
                                    'C>A': 895,
                                    'C>G': 513,
                                    'C>T': 515,
                                    'T>A': 709,
                                    'T>C': 598,
                                    'T>G': 911,
                                },
                                uid: 'TCGA-04-1365-01',
                                na: false,
                            },
                        ],
                    },
                }
            );
        });
        it('throws an error if a non-number is passed as a data point to a heatmap track', () => {
            const attributes = [
                {
                    trackName: 'pten',
                    datatype: HeatmapTrackDataType.HEATMAP,
                },
            ];
            const parsedLines = [
                {
                    sampleId: 'TCGA-25-2392-01',
                    orderedValues: ['24'],
                },
                {
                    sampleId: 'TCGA-25-2393-01',
                    orderedValues: ['asdf'],
                },
            ];

            let errorMessage: any = null;
            try {
                getClinicalAndHeatmapOncoprintData(attributes, parsedLines);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(
                errorMessage,
                'input asdf is not valid for heatmap track pten'
            );
        });
        it('throws an error if a non-number is passed as a data point to a number track', () => {
            const attributes = [
                {
                    trackName: 'Age',
                    datatype: ClinicalTrackDataType.NUMBER,
                },
            ];
            const parsedLines = [
                {
                    sampleId: 'TCGA-25-2392-01',
                    orderedValues: ['24'],
                },
                {
                    sampleId: 'TCGA-25-2393-01',
                    orderedValues: ['asdf'],
                },
            ];

            let errorMessage: any = null;
            try {
                getClinicalAndHeatmapOncoprintData(attributes, parsedLines);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(
                errorMessage,
                'input asdf is not valid for numerical track'
            );
        });
        it('throws an error if a non-number is passed as a data point to a lognumber track', () => {
            const attributes = [
                {
                    trackName: 'Mutation_Count',
                    datatype: ClinicalTrackDataType.LOG_NUMBER,
                },
            ];
            const parsedLines = [
                {
                    sampleId: 'TCGA-25-2392-01',
                    orderedValues: ['24'],
                },
                {
                    sampleId: 'TCGA-25-2393-01',
                    orderedValues: ['asdf'],
                },
            ];

            let errorMessage: any = null;
            try {
                getClinicalAndHeatmapOncoprintData(attributes, parsedLines);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(
                errorMessage,
                'input asdf is not valid for numerical track'
            );
        });
        it('throws an error if a counts data point doesnt have the same number of entries', () => {
            const attributes = [
                {
                    trackName: 'Mutation_Spectrum',
                    datatype: ClinicalTrackDataType.COUNTS,
                    countsCategories: [
                        'C>A',
                        'C>G',
                        'C>T',
                        'T>A',
                        'T>C',
                        'T>G',
                    ],
                },
            ];
            const parsedLines = [
                {
                    sampleId: 'TCGA-25-2392-01',
                    orderedValues: ['190/392/708'],
                },
                {
                    sampleId: 'TCGA-25-2393-01',
                    orderedValues: ['51/651/765/956/106/552/12'],
                },
            ];

            let errorMessage: any = null;
            try {
                getClinicalAndHeatmapOncoprintData(attributes, [
                    parsedLines[0],
                ]);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(
                errorMessage,
                'must have 6 values to match with header'
            );

            errorMessage = null;
            try {
                getClinicalAndHeatmapOncoprintData(attributes, [
                    parsedLines[1],
                ]);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(
                errorMessage,
                'must have 6 values to match with header'
            );
        });
    });
});
