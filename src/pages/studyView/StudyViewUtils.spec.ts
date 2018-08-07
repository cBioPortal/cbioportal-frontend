import { assert } from 'chai';
import {
    calcIntervalBinValues, filterCategoryBins, filterIntervalBins, filterNumericalBins,
    generateCategoricalData, generateNumericalData, isLogScaleByDataBins, isLogScaleByValues,
    getClinicalDataIntervalFilterValues, makePatientToClinicalAnalysisGroup, updateGeneQuery, formatNumericalTickValues,
    intervalFiltersDisplayValue
} from 'pages/studyView/StudyViewUtils';
import { getVirtualStudyDescription } from 'pages/studyView/StudyViewUtils';
import { Gene } from 'shared/api/generated/CBioPortalAPI';
import {DataBin, StudyViewFilter, ClinicalDataIntervalFilterValue} from 'shared/api/generated/CBioPortalAPIInternal';

describe('StudyViewUtils', () => {

    describe('updateGeneQuery', () => {
        it('when gene selected in table', () => {
            assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }], 'TTN'), 'TP53;\nTTN;',);
            assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }, { gene: 'TTN', alterations: false }], 'ALK'), 'TP53;\nTTN;\nALK;',);
        });
        it('when gene unselected in table', () => {
            assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }], 'TP53'), '');
            assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }, { gene: 'TTN', alterations: false }], 'TP53'), 'TTN;',);
            assert.equal(updateGeneQuery([{ gene: 'TP53', alterations: false }, { gene: 'TTN', alterations: false }], 'ALK'), 'TP53;\nTTN;\nALK;',);
        });
    });

    describe('getVirtualStudyDescription', () => {
        let studies = [{
            name: 'Study 1',
            studyId: 'study1',
            uniqueSampleKeys: ['1', '2']
        },
        {
            name: 'Study 2',
            studyId: 'study2',
            uniqueSampleKeys: ['3', '4']
        }];
        let selectedSamples = [{
            studyId: 'study1',
            uniqueSampleKey: '1'
        }, {
            studyId: 'study1',
            uniqueSampleKey: '2'
        }, {
            studyId: 'study2',
            uniqueSampleKey: '3'
        }, {
            studyId: 'study2',
            uniqueSampleKey: '4'
        }];

        it('when all samples are selected', () => {
            assert.isTrue(
                getVirtualStudyDescription(
                    studies as any,
                    selectedSamples as any,
                    {} as any,
                    {} as any,
                    []
                ).startsWith('4 samples from 2 studies:\n- Study 1 (2 samples)\n- Study 2 (2 samples)'));
        });
        it('when filters are applied', () => {
            let filter = {
                'clinicalDataEqualityFilters': [{
                    'attributeId': 'attribute1',
                    'clinicalDataType': "SAMPLE",
                    'values': ['value1']
                }],
                "mutatedGenes": [{ "entrezGeneIds": [1] }],
                "cnaGenes": [{ "alterations": [{ "entrezGeneId": 2, "alteration": -2 }] }],
                'studyIds': ['study1', 'study2']
            } as StudyViewFilter

            let genes = [{ entrezGeneId: 1, hugoGeneSymbol: "GENE1" }, { entrezGeneId: 2, hugoGeneSymbol: "GENE2" }] as Gene[];

            assert.isTrue(
                getVirtualStudyDescription(
                    studies as any,
                    [{ studyId: 'study1', uniqueSampleKey: '1' }] as any,
                    filter,
                    { 'SAMPLE_attribute1': 'attribute1 name' },
                    genes
                ).startsWith('1 sample from 1 study:\n- Study 1 (1 samples)\n\nFilters:\n- CNA Genes:\n  ' +
                    '- GENE2-DEL\n- Mutated Genes:\n  - GENE1\n  - attribute1 name: value1'));
        });
        it('when username is not null', () => {
            assert.isTrue(
                getVirtualStudyDescription(
                    studies as any,
                    selectedSamples as any,
                    {} as any,
                    {} as any,
                    [],
                    'user1'
                ).startsWith('4 samples from 2 studies:\n- Study 1 (2 samples)\n- Study 2 (2 samples)'));
            assert.isTrue(
                getVirtualStudyDescription(
                    studies as any,
                    selectedSamples as any,
                    {} as any,
                    {} as any,
                    [],
                    'user1'
                ).endsWith('by user1'));
        });
    });

    describe('makePatientToClinicalAnalysisGroup', ()=>{
        it("returns correct result on empty input", ()=>{
            assert.deepEqual(makePatientToClinicalAnalysisGroup([], {}), {});
        });
        it("returns correct result with no conflicting samples", ()=>{
            assert.deepEqual(
                makePatientToClinicalAnalysisGroup(
                    [{ uniqueSampleKey: "sample1.1", uniquePatientKey: "patient1"},
                    { uniqueSampleKey: "sample1.2", uniquePatientKey: "patient1"},
                        { uniqueSampleKey: "sample2.1", uniquePatientKey: "patient2"},
                        { uniqueSampleKey: "sample3.1", uniquePatientKey: "patient3"},
                        { uniqueSampleKey: "sample3.2", uniquePatientKey: "patient3"}
                    ],
                    { "sample1.1":"a", "sample1.2":"a", "sample2.1":"b", "sample3.1":"c", "sample3.2":"c"}
                ),
                { "patient1":"a", "patient2":"b", "patient3":"c"}
            );
        });
        it("omits patients with samples in different analysis groups", ()=>{
            assert.deepEqual(
                makePatientToClinicalAnalysisGroup(
                    [{ uniqueSampleKey: "sample1.1", uniquePatientKey: "patient1"},
                        { uniqueSampleKey: "sample1.2", uniquePatientKey: "patient1"},
                        { uniqueSampleKey: "sample2.1", uniquePatientKey: "patient2"},
                        { uniqueSampleKey: "sample3.1", uniquePatientKey: "patient3"},
                        { uniqueSampleKey: "sample3.2", uniquePatientKey: "patient3"}
                    ],
                    { "sample1.1":"a", "sample1.2":"b", "sample2.1":"b", "sample3.1":"c", "sample3.2":"c"}
                ),
                { "patient2":"b", "patient3":"c"}
            );
        });
    });

    describe('processDataBins', () => {
        const linearScaleDataBinsWithNa = [
            {
                "attributeId": "PB_BLAST_PERCENTAGE",
                "specialValue": "<=",
                "end": 20,
                "count": 70
            },
            {
                "attributeId": "PB_BLAST_PERCENTAGE",
                "start": 20,
                "end": 40,
                "count": 3
            },
            {
                "attributeId": "PB_BLAST_PERCENTAGE",
                "start": 40,
                "end": 60,
                "count": 5
            },
            {
                "attributeId": "PB_BLAST_PERCENTAGE",
                "start": 60,
                "end": 80,
                "count": 11
            },
            {
                "attributeId": "PB_BLAST_PERCENTAGE",
                "start": 80,
                "end": 100,
                "count": 69
            },
            {
                "attributeId": "PB_BLAST_PERCENTAGE",
                "specialValue": "NA",
                "count": 2
            }
        ] as any;

        const logScaleDataBinsWithNaAndSpecialValues = [
            {
                "attributeId": "DAYS_TO_LAST_FOLLOWUP",
                "specialValue": "<=",
                "end": 10,
                "count": 1
            },
            {
                "attributeId": "DAYS_TO_LAST_FOLLOWUP",
                "start": 10,
                "end": 31,
                "count": 3
            },
            {
                "attributeId": "DAYS_TO_LAST_FOLLOWUP",
                "start": 31,
                "end": 100,
                "count": 5
            },
            {
                "attributeId": "DAYS_TO_LAST_FOLLOWUP",
                "start": 100,
                "end": 316,
                "count": 23
            },
            {
                "attributeId": "DAYS_TO_LAST_FOLLOWUP",
                "start": 316,
                "end": 1000,
                "count": 67
            },
            {
                "attributeId": "DAYS_TO_LAST_FOLLOWUP",
                "start": 1000,
                "end": 3162,
                "count": 55
            },
            {
                "attributeId": "DAYS_TO_LAST_FOLLOWUP",
                "start": 3162,
                "end": 10000,
                "count": 6
            },
            {
                "attributeId": "DAYS_TO_LAST_FOLLOWUP",
                "specialValue": ">",
                "start": 10000,
                "count": 16
            },
            {
                "attributeId": "DAYS_TO_LAST_FOLLOWUP",
                "specialValue": "NA",
                "count": 66
            },
            {
                "attributeId": "DAYS_TO_LAST_FOLLOWUP",
                "specialValue": "REDACTED",
                "count": 666
            }
        ] as any;

        const scientificSmallNumberBins = [
            {
                "attributeId": "SILENT_RATE",
                "start": 1E-8,
                "end": 1E-7,
                "count": 1
            },
            {
                "attributeId": "SILENT_RATE",
                "start": 1E-7,
                "end": 1E-6,
                "count": 16
            },
            {
                "attributeId": "SILENT_RATE",
                "start": 1E-6,
                "end": 1E-5,
                "count": 32
            },
            {
                "attributeId": "SILENT_RATE",
                "specialValue": ">",
                "start": 1E-5,
                "count": 1
            }
        ] as any;

        const noNumericalDataBins = [
            {
                "attributeId": "CANCER_TYPE",
                "specialValue": "BREAST",
                "count": 1
            },
            {
                "attributeId": "CANCER_TYPE",
                "specialValue": "SKIN",
                "count": 11
            },
            {
                "attributeId": "CANCER_TYPE",
                "specialValue": "BRAIN",
                "count": 121
            },
            {
                "attributeId": "CANCER_TYPE",
                "specialValue": "NA",
                "count": 66
            },
            {
                "attributeId": "CANCER_TYPE",
                "specialValue": "REDACTED",
                "count": 666
            }
        ] as any;

        const logScaleDataBinsWithNegativeAndNaAndSpecialValues = [
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": -31622,
                "end": -10000,
                "count": 78
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": -10000,
                "end": -3162,
                "count": 14
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": -3162,
                "end": -1000,
                "count": 31
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": -1000,
                "end": -316,
                "count": 12
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": -316,
                "end": -100,
                "count": 6
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": -100,
                "end": -31,
                "count": 2
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": -31,
                "end": -10,
                "count": 2
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": -10,
                "end": -1,
                "count": 0
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": -1,
                "end": 1,
                "count": 0
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": 1,
                "end": 10,
                "count": 2
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "start": 10,
                "end": 31,
                "count": 7
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "specialValue": "NA",
                "count": 66
            },
            {
                "attributeId": "DAYS_TO_BIRTH",
                "specialValue": "REDACTED",
                "count": 666
            }
        ] as any;

        const noGroupingDataBinsWithNa = [
            {
                "attributeId": "ACTIONABLE_ALTERATIONS",
                "start": 0,
                "end": 0,
                "count": 16
            },
            {
                "attributeId": "ACTIONABLE_ALTERATIONS",
                "start": 1,
                "end": 1,
                "count": 6
            },
            {
                "attributeId": "ACTIONABLE_ALTERATIONS",
                "start": 2,
                "end": 2,
                "count": 4
            },
            {
                "attributeId": "ACTIONABLE_ALTERATIONS",
                "start": 3,
                "end": 3,
                "count": 1
            },
            {
                "attributeId": "ACTIONABLE_ALTERATIONS",
                "start": 5,
                "end": 5,
                "count": 1
            },
            {
                "attributeId": "ACTIONABLE_ALTERATIONS",
                "specialValue": "NA",
                "count": 4
            },
        ] as any;

        it('generates clinical data interval filter values from data bins', () => {
            const values: ClinicalDataIntervalFilterValue[] = getClinicalDataIntervalFilterValues(
                [linearScaleDataBinsWithNa[0], linearScaleDataBinsWithNa[2], linearScaleDataBinsWithNa[5]] as any);

            assert.deepEqual(values, [
                {end: 20, start: undefined, value: undefined},
                {start: 40, end: 60, value: undefined},
                {value: "NA", start: undefined, end: undefined}
            ] as any);
        });

        it('processes linear scaled data bins including NA count', () => {
            const numericalBins = filterNumericalBins(linearScaleDataBinsWithNa);
            assert.equal(numericalBins.length, 5, "NA should be filtered out");

            const formattedTickValues = formatNumericalTickValues(numericalBins);
            assert.deepEqual(formattedTickValues, ["≤20", "20", "40", "60", "80", "100"]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(intervalBins.length, 4, "First bin with the special values (<=) should be filtered out");

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [20, 40, 60, 80, 100]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isFalse(isLogScale);

            const categoryBins = filterCategoryBins(linearScaleDataBinsWithNa);
            assert.equal(categoryBins.length, 1, "Only the bin with NA special value should be included");

            const normalizedNumericalData = generateNumericalData(numericalBins);
            assert.deepEqual(normalizedNumericalData.map(data => data.x), [1, 2.5, 3.5, 4.5, 5.5]);

            const normalizedCategoryData = generateCategoricalData(categoryBins, 6);
            assert.deepEqual(normalizedCategoryData.map(data => data.x), [7]);
        });

        it('processes log scaled data bins including NA and REDACTED counts', () => {
            const numericalBins = filterNumericalBins(logScaleDataBinsWithNaAndSpecialValues);
            assert.equal(numericalBins.length, 8, "NA and REDACTED should be filtered out");

            const formattedTickValues = formatNumericalTickValues(numericalBins);
            assert.deepEqual(formattedTickValues, ["≤10", "10", "", "10^2", "", "10^3", "", "10^4", ">10^4"]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(intervalBins.length, 6,
                "First and last bins with the special values (<= and >) should be filtered out");

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [10, 31, 100, 316, 1000, 3162, 10000]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isTrue(isLogScale);

            const categoryBins = filterCategoryBins(logScaleDataBinsWithNaAndSpecialValues);
            assert.equal(categoryBins.length, 2,
                "Only the bins with NA and REDACTED special values should be included");

            const normalizedNumericalData = generateNumericalData(numericalBins);
            assert.deepEqual(normalizedNumericalData.map(data => data.x),
                [1, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 9]);

            const normalizedCategoryData = generateCategoricalData(categoryBins, 9);
            assert.deepEqual(normalizedCategoryData.map(data => data.x), [10, 11]);
        });

        it('processes log scaled data bins including negative values and NA and REDACTED counts', () => {
            const numericalBins = filterNumericalBins(logScaleDataBinsWithNegativeAndNaAndSpecialValues);
            assert.equal(numericalBins.length, 11, "NA and REDACTED should be filtered out");

            const formattedTickValues = formatNumericalTickValues(numericalBins);
            assert.deepEqual(formattedTickValues, ["-10^5", "", "-10^4", "", "-10^3", "", "-10^2", "", "-10", "-1", "1", "10", "", "10^2"]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(intervalBins.length, 11,
                "Should be same as the number of mumerical bins");

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [-31622, -10000, -3162, -1000, -316, -100, -31, -10, -1, 1, 10, 31]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isTrue(isLogScale);

            const categoryBins = filterCategoryBins(logScaleDataBinsWithNegativeAndNaAndSpecialValues);
            assert.equal(categoryBins.length, 2,
                "Only the bins with NA and REDACTED special values should be included");

            const normalizedNumericalData = generateNumericalData(numericalBins);
            assert.deepEqual(normalizedNumericalData.map(data => data.x),
                [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5]);

            const normalizedCategoryData = generateCategoricalData(categoryBins, 13);
            assert.deepEqual(normalizedCategoryData.map(data => data.x), [14, 15]);
        });

        it('processes scientific small numbers data bins', () => {
            const numericalBins = filterNumericalBins(scientificSmallNumberBins);
            assert.equal(numericalBins.length, 4, "all bins should be included");

            const formattedTickValues = formatNumericalTickValues(numericalBins);
            assert.deepEqual(formattedTickValues, ["1e-8", "1e-7", "1e-6", "1e-5", ">1e-5"]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(intervalBins.length, 3,
                "Last bin with the special values (>) should be filtered out");

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [1E-8, 1E-7, 1E-6, 1E-5]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isFalse(isLogScale);

            const categoryBins = filterCategoryBins(scientificSmallNumberBins);
            assert.equal(categoryBins.length, 0, "There should not be any category bin");

            const normalizedNumericalData = generateNumericalData(numericalBins);
            assert.deepEqual(normalizedNumericalData.map(data => data.x),
                [1.5, 2.5, 3.5, 5]);

            const normalizedCategoryData = generateCategoricalData(categoryBins, 5);
            assert.equal(normalizedCategoryData.length, 0);
        });

        it('processes no grouping data bins including NA count', () => {
            const numericalBins = filterNumericalBins(noGroupingDataBinsWithNa);
            assert.equal(numericalBins.length, 5, "NA should be filtered out");

            const formattedTickValues = formatNumericalTickValues(numericalBins);
            assert.deepEqual(formattedTickValues, ["0", "1", "2", "3", "5"]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(intervalBins.length, 5, "should be equal to number of numerical bins");

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [0, 1, 2, 3, 5]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isFalse(isLogScale);

            const categoryBins = filterCategoryBins(noGroupingDataBinsWithNa);
            assert.equal(categoryBins.length, 1,
                "Only the bin with NA special value should be included");

            const normalizedNumericalData = generateNumericalData(numericalBins);
            assert.deepEqual(normalizedNumericalData.map(data => data.x),
                [1, 2, 3, 4, 5]);

            const normalizedCategoryData = generateCategoricalData(categoryBins, 5);
            assert.deepEqual(normalizedCategoryData.map(data => data.x), [6]);
        });

        it('processes no numerical data bins', () => {
            const numericalBins = filterNumericalBins(noNumericalDataBins);
            assert.equal(numericalBins.length, 0, "all bins should be filtered out");

            const formattedTickValues = formatNumericalTickValues(numericalBins);
            assert.equal(formattedTickValues.length, 0, "there should be no numerical tick values");

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(intervalBins.length, 0, "should be equal to number of numerical bins");

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.equal(intervalBinValues.length, 0, "there should be no interval bin values");

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isFalse(isLogScale);

            const categoryBins = filterCategoryBins(noNumericalDataBins);
            assert.equal(categoryBins.length, 5, "all bins should be included");

            const normalizedNumericalData = generateNumericalData(numericalBins);
            assert.deepEqual(normalizedNumericalData.map(data => data.x), []);

            const normalizedCategoryData = generateCategoricalData(categoryBins, 0);
            assert.deepEqual(normalizedCategoryData.map(data => data.x), [1, 2, 3, 4, 5]);
        });

        it('determines log scale from an array of data bins', () => {
            assert.isFalse(isLogScaleByDataBins(linearScaleDataBinsWithNa));
            assert.isFalse(isLogScaleByDataBins(noGroupingDataBinsWithNa));
            assert.isFalse(isLogScaleByDataBins(noNumericalDataBins));
            assert.isTrue(isLogScaleByDataBins(logScaleDataBinsWithNaAndSpecialValues));
            assert.isTrue(isLogScaleByDataBins(logScaleDataBinsWithNegativeAndNaAndSpecialValues));
        });
    });

    describe('intervalFiltersDisplayValue', () => {
        const filterValuesWithBothEndsClosed = [
            {start: 10, end: 20},
            {start: 20, end: 30},
            {start: 30, end: 40},
            {start: 40, end: 50}
        ] as ClinicalDataIntervalFilterValue[];

        const filterValuesWithBothEndsClosedAndSpecialValues = [
            ...filterValuesWithBothEndsClosed,
            {value: "NA"},
            {value: "REDACTED"}
        ] as ClinicalDataIntervalFilterValue[];

        const filterValuesWithBothEndsOpen = [
            {end: 10},
            {start: 10, end: 20},
            {start: 20, end: 30},
            {start: 30, end: 40},
            {start: 40, end: 50},
            {start: 50}
        ] as ClinicalDataIntervalFilterValue[];

        const filterValuesWithBothEndsOpenAndSpecialValues = [
            ...filterValuesWithBothEndsOpen,
            {value: "NA"},
            {value: "REDACTED"}
        ] as ClinicalDataIntervalFilterValue[];

        const filterValuesWithStartOpen = [
            {end: 10},
            {start: 10, end: 20},
            {start: 20, end: 30},
            {start: 30, end: 40},
            {start: 40, end: 50},
        ] as ClinicalDataIntervalFilterValue[];

        const filterValuesWithStartOpenAndSpecialValues = [
            ...filterValuesWithStartOpen,
            {value: "NA"},
            {value: "REDACTED"}
        ] as ClinicalDataIntervalFilterValue[];

        const filterValuesWithEndOpen = [
            {start: 10, end: 20},
            {start: 20, end: 30},
            {start: 30, end: 40},
            {start: 40, end: 50},
            {start: 50}
        ] as ClinicalDataIntervalFilterValue[];

        const filterValuesWithEndOpenAndSpecialValues = [
            ...filterValuesWithEndOpen,
            {value: "NA"},
            {value: "REDACTED"}
        ] as ClinicalDataIntervalFilterValue[];

        it ('generates display value for filter values with both ends closed', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithBothEndsClosed);
            assert.equal(value, "10 < ~ ≤ 50");
        });

        it ('generates display value for filter values with both ends closed, with special values', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithBothEndsClosedAndSpecialValues);
            assert.equal(value, "10 < ~ ≤ 50, NA, REDACTED");
        });

        it ('generates display value for filter values with both ends open', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithBothEndsOpen);
            assert.equal(value, "All Numbers");
        });

        it ('generates display value for filter values with both ends open, with special values', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithBothEndsOpenAndSpecialValues);
            assert.equal(value, "All Numbers, NA, REDACTED");
        });

        it ('generates display value for filter values with start open, end closed', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithStartOpen);
            assert.equal(value, "≤ 50");
        });

        it ('generates display value for filter values with start open, end closed, with special values', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithStartOpenAndSpecialValues);
            assert.equal(value, "≤ 50, NA, REDACTED");
        });

        it ('generates display value for filter values with start closed, end open', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithEndOpen);
            assert.equal(value, "> 10");
        });

        it ('generates display value for filter values with start closed, end open, with special values', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithEndOpenAndSpecialValues);
            assert.equal(value, "> 10, NA, REDACTED");
        });
    });
});
