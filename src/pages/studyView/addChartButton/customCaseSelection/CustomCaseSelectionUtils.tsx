import {
    ClinicalDataType,
    ClinicalDataTypeEnum,
    CustomChartIdentifier,
    CustomGroup,
    NewChart
} from "../../StudyViewPageStore";
import * as _ from 'lodash';
import {Sample} from "../../../../shared/api/generated/CBioPortalAPI";

type Code =
    'MULTI_NAME'
    | 'NO_GROUP_NAME'
    | 'OVERLAP'
    | 'INVALID'
    | 'INVALID_CASE_ID'
    | 'TOO_MANY_INVALID_CASE_ID'
    | 'STUDY_NOT_SELECTED'
    | 'INPUT_ERROR'
    | 'NO_CHART_NAME';

export const DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT = 'Selected';
export const DEFAULT_GROUP_NAME_WITH_USER_INPUT = 'Unselected';

export enum ErrorCodeEnum {
    OVERLAP = 'OVERLAP',
    INVALID = 'INVALID',
    INVALID_CASE_ID = 'INVALID_CASE_ID',
    TOO_MANY_INVALID_CASE_ID = 'TOO_MANY_INVALID_CASE_ID',
    STUDY_NOT_SELECTED = 'STUDY_NOT_SELECTED',
    INPUT_ERROR = 'INPUT_ERROR',
};

export enum WarningCodeEnum {
    NO_CHART_NAME = 'NO_CHART_NAME',
    NO_GROUP_NAME = 'NO_GROUP_NAME',
};

export type ValidationMessage = {
    code: Code,
    message: Error
};

export type ParseResult = {
    groups: CustomGroup[],
    validationResult: ValidationResult
}

export enum LineTypeEnum {
    GROUP_NAME = 'GROUP_NAME',
    CHART_NAME = 'CHART_NAME',
    CASE_ID = 'CASE_ID',
}

export type InputLine = {
    line: string,
    studyId?: string,
    caseId: string,
    groupName?: string
}

export type ValidationResult = {
    error: ValidationMessage[],
    warning: ValidationMessage[],
}

export function getLine(line: string): InputLine {
    let parsedResult: InputLine = {
        line: line,
        caseId: ''
    };

    const content = line.split(':');
    if (content.length === 1) {
        parsedResult.caseId = content[0];
    } else if (content.length > 1) {
        parsedResult.studyId = content[0];
        const groupInfo = content[1].split(/\s|\t/g);
        if (groupInfo.length > 1) {
            parsedResult.groupName = groupInfo[1];
        }
        parsedResult.caseId = groupInfo[0];
    }
    return parsedResult;
}

export function getLines(content: string): InputLine[] {
    return _.reduce(content.trim().split(/\n|\r/g), (acc, line) => {
        line = line.trim();
        if (line) {
            acc.push(getLine(line));
        }
        return acc;
    }, [] as InputLine[])
}

export function validateLines(lines: InputLine[], caseType: ClinicalDataType, allSamples: Sample[], isSingleStudy: boolean, selectedStudies: string[]): ValidationResult {
    let errorMessages: ValidationMessage[] = [];
    let warningMessages: ValidationMessage[] = [];

    const TOO_MANY = 10;

    // Find out the invalid cases
    let invalidCases: string[] = [];

    const validPair: { [key: string]: boolean } = _.reduce(allSamples, (acc, sample) => {
        acc[`${sample.studyId}:${caseType === ClinicalDataTypeEnum.PATIENT ? sample.patientId : sample.sampleId}`] = true;
        return acc;
    }, {} as { [key: string]: boolean });

    let occurrence: { [key: string]: number } = {};

    _.each(lines, line => {
        let _case = '';
        if (line.studyId === undefined || line.studyId === '') {
            if (!isSingleStudy) {
                errorMessages.push({
                    code: ErrorCodeEnum.INVALID_CASE_ID,
                    message: new Error(`No study specified for ${caseType} id: ${line.caseId}, and more than one study selected for query.`)
                });
            } else {
                _case = `${selectedStudies[0]}:${line.caseId}`;
                if (validPair[_case] === undefined) {
                    errorMessages.push({
                        code: ErrorCodeEnum.INVALID_CASE_ID,
                        message: new Error(`The case id: ${line.caseId} is invalid.`)
                    });
                } else {
                    if (occurrence[_case] === undefined) {
                        occurrence[_case] = 0;
                    }
                    occurrence[_case]++;
                }
            }
        } else {
            if (!_.includes(selectedStudies, line.studyId)) {
                errorMessages.push({
                    code: ErrorCodeEnum.STUDY_NOT_SELECTED,
                    message: new Error(`Study ${line.caseId} is not selected.`)
                });
            } else {
                _case = `${line.studyId}:${line.caseId}`;
                if (validPair[_case] === undefined) {
                    invalidCases.push(`${line.studyId}:${line.caseId}`);
                    if (invalidCases.length >= TOO_MANY) {
                        return false;
                    }
                } else {
                    if (occurrence[_case] === undefined) {
                        occurrence[_case] = 0;
                    }
                    occurrence[_case]++;
                }
            }
        }
    });

    // Find duplication cases
    const dups = _.reduce(occurrence, (acc, count, caseId) => {
        if (count > 1) {
            acc.push(caseId);
        }
        return acc;
    }, [] as string[]);
    if (dups.length > 0) {
        errorMessages.push({
            code: ErrorCodeEnum.OVERLAP,
            message: new Error(`There are duplicate cases. Such as ${dups.slice(0, 3).join(', ')}`)
        });
    }

    if (invalidCases.length >= TOO_MANY) {
        errorMessages.push({
            code: ErrorCodeEnum.TOO_MANY_INVALID_CASE_ID,
            message: new Error(`Too many invalid cases. Such as ${invalidCases.slice(0, 3).join(', ')}`)
        });
    } else if (invalidCases.length > 0) {
        errorMessages.push({
            code: ErrorCodeEnum.INVALID_CASE_ID,
            message: new Error(`Invalid case${
                invalidCases.length > 1 ? 's' : ''
                } for the selected cancer study: ${
                invalidCases.join(', ')
                }`)
        });
    }

    return {
        error: errorMessages,
        warning: warningMessages
    }
}

// the lines should already be validated
export function getGroups(lines: InputLine[], singleStudyId: string, caseType: ClinicalDataType, allSamples: Sample[], hasGroupName: boolean): CustomGroup[] {
    const sampleMap: { [id: string]: Sample } = {};
    const patientMap: { [id: string]: Sample[] } = {};
    const isPatientId = caseType === ClinicalDataTypeEnum.PATIENT;

    _.each(allSamples, sample => {
        sampleMap[`${sample.studyId}:${sample.sampleId}`] = sample;

        const patientKey = `${sample.studyId}:${sample.patientId}`;
        if (patientMap[patientKey] === undefined) {
            patientMap[patientKey] = [];
        }
        patientMap[patientKey].push(sample);
    });

    return _.values(_.reduce(lines, (acc, line) => {
        const groupName = line.groupName || (hasGroupName ? DEFAULT_GROUP_NAME_WITH_USER_INPUT : DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT);
        if (acc[groupName] == undefined) {
            acc[groupName] = {
                name: groupName,
                cases: []
            }
        }

        const caseId = line.studyId === undefined ? `${singleStudyId}:${line.caseId}` : `${line.studyId}:${line.caseId}`;
        const maps = isPatientId ? patientMap[caseId] : [sampleMap[caseId]];
        const matches = maps === undefined ? [] : parseCase(isPatientId, maps);
        acc[groupName].cases.push(...matches);
        return acc;
    }, {} as { [key: string]: CustomGroup }));
}

export function parseContent(content: string, needToValidate: boolean = false, selectedStudies: string[], caseType: ClinicalDataType, allSamples: Sample[], isSingleStudy: boolean): ParseResult {
    let validationResult: ValidationResult = {
        error: [],
        warning: []
    };
    let lines: InputLine[] = getLines(content);
    if (lines.length > 0) {
        if (needToValidate) {
            const result = validateLines(lines, caseType, allSamples, isSingleStudy, selectedStudies);
            validationResult.warning.push(...result.warning);
            validationResult.error.push(...result.error);
        }
    }

    const hasGroupName = _.find(lines, (line => line.groupName !== undefined && line.groupName !== '')) !== undefined;

    if (validationResult.error.length > 0) {
        return {
            groups: [],
            validationResult: validationResult
        };
    } else {
        return {
            groups: getGroups(lines, selectedStudies[0], caseType, allSamples, hasGroupName),
            validationResult: validationResult
        };
    }
}

export function parseCase(isPatientId: boolean, mappedSamples: Sample[]): CustomChartIdentifier[] {
    return mappedSamples.map(sample => {
        return {
            studyId: sample.studyId,
            patientAttribute: isPatientId,
            sampleId: sample.sampleId,
            patientId: sample.patientId
        }
    });
}