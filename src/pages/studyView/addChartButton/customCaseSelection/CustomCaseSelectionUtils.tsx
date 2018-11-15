import {ClinicalDataType, ClinicalDataTypeEnum, CustomChartIdentifier, NewChart} from "../../StudyViewPageStore";
import * as _ from 'lodash';
import {Sample} from "../../../../shared/api/generated/CBioPortalAPI";

type Code =
    'MULTI_NAME'
    | 'NO_GROUP_NAME'
    | 'OVERLAP'
    | 'INVALID_CASE_ID'
    | 'TOO_MANY_INVALID_CASE_ID'
    | 'STUDY_NOT_SELECTED'
    | 'INPUT_ERROR'
    | 'NO_CHART_NAME';

export const CHART_NAME_LINE_START = '#chart_name:';
export const GROUP_LINE_START = '>group:';
export const DEFAULT_CHART_NAME = 'Custom Chart';
export const DEFAULT_GROUP_NAME = 'Selected';

export enum ErrorCodeEnum {
    MULTI_NAME = 'MULTI_NAME',
    NO_CHART_NAME = 'NO_CHART_NAME',
    NO_GROUP_NAME = 'NO_GROUP_NAME',
    OVERLAP = 'OVERLAP',
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
    chart: NewChart,
    validationResult: LineValidationResult
}

export enum LineTypeEnum {
    GROUP_NAME = 'GROUP_NAME',
    CHART_NAME = 'CHART_NAME',
    CASE_ID = 'CASE_ID',
}

export type LineType = LineTypeEnum.CHART_NAME | LineTypeEnum.CASE_ID | LineTypeEnum.GROUP_NAME;

export type InputLine = {
    type: LineType,
    line: string,
    content: string[]
}

export type LineValidationResult = {
    error: ValidationMessage[],
    warning: ValidationMessage[],
}

export function getLine(line: string): InputLine {
    let type = LineTypeEnum.CASE_ID;
    let content = [];
    if (line.startsWith(CHART_NAME_LINE_START)) {
        type = LineTypeEnum.CHART_NAME;
        content = purifyLine(line, CHART_NAME_LINE_START);
    } else if (line.startsWith(GROUP_LINE_START)) {
        type = LineTypeEnum.GROUP_NAME;
        content = purifyLine(line, GROUP_LINE_START);
    } else {
        content = line.split(':');
    }
    return {
        type: type,
        line: line,
        content: content
    }
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

export function validateLines(lines: InputLine[], caseType: ClinicalDataType, allSamples: Sample[], isSingleStudy: boolean, selectedStudies: string[]): LineValidationResult {
    let errorMessages: ValidationMessage[] = [];
    let warningMessages: ValidationMessage[] = [];

    const chartNames: InputLine[] = findChartNameLines(lines);
    const groupNames: InputLine[] = findGroupNameLines(lines);

    const TOO_MANY = 10;

    if (chartNames.length > 1) {
        errorMessages.push({
            code: ErrorCodeEnum.MULTI_NAME,
            message: new Error('There are multiple rows to define chart name')
        });
    } else if (chartNames.length === 0) {
        errorMessages.push({
            code: WarningCodeEnum.NO_CHART_NAME,
            message: new Error(`Chart name is not specified.`)
        });
    } else {
        const name = chartNames[0];
        if (name.content.length === 0) {
            errorMessages.push({
                code: ErrorCodeEnum.NO_CHART_NAME,
                message: new Error('Chart name is not specified.')
            });
        }
    }

    const groupsWithName = _.filter(groupNames, group => group.content.length > 0);
    if (groupsWithName.length === 0) {
        errorMessages.push({
            code: ErrorCodeEnum.NO_GROUP_NAME,
            message: new Error('Group name needs to be specified')
        });
    }

    // Find out the invalid cases
    let invalidCases: string[] = [];
    const caseLines: string[][] = _.filter(lines, line => line.type === LineTypeEnum.CASE_ID).map(line => line.content);
    const validPair: { [key: string]: boolean } = _.reduce(allSamples, (acc, sample) => {
        acc[`${sample.studyId}:${caseType === ClinicalDataTypeEnum.PATIENT ? sample.patientId : sample.sampleId}`] = true;
        return acc;
    }, {} as { [key: string]: boolean });

    _.each(caseLines, line => {
        if (line.length === 1) {
            if (!isSingleStudy) {
                errorMessages.push({
                    code: ErrorCodeEnum.INVALID_CASE_ID,
                    message: new Error(`No study specified for ${caseType} id: ${line[0]}, and more than one study selected for query.`)
                });
            }
        } else if (line.length === 2) {
            if (!_.includes(selectedStudies, line[0])) {
                errorMessages.push({
                    code: ErrorCodeEnum.STUDY_NOT_SELECTED,
                    message: new Error(`Study ${line[0]} is not selected.`)
                });
            } else if (validPair[`${line[0]}:${line[1]}`] === undefined) {
                invalidCases.push(`${line[0]}:${line[1]}`);
                if (invalidCases.length >= TOO_MANY) {
                    return false;
                }
            }
        } else {
            errorMessages.push({
                code: ErrorCodeEnum.INPUT_ERROR,
                message: new Error(`Input error for entity: ${line.join('')}.`)
            });
        }
    });

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
export function getNewChart(lines: InputLine[], singleStudyId: string, caseType: ClinicalDataType, allSamples: Sample[]): NewChart {
    const chartNameLines = findChartNameLines(lines);
    const chartName = chartNameLines.length > 0 ? chartNameLines[0].content[0] : DEFAULT_CHART_NAME;
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

    let groups = [];

    lines = _.filter(lines, line => line.type === LineTypeEnum.GROUP_NAME || line.type === LineTypeEnum.CASE_ID);

    while (lines.length > 0) {
        const groupIndexStart = _.findIndex(lines, line => line.type === LineTypeEnum.GROUP_NAME);
        let groupIndexEnd = (groupIndexStart - 1 < lines.length) ? _.findIndex(lines.slice(groupIndexStart + 1), line => line.type === LineTypeEnum.GROUP_NAME) : -1;

        if (groupIndexStart === -1) {
            lines = [];
        } else {
            if (groupIndexEnd === -1) {
                groupIndexEnd = lines.length - 1;
            }
            const groupBlock: InputLine[] = lines.splice(groupIndexStart, groupIndexEnd - groupIndexStart + 1);
            const groupNameLine: InputLine = groupBlock.splice(0, 1)[0];
            groups.push({
                name: groupNameLine.content[0],
                cases: _.reduce(groupBlock, (acc, caseLine) => {
                    const caseId = caseLine.content.length === 1 ? `${singleStudyId}:${caseLine.content[0]}` : `${caseLine.content[0]}:${caseLine.content[1]}`;
                    const maps = isPatientId ? patientMap[caseId] : [sampleMap[caseId]];
                    const matches = parseCase(singleStudyId, isPatientId, maps);
                    acc.push(...matches);
                    return acc;
                }, [] as CustomChartIdentifier[])
            });
        }
    }

    return {
        name: chartName,
        groups: groups
    }
}


export function findChartNameLines(lines: InputLine[]) {
    return _.filter(lines, line => line.type === LineTypeEnum.CHART_NAME);
}

export function findGroupNameLines(lines: InputLine[]) {
    return _.filter(lines, line => line.type === LineTypeEnum.GROUP_NAME);
}

export function getDefaultChartName(): InputLine {
    return {
        type: LineTypeEnum.CHART_NAME,
        line: DEFAULT_CHART_NAME,
        content: [DEFAULT_CHART_NAME]
    };
}

export function getDefaultGroupName(): InputLine {
    return {
        type: LineTypeEnum.GROUP_NAME,
        line: DEFAULT_GROUP_NAME,
        content: [DEFAULT_GROUP_NAME]
    };
}

export function parseContent(content: string, needToValidate: boolean = false, selectedStudies: string[], caseType: ClinicalDataType, allSamples: Sample[], isSingleStudy: boolean): ParseResult {
    let validationResult: LineValidationResult = {
        error: [],
        warning: []
    };
    let lines: InputLine[] = getLines(content);
    if (lines.length > 0) {
        const chartNameLines = findChartNameLines(lines);
        if (chartNameLines.length === 0) {
            validationResult.warning.push({
                code: WarningCodeEnum.NO_CHART_NAME,
                message: new Error(`No chart name specified, ${DEFAULT_CHART_NAME} will be used`)
            });
            lines.unshift(getDefaultChartName())
        }
        const groupNames = findGroupNameLines(lines);
        if (groupNames.length === 0) {
            validationResult.warning.push({
                code: WarningCodeEnum.NO_GROUP_NAME,
                message: new Error(`No group name specified, ${DEFAULT_GROUP_NAME} will be used`)
            });
            lines.unshift(getDefaultGroupName());
        }

        if (needToValidate) {
            const result = validateLines(lines, caseType, allSamples, isSingleStudy, selectedStudies);
            validationResult.warning.push(...result.warning);
            validationResult.error.push(...result.error);
        }
    }

    if (validationResult.error.length > 0) {
        return {
            chart: {
                name: '',
                groups: []
            },
            validationResult: validationResult
        };
    } else {
        return {
            chart: getNewChart(lines, selectedStudies[0], caseType, allSamples),
            validationResult: validationResult
        };
    }
}

export function parseCase(studyId: string, isPatientId: boolean, mappedSamples: Sample[]): CustomChartIdentifier[] {
    return mappedSamples.map(sample => {
        return {
            studyId: studyId,
            patientAttribute: isPatientId,
            sampleId: sample.sampleId,
            patientId: sample.patientId
        }
    });
}

export function purifyLine(line: string, separator: string): string[] {
    return _.filter(line.split(separator).map(item => item.trim()), item => !!item);
}

export function getDefaultTitle() {
    return `${CHART_NAME_LINE_START} ${DEFAULT_CHART_NAME}\n\n${GROUP_LINE_START} ${DEFAULT_GROUP_NAME}\n`;
}
