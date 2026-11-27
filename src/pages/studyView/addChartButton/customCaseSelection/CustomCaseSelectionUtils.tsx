import _, { uniq } from 'lodash';
import { Sample } from 'cbioportal-ts-api-client';
import { ClinicalDataType, ClinicalDataTypeEnum } from '../../StudyViewUtils';
import Pluralize from 'pluralize';
import { CustomChartIdentifierWithValue } from 'shared/api/session-service/sessionServiceModels';
import { CaseIdAlias, getAliasMap } from 'shared/lib/CaseIdAliasUtils';

type Code =
    | 'MULTI_NAME'
    | 'NO_GROUP_NAME'
    | 'OVERLAP'
    | 'POTENTIAL_OVERLAP'
    | 'INVALID'
    | 'INVALID_CASE_ID'
    | 'TOO_MANY_INVALID_CASE_ID'
    | 'STUDY_NOT_SELECTED'
    | 'INPUT_ERROR'
    | 'NO_CHART_NAME'
    | 'AMBIGUOUS_ALIAS';

export const DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT = 'custom_value';
export const DEFAULT_GROUP_NAME_WITH_USER_INPUT = 'Unselected';

export enum CodeEnum {
    OVERLAP = 'OVERLAP',
    POTENTIAL_OVERLAP = 'POTENTIAL_OVERLAP',
    INVALID = 'INVALID',
    INVALID_CASE_ID = 'INVALID_CASE_ID',
    STUDY_NOT_SELECTED = 'STUDY_NOT_SELECTED',
    INPUT_ERROR = 'INPUT_ERROR',
    NO_CHART_NAME = 'NO_CHART_NAME',
    NO_GROUP_NAME = 'NO_GROUP_NAME',
    AMBIGUOUS_ALIAS = 'AMBIGUOUS_ALIAS',
}

export type ValidationMessage = {
    code: Code;
    message: Error;
};

export type ParseResult = {
    data: CustomChartIdentifierWithValue[];
    validationResult: ValidationResult;
};

export enum LineTypeEnum {
    GROUP_NAME = 'GROUP_NAME',
    CHART_NAME = 'CHART_NAME',
    CASE_ID = 'CASE_ID',
}

export type InputLine = {
    line: string;
    studyId?: string;
    caseId: string;
    value?: string;
};

export type ValidationResult = {
    error: ValidationMessage[];
    warning: ValidationMessage[];
    updatedLines?: InputLine[];
};

export function getLine(line: string): InputLine {
    let parsedResult: InputLine = {
        line: line,
        caseId: '',
    };

    const content = line.split(':');
    if (content.length === 1) {
        const groupInfo = content[0].split(/\s|\t/g);
        parsedResult.caseId = groupInfo[0];
        if (groupInfo.length > 1) {
            parsedResult.value = groupInfo[1];
        }
    } else if (content.length > 1) {
        parsedResult.studyId = content[0];
        const groupInfo = content[1].split(/\s|\t/g);
        if (groupInfo.length > 1) {
            parsedResult.value = groupInfo[1];
        }
        parsedResult.caseId = groupInfo[0];
    }
    return parsedResult;
}

export function getLines(content: string): InputLine[] {
    return _.reduce(
        content.trim().split(/\n|\r/g),
        (acc, line) => {
            line = line.trim();
            if (line) {
                acc.push(getLine(line));
            }
            return acc;
        },
        [] as InputLine[]
    );
}

function getUniqueCaseId(studyId: string, caseId: string) {
    return `${studyId}:${caseId}`;
}

function getInputLineKey(line: InputLine) {
    return [line.studyId || '', line.caseId, line.value || ''].join('&');
}

export function validateLines(
    lines: InputLine[],
    caseType: ClinicalDataType,
    allSamples: Sample[],
    isSingleStudy: boolean,
    selectedStudies: string[],
    caseIdAliases: CaseIdAlias[] = []
): ValidationResult {
    let errorMessages: ValidationMessage[] = [];
    let warningMessages: ValidationMessage[] = [];
    const groupNameDefault = '_TEST_';

    // Find out the invalid cases
    let invalidCases: string[] = [];

    const validPair: { [key: string]: boolean } = _.reduce(
        allSamples,
        (acc, sample) => {
            acc[
                `${sample.studyId}:${
                    caseType === ClinicalDataTypeEnum.PATIENT
                        ? sample.patientId
                        : sample.sampleId
                }`
            ] = true;
            return acc;
        },
        {} as { [key: string]: boolean }
    );

    const aliasMap = getAliasMap(caseIdAliases, caseType);
    // input alias -> resolved case IDs, for the validation messages
    // prototype-free so arbitrary alias strings (e.g. "constructor") are safe keys
    const aliasMatches: { [alias: string]: string[] } = Object.create(null);
    const ambiguousAliases: { [alias: string]: string[] } = Object.create(null);

    // Returns the internal case IDs that `caseId` refers to in `studyId`.
    // An exact internal ID match always takes precedence over an alias.
    const resolveCaseIds = (studyId: string, caseId: string): string[] => {
        if (validPair[getUniqueCaseId(studyId, caseId)]) {
            return [caseId];
        }
        const matches = aliasMap[getUniqueCaseId(studyId, caseId)] || [];
        const resolved = matches
            .map(m => m.caseId)
            .filter(id => validPair[getUniqueCaseId(studyId, id)]);
        if (resolved.length > 0) {
            aliasMatches[caseId] = _.uniq(
                (aliasMatches[caseId] || []).concat(resolved)
            );
            if (aliasMatches[caseId].length > 1) {
                ambiguousAliases[caseId] = aliasMatches[caseId];
            }
        }
        return resolved;
    };

    let occurrence: { [key: string]: number } = {};
    let validLines: { [key: string]: InputLine } = {};
    let multiStudyCases: string[] = [];

    // Remove all dups, not necessary to mention in the message
    _.reduce(
        _.uniqBy(lines, line => {
            return getInputLineKey(line);
        }),
        (acc, line) => {
            let _case = '';
            let validLine = false;
            let newLines: InputLine[] = [];
            if (line.studyId === undefined || line.studyId === '') {
                let validCaseCount = 0;
                selectedStudies.map(studyId => {
                    const resolved = resolveCaseIds(studyId, line.caseId);
                    resolved.forEach(caseId => {
                        _case = getUniqueCaseId(studyId, caseId);
                        if (occurrence[_case] === undefined) {
                            occurrence[_case] = 0;
                        }
                        occurrence[_case]++;

                        let newLine = _.cloneDeep(line);
                        newLine.studyId = studyId;
                        newLine.caseId = caseId;
                        newLines.push(newLine);
                    });
                    if (resolved.length > 0) {
                        validCaseCount += 1;
                        validLine = true;
                    }
                });

                if (validCaseCount === 0) {
                    invalidCases.push(line.caseId);
                }

                // case where it belongs to multiple studies
                if (validCaseCount > 1) {
                    multiStudyCases.push(line.caseId);
                }
            } else {
                if (!_.includes(selectedStudies, line.studyId)) {
                    errorMessages.push({
                        code: CodeEnum.STUDY_NOT_SELECTED,
                        message: new Error(
                            `Incorrect study id: ${line.studyId}`
                        ),
                    });
                } else {
                    const studyId = line.studyId;
                    const resolved = resolveCaseIds(studyId, line.caseId);
                    resolved.forEach(caseId => {
                        _case = getUniqueCaseId(studyId, caseId);
                        if (occurrence[_case] === undefined) {
                            occurrence[_case] = 0;
                        }
                        occurrence[_case]++;

                        let newLine = _.cloneDeep(line);
                        newLine.caseId = caseId;
                        newLines.push(newLine);
                    });
                    if (resolved.length > 0) {
                        validLine = true;
                    } else {
                        invalidCases.push(line.caseId);
                    }
                }
            }

            if (validLine) {
                _.forEach(newLines, newLine => {
                    acc[getInputLineKey(newLine)] = newLine;
                });
            }
            return acc;
        },
        validLines
    );

    if (!isSingleStudy && !_.isEmpty(multiStudyCases)) {
        warningMessages.push({
            code: CodeEnum.INVALID_CASE_ID,
            message: new Error(
                `The ${caseType} ID's below belong to multiple studies. All of them in the different studies will be selected. 
                To select specific ${caseType}, please specify study_id, Example: study_id:sample_id. 
                ${caseType} ID's: ${multiStudyCases.join(', ')}`
            ),
        });
    }

    // Find duplication cases
    const dups = _.reduce(
        occurrence,
        (acc, count, caseId) => {
            if (count > 1) {
                acc.push(caseId);
            }
            return acc;
        },
        [] as string[]
    );
    if (dups.length > 0) {
        // when dups exist, we need to figure out the damage
        const groupDistribution = _.reduce(
            lines,
            (acc, line) => {
                let groupName = line.value ? line.value : groupNameDefault;
                if (acc[groupName] === undefined) {
                    acc[groupName] = [];
                }
                acc[groupName].push(
                    getUniqueCaseId(
                        line.studyId ? line.studyId : '',
                        line.caseId
                    )
                );
                return acc;
            },
            {} as { [groupName: string]: string[] }
        );

        const dupCount = _.reduce(
            groupDistribution,
            (acc, group) => {
                acc += group.length - _.uniq(group).length;
                return acc;
            },
            0
        );

        // when the dupCount is not the same as dups length, means that the case is in different groups, that should be ok.
        if (_.keys(groupDistribution).length > 1 && dupCount !== dups.length) {
            warningMessages.push({
                code: CodeEnum.POTENTIAL_OVERLAP,
                message: new Error(
                    `${dups.join(', ')} ${Pluralize(
                        'exist',
                        dups.length - dupCount
                    )} in different groups.`
                ),
            });
        }
    }

    if (!_.isEmpty(ambiguousAliases)) {
        warningMessages.push({
            code: CodeEnum.AMBIGUOUS_ALIAS,
            message: new Error(
                `The following ${Pluralize(
                    'name',
                    _.size(ambiguousAliases)
                )} matched multiple ${Pluralize(
                    caseType.toLowerCase()
                )}, all of which will be selected: ${_.map(
                    ambiguousAliases,
                    (ids, alias) => `${alias} (${ids.join(', ')})`
                ).join('; ')}`
            ),
        });
    }

    if (invalidCases.length > 0) {
        warningMessages.push({
            code: CodeEnum.INVALID_CASE_ID,
            message: new Error(
                `The following ${Pluralize(
                    'case',
                    invalidCases.length
                )} ${Pluralize(
                    'is',
                    invalidCases.length
                )} invalid and will be ignored. ${invalidCases.join(', ')}`
            ),
        });
    }
    return {
        error: errorMessages,
        warning: warningMessages,
        updatedLines: _.values(validLines),
    };
}

// the lines should already be validated
export function getData(
    lines: InputLine[],
    singleStudyId: string,
    caseType: ClinicalDataType,
    allSamples: Sample[],
    hasGroupName: boolean
): CustomChartIdentifierWithValue[] {
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

    return _.flatMap(lines, line => {
        const groupName =
            line.value ||
            (hasGroupName
                ? DEFAULT_GROUP_NAME_WITH_USER_INPUT
                : DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT);

        const caseId = !line.studyId
            ? `${singleStudyId}:${line.caseId}`
            : `${line.studyId}:${line.caseId}`;
        const caseMap = isPatientId ? patientMap[caseId] : [sampleMap[caseId]];

        return caseMap.map(sample => {
            return {
                studyId: line.studyId || singleStudyId,
                sampleId: sample.sampleId,
                patientId: sample.patientId,
                value: groupName,
            };
        });
    });
}

export function parseContent(
    content: string,
    needToValidate: boolean = false,
    selectedStudies: string[],
    caseType: ClinicalDataType,
    allSamples: Sample[],
    isSingleStudy: boolean,
    caseIdAliases: CaseIdAlias[] = []
): ParseResult {
    let validationResult: ValidationResult = {
        error: [],
        warning: [],
    };
    let lines: InputLine[] = getLines(content);
    if (lines.length > 0) {
        if (needToValidate) {
            const result = validateLines(
                lines,
                caseType,
                allSamples,
                isSingleStudy,
                selectedStudies,
                caseIdAliases
            );
            validationResult.warning.push(...result.warning);
            validationResult.error.push(...result.error);
            if (result.updatedLines !== undefined) {
                lines = result.updatedLines;
            }
        }
    }

    const hasGroupName =
        _.find(lines, line => line.value !== undefined && line.value !== '') !==
        undefined;
    if (validationResult.error.length > 0) {
        return {
            data: [],
            validationResult: validationResult,
        };
    } else {
        return {
            data: getData(
                lines,
                selectedStudies[0],
                caseType,
                allSamples,
                hasGroupName
            ),
            validationResult: validationResult,
        };
    }
}
