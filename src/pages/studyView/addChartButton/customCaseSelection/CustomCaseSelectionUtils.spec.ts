import {assert} from 'chai';
import * as _ from 'lodash';
import {
    CHART_NAME_LINE_START,
    ErrorCodeEnum,
    getLine,
    getLines,
    InputLine,
    LineTypeEnum,
    LineValidationResult,
    purifyLine,
    validateLines
} from "./CustomCaseSelectionUtils";
import {ClinicalDataTypeEnum} from "../../StudyViewPageStore";
import {Sample} from "../../../../shared/api/generated/CBioPortalAPI";

describe('CustomCaseSelectionUtils', () => {
    describe('getLine', () => {
        it('CHART NAME should be properly assigned', () => {
            assert.isTrue(getLine('#chart_name:test').type === LineTypeEnum.CHART_NAME);
            assert.isTrue(getLine('#chart_name: test').type === LineTypeEnum.CHART_NAME);
            assert.isTrue(getLine('#chart_name: test ').type === LineTypeEnum.CHART_NAME);
            assert.isTrue(getLine('#chart_name:').type === LineTypeEnum.CHART_NAME);
        });
        it('GROUP NAME should be properly assigned', () => {
            assert.isTrue(getLine('>group:test').type === LineTypeEnum.GROUP_NAME);
            assert.isTrue(getLine('>group: test').type === LineTypeEnum.GROUP_NAME);
            assert.isTrue(getLine('>group: test ').type === LineTypeEnum.GROUP_NAME);
            assert.isTrue(getLine('>group:').type === LineTypeEnum.GROUP_NAME);
        });
        it('CASE_ID should be properly assigned', () => {
            assert.isTrue(getLine('>:test').type === LineTypeEnum.CASE_ID);
            assert.isTrue(getLine('#: test').type === LineTypeEnum.CASE_ID);
            assert.isTrue(getLine(': test ').type === LineTypeEnum.CASE_ID);
            assert.isTrue(getLine('test').type === LineTypeEnum.CASE_ID);
            assert.isTrue(getLine('').type === LineTypeEnum.CASE_ID);
        });
    });
    describe('getLines', () => {
        it('parse chart name properly', () => {
            const line = '#chart_name: test';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
            assert.isTrue(result[0].type === LineTypeEnum.CHART_NAME);
            assert.isTrue(result[0].content.length === 1);
            assert.isTrue(result[0].content[0] === 'test');
        });

        it('parse group name properly', () => {
            const line = '#chart_name: test\n>group: test1\n';
            const result = getLines(line);
            assert.isTrue(result.length === 2);
            assert.isTrue(result[1].type === LineTypeEnum.GROUP_NAME);
            assert.isTrue(result[1].content.length === 1);
            assert.isTrue(result[1].content[0] === 'test1');
        });

        it('parse case id properly', () => {
            const line = '#chart_name: test\n>group: test1\ns1:c1';
            const result = getLines(line);
            assert.isTrue(result.length === 3);
            assert.isTrue(result[2].type === LineTypeEnum.CASE_ID);
            assert.isTrue(result[2].content.length === 2);
            assert.isTrue(result[2].content[0] === 's1');
            assert.isTrue(result[2].content[1] === 'c1');
        });
    });
    describe('purifyLine', () => {
        it('parse chart name properly - 1', () => {
            const line = '#chart_name: test';
            const result = purifyLine(line, CHART_NAME_LINE_START);
            assert.isTrue(result.length === 1);
            assert.isTrue(result[0] === 'test');
        });

        it('parse chart name properly - 2', () => {
            const line = '#chart_name:test';
            const result = purifyLine(line, CHART_NAME_LINE_START);
            assert.isTrue(result.length === 1);
            assert.isTrue(result[0] === 'test');
        });

        it('parse chart name properly - 3', () => {
            const line = '#chart_name:test ';
            const result = purifyLine(line, CHART_NAME_LINE_START);
            assert.isTrue(result.length === 1);
            assert.isTrue(result[0] === 'test');
        });

        it('parse chart name properly - 4', () => {
            const line = '#chart_name:      ';
            const result = purifyLine(line, CHART_NAME_LINE_START);
            assert.isTrue(result.length === 0);
        });

        it('parse chart name properly - 5', () => {
            const line = '   #chart_name:      ';
            const result = purifyLine(line, CHART_NAME_LINE_START);
            assert.isTrue(result.length === 0);
        });
    });

    describe('validateLines', () => {
        const st1 = _.map(new Array(10), (item, index) => {
            return {
                "studyId": "chol_nus_2012",
                "sampleId": "s" + index,
                "patientId": "p" + index,
                "copyNumberSegmentPresent": false,
                "sampleType": "Primary Solid Tumor",
                "sequenced": true,
                "uniquePatientKey": "chol_nus_2012_p" + index,
                "uniqueSampleKey": "chol_nus_2012_s" + index
            };
        }) as Sample[];

        const st2 = _.map(new Array(5), (item, index) => {
            return {
                "studyId": "lgg_tcga",
                "sampleId": "s" + index,
                "patientId": "p" + index,
                "copyNumberSegmentPresent": false,
                "sampleType": "Primary Solid Tumor",
                "sequenced": true,
                "uniquePatientKey": "lgg_tcga_p" + index,
                "uniqueSampleKey": "lgg_tcga_s" + index
            };
        }) as Sample[];

        it('chart name/group name should be specified - 1', () => {
            const lines: InputLine[] = [];
            const result = validateLines(lines, ClinicalDataTypeEnum.PATIENT, st1, true, ['chol_nus_2012']);
            assert.isTrue(result.error.length !== 0);
            assert.isTrue(_.keyBy(result.error, 'code')[ErrorCodeEnum.NO_CHART_NAME] !== undefined);
            assert.isTrue(_.keyBy(result.error, 'code')[ErrorCodeEnum.NO_GROUP_NAME] !== undefined);
        });

        it('chart name/group name should be specified - 2', () => {
            const lines: InputLine[] = [{
                type: LineTypeEnum.CASE_ID,
                line: 'chol_nus_2012:s1',
                content: ['chol_nus_2012', 's1']
            }];
            const result: LineValidationResult = validateLines(lines, ClinicalDataTypeEnum.SAMPLE, st1, true, ['chol_nus_2012']);
            assert.isTrue(result.error.length !== 0);
            assert.isTrue(_.keyBy(result.error, 'code')[ErrorCodeEnum.NO_CHART_NAME] !== undefined);
            assert.isTrue(_.keyBy(result.error, 'code')[ErrorCodeEnum.NO_GROUP_NAME] !== undefined);
        });

        it('In multiple studies, study id needs to be specified', () => {
            const lines: InputLine[] = [{
                type: LineTypeEnum.CHART_NAME,
                line: '#chart_name: test',
                content: ['chol_nus_2012', 's1']
            }, {
                type: LineTypeEnum.GROUP_NAME,
                line: '>group:group1',
                content: ['group1']
            }, {
                type: LineTypeEnum.CASE_ID,
                line: 'chol_nus_2012:s1',
                content: ['chol_nus_2012', 's1']
            }, {
                type: LineTypeEnum.CASE_ID,
                line: 'lgg_tcga:s1',
                content: ['lgg_tcga', 's1']
            }, {
                type: LineTypeEnum.CASE_ID,
                line: 's1',
                content: ['s1']
            }];
            const result: LineValidationResult = validateLines(lines, ClinicalDataTypeEnum.SAMPLE, st1.concat(st2), false, ['chol_nus_2012', 'lgg_tcga']);

            assert.isTrue(result.error.length !== 0);
            assert.isTrue(_.keyBy(result.error, 'code')[ErrorCodeEnum.INVALID_CASE_ID] !== undefined);
        });

        it('Give error for unknown study ids', () => {
            const lines: InputLine[] = [{
                type: LineTypeEnum.CHART_NAME,
                line: '#chart_name: test',
                content: ['chol_nus_2012', 's1']
            }, {
                type: LineTypeEnum.GROUP_NAME,
                line: '>group:group1',
                content: ['group1']
            }, {
                type: LineTypeEnum.CASE_ID,
                line: 'chol_nus_2012:s1',
                content: ['chol_nus_2012', 's1']
            }, {
                type: LineTypeEnum.CASE_ID,
                line: 'lgg_tcga:s1',
                content: ['lgg_tcga', 's1']
            }, {
                type: LineTypeEnum.CASE_ID,
                line: 'test:s1',
                content: ['test', 's1']
            }];
            const result: LineValidationResult = validateLines(lines, ClinicalDataTypeEnum.SAMPLE, st1.concat(st2), false, ['chol_nus_2012', 'lgg_tcga']);
            assert.isTrue(result.error.length !== 0);
            assert.isTrue(_.keyBy(result.error, 'code')[ErrorCodeEnum.STUDY_NOT_SELECTED] !== undefined);
        });

        it('In single study, study id does not need to be specified', () => {
            const lines: InputLine[] = [{
                type: LineTypeEnum.CHART_NAME,
                line: '#chart_name: test',
                content: ['chol_nus_2012', 's1']
            }, {
                type: LineTypeEnum.GROUP_NAME,
                line: '>group:group1',
                content: ['group1']
            }, {
                type: LineTypeEnum.CASE_ID,
                line: 'chol_nus_2012:s1',
                content: ['chol_nus_2012', 's1']
            }, {
                type: LineTypeEnum.CASE_ID,
                line: 's1',
                content: ['s1']
            }];
            const result: LineValidationResult = validateLines(lines, ClinicalDataTypeEnum.SAMPLE, st1, true, ['chol_nus_2012']);
            assert.isTrue(result.error.length === 0);
        });


        it('TOO_MANY_INVALID_CASE_ID should be given when there are too many invalid case ids', () => {
            let lines: InputLine[] = [{
                type: LineTypeEnum.CHART_NAME,
                line: '#chart_name: test',
                content: ['chol_nus_2012', 's1']
            }, {
                type: LineTypeEnum.GROUP_NAME,
                line: '>group:group1',
                content: ['group1']
            }, {
                type: LineTypeEnum.CASE_ID,
                line: 'chol_nus_2012:s1',
                content: ['chol_nus_2012', 's1']
            }];

            lines = lines.concat(new Array(20).fill('').map((item, index) => {
                return {
                    type: LineTypeEnum.CASE_ID,
                    line: 'chol_nus_2012:ss' + index,
                    content: ['chol_nus_2012', 'ss' + index]
                };
            }));

            const result: LineValidationResult = validateLines(lines, ClinicalDataTypeEnum.SAMPLE, st1, false, ['chol_nus_2012']);
            const errors = _.keyBy(result.error, 'code');

            assert.isTrue(result.error.length !== 0);
            assert.isTrue(errors[ErrorCodeEnum.TOO_MANY_INVALID_CASE_ID] !== undefined);

            // When TOO_MANY_INVALID_CASE_ID error is given, the INVALID_CASE_ID should not be added
            assert.isTrue(errors[ErrorCodeEnum.INVALID_CASE_ID] === undefined);
        });
    });

});
