import _ from 'lodash';
import { ClinicalData } from 'cbioportal-ts-api-client';
import { getClient } from 'shared/api/cbioportalClientInstance';

export type CaseIdType = 'SAMPLE' | 'PATIENT';

/**
 * Clinical attributes whose values are accepted in place of the internal
 * sample / patient ID, in order of precedence.
 */
export const SAMPLE_ID_ALIAS_ATTRIBUTES = [
    'SAMPLE_DISPLAY_NAME',
    'DISPLAY_SAMPLE_NAME',
    'OTHER_SAMPLE_ID',
];
export const PATIENT_ID_ALIAS_ATTRIBUTES = [
    'PATIENT_DISPLAY_NAME',
    'OTHER_PATIENT_ID',
];

export function getCaseIdAliasAttributeIds(caseType: CaseIdType) {
    return caseType === 'PATIENT'
        ? PATIENT_ID_ALIAS_ATTRIBUTES
        : SAMPLE_ID_ALIAS_ATTRIBUTES;
}

const EMPTY_ALIAS_VALUES = ['', 'NA', 'N/A', 'NAN', 'NULL', 'NONE'];

export type CaseIdAlias = {
    studyId: string;
    // internal sample or patient ID
    caseId: string;
    // the alternative identifier, e.g. a SAMPLE_DISPLAY_NAME value
    alias: string;
    attributeId: string;
};

export type CaseIdAliases = { [caseType in CaseIdType]: CaseIdAlias[] };

export function isUsableAliasValue(value: string | undefined) {
    return (
        value !== undefined &&
        !EMPTY_ALIAS_VALUES.includes(value.trim().toUpperCase())
    );
}

/**
 * Maps `studyId:alias` to the internal case IDs it refers to.
 * When an alias value occurs under several alias attributes, the attribute
 * listed first in the precedence list wins.
 */
export function getAliasMap(
    aliases: CaseIdAlias[],
    caseType: CaseIdType
): { [studyIdAlias: string]: CaseIdAlias[] } {
    const precedence = getCaseIdAliasAttributeIds(caseType);
    const rank = (a: CaseIdAlias) => {
        const i = precedence.indexOf(a.attributeId);
        return i === -1 ? precedence.length : i;
    };
    const grouped = _.groupBy(
        aliases.filter(a => isUsableAliasValue(a.alias)),
        a => `${a.studyId}:${a.alias.trim()}`
    );
    return _.mapValues(grouped, group => {
        const bestRank = _.min(group.map(rank));
        return _.uniqBy(
            group.filter(a => rank(a) === bestRank),
            a => a.caseId
        );
    });
}

export function clinicalDataToCaseIdAliases(
    data: ClinicalData[],
    caseType: CaseIdType
): CaseIdAlias[] {
    return data
        .filter(d => isUsableAliasValue(d.value))
        .map(d => ({
            studyId: d.studyId,
            caseId: caseType === 'PATIENT' ? d.patientId : d.sampleId,
            alias: d.value.trim(),
            attributeId: d.clinicalAttributeId,
        }));
}

/**
 * Fetches all alias values of the given studies. Only alias attributes that a
 * study actually has are requested.
 */
export async function fetchCaseIdAliasesInStudies(
    studyIds: string[],
    caseType: CaseIdType
): Promise<CaseIdAlias[]> {
    if (studyIds.length === 0) {
        return [];
    }
    const aliasAttributeIds = getCaseIdAliasAttributeIds(caseType);
    const attributes = (
        await getClient().fetchClinicalAttributesUsingPOST({
            studyIds: _.uniq(studyIds),
        })
    ).filter(
        attr =>
            attr.patientAttribute === (caseType === 'PATIENT') &&
            aliasAttributeIds.includes(attr.clinicalAttributeId)
    );
    const data = await Promise.all(
        attributes.map(attr =>
            getClient().getAllClinicalDataInStudyUsingGET({
                studyId: attr.studyId,
                attributeId: attr.clinicalAttributeId,
                clinicalDataType: caseType,
            })
        )
    );
    return clinicalDataToCaseIdAliases(_.flatten(data), caseType);
}
