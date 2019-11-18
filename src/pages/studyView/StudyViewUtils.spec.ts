import {assert} from 'chai';
import {
    calcIntervalBinValues,
    calculateLayout,
    calculateNewLayoutForFocusedChart,
    chartMetaComparator,
    clinicalDataCountComparator,
    customBinsAreValid,
    filterCategoryBins,
    filterIntervalBins,
    filterNumericalBins,
    findSpot,
    formatFrequency,
    formatNumericalTickValues,
    generateCategoricalData,
    generateMatrixByLayout,
    generateNumericalData,
    getClinicalDataCountWithColorByCategoryCounts,
    getClinicalDataCountWithColorByClinicalDataCount,
    getDataIntervalFilterValues,
    getClinicalEqualityFilterValuesByString,
    getCNAByAlteration,
    getDefaultChartTypeByClinicalAttribute,
    getExponent,
    getFilteredSampleIdentifiers,
    getFilteredStudiesWithSamples,
    getFrequencyStr,
    getPositionXByUniqueKey,
    getPositionYByUniqueKey,
    getPriorityByClinicalAttribute,
    getQValue,
    getRequestedAwaitPromisesForClinicalData,
    getSamplesByExcludingFiltersOnChart,
    getVirtualStudyDescription,
    intervalFiltersDisplayValue,
    isEveryBinDistinct,
    isFocusedChartShrunk,
    isLogScaleByDataBins,
    isLogScaleByValues,
    isOccupied,
    makePatientToClinicalAnalysisGroup,
    mutationCountVsCnaTooltip,
    needAdditionShiftForLogScaleBarChart,
    pickClinicalDataColors,
    showOriginStudiesInSummaryDescription,
    shouldShowChart,
    toFixedDigit,
    updateGeneQuery,
    StudyViewFilterWithSampleIdentifierFilters,
    ChartMeta,
    ChartMetaDataTypeEnum,
    getStudyViewTabId,
    formatRange,
    getBinName,
    getGroupedClinicalDataByBins,
} from 'pages/studyView/StudyViewUtils';
import {
    DataIntervalFilterValue,
    ClinicalDataBin,
    Sample,
    StudyViewFilter
} from 'shared/api/generated/CBioPortalAPIInternal';
import {CancerStudy, ClinicalAttribute, Gene} from 'shared/api/generated/CBioPortalAPI';
import {
    StudyViewPageTabKeyEnum
} from "./StudyViewPageStore";
import {
    UniqueKey
} from "./StudyViewUtils";
import {Layout} from 'react-grid-layout';
import sinon from 'sinon';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import {VirtualStudy} from 'shared/model/VirtualStudy';
import {ChartDimension, ChartTypeEnum} from "./StudyViewConfig";
import {MobxPromise} from "mobxpromise";
import {CLI_NO_COLOR, CLI_YES_COLOR, DEFAULT_NA_COLOR, RESERVED_CLINICAL_VALUE_COLORS} from "shared/lib/Colors";
import { IStudyViewDensityScatterPlotDatum } from './charts/scatterPlot/StudyViewDensityScatterPlot';
import { shallow } from 'enzyme';

describe('StudyViewUtils', () => {
    const emptyStudyViewFilter: StudyViewFilter = {
        clinicalDataEqualityFilters: [],
        clinicalDataIntervalFilters: [],
        cnaGenes: [],
        mutatedGenes: []
    } as any;

    describe('updateGeneQuery', () => {
        it('when gene selected in table', () => {
            assert.deepEqual(updateGeneQuery([{gene: 'TP53', alterations: false}], 'TTN'), [{
                gene: 'TP53',
                alterations: false
            }, {gene: 'TTN', alterations: false}]);
            assert.deepEqual(updateGeneQuery([{gene: 'TP53', alterations: false}, {
                gene: 'TTN',
                alterations: false
            }], 'ALK'), [{gene: 'TP53', alterations: false}, {gene: 'TTN', alterations: false}, {
                gene: 'ALK',
                alterations: false
            }]);
        });
        it('when gene unselected in table', () => {
            assert.deepEqual(updateGeneQuery([{gene: 'TP53', alterations: false}], 'TP53'), []);
            assert.deepEqual(updateGeneQuery([{gene: 'TP53', alterations: false}, {
                gene: 'TTN',
                alterations: false
            }], 'TP53'), [{gene: 'TTN', alterations: false}]);
            assert.deepEqual(updateGeneQuery([{gene: 'TP53', alterations: false}, {
                gene: 'TTN',
                alterations: false
            }], 'ALK'), [{gene: 'TP53', alterations: false}, {gene: 'TTN', alterations: false}, {
                gene: 'ALK',
                alterations: false
            }]);
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

        it('when all samples are selected', () => {
            assert.isTrue(
                getVirtualStudyDescription(
                    '',
                    studies as any,
                    {} as any,
                    {} as any,
                    []
                ).startsWith('4 samples from 2 studies:\n- Study 1 (2 samples)\n- Study 2 (2 samples)'));
        });
        it('when filters are applied', () => {
            let filter = {
                clinicalDataEqualityFilters: [{
                    'attributeId': 'attribute1',
                    'clinicalDataType': "SAMPLE",
                    'values': ['value1']
                }],
                clinicalDataIntervalFilters: [{
                    'attributeId': 'attribute2',
                    'clinicalDataType': "PATIENT",
                    'values': [{
                        'end': 0,
                        'start': 10,
                        'value': `10`
                    }]
                }],
                genomicDataIntervalFilters: [],
                mutatedGenes: [{ "entrezGeneIds": [1] }],
                fusionGenes: [{ "entrezGeneIds": [1] }],
                cnaGenes: [{ "alterations": [{ "entrezGeneId": 2, "alteration": -2 }] }],
                studyIds: ['study1', 'study2'],
                sampleIdentifiers: [],
                sampleIdentifiersSet: {
                    'SAMPLE_attribute3': [{
                        'sampleId': 'sample 1',
                        'studyId': 'study1'
                    }, {
                        'sampleId': 'sample 1',
                        'studyId': 'study2'
                    }]
                },
                mutationCountVsCNASelection: {
                    xEnd: 0, xStart: 0, yEnd: 0, yStart: 0
                },
                numberOfSamplesPerPatient: [],
                withCNAData: false,
                withMutationData: false
            } as StudyViewFilterWithSampleIdentifierFilters;

            let genes = [{ entrezGeneId: 1, hugoGeneSymbol: "GENE1" }, { entrezGeneId: 2, hugoGeneSymbol: "GENE2" }] as Gene[];

            assert.isTrue(
                getVirtualStudyDescription(
                    '',
                    studies as any,
                    filter,
                    {
                        'SAMPLE_attribute1': 'attribute1 name',
                        'PATIENT_attribute2': 'attribute2 name',
                        'SAMPLE_attribute3': 'attribute3 name'
                    },
                    genes
                ).startsWith('4 samples from 2 studies:\n- Study 1 (2 samples)\n- Study 2 (2 samples)\n\nFilters:\n- CNA Genes:\n' +
                '  - GENE2-DEL\n- Mutated Genes:\n  - GENE1\n- Fusion Genes:\n  - GENE1\nWith Mutation data: NO\nWith CNA data: NO\n- attribute1 name: value1\n' +
                '- attribute2 name: 10 < x ≤ 0\n- attribute3 name: 2 samples\n\nCreated on'));
        });
        it('when username is not null', () => {
            assert.isTrue(
                getVirtualStudyDescription(
                    '',
                    studies as any,
                    {} as any,
                    {} as any,
                    [],
                    'user1'
                ).startsWith('4 samples from 2 studies:\n- Study 1 (2 samples)\n- Study 2 (2 samples)'));
            assert.isTrue(
                getVirtualStudyDescription(
                    '',
                    studies as any,
                    {} as any,
                    {} as any,
                    [],
                    'user1'
                ).endsWith('by user1'));
        });
        it('when previousDescription is defined', () => {
            let filter = {
                clinicalDataEqualityFilters: [{
                    'attributeId': 'attribute1',
                    'clinicalDataType': "SAMPLE",
                    'values': ['value1']
                }]
            } as StudyViewFilterWithSampleIdentifierFilters;

            let genes = [{entrezGeneId: 1, hugoGeneSymbol: "GENE1"}, {
                entrezGeneId: 2,
                hugoGeneSymbol: "GENE2"
            }] as Gene[];

            assert.isTrue(
                getVirtualStudyDescription(
                    'test\nCreated on ...',
                    studies as any,
                    filter,
                    {
                        'SAMPLE_attribute1': 'attribute1 name',
                        'PATIENT_attribute2': 'attribute2 name',
                        'SAMPLE_attribute3': 'attribute3 name'
                    },
                    genes
                ).startsWith('test\n\nCreated on'));
        });
    });

    describe('shouldShowChart', () => {
        const hasInfoFilter = {
            clinicalDataEqualityFilters: [{
                'attributeId': 'attribute1',
                'clinicalDataType': "SAMPLE" as 'SAMPLE',
                'values': ['value1']
            }],
            clinicalDataIntervalFilters: [],
            mutatedGenes: [],
            cnaGenes: []
        };
        it("return true when there is only one sample in the study", () => {
            assert.isTrue(shouldShowChart(emptyStudyViewFilter, 1, 1));
        });
        it("return true when unique number of data bigger than one", () => {
            assert.isTrue(shouldShowChart(emptyStudyViewFilter, 2, 2));
        });
        it("return true when study view is filtered", () => {
            assert.isTrue(shouldShowChart(hasInfoFilter, 1, 2));
        });
        it("return false when study view is not filtered, unique number of data less than 2, and there are more than one sample in the study", () => {
            assert.isFalse(shouldShowChart(emptyStudyViewFilter, 1, 2));
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

        const logScaleDataBinsStartingWithZeroAndContainsNa = [
            {
                "attributeId": "DAYS_TO_COLLECTION",
                "start": 0,
                "end": 3,
                "count": 1
            },
            {
                "attributeId": "DAYS_TO_COLLECTION",
                "start": 3,
                "end": 10,
                "count": 1
            },
            {
                "attributeId": "DAYS_TO_COLLECTION",
                "start": 10,
                "end": 31,
                "count": 13
            },
            {
                "attributeId": "DAYS_TO_COLLECTION",
                "start": 31,
                "end": 100,
                "count": 47
            },
            {
                "attributeId": "DAYS_TO_COLLECTION",
                "start": 100,
                "end": 316,
                "count": 78
            },
            {
                "attributeId": "DAYS_TO_COLLECTION",
                "start": 316,
                "end": 1000,
                "count": 82
            },
            {
                "attributeId": "DAYS_TO_COLLECTION",
                "start": 1000,
                "end": 3162,
                "count": 63
            },
            {
                "attributeId": "DAYS_TO_COLLECTION",
                "start": 3162,
                "end": 10000,
                "count": 22
            },
            {
                "attributeId": "DAYS_TO_COLLECTION",
                "specialValue": "NA",
                "count": 225
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
            const values: DataIntervalFilterValue[] = getDataIntervalFilterValues(
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

            const needAdditionShift = needAdditionShiftForLogScaleBarChart(numericalBins);
            assert.isFalse(needAdditionShift);

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

            const needAdditionShift = needAdditionShiftForLogScaleBarChart(numericalBins);
            assert.isFalse(needAdditionShift);

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

            const needAdditionShift = needAdditionShiftForLogScaleBarChart(numericalBins);
            assert.isTrue(needAdditionShift);

            const normalizedNumericalData = generateNumericalData(numericalBins);
            assert.deepEqual(normalizedNumericalData.map(data => data.x),
                [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5]);

            const normalizedCategoryData = generateCategoricalData(categoryBins, 13);
            assert.deepEqual(normalizedCategoryData.map(data => data.x), [14, 15]);
        });

        it('processes log scaled data bins starting with zero and including NA counts', () => {
            const numericalBins = filterNumericalBins(logScaleDataBinsStartingWithZeroAndContainsNa);
            assert.equal(numericalBins.length, 8, "NA should be filtered out");

            const formattedTickValues = formatNumericalTickValues(numericalBins);
            assert.deepEqual(formattedTickValues, ["0", "", "10", "", "10^2", "", "10^3", "", "10^4"]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(intervalBins.length, 8,
                "Should be same as the number of mumerical bins");

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [0, 3, 10, 31, 100, 316, 1000, 3162, 10000]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isTrue(isLogScale);

            const categoryBins = filterCategoryBins(logScaleDataBinsStartingWithZeroAndContainsNa);
            assert.equal(categoryBins.length, 1,
                "Only NA bin should be included");

            const needAdditionShift = needAdditionShiftForLogScaleBarChart(numericalBins);
            assert.isFalse(needAdditionShift);

            const normalizedNumericalData = generateNumericalData(numericalBins);
            assert.deepEqual(normalizedNumericalData.map(data => data.x),
                [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5]);

            const normalizedCategoryData = generateCategoricalData(categoryBins, 9);
            assert.deepEqual(normalizedCategoryData.map(data => data.x), [10]);
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

            const needAdditionShift = needAdditionShiftForLogScaleBarChart(numericalBins);
            assert.isFalse(needAdditionShift);

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
        ] as DataIntervalFilterValue[];

        const filterValuesWithBothEndsClosedAndSpecialValues = [
            ...filterValuesWithBothEndsClosed,
            {value: "NA"},
            {value: "REDACTED"}
        ] as DataIntervalFilterValue[];

        const filterValuesWithBothEndsOpen = [
            {end: 10},
            {start: 10, end: 20},
            {start: 20, end: 30},
            {start: 30, end: 40},
            {start: 40, end: 50},
            {start: 50}
        ] as DataIntervalFilterValue[];

        const filterValuesWithBothEndsOpenAndSpecialValues = [
            ...filterValuesWithBothEndsOpen,
            {value: "NA"},
            {value: "REDACTED"}
        ] as DataIntervalFilterValue[];

        const filterValuesWithStartOpen = [
            {end: 10},
            {start: 10, end: 20},
            {start: 20, end: 30},
            {start: 30, end: 40},
            {start: 40, end: 50},
        ] as DataIntervalFilterValue[];

        const filterValuesWithStartOpenAndSpecialValues = [
            ...filterValuesWithStartOpen,
            {value: "NA"},
            {value: "REDACTED"}
        ] as DataIntervalFilterValue[];

        const filterValuesWithEndOpen = [
            {start: 10, end: 20},
            {start: 20, end: 30},
            {start: 30, end: 40},
            {start: 40, end: 50},
            {start: 50}
        ] as DataIntervalFilterValue[];

        const filterValuesWithEndOpenAndSpecialValues = [
            ...filterValuesWithEndOpen,
            {value: "NA"},
            {value: "REDACTED"}
        ] as DataIntervalFilterValue[];

        const filterValuesWithSpecialValuesOnly = [
            {value: "NA"},
            {value: "REDACTED"}
        ] as DataIntervalFilterValue[];

        const filterValuesWithDistinctNumerals = [
            {start: 20, end: 20},
            {start: 30, end: 30},
            {start: 40, end: 40}
        ] as DataIntervalFilterValue[];

        const filterValuesWithDistinctNumeralsAndSpecialValues = [
            ...filterValuesWithDistinctNumerals,
            {value: "NA"},
            {value: "REDACTED"}
        ] as DataIntervalFilterValue[];

        const filterValuesWithSingleDistinctValue = [
            {start: 666, end: 666}
        ] as DataIntervalFilterValue[];

        const filterValuesWithSingleDistinctValueAndSpecialValues = [
            ...filterValuesWithSingleDistinctValue,
            {value: "NA"},
            {value: "REDACTED"}
        ] as DataIntervalFilterValue[];

        it ('generates display value for filter values with both ends closed', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithBothEndsClosed);
            assert.equal(value, "10 < x ≤ 50");
        });

        it ('generates display value for filter values with both ends closed, with special values', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithBothEndsClosedAndSpecialValues);
            assert.equal(value, "10 < x ≤ 50, NA, REDACTED");
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

        it ('generates display value for filter values with special values only', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithSpecialValuesOnly);
            assert.equal(value, "NA, REDACTED");
        });

        it ('generates display value for filter values with distinct values only', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithDistinctNumerals);
            assert.equal(value, "20 ≤ x ≤ 40");
        });

        it ('generates display value for filter values with distinct values and special values', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithDistinctNumeralsAndSpecialValues);
            assert.equal(value, "20 ≤ x ≤ 40, NA, REDACTED");
        });

        it ('generates display value for filter values with a single distinct value', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithSingleDistinctValue);
            assert.equal(value, "666");
        });

        it ('generates display value for filter values with a single distinct value and special values', () => {
            const value = intervalFiltersDisplayValue(filterValuesWithSingleDistinctValueAndSpecialValues);
            assert.equal(value, "666, NA, REDACTED");
        });
    });

    describe('isEveryBinDistinct', () => {
        const noBinDistinct = [
            {start: 10, end: 20},
            {start: 20, end: 30},
            {start: 30, end: 40},
            {start: 40, end: 50}
        ] as ClinicalDataBin[];

        const everyBinDistinct = [
            {start: 0, end: 0},
            {start: 10, end: 10},
            {start: 20, end: 20},
            {start: 30, end: 30}
        ] as ClinicalDataBin[];

        const someBinsDistinct = [
            {start: 0, end: 0},
            {start: 10, end: 10},
            {start: 20, end: 30},
            {start: 30, end: 40}
        ] as ClinicalDataBin[];

        it ('accepts a list of bins with all distinct values', () => {
            assert.isTrue(isEveryBinDistinct(everyBinDistinct),
                "should be true when every bin is distinct");
        });

        it ('rejects an empty list', () => {
            assert.isFalse(isEveryBinDistinct([]),
                "empty list should not be classified as distinct");
        });

        it ('rejects a list of bins with no distinct values', () => {
            assert.isFalse(isEveryBinDistinct(noBinDistinct),
                "should be false when no bin is distinct");
        });

        it ('rejects a list of bins with some distinct values', () => {
            assert.isFalse(isEveryBinDistinct(someBinsDistinct),
                "should be false when some bins are distinct");
        });
    });

    describe('toFixedDigit', () => {
        const negativeValues = [
            -666.666,
            -3,
            -2.2499999999999,
            -2.0000000000001,
            -1,
            -0.6000000000000001,
            -0.002499999998
        ];

        const positiveValues = [
            0.002499999998,
            0.6000000000000001,
            1,
            1.5999999999999999,
            1.7999999999999998,
            2.0000000000000001,
            16.99999999999998,
            666.666
        ];

        it ('handles negative values properly', () => {
            assert.equal(toFixedDigit(negativeValues[0]), "-666.67");
            assert.equal(toFixedDigit(negativeValues[1]), "-3");
            assert.equal(toFixedDigit(negativeValues[2]), "-2.25");
            assert.equal(toFixedDigit(negativeValues[3]), "-2");
            assert.equal(toFixedDigit(negativeValues[4]), "-1");
            assert.equal(toFixedDigit(negativeValues[5]), "-0.6");
            assert.equal(toFixedDigit(negativeValues[6]), "-0.0025");
        });

        it ('handles zero properly', () => {
            assert.equal(toFixedDigit(0), "0");
        });

        it ('handles positive values properly', () => {
            //assert.equal(toFixedDigit(positiveValues[0]), "0.0025");
            assert.equal(toFixedDigit(positiveValues[0]), "0.0025");
            assert.equal(toFixedDigit(positiveValues[1]), "0.6");
            assert.equal(toFixedDigit(positiveValues[2]), "1");
            assert.equal(toFixedDigit(positiveValues[3]), "1.6");
            assert.equal(toFixedDigit(positiveValues[4]), "1.8");
            assert.equal(toFixedDigit(positiveValues[5]), "2");
            assert.equal(toFixedDigit(positiveValues[6]), "17");
            assert.equal(toFixedDigit(positiveValues[7]), "666.67");
        });
    });

    describe('pickClinicalDataColors', () => {
        const clinicalDataCountWithFixedValues = [
            {
                "value": "FALSE",
                "count": 26
            },
            {
                "value": "TRUE",
                "count": 66
            },
            {
                "value": "NA",
                "count": 16
            }
        ];

        const clinicalDataCountWithFixedMixedCaseValues = [
            {
                "value": "Yes",
                "count": 26
            },
            {
                "value": "No",
                "count": 66
            },
            {
                "value": "Male",
                "count": 36
            },
            {
                "value": "F",
                "count": 26
            },
            {
                "value": "Na",
                "count": 16
            }
        ];

        const clinicalDataCountWithBothFixedAndOtherValues = [
            {
                "value": "Yes",
                "count": 26
            },
            {
                "value": "NO",
                "count": 66
            },
            {
                "value": "na",
                "count": 16
            },
            {
                "value": "WHY",
                "count": 46
            },
            {
                "value": "weather",
                "count": 36
            },
            {
                "value": "is",
                "count": 36
            },
            {
                "value": "so",
                "count": 36
            },
            {
                "value": "hot",
                "count": 36
            }
        ];

        it ('picks predefined colors for known clinical attribute values', () => {
            const colors = pickClinicalDataColors(clinicalDataCountWithFixedValues);
            assert.equal(colors["TRUE"], RESERVED_CLINICAL_VALUE_COLORS.true);
            assert.equal(colors["FALSE"], RESERVED_CLINICAL_VALUE_COLORS.false);
            assert.equal(colors["NA"], RESERVED_CLINICAL_VALUE_COLORS.na);
        });

        it ('picks predefined colors for known clinical attribute values in mixed letter case', () => {
            const colors = pickClinicalDataColors(clinicalDataCountWithFixedMixedCaseValues);

            assert.equal(colors["Yes"], RESERVED_CLINICAL_VALUE_COLORS.yes);
            assert.equal(colors["No"], RESERVED_CLINICAL_VALUE_COLORS.no);
            assert.equal(colors["Na"], RESERVED_CLINICAL_VALUE_COLORS.na);
            assert.equal(colors["Male"], RESERVED_CLINICAL_VALUE_COLORS.male);
            assert.equal(colors["F"], RESERVED_CLINICAL_VALUE_COLORS.f);
        });

        it ('does not pick already picked colors again for non-fixed values', () => {
            const availableColors = ["#66AA00", "#666666", "#2986E2", RESERVED_CLINICAL_VALUE_COLORS.na, RESERVED_CLINICAL_VALUE_COLORS.no, "#f88508", RESERVED_CLINICAL_VALUE_COLORS.yes, "#f88507"];

            const colors = pickClinicalDataColors(clinicalDataCountWithBothFixedAndOtherValues, availableColors);

            assert.equal(colors["Yes"], RESERVED_CLINICAL_VALUE_COLORS.yes);
            assert.equal(colors["NO"], RESERVED_CLINICAL_VALUE_COLORS.no);
            assert.equal(colors["na"], RESERVED_CLINICAL_VALUE_COLORS.na);
            assert.equal(colors["WHY"], "#66AA00");
            assert.equal(colors["weather"], "#666666");
            assert.equal(colors["is"], "#2986E2");
            assert.equal(colors["so"], "#f88508");
            assert.equal(colors["hot"], "#f88507");
        });
    });

    describe('getExponent', () => {
        it ('handles negative values properly', () => {
            assert.equal(getExponent(-1), 0);
            assert.equal(getExponent(-3), 0.5);
            assert.equal(getExponent(-10), 1);
            assert.equal(getExponent(-31), 1.5);
            assert.equal(getExponent(-100), 2);
            assert.equal(getExponent(-316), 2.5);
            assert.equal(getExponent(-1000), 3);
        });

        it ('handles zero properly', () => {
            assert.equal(getExponent(0), -Infinity);
        });

        it ('handles positive values properly', () => {
            //assert.equal(toFixedDigit(positiveValues[0]), "0.0025");
            assert.equal(getExponent(1), 0);
            assert.equal(getExponent(3), 0.5);
            assert.equal(getExponent(10), 1);
            assert.equal(getExponent(31), 1.5);
            assert.equal(getExponent(100), 2);
            assert.equal(getExponent(316), 2.5);
            assert.equal(getExponent(1000), 3);
        });
    });

    describe('getCNAByAlteration', ()=>{
        it('return proper string from proper alteration', ()=>{
            assert.isTrue(getCNAByAlteration(-2) === 'DEL');
            assert.isTrue(getCNAByAlteration(2) === 'AMP');
        });

        it('return empty string when alteration is not 2 or -2', ()=>{
            assert.isTrue(getCNAByAlteration(0) === '');
            assert.isTrue(getCNAByAlteration(1) === '');
            assert.isTrue(getCNAByAlteration(-1) === '');
        });
    });

    describe('getDefaultChartTypeByClinicalAttribute', () => {
        it('return TABLE when the clinical attributes are pre-defined as table', () => {
            let attr: ClinicalAttribute = {
                clinicalAttributeId: 'CANCER_TYPE'
            } as ClinicalAttribute;
            assert.isTrue(getDefaultChartTypeByClinicalAttribute(attr) === ChartTypeEnum.TABLE);

            attr.clinicalAttributeId = 'CANCER_TYPE_DETAILED';
            assert.isTrue(getDefaultChartTypeByClinicalAttribute(attr) === ChartTypeEnum.TABLE);
        });

        it('return PIE_CHART when clinical attribute has data type as STRING', () => {
            const attr:ClinicalAttribute = {
                datatype: 'STRING'
            } as ClinicalAttribute;
            assert.isTrue(getDefaultChartTypeByClinicalAttribute(attr) === ChartTypeEnum.PIE_CHART);
        });

        it('return BAR_CHART when clinical attribute has data type as STRING', () => {
            const attr:ClinicalAttribute = {
                datatype: 'NUMBER'
            } as ClinicalAttribute;
            assert.isTrue(getDefaultChartTypeByClinicalAttribute(attr) === ChartTypeEnum.BAR_CHART);
        });
    });

    describe("isOccupied", () => {
        it("Return false if the matrix is empty", () => {
            assert.isFalse(isOccupied([], {x: 0, y: 0}, {w: 1, h: 1}));
        });
        it("Check the bigger chart starts from even index", () => {
            // x
            assert.isTrue(isOccupied([['1', '', '', '2', '', '']], {x: 1, y: 0}, {w: 2, h: 1},));
            assert.isTrue(isOccupied([['1', '', '', '2', '', '']], {x: 2, y: 0}, {w: 2, h: 1}));
            assert.isFalse(isOccupied([['1', '', '', '2', '', '']], {x: 4, y: 0}, {w: 2, h: 1}));

            // y
            assert.isTrue(isOccupied([['1', '1', '', ''], ['2', '2', '', '']], {x: 2, y: 1}, {w: 2, h: 2}));
        });
        it("Return proper value", () => {
            assert.isTrue(isOccupied([['1', '2', '']], {x: 0, y: 0}, {w: 1, h: 1}));
            assert.isTrue(isOccupied([['1', '2', '']], {x: 1, y: 0}, {w: 1, h: 1}));
            assert.isFalse(isOccupied([['1', '2', '']], {x: 2, y: 0}, {w: 1, h: 1}));

            assert.isTrue(isOccupied([['1', '2', '']], {x: 2, y: 0}, {w: 2, h: 1}));

            assert.isTrue(isOccupied([['1', '1', ''], ['2', '2', '']], {x: 0, y: 0}, {w: 1, h: 1}));
            assert.isTrue(isOccupied([['1', '1', ''], ['2', '2', '']], {x: 0, y: 1}, {w: 1, h: 1}));

            assert.isFalse(isOccupied([['1', '1', '', ''], ['2', '2', '', '']], {x: 2, y: 0}, {w: 2, h: 2}));
            assert.isFalse(isOccupied([['1', '1', '', ''], ['2', '2', '', ''], ['3', '3', '', '']], {x: 2, y: 2}, {w: 2, h: 2}));
        });
    });

    describe("findSpot", () => {
        it("0,0 should be returned if the matrix is empty", () => {
            assert.deepEqual(findSpot([], {w: 1, h: 1}), {x: 0, y: 0});
        });
        it("The first index in next row should be returned if the matrix is fully occupied", () => {
            assert.deepEqual(findSpot([['1', '2']], {w: 1, h: 1}), {x: 0, y: 1});
        });
        it("Return proper position", () => {
            assert.deepEqual(findSpot([['1', '2', '']], {w: 1, h: 1}), {x: 2, y: 0});
            assert.deepEqual(findSpot([['1', '2', '']], {w: 2, h: 1}), {x: 0, y: 1});
            assert.deepEqual(findSpot([['1', '1', ''], ['2', '2', '']], {w: 1, h: 1}), {x: 2, y: 0});
            assert.deepEqual(findSpot([['1', '1', ''], ['2', '2', '']], {w: 2, h: 1}), {x: 0, y: 2});
        });
    });

    describe("calculateLayout", () => {
        let visibleAttrs: ChartMeta[] = [];
        let visibleAttrsChartDimensions: { [id: string]: ChartDimension } = {};
        const clinicalAttr: ClinicalAttribute = {
            'clinicalAttributeId': 'test',
            'datatype': 'STRING',
            'description': '',
            'displayName': '',
            'patientAttribute': true,
            'priority': '1',
            'studyId': ''
        };
        for (let i = 0; i < 8; i++) {
            const uniqueKey = 'test' + i;
            visibleAttrs.push({
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: uniqueKey,
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            });
            visibleAttrsChartDimensions[uniqueKey] = {w: 1, h: 1};
        }

        it("Empty array should be returned when no attributes given", () => {
            let layout: Layout[] = calculateLayout([], 6, visibleAttrsChartDimensions, []);
            assert.isArray(layout);
            assert.equal(layout.length, 0);
        });

        it("The layout is not expected - 1", () => {
            let layout: Layout[] = calculateLayout(visibleAttrs, 6, visibleAttrsChartDimensions, []);
            assert.equal(layout.length, 8);
            assert.equal(layout[0].i, 'test0');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);
            assert.equal(layout[1].i, 'test1');
            assert.equal(layout[1].x, 1);
            assert.equal(layout[1].y, 0);
            assert.equal(layout[2].i, 'test2');
            assert.equal(layout[2].x, 2);
            assert.equal(layout[2].y, 0);
            assert.equal(layout[3].i, 'test3');
            assert.equal(layout[3].x, 3);
            assert.equal(layout[3].y, 0);
            assert.equal(layout[4].i, 'test4');
            assert.equal(layout[4].x, 4);
            assert.equal(layout[4].y, 0);
            assert.equal(layout[5].i, 'test5');
            assert.equal(layout[5].x, 5);
            assert.equal(layout[5].y, 0);
            assert.equal(layout[6].i, 'test6');
            assert.equal(layout[6].x, 0);
            assert.equal(layout[6].y, 1);
            assert.equal(layout[7].i, 'test7');
            assert.equal(layout[7].x, 1);
            assert.equal(layout[7].y, 1);
        });

        it("The layout is not expected - 2", () => {
            let layout: Layout[] = calculateLayout(visibleAttrs, 2, visibleAttrsChartDimensions, []);
            assert.equal(layout.length, 8);
            assert.equal(layout[0].i, 'test0');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);
            assert.equal(layout[1].i, 'test1');
            assert.equal(layout[1].x, 1);
            assert.equal(layout[1].y, 0);
            assert.equal(layout[2].i, 'test2');
            assert.equal(layout[2].x, 0);
            assert.equal(layout[2].y, 1);
            assert.equal(layout[3].i, 'test3');
            assert.equal(layout[3].x, 1);
            assert.equal(layout[3].y, 1);
            assert.equal(layout[4].i, 'test4');
            assert.equal(layout[4].x, 0);
            assert.equal(layout[4].y, 2);
            assert.equal(layout[5].i, 'test5');
            assert.equal(layout[5].x, 1);
            assert.equal(layout[5].y, 2);
            assert.equal(layout[6].i, 'test6');
            assert.equal(layout[6].x, 0);
            assert.equal(layout[6].y, 3);
            assert.equal(layout[7].i, 'test7');
            assert.equal(layout[7].x, 1);
            assert.equal(layout[7].y, 3);
        });

        it("Higher priority chart should be displayed first", () => {
            let visibleAttrsChartDimensions: { [id: string]: ChartDimension } = {};
            visibleAttrs = [{
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test0',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: true,
                priority: 10,
            }, {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test1',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 20,
            }];
            visibleAttrsChartDimensions['test0'] = {w: 2, h: 2};
            visibleAttrsChartDimensions['test1'] = {w: 1, h: 1};

            let layout: Layout[] = calculateLayout(visibleAttrs, 4, visibleAttrsChartDimensions, []);
            assert.equal(layout.length, 2);
            assert.equal(layout[0].i, 'test1');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);

            assert.equal(layout[1].i, 'test0');
            assert.equal(layout[1].x, 2);
            assert.equal(layout[1].y, 0);
        });

        it("The lower priority chart should occupy the empty space first", () => {
            let visibleAttrsChartDimensions: { [id: string]: ChartDimension } = {};
            visibleAttrs = [{
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test0',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 10,
            }, {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test1',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: true,
                priority: 5,
            }, {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test2',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 2,
            }];
            visibleAttrsChartDimensions['test0'] = {w: 2, h: 1};
            visibleAttrsChartDimensions['test1'] = {w: 2, h: 2};
            visibleAttrsChartDimensions['test2'] = {w: 1, h: 1};

            let layout: Layout[] = calculateLayout(visibleAttrs, 4, visibleAttrsChartDimensions, []);
            assert.equal(layout.length, 3);
            assert.equal(layout[0].i, 'test0');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);

            assert.equal(layout[1].i, 'test1');
            assert.equal(layout[1].x, 2);
            assert.equal(layout[1].y, 0);


            assert.equal(layout[2].i, 'test2');
            assert.equal(layout[2].x, 0);
            assert.equal(layout[2].y, 1);
        });

        it("The chart should utilize the horizontal space in the last row", () => {
            let visibleAttrsChartDimensions: { [id: string]: ChartDimension } = {};
            visibleAttrs = [{
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test0',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            }, {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test1',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: true,
                priority: 1,
            }, {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test2',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            }, {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test3',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            }, {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test4',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            }];
            visibleAttrsChartDimensions['test0'] = {w: 2, h: 2};
            visibleAttrsChartDimensions['test1'] = {w: 2, h: 2};
            visibleAttrsChartDimensions['test2'] = {w: 2, h: 1};
            visibleAttrsChartDimensions['test3'] = {w: 1, h: 1};
            visibleAttrsChartDimensions['test4'] = {w: 1, h: 1};

            let layout: Layout[] = calculateLayout(visibleAttrs, 4, visibleAttrsChartDimensions, []);
            assert.equal(layout.length, 5);
            assert.equal(layout[0].i, 'test0');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);

            assert.equal(layout[1].i, 'test1');
            assert.equal(layout[1].x, 2);
            assert.equal(layout[1].y, 0);

            assert.equal(layout[2].i, 'test2');
            assert.equal(layout[2].x, 0);
            assert.equal(layout[2].y, 2);

            assert.equal(layout[3].i, 'test3');
            assert.equal(layout[3].x, 2);
            assert.equal(layout[3].y, 2);

            assert.equal(layout[4].i, 'test4');
            assert.equal(layout[4].x, 3);
            assert.equal(layout[4].y, 2);
        });

    });

    describe('getSamplesByExcludingFiltersOnChart', () => {
        it("Test getQValue", () => {
            assert.equal(getQValue(0), '0');
            assert.equal(getQValue(0.00001), '1.000e-5');
            assert.equal(getQValue(-0.01), '-1.000e-2');
        })
    });

    describe('getSamplesByExcludingFiltersOnChart', () => {
        let fetchStub: sinon.SinonStub;
        beforeEach(() => {
            fetchStub = sinon.stub(internalClient, 'fetchFilteredSamplesUsingPOST');
            fetchStub
                .returns(Promise.resolve([]));
        });
        afterEach(() => {
            fetchStub.restore();
        });

        it('no filters selected', (done) => {
            getSamplesByExcludingFiltersOnChart(
                UniqueKey.CANCER_STUDIES,
                emptyStudyViewFilter,
                {},
                [{ sampleId: 'sample1', studyId: 'study1' }],
                ['study1']
            ).then(() => {
                assert.isTrue(fetchStub.calledWith({ studyViewFilter: { ...emptyStudyViewFilter, sampleIdentifiers: [{ sampleId: 'sample1', studyId: 'study1' }] } }));
                done();
            }).catch(done);
        });


        it('has filter for one chart', (done) => {
            getSamplesByExcludingFiltersOnChart(
                UniqueKey.MUTATION_COUNT,
                emptyStudyViewFilter,
                { [UniqueKey.CANCER_STUDIES]: [{ sampleId: 'sample1', studyId: 'study1' }] },
                [{ sampleId: 'sample1', studyId: 'study1' }, { sampleId: 'sample2', studyId: 'study1' }],
                ['study1']
            ).then(() => {
                assert.isTrue(fetchStub.calledWith({ studyViewFilter: { ...emptyStudyViewFilter, sampleIdentifiers: [{ sampleId: 'sample1', studyId: 'study1' }] } }));
                done();
            }).catch(done);
        });

        it('no filters selected and queriedSampleIdentifiers is empty', (done) => {
            getSamplesByExcludingFiltersOnChart(
                UniqueKey.CANCER_STUDIES,
                emptyStudyViewFilter,
                {},
                [],
                ['study1']
            ).then(() => {
                assert.isTrue(fetchStub.calledWith({ studyViewFilter: { ...emptyStudyViewFilter, studyIds: ['study1'] } }));
                done();
            }).catch(done);
        });

        it('has filter for one chart and queriedSampleIdentifiers is empty', (done) => {
            getSamplesByExcludingFiltersOnChart(
                UniqueKey.MUTATION_COUNT,
                emptyStudyViewFilter,
                { [UniqueKey.CANCER_STUDIES]: [{ sampleId: 'sample1', studyId: 'study1' }] },
                [],
                ['study1']
            ).then(() => {
                assert.isTrue(fetchStub.calledWith({ studyViewFilter: { ...emptyStudyViewFilter, sampleIdentifiers: [{ sampleId: 'sample1', studyId: 'study1' }] } }));
                done();
            }).catch(done);
        });
    });

    describe('getFilteredSampleIdentifiers', ()=>{
        let samples:Sample[] = [
            { sampleId: 'sample1', studyId: 'study1' , sequenced: true , copyNumberSegmentPresent:false},
            { sampleId: 'sample2', studyId: 'study1' , sequenced: false , copyNumberSegmentPresent: true}
        ] as any
        it('when filter function is not present', ()=>{
            assert.deepEqual(getFilteredSampleIdentifiers([]),[]);
            assert.deepEqual(getFilteredSampleIdentifiers(samples),[{ sampleId: 'sample1', studyId: 'study1' }, { sampleId: 'sample2', studyId: 'study1' }]);
        });

        it('when filter function is present', ()=>{
            assert.deepEqual(getFilteredSampleIdentifiers(samples,  (sample) => sample.sequenced),[{ sampleId: 'sample1', studyId: 'study1' }]);
            assert.deepEqual(getFilteredSampleIdentifiers(samples,  (sample) => sample.copyNumberSegmentPresent),[{ sampleId: 'sample2', studyId: 'study1' }]);
        });
    });

    describe('showOriginStudiesInSummaryDescription', () => {
        it('hide origin studies in summary description', () => {
            assert.equal(showOriginStudiesInSummaryDescription([], []), false);
            assert.equal(showOriginStudiesInSummaryDescription([{ studyId: 'CancerStudy1' }] as CancerStudy[], [] as VirtualStudy[]), false);
            assert.equal(showOriginStudiesInSummaryDescription([{ studyId: 'CancerStudy1' }] as CancerStudy[], [{ id: 'VirtualStudy1' }] as VirtualStudy[]), false);
        });
        it('show origin studies in summary description', () => {
            assert.equal(showOriginStudiesInSummaryDescription([], [{ id: 'VirtualStudy1' }] as VirtualStudy[]), true);
        });
    });

    describe('getFilteredStudiesWithSamples', () => {

        const samples: Sample[] = [{ sampleId: 'sample1', studyId: 'study1', uniqueSampleKey: 'sample1' }] as any;
        const physicalStudies: CancerStudy[] = [{ studyId: 'study1' }] as any;
        const virtualStudies: VirtualStudy[] = [{
            id: 'virtualStudy1', data: {
                name: 'virtual study 1',
                description: 'virtual study 1',
                studies: [{ id: 'study1', samples: ['sample1'] }, { id: 'study2', samples: ['sample1'] }]
            }
        }] as any;
        it('returns expected results', () => {
            assert.deepEqual(getFilteredStudiesWithSamples([], [], []), []);
            assert.deepEqual(getFilteredStudiesWithSamples(samples, physicalStudies, []), [{ studyId: 'study1', uniqueSampleKeys: ['sample1'] }] as any);
            assert.deepEqual(
                getFilteredStudiesWithSamples(samples, physicalStudies, virtualStudies),
                [
                    {
                        studyId: 'study1',
                        uniqueSampleKeys: ['sample1']
                    },
                    {
                        studyId: "virtualStudy1",
                        name: "virtual study 1",
                        description: "virtual study 1",
                        uniqueSampleKeys: [
                            "sample1"
                        ]
                    }] as any);
        });
    });

    describe('getFrequencyStr', () => {
        const negativeValues = [
            -666.666,
            -3,
            -2.2499999999999,
            -1,
            -0.6000000000000001,
            -0.002499999998
        ];

        const positiveValues = [
            0.002499999998,
            0.6000000000000001,
            1,
            1.00001,
            1.5999999999999999,
            1.7999999999999998,
            16.99999999999998,
            16.77,
            16.74,
            666.666
        ];

        it ('handles negative values properly', () => {
            assert.equal(getFrequencyStr(negativeValues[0]), "NA");
            assert.equal(getFrequencyStr(negativeValues[1]), "NA");
            assert.equal(getFrequencyStr(negativeValues[2]), "NA");
            assert.equal(getFrequencyStr(negativeValues[3]), "NA");
            assert.equal(getFrequencyStr(negativeValues[4]), "NA");
            assert.equal(getFrequencyStr(negativeValues[5]), "NA");
        });

        it ('handles zero properly', () => {
            assert.equal(getFrequencyStr(0), "0%");
        });

        it ('handles positive values properly', () => {
            //assert.equal(getFrequencyStr(positiveValues[0]), "0.0025");
            assert.equal(getFrequencyStr(positiveValues[0]), "<0.1%");
            assert.equal(getFrequencyStr(positiveValues[1]), "0.6%");
            assert.equal(getFrequencyStr(positiveValues[2]), "1.0%");
            assert.equal(getFrequencyStr(positiveValues[3]), "1.0%");
            assert.equal(getFrequencyStr(positiveValues[4]), "1.6%");
            assert.equal(getFrequencyStr(positiveValues[5]), "1.8%");
            assert.equal(getFrequencyStr(positiveValues[6]), "17.0%");
            assert.equal(getFrequencyStr(positiveValues[7]), "16.8%");
            assert.equal(getFrequencyStr(positiveValues[8]), "16.7%");
            assert.equal(getFrequencyStr(positiveValues[9]), "666.7%");
        });
    });

    describe('formatFrequency', () => {
        const negativeValues = [
            -666.666,
            -0.002499999998
        ];

        const positiveValues = [
            0.002499999998,
            0.6000000000000001,
            1,
            1.00001,
            1.5999999999999999,
            1.7999999999999998,
            16.99999999999998,
            16.77,
            16.74,
            666.666
        ];

        it('handles negative values properly', () => {
            assert.equal(formatFrequency(negativeValues[0]), -1);
            assert.equal(formatFrequency(negativeValues[1]), -1);
        });

        it('handles zero properly', () => {
            assert.equal(formatFrequency(0), 0);
        });

        it('handles positive values properly', () => {
            assert.equal(formatFrequency(positiveValues[0]), 0.05);
            assert.equal(formatFrequency(positiveValues[1]), 0.6);
            assert.equal(formatFrequency(positiveValues[2]), 1);
            assert.equal(formatFrequency(positiveValues[3]), 1);
            assert.equal(formatFrequency(positiveValues[4]), 1.6);
            assert.equal(formatFrequency(positiveValues[5]), 1.8);
            assert.equal(formatFrequency(positiveValues[6]), 17);
            assert.equal(formatFrequency(positiveValues[7]), 16.8);
            assert.equal(formatFrequency(positiveValues[8]), 16.7);
            assert.equal(formatFrequency(positiveValues[9]), 666.7);
        });
    });

    describe('getClinicalDataCountWithColorByClinicalDataCount', () => {
        it('NA should be placed at the last and also get predefined color for NA', () => {
            const result = getClinicalDataCountWithColorByClinicalDataCount([{
                count: 50,
                value: 'NA'
            }, {
                count: 10,
                value: 'Stage I'
            }]);
            assert.equal(result.length, 2);
            assert.equal(result[0].value, 'Stage I');
            assert.equal(result[1].color, DEFAULT_NA_COLOR);
        });

        it('Test the reserved value', () => {
            const result = getClinicalDataCountWithColorByClinicalDataCount([{
                count: 50,
                value: 'Male'
            }, {
                count: 10,
                value: 'F'
            }]);
            assert.equal(result.length, 2);
            assert.equal(result[0].color, RESERVED_CLINICAL_VALUE_COLORS.male);
            assert.equal(result[1].color, RESERVED_CLINICAL_VALUE_COLORS.f);
        });
    });

    describe('clinicalDataCountComparator', () => {
        it('returns zero if both NA', () => {
            assert.equal(clinicalDataCountComparator({value: "NA", count: 1}, {value: "na", count: 666}), 0);
        });

        it('returns 1 if a is NA, but not b', () => {
            assert.equal(clinicalDataCountComparator({value: "NA", count: 666}, {value: "HIGH", count: 66}), 1);
        });

        it('returns -1 if b is NA, but not a', () => {
            assert.equal(clinicalDataCountComparator({value: "FEMALE", count: 6}, {value: "NA", count: 666}), -1);
        });

        it('returns count difference if none NA', () => {
            assert.equal(clinicalDataCountComparator({value: "FEMALE", count: 6}, {value: "MALE", count: 16}), 10);
            assert.equal(clinicalDataCountComparator({value: "FEMALE", count: 16}, {value: "MALE", count: 6}), -10);
            assert.equal(clinicalDataCountComparator({value: "FEMALE", count: 666}, {value: "MALE", count: 666}), 0);
        });
    });

    describe('chartMetaComparator', () => {
        it('returns 0 if priority and display name are exactly same', () => {
            assert.equal(chartMetaComparator({priority: 100, displayName: "test chart"} as ChartMeta, {priority: 100, displayName: "test chart"} as ChartMeta), 0);
        });

        it('returns difference if priority is higher', () => {
            assert.equal(chartMetaComparator({priority: 100, displayName: "name b"} as ChartMeta, {priority: 50, displayName: "name a"} as ChartMeta), -50);
        });

        it('returns difference if priority is lower', () => {
            assert.equal(chartMetaComparator({priority: 50, displayName: "name a"} as ChartMeta, {priority: 100, displayName: "name b"} as ChartMeta), 50);
        });

        it('when priority is same, returns 1 if displayName is alphabet higher', () => {
            assert.equal(chartMetaComparator({priority: 100, displayName: "name z"} as ChartMeta, {priority: 100, displayName: "name a"} as ChartMeta), 1);
        });

        it('when priority is same, returns -1 if displayName is alphabet lower', () => {
            assert.equal(chartMetaComparator({priority: 100, displayName: "name a"} as ChartMeta, {priority: 100, displayName: "name z"} as ChartMeta), -1);
        });
    });

    describe('getRequestedAwaitPromisesForClinicalData', () => {
        // Create some references
        const unfilteredPromise: MobxPromise<any> = {
            result: [],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };
        const newlyAddedUnfilteredPromise: MobxPromise<any> = {
            result: [],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };
        const initialVisibleAttributesPromise: MobxPromise<any> = {
            result: [],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined
        };
        it('initialVisibleAttributesPromise should be used when the chart is default visible attribute and in initial state', () => {
            const promises = getRequestedAwaitPromisesForClinicalData(true, true, false, false, unfilteredPromise, newlyAddedUnfilteredPromise, initialVisibleAttributesPromise);
            assert.equal(promises.length, 1);
            assert.isTrue(promises[0] === initialVisibleAttributesPromise);
        });
        it('newlyAddedUnfilteredPromise should be used when the chart is not default visible attribute, at the time the chart is not filtered', () => {
            const promises = getRequestedAwaitPromisesForClinicalData(false, true, false,  false, unfilteredPromise, newlyAddedUnfilteredPromise, initialVisibleAttributesPromise);
            assert.equal(promises.length, 1);
            assert.isTrue(promises[0] === newlyAddedUnfilteredPromise);
        });
        it('unfilteredPromise should be used when there are filters applied, but attribute is unfiltered, ignore whether the chart is default visible attribute', () => {
            let promises = getRequestedAwaitPromisesForClinicalData(true, false, true,  false, unfilteredPromise, newlyAddedUnfilteredPromise, initialVisibleAttributesPromise);
            assert.equal(promises.length, 1);
            assert.isTrue(promises[0] === unfilteredPromise);

            promises = getRequestedAwaitPromisesForClinicalData(false, false, true,  false, unfilteredPromise, newlyAddedUnfilteredPromise, initialVisibleAttributesPromise);
            assert.equal(promises.length, 1);
            assert.isTrue(promises[0] === unfilteredPromise);
        });

        it('unfilteredPromise should be used when there are filters applied, when it is newly added chart', () => {
            let promises = getRequestedAwaitPromisesForClinicalData(true, false, true, false, unfilteredPromise, newlyAddedUnfilteredPromise, initialVisibleAttributesPromise);
            assert.equal(promises.length, 1);
            assert.isTrue(promises[0] === unfilteredPromise);
        });

        it('When chart is filtered and not in initial state, empty array should be returned. Ignore whether the chart is default visible attribute', () => {
            let promises = getRequestedAwaitPromisesForClinicalData(true, false, true,  true, unfilteredPromise, newlyAddedUnfilteredPromise, initialVisibleAttributesPromise);
            assert.equal(promises.length, 0);

            promises = getRequestedAwaitPromisesForClinicalData(false, false, true,  true, unfilteredPromise, newlyAddedUnfilteredPromise, initialVisibleAttributesPromise);
            assert.equal(promises.length, 0);
        });
    })

    describe('getPriorityByClinicalAttribute', () => {
        it('The priority from database needs to overwrite the frontned config in the frontend', () => {
            let attr = {
                'clinicalAttributeId': 'AGE',
                'datatype': 'STRING',
                'description': '',
                'displayName': '',
                'patientAttribute': true,
                'priority': '10',
                'studyId': ''
            };
            assert.equal(getPriorityByClinicalAttribute(attr), 10);
        });
        it('The frontned config priority should be used when the DB priority is set to default', () => {
            let attr = {
                'clinicalAttributeId': 'AGE',
                'datatype': 'STRING',
                'description': '',
                'displayName': '',
                'patientAttribute': true,
                'priority': '1',
                'studyId': ''
            };
            assert.equal(getPriorityByClinicalAttribute(attr), 9);
        });
    })

    describe('getClinicalEqualityFilterValuesByString', () => {
        it('the values should be separated by comma', () => {
            let result = getClinicalEqualityFilterValuesByString('test1,test2');
            assert.equal(result.length, 2);
            assert.equal(result[0], 'test1');

            result = getClinicalEqualityFilterValuesByString('test1;test2');
            assert.equal(result.length, 1);
        });

        it('Allow using back slash to escape the comma actually in the content', () => {
            let result = getClinicalEqualityFilterValuesByString('test1\\,test2');
            assert.equal(result.length, 1);
            assert.equal(result[0], 'test1,test2');
        });

        it('Allow using back slash to escape the comma actually in the content, multiple instances', () => {
            let result = getClinicalEqualityFilterValuesByString('test1\\,test2,test3, test4\\,test5\\,test6');
            assert.equal(result.length, 3);
            assert.equal(result[0], 'test1,test2');
            assert.equal(result[1], 'test3');
            assert.equal(result[2], 'test4,test5,test6');
        });
    });

    describe('getClinicalDataCountWithColorByCategoryCounts', () => {
        it('When both counts are zero', () => {
            assert.deepEqual([], getClinicalDataCountWithColorByCategoryCounts(0, 0))
        });
        it('When only yesCount is > 0', () => {
            assert.deepEqual([{ count: 10, value: "YES", color: CLI_YES_COLOR, freq: '100.0%', percentage: 1 }], getClinicalDataCountWithColorByCategoryCounts(10, 0))
        });
        it('When only noCount is > 0', () => {
            assert.deepEqual([{ count: 10, value: "NO", color: CLI_NO_COLOR, freq: '100.0%', percentage: 1 }], getClinicalDataCountWithColorByCategoryCounts(0, 10))
        });
        it('When both counts are > 0', () => {
            assert.deepEqual(
                [
                    { count: 10, value: "YES", color: CLI_YES_COLOR, freq: '50.0%', percentage: 0.5 },
                    { count: 10, value: "NO", color: CLI_NO_COLOR , freq: '50.0%', percentage: 0.5}
                ], getClinicalDataCountWithColorByCategoryCounts(10, 10))
        });
    });

    describe ('calculateNewLayoutForFocusedChart', () => {
        it('should return the previous x, y, and new chartMeta dimension for not overflow position', () => {
            const clinicalAttr: ClinicalAttribute = {
                'clinicalAttributeId': 'test',
                'datatype': 'STRING',
                'description': '',
                'displayName': '',
                'patientAttribute': true,
                'priority': '1',
                'studyId': ''
            };
            const layout = {
                x: 1,
                y: 1,
                w: 1,
                h: 1
            };
            const focusedChartMeta = {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            };
            const focusedChartDimension = {w: 2, h: 2};
            const cols = 5;
            const newLayout = calculateNewLayoutForFocusedChart(layout, focusedChartMeta, cols, focusedChartDimension);
            assert.equal(newLayout.i, 'test');
            assert.equal(newLayout.x, 1);
            assert.equal(newLayout.y, 1);
            assert.equal(newLayout.w, 2);
            assert.equal(newLayout.h, 2);
            assert.equal(newLayout.isResizable, false);
        });

        it('should return the fixed x, previous y, and new chartMeta dimension for the overflow positions', () => {
            const clinicalAttr: ClinicalAttribute = {
                'clinicalAttributeId': 'test',
                'datatype': 'STRING',
                'description': '',
                'displayName': '',
                'patientAttribute': true,
                'priority': '1',
                'studyId': ''
            };
            const layout = {
                x: 4,
                y: 1,
                w: 1,
                h: 1
            };
            const focusedChartMeta = {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            };
            const focusedChartDimension = {w: 2, h: 2};
            const cols = 5;
            const newLayout = calculateNewLayoutForFocusedChart(layout, focusedChartMeta, cols, focusedChartDimension);
            assert.equal(newLayout.i, 'test');
            assert.equal(newLayout.x, 3);
            assert.equal(newLayout.y, 1);
            assert.equal(newLayout.w, 2);
            assert.equal(newLayout.h, 2);
            assert.equal(newLayout.isResizable, false);
        });

        it('should return the fixed x, previous y, and new chartMeta dimension for the shrunk chart', () => {
            const clinicalAttr: ClinicalAttribute = {
                'clinicalAttributeId': 'test',
                'datatype': 'STRING',
                'description': '',
                'displayName': '',
                'patientAttribute': true,
                'priority': '1',
                'studyId': ''
            };
            const layout = {
                x: 1,
                y: 1,
                w: 2,
                h: 2
            };
            const focusedChartMeta = {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            };
            const focusedChartDimension = {w: 1, h: 1};
            const cols = 5;
            const newLayout = calculateNewLayoutForFocusedChart(layout, focusedChartMeta, cols, focusedChartDimension);
            assert.equal(newLayout.i, 'test');
            assert.equal(newLayout.x, 2);
            assert.equal(newLayout.y, 1);
            assert.equal(newLayout.w, 1);
            assert.equal(newLayout.h, 1);
            assert.equal(newLayout.isResizable, false);
        });
    })

    describe ('generateMatrixByLayout', () => {
        it('should return the generated matrix', () => {
            const layout = {
                i: 'test',
                x: 1,
                y: 1,
                w: 1,
                h: 1,
                isResizable: false
            };
            const cols = 5;
            const matrix = generateMatrixByLayout(layout, cols);
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < cols; j++) {
                    if (i === 1 && j === 1) {
                        assert.equal(matrix[i][j], 'test');
                        break;
                    }
                    assert.equal(matrix[i][j], '');
                }
            }
        });
    })

    describe ('isFocusedChartShrunk', () => {
        const largeDimension = {w: 2, h: 2};
        const smallDimension = {w: 1, h: 1};
        it('should return true if the chart shrunk', () => {
            assert.equal(isFocusedChartShrunk(largeDimension, smallDimension), true);
        });
        it('should return false if the chart not shrunk', () => {
            assert.equal(isFocusedChartShrunk(smallDimension, largeDimension), false);
        });
        it('should return false if the dimension is not changed', () => {
            assert.equal(isFocusedChartShrunk(smallDimension, smallDimension), false);
            assert.equal(isFocusedChartShrunk(largeDimension, largeDimension), false);
        });
    })

    const layoutForPositionTest = [
        {
            i: 'test',
            x: 1,
            y: 1,
            w: 1,
            h: 1
        } as Layout
    ];

    describe ('getPositionXByUniqueKey', () => {
        it('should return undefined for the not exist uniqueKey', () => {
            assert.equal(getPositionXByUniqueKey(layoutForPositionTest, 'test1'), undefined);
            assert.equal(getPositionXByUniqueKey([], 'test'), undefined);
            assert.equal(getPositionXByUniqueKey([], ''), undefined);
        });
        it('should return the X value of the layout which matches the uniqueKey', () => {
            assert.equal(getPositionXByUniqueKey(layoutForPositionTest, 'test'), 1);
        });
    })

    describe ('getPositionYByUniqueKey', () => {
        it('should return undefined for the not exist uniqueKey', () => {
            assert.equal(getPositionYByUniqueKey(layoutForPositionTest, 'test1'), undefined);
            assert.equal(getPositionYByUniqueKey([], 'test'), undefined);
            assert.equal(getPositionYByUniqueKey([], ''), undefined);
        });
        it('should return the Y value of the layout which matches the uniqueKey', () => {
            assert.equal(getPositionYByUniqueKey(layoutForPositionTest, 'test'), 1);
        });
    })

    describe("getStudyViewTabId", ()=>{
        it("gets study view tab id correctly", ()=>{
            assert.equal(getStudyViewTabId("study"), undefined);
            assert.equal(getStudyViewTabId("study/"), undefined);
            assert.equal(getStudyViewTabId("study/asdf"), "asdf" as any);
            assert.equal(getStudyViewTabId("study/summary"), StudyViewPageTabKeyEnum.SUMMARY);
            assert.equal(getStudyViewTabId("study/summary/"), StudyViewPageTabKeyEnum.SUMMARY);
        });
    });

    describe('customBinsAreValid', () => {
        it('If the bins have string, it should be invalid', () => {
            assert.isTrue(!customBinsAreValid(['1', 'test']));
        });
        it('If there is no bin defined, it should be invalid', () => {
            assert.isTrue(!customBinsAreValid([]));
        });
        it('Test a valid bin', () => {
            assert.isTrue(customBinsAreValid(['1', '2']));
        });
    })

    describe("formatRange", () => {
        it("should format min max range with no special value", () => {
            const actual = formatRange(1.5, 2.5, undefined)
            const expected = "1.5-2.5";
            assert.equal(actual, expected);
        });

        it("should format min max range with special value", () => {
            const actual = formatRange(1, 2, "Foo ");
            const expected = "Foo 1-2";

            assert.equal(actual, expected);
        });

        it("should format min range with special value", () => {
            const acutal = formatRange(1, undefined, "<=");
            const expected = "≤1";

            assert.equal(acutal, expected);
        });

        it("should format max range with special value", () => {
            const actual = formatRange(undefined, 2, ">=");
            const expected = "≥2";

            assert.equal(actual, expected);
        });

        it("should format min max range where min = max", () => {
            const actual = formatRange(10, 10, undefined);
            const expected = "10";

            assert.equal(actual, expected);
        });
    });

    describe("getBinName", () => {
        it("should return correct bin name", () => {
            assert.equal(getBinName({ specialValue:"NA" } as any), "NA");
            assert.equal(getBinName({ start:10, end:20 } as any), "10-20");
            assert.equal(getBinName({ start:10, specialValue:"<=" } as any), "<=10");
            assert.equal(getBinName({ specialValue:">", end:20 } as any), ">20");
        });
    });

    describe("getGroupedClinicalDataByBins", () => {

        let clinicalData = [{
            patientId: 'patient1',
            sampleId: 'sample1',
            studyId: 'study1',
            uniquePatientKey: 'patient1',
            value: 10
        }, {
            patientId: 'patient2',
            sampleId: 'sample2',
            studyId: 'study1',
            uniquePatientKey: 'patient2',
            value: 11
        }, {
            patientId: 'patient3',
            sampleId: 'sample3',
            studyId: 'study1',
            uniquePatientKey: 'patient3',
            value: 20
        }, {
            patientId: 'patient4',
            sampleId: 'sample4',
            studyId: 'study1',
            uniquePatientKey: 'patient4',
            value: 30
        }, {
            patientId: 'patient5',
            sampleId: 'sample5',
            studyId: 'study1',
            uniquePatientKey: 'patient5',
            value: 40
        }, {
            patientId: 'patient6',
            sampleId: 'sample6',
            studyId: 'study1',
            uniquePatientKey: 'patient6',
            value: 45
        }, {
            patientId: 'patient7',
            sampleId: 'sample7',
            studyId: 'study1',
            uniquePatientKey: 'patient7',
            value: 'NA'
        }]

        let dataBins = [{
            'end': 10,
            'specialValue': '<='
        }, {
            'start': 10,
            'end': 20,
        }, {
            'start': 20,
            'end': 40,
        }, {
            'start': 40,
            'specialValue': '>'
        }, {
            'specialValue': 'NA'
        }]


        it("should return grouped clinicalData by bins", () => {
            assert.deepEqual(getGroupedClinicalDataByBins(clinicalData as any, dataBins as any), {
                "<=10": [{
                    "patientId": "patient1",
                    "sampleId": "sample1",
                    "studyId": "study1",
                    "uniquePatientKey": "patient1",
                    "value": 10
                }],
                "10-20": [{
                    "patientId": "patient2",
                    "sampleId": "sample2",
                    "studyId": "study1",
                    "uniquePatientKey": "patient2",
                    "value": 11
                }, {
                    "patientId": "patient3",
                    "sampleId": "sample3",
                    "studyId": "study1",
                    "uniquePatientKey": "patient3",
                    "value": 20
                }],
                "20-40": [{
                    "patientId": "patient4",
                    "sampleId": "sample4",
                    "studyId": "study1",
                    "uniquePatientKey": "patient4",
                    "value": 30
                }, {
                    "patientId": "patient5",
                    "sampleId": "sample5",
                    "studyId": "study1",
                    "uniquePatientKey": "patient5",
                    "value": 40
                }],
                ">40": [{
                    "patientId": "patient6",
                    "sampleId": "sample6",
                    "studyId": "study1",
                    "uniquePatientKey": "patient6",
                    "value": 45
                }],
                "NA": [{
                    "patientId": "patient7",
                    "sampleId": "sample7",
                    "studyId": "study1",
                    "uniquePatientKey": "patient7",
                    "value": "NA"
                }]
            } as any);
        });
    });
});
