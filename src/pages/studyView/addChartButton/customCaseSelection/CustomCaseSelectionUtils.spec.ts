import { assert } from 'chai';
import _ from 'lodash';
import {
    DEFAULT_GROUP_NAME_WITH_USER_INPUT,
    DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT,
    CaseIdAlias,
    CodeEnum,
    getAliasMap,
    getData,
    parseContent,
    getLine,
    getLines,
    InputLine,
    LineTypeEnum,
    ValidationResult,
    validateLines,
} from './CustomCaseSelectionUtils';
import { ClinicalDataTypeEnum } from '../../StudyViewUtils';
import { Sample } from 'cbioportal-ts-api-client';

describe('CustomCaseSelectionUtils', () => {
    describe('getData', () => {
        const s1 = ({
            studyId: 's1',
            sampleId: 'c1',
            patientId: 'p1',
            copyNumberSegmentPresent: false,
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            uniquePatientKey: 's1_p1',
            uniqueSampleKey: 's1_c1',
        } as unknown) as Sample;

        const s2 = ({
            studyId: 's1',
            sampleId: 'c2',
            patientId: 'p2',
            copyNumberSegmentPresent: false,
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            uniquePatientKey: 's1_p2',
            uniqueSampleKey: 's1_c2',
        } as unknown) as Sample;

        it("group name should be Selected when it's not specified by user", () => {
            const sampleIdentifiersWithData = getData(
                [
                    {
                        line: 's1:c1',
                        studyId: 's1',
                        caseId: 'c1',
                    },
                ],
                's1',
                ClinicalDataTypeEnum.SAMPLE,
                [s1],
                false
            );
            assert.isTrue(sampleIdentifiersWithData.length === 1);
            assert.isTrue(
                sampleIdentifiersWithData[0].value ===
                    DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT
            );
        });

        it('resolves sample when studyId is empty string (auto-populated single-study format)', () => {
            const result = getData(
                [{ line: ':c1', studyId: '', caseId: 'c1' }],
                's1',
                ClinicalDataTypeEnum.SAMPLE,
                [s1],
                false
            );
            assert.equal(result.length, 1);
            assert.equal(result[0].sampleId, 'c1');
            assert.equal(result[0].studyId, 's1');
        });

        it("group name should be NA when it's specified by user", () => {
            const sampleIdentifiersWithData = getData(
                [
                    { line: 's1:c1', studyId: 's1', caseId: 'c1' },
                    {
                        line: 's1:c2',
                        studyId: 's1',
                        caseId: 'c2',
                        value: 'Group1',
                    },
                ],
                's1',
                ClinicalDataTypeEnum.SAMPLE,
                [s1, s2],
                true
            );
            assert.isTrue(sampleIdentifiersWithData.length === 2);
            assert.isTrue(
                sampleIdentifiersWithData[0].value ===
                    DEFAULT_GROUP_NAME_WITH_USER_INPUT
            );
            assert.isTrue(sampleIdentifiersWithData[1].value === 'Group1');
        });
    });

    describe('getLine', () => {
        it('study id should be properly assigned', () => {
            const result = getLine('test:test1');
            assert.equal(result.studyId, 'test');
            assert.equal(result.caseId, 'test1');
        });
        it('case id should be properly assigned', () => {
            const result = getLine('test');
            assert.equal(result.caseId, 'test');
        });
        it('group name should be properly assigned when separate by space', () => {
            const result = getLine('test:test1 group1');
            assert.equal(result.studyId, 'test');
            assert.equal(result.caseId, 'test1');
            assert.equal(result.value, 'group1');
        });
        it('group name should be properly assigned when separate by tab', () => {
            const result = getLine('test:test1\tgroup1');
            assert.equal(result.studyId, 'test');
            assert.equal(result.caseId, 'test1');
            assert.equal(result.value, 'group1');
        });
        it('bare case id with group value (single-study auto-populate format) is split correctly', () => {
            const result = getLine('test1 group1');
            assert.isUndefined(result.studyId);
            assert.equal(result.caseId, 'test1');
            assert.equal(result.value, 'group1');
        });
    });

    describe('getLines', () => {
        it('proper number of lines should be returned - 1', () => {
            const line = 'test\n';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
        });

        it('proper number of lines should be returned - 2', () => {
            const line = 'test\n\n';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
        });

        it('proper number of lines should be returned - 3', () => {
            const line = 'test';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
        });

        it('study id should be undefined', () => {
            const line = 'c1';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
            assert.isTrue(result[0].studyId === undefined);
            assert.isTrue(result[0].caseId === 'c1');
        });

        it('parse case id properly', () => {
            const line = 's1:c1';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
            assert.isTrue(result[0].studyId === 's1');
            assert.isTrue(result[0].caseId === 'c1');
        });
    });

    describe('validateLines', () => {
        const st1 = (_.map(new Array(10), (item, index) => {
            return {
                studyId: 'chol_nus_2012',
                sampleId: 's' + index,
                patientId: 'p' + index,
                copyNumberSegmentPresent: false,
                sampleType: 'Primary Solid Tumor',
                sequenced: true,
                uniquePatientKey: 'chol_nus_2012_p' + index,
                uniqueSampleKey: 'chol_nus_2012_s' + index,
            };
        }) as unknown) as Sample[];

        const st2 = (_.map(new Array(5), (item, index) => {
            return {
                studyId: 'lgg_tcga',
                sampleId: 's' + index,
                patientId: 'p' + index,
                copyNumberSegmentPresent: false,
                sampleType: 'Primary Solid Tumor',
                sequenced: true,
                uniquePatientKey: 'lgg_tcga_p' + index,
                uniqueSampleKey: 'lgg_tcga_s' + index,
            };
        }) as unknown) as Sample[];

        it('In multiple studies, study id needs to be specified', () => {
            const lines: InputLine[] = [
                {
                    line: 'chol_nus_2012:s1',
                    studyId: 'chol_nus_2012',
                    caseId: 's1',
                },
                {
                    line: 'lgg_tcga:s1',
                    studyId: 'lgg_tcga',
                    caseId: 's1',
                },
                {
                    line: 's1',
                    caseId: 's1',
                },
            ];
            const result: ValidationResult = validateLines(
                lines,
                ClinicalDataTypeEnum.SAMPLE,
                st1.concat(st2),
                false,
                ['chol_nus_2012', 'lgg_tcga']
            );

            assert.isTrue(result.warning.length !== 0);
            assert.isTrue(
                _.keyBy(result.warning, 'code')[CodeEnum.INVALID_CASE_ID] !==
                    undefined
            );
        });

        it('Give error for unknown study ids', () => {
            const lines: InputLine[] = [
                {
                    line: 'chol_nus_2012:s1',
                    studyId: 'chol_nus_2012',
                    caseId: 's1',
                },
                {
                    line: 'lgg_tcga:s1',
                    studyId: 'lgg_tcga',
                    caseId: 's1',
                },
                {
                    line: 'test:s1',
                    studyId: 'test',
                    caseId: 's1',
                },
            ];
            const result: ValidationResult = validateLines(
                lines,
                ClinicalDataTypeEnum.SAMPLE,
                st1.concat(st2),
                false,
                ['chol_nus_2012', 'lgg_tcga']
            );
            assert.isTrue(result.error.length !== 0);
            assert.isTrue(
                _.keyBy(result.error, 'code')[CodeEnum.STUDY_NOT_SELECTED] !==
                    undefined
            );
        });

        it('In single study, study id does not need to be specified', () => {
            const lines: InputLine[] = [
                {
                    line: 's1',
                    caseId: 's1',
                },
            ];
            const result: ValidationResult = validateLines(
                lines,
                ClinicalDataTypeEnum.SAMPLE,
                st1,
                true,
                ['chol_nus_2012']
            );
            assert.isTrue(result.error.length === 0);
        });

        describe('The warning message should be given when case is invalid', () => {
            it('Check when study id is not specified', function() {
                const lines: InputLine[] = [
                    {
                        line: 's1test',
                        caseId: 's1test',
                    },
                ];
                const result: ValidationResult = validateLines(
                    lines,
                    ClinicalDataTypeEnum.SAMPLE,
                    st1,
                    true,
                    ['chol_nus_2012']
                );
                assert.isTrue(result.warning.length === 1);
                assert.equal(result.warning[0].code, CodeEnum.INVALID_CASE_ID);
            });
            it('Check when study id is specified', function() {
                const lines: InputLine[] = [
                    {
                        line: 's1test',
                        studyId: 'chol_nus_2012',
                        caseId: 's1test',
                    },
                ];
                const result: ValidationResult = validateLines(
                    lines,
                    ClinicalDataTypeEnum.SAMPLE,
                    st1,
                    true,
                    ['chol_nus_2012']
                );
                assert.isTrue(result.warning.length === 1);
                assert.equal(result.warning[0].code, CodeEnum.INVALID_CASE_ID);
            });
        });

        describe('The warning message should be given when case id is sample but asking for validation on patient', () => {
            it('Check when study id is not specified', function() {
                const lines: InputLine[] = [
                    {
                        line: 's1',
                        caseId: 's1',
                    },
                ];
                const result: ValidationResult = validateLines(
                    lines,
                    ClinicalDataTypeEnum.PATIENT,
                    st1,
                    true,
                    ['chol_nus_2012']
                );
                assert.isTrue(result.warning.length === 1);
                assert.equal(result.warning[0].code, CodeEnum.INVALID_CASE_ID);
            });
            it('Check when study id is specified', function() {
                const lines: InputLine[] = [
                    {
                        line: 's1',
                        studyId: 'chol_nus_2012',
                        caseId: 's1',
                    },
                ];
                const result: ValidationResult = validateLines(
                    lines,
                    ClinicalDataTypeEnum.PATIENT,
                    st1,
                    true,
                    ['chol_nus_2012']
                );
                assert.isTrue(result.warning.length === 1);
                assert.equal(result.warning[0].code, CodeEnum.INVALID_CASE_ID);
            });
        });

        it('For duplicate cases, give POTENTIAL_OVERLAP warning when the case is in different group', () => {
            const lines: InputLine[] = [
                {
                    line: 's1',
                    caseId: 's1',
                    value: 't1',
                },
                {
                    line: 's1',
                    caseId: 's1',
                    value: 't2',
                },
            ];
            const noGroupNameResult: ValidationResult = validateLines(
                lines,
                ClinicalDataTypeEnum.SAMPLE,
                st1,
                true,
                ['chol_nus_2012']
            );
            assert.isTrue(noGroupNameResult.warning.length === 1);
            assert.isTrue(noGroupNameResult.error.length === 0);
            assert.equal(
                noGroupNameResult.warning[0].code,
                CodeEnum.POTENTIAL_OVERLAP
            );
        });
    });

    describe('case ID aliases', () => {
        const makeSample = (
            studyId: string,
            sampleId: string,
            patientId: string
        ) =>
            (({
                studyId,
                sampleId,
                patientId,
                uniquePatientKey: `${studyId}_${patientId}`,
                uniqueSampleKey: `${studyId}_${sampleId}`,
            } as unknown) as Sample);

        const samples = [
            makeSample('s1', 'P-1-T01', 'P-1'),
            makeSample('s1', 'P-2-T01', 'P-2'),
            makeSample('s1', 'P-2-T02', 'P-2'),
            makeSample('s1', 'P-3-T01', 'P-3'),
            makeSample('s2', 'P-9-T01', 'P-9'),
        ];

        const sampleAlias = (
            studyId: string,
            caseId: string,
            alias: string,
            attributeId = 'SAMPLE_DISPLAY_NAME'
        ): CaseIdAlias => ({
            studyId,
            caseId,
            alias,
            attributeId,
            attributeDisplayName:
                attributeId === 'SAMPLE_DISPLAY_NAME'
                    ? 'Sample Display Name'
                    : 'Other Sample ID',
        });

        const sampleAliases = [
            sampleAlias('s1', 'P-1-T01', 'Tumor_A'),
            sampleAlias('s1', 'P-2-T01', 'Tumor_B'),
            sampleAlias('s1', 'P-2-T02', 'Tumor_B'),
            // display name equal to a different sample's internal ID
            sampleAlias('s1', 'P-3-T01', 'P-1-T01'),
            sampleAlias('s1', 'P-3-T01', 'NA'),
            sampleAlias('s1', 'P-3-T01', 'uuid-3', 'OTHER_SAMPLE_ID'),
            sampleAlias('s1', 'P-1-T01', 'Tumor_C', 'OTHER_SAMPLE_ID'),
            sampleAlias('s1', 'P-3-T01', 'Tumor_C'),
            sampleAlias('s2', 'P-9-T01', 'Tumor_A'),
        ];

        const parseSamples = (
            content: string,
            studies: string[] = ['s1'],
            aliases = sampleAliases
        ) =>
            parseContent(
                content,
                true,
                studies,
                ClinicalDataTypeEnum.SAMPLE,
                samples,
                studies.length === 1,
                aliases
            );

        const sampleIds = (data: { studyId: string; sampleId: string }[]) =>
            _.sortBy(data.map(d => `${d.studyId}:${d.sampleId}`));

        it('ignores empty / NA alias values', () => {
            const map = getAliasMap(sampleAliases, ClinicalDataTypeEnum.SAMPLE);
            assert.isUndefined(map['s1:NA']);
        });

        it('matches samples by display name', () => {
            const result = parseSamples('Tumor_A');
            assert.deepEqual(sampleIds(result.data), ['s1:P-1-T01']);
            assert.deepEqual(
                result.validationResult.warning.map(w => w.code),
                [CodeEnum.ALIAS_MATCH]
            );
            assert.include(
                result.validationResult.warning[0].message.message,
                'Sample Display Name'
            );
        });

        it('matches samples by other sample ID', () => {
            const result = parseSamples('uuid-3');
            assert.deepEqual(sampleIds(result.data), ['s1:P-3-T01']);
        });

        it('mixes internal IDs and display names', () => {
            const result = parseSamples('P-3-T01\nTumor_A');
            assert.deepEqual(sampleIds(result.data), [
                's1:P-1-T01',
                's1:P-3-T01',
            ]);
        });

        it('prefers an exact internal ID over a display name', () => {
            const result = parseSamples('P-1-T01');
            assert.deepEqual(sampleIds(result.data), ['s1:P-1-T01']);
            assert.equal(result.validationResult.warning.length, 0);
        });

        it('prefers display name over other sample ID when values collide', () => {
            const result = parseSamples('Tumor_C');
            assert.deepEqual(sampleIds(result.data), ['s1:P-3-T01']);
        });

        it('selects all samples sharing a display name and warns', () => {
            const result = parseSamples('Tumor_B');
            assert.deepEqual(sampleIds(result.data), [
                's1:P-2-T01',
                's1:P-2-T02',
            ]);
            const ambiguous = result.validationResult.warning.find(
                w => w.code === CodeEnum.AMBIGUOUS_ALIAS
            );
            assert.isDefined(ambiguous);
            assert.include(
                ambiguous!.message.message,
                'Tumor_B (P-2-T01, P-2-T02)'
            );
        });

        it('does not duplicate a sample given by both ID and display name', () => {
            const result = parseSamples('P-1-T01\nTumor_A');
            assert.deepEqual(sampleIds(result.data), ['s1:P-1-T01']);
        });

        it('still reports unknown names as invalid', () => {
            const result = parseSamples('Tumor_A\nnot_a_sample');
            assert.deepEqual(sampleIds(result.data), ['s1:P-1-T01']);
            const invalid = result.validationResult.warning.find(
                w => w.code === CodeEnum.INVALID_CASE_ID
            );
            assert.include(invalid!.message.message, 'not_a_sample');
        });

        it('resolves display names per study in multi-study mode', () => {
            assert.deepEqual(
                sampleIds(parseSamples('Tumor_A', ['s1', 's2']).data),
                ['s1:P-1-T01', 's2:P-9-T01']
            );
            assert.deepEqual(
                sampleIds(parseSamples('s2:Tumor_A', ['s1', 's2']).data),
                ['s2:P-9-T01']
            );
        });

        it('matches patients by patient display name', () => {
            const result = parseContent(
                'Patient_Two',
                true,
                ['s1'],
                ClinicalDataTypeEnum.PATIENT,
                samples,
                true,
                [
                    {
                        studyId: 's1',
                        caseId: 'P-2',
                        alias: 'Patient_Two',
                        attributeId: 'PATIENT_DISPLAY_NAME',
                    },
                ]
            );
            assert.deepEqual(sampleIds(result.data), [
                's1:P-2-T01',
                's1:P-2-T02',
            ]);
            assert.isTrue(result.data.every(d => d.patientId === 'P-2'));
        });

        it('behaves as before when no aliases are given', () => {
            const result = parseSamples('Tumor_A', ['s1'], []);
            assert.equal(result.data.length, 0);
            assert.equal(
                result.validationResult.warning[0].code,
                CodeEnum.INVALID_CASE_ID
            );
        });
    });
});
