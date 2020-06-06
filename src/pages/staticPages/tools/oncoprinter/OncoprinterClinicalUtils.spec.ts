import { assert } from 'chai';
import {
    ClinicalTrackDataType,
    getClinicalOncoprintData,
    ONCOPRINTER_CLINICAL_VAL_NA,
    parseClinicalDataHeader,
} from './OncoprinterClinicalUtils';

describe('OncoprinterClinicalUtils', () => {
    describe('parseClinicalDataHeader', () => {
        it('parses zero attributes correctly', () => {
            assert.deepEqual(parseClinicalDataHeader(['sample']), []);
        });
        it('parses clinical attribute definitions correctly', () => {
            assert.deepEqual(
                parseClinicalDataHeader([
                    'sample',
                    'age(number)',
                    'mutcount(lognumber)',
                    'cancer_type',
                    'cancer_type2(string)',
                    'spectrum(a/b)',
                ]),
                [
                    {
                        clinicalAttributeName: 'age',
                        datatype: ClinicalTrackDataType.NUMBER,
                        countsCategories: undefined,
                    },
                    {
                        clinicalAttributeName: 'mutcount',
                        datatype: ClinicalTrackDataType.LOG_NUMBER,
                        countsCategories: undefined,
                    },
                    {
                        clinicalAttributeName: 'cancer_type',
                        datatype: ClinicalTrackDataType.STRING,
                        countsCategories: undefined,
                    },
                    {
                        clinicalAttributeName: 'cancer_type2',
                        datatype: ClinicalTrackDataType.STRING,
                        countsCategories: undefined,
                    },
                    {
                        clinicalAttributeName: 'spectrum',
                        datatype: ClinicalTrackDataType.COUNTS,
                        countsCategories: ['a', 'b'],
                    },
                ]
            );
        });
        it('throws error for misformatted attribute name', () => {
            let errorMessage: any = null;
            try {
                parseClinicalDataHeader(['sample', 'test()']);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(errorMessage, 'misformatted attribute name test');
        });
        it('throws error for invalid data type', () => {
            let errorMessage: any = null;
            try {
                parseClinicalDataHeader(['sample', 'test(asdf)']);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(errorMessage, 'invalid track data type asdf');
        });
    });

    describe('getClinicalOncoprintData', () => {
        it('parses data correctly', () => {
            const attributes = [
                {
                    clinicalAttributeName: 'AGE',
                    datatype: ClinicalTrackDataType.NUMBER,
                },
                {
                    clinicalAttributeName: 'CANCER_TYPE',
                    datatype: ClinicalTrackDataType.STRING,
                },
                {
                    clinicalAttributeName: 'MUTATION_COUNT',
                    datatype: ClinicalTrackDataType.LOG_NUMBER,
                },
                {
                    clinicalAttributeName: 'MUTATION_SPECTRUM',
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
                    orderedValues: [
                        '24',
                        'Prostate',
                        '63',
                        '190/54/416/661/392/708',
                    ],
                },
                {
                    sampleId: 'TCGA-25-2393-01',
                    orderedValues: [
                        '33',
                        'Lung',
                        '83',
                        '51/651/765/956/106/552',
                    ],
                },
                {
                    sampleId: 'TCGA-04-1331-01',
                    orderedValues: ['22', 'Lung', '15', 'N/A'],
                },
                {
                    sampleId: 'TCGA-04-1365-01',
                    orderedValues: [
                        '33',
                        'Lung',
                        'N/A',
                        '895/513/515/709/598/911',
                    ],
                },
            ];
            assert.deepEqual(
                getClinicalOncoprintData(attributes, parsedLines),
                {
                    AGE: [
                        {
                            sample: 'TCGA-25-2392-01',
                            attr_id: 'AGE',
                            attr_val_counts: { 24: 1 },
                            attr_val: 24,
                            uid: 'TCGA-25-2392-01',
                            na: false,
                        },
                        {
                            sample: 'TCGA-25-2393-01',
                            attr_id: 'AGE',
                            attr_val_counts: { 33: 1 },
                            attr_val: 33,
                            uid: 'TCGA-25-2393-01',
                            na: false,
                        },
                        {
                            sample: 'TCGA-04-1331-01',
                            attr_id: 'AGE',
                            attr_val_counts: { 22: 1 },
                            attr_val: 22,
                            uid: 'TCGA-04-1331-01',
                            na: false,
                        },
                        {
                            sample: 'TCGA-04-1365-01',
                            attr_id: 'AGE',
                            attr_val_counts: { 33: 1 },
                            attr_val: 33,
                            uid: 'TCGA-04-1365-01',
                            na: false,
                        },
                    ],
                    CANCER_TYPE: [
                        {
                            sample: 'TCGA-25-2392-01',
                            attr_id: 'CANCER_TYPE',
                            attr_val_counts: { Prostate: 1 },
                            attr_val: 'Prostate',
                            uid: 'TCGA-25-2392-01',
                            na: false,
                        },
                        {
                            sample: 'TCGA-25-2393-01',
                            attr_id: 'CANCER_TYPE',
                            attr_val_counts: { Lung: 1 },
                            attr_val: 'Lung',
                            uid: 'TCGA-25-2393-01',
                            na: false,
                        },
                        {
                            sample: 'TCGA-04-1331-01',
                            attr_id: 'CANCER_TYPE',
                            attr_val_counts: { Lung: 1 },
                            attr_val: 'Lung',
                            uid: 'TCGA-04-1331-01',
                            na: false,
                        },
                        {
                            sample: 'TCGA-04-1365-01',
                            attr_id: 'CANCER_TYPE',
                            attr_val_counts: { Lung: 1 },
                            attr_val: 'Lung',
                            uid: 'TCGA-04-1365-01',
                            na: false,
                        },
                    ],
                    MUTATION_COUNT: [
                        {
                            sample: 'TCGA-25-2392-01',
                            attr_id: 'MUTATION_COUNT',
                            attr_val_counts: { 63: 1 },
                            attr_val: 63,
                            uid: 'TCGA-25-2392-01',
                            na: false,
                        },
                        {
                            sample: 'TCGA-25-2393-01',
                            attr_id: 'MUTATION_COUNT',
                            attr_val_counts: { 83: 1 },
                            attr_val: 83,
                            uid: 'TCGA-25-2393-01',
                            na: false,
                        },
                        {
                            sample: 'TCGA-04-1331-01',
                            attr_id: 'MUTATION_COUNT',
                            attr_val_counts: { 15: 1 },
                            attr_val: 15,
                            uid: 'TCGA-04-1331-01',
                            na: false,
                        },
                        {
                            sample: 'TCGA-04-1365-01',
                            attr_id: 'MUTATION_COUNT',
                            attr_val_counts: {},
                            attr_val: '',
                            uid: 'TCGA-04-1365-01',
                            na: true,
                        },
                    ],
                    MUTATION_SPECTRUM: [
                        {
                            sample: 'TCGA-25-2392-01',
                            attr_id: 'MUTATION_SPECTRUM',
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
                            attr_id: 'MUTATION_SPECTRUM',
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
                            attr_id: 'MUTATION_SPECTRUM',
                            attr_val_counts: {},
                            attr_val: '',
                            uid: 'TCGA-04-1331-01',
                            na: true,
                        },
                        {
                            sample: 'TCGA-04-1365-01',
                            attr_id: 'MUTATION_SPECTRUM',
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
                }
            );
        });
        it('throws an error if a non-number is passed as a data point to a number track', () => {
            const attributes = [
                {
                    clinicalAttributeName: 'AGE',
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
                getClinicalOncoprintData(attributes, parsedLines);
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
                    clinicalAttributeName: 'MUTATION_COUNT',
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
                getClinicalOncoprintData(attributes, parsedLines);
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
                    clinicalAttributeName: 'MUTATION_SPECTRUM',
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
                getClinicalOncoprintData(attributes, [parsedLines[0]]);
            } catch (e) {
                errorMessage = e.message;
            }
            assert.include(
                errorMessage,
                'must have 6 values to match with header'
            );

            errorMessage = null;
            try {
                getClinicalOncoprintData(attributes, [parsedLines[1]]);
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
