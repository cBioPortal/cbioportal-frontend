import { ClinicalAttribute } from 'cbioportal-ts-api-client';
import { SpecialAttribute } from 'shared/cache/ClinicalDataCache';

/**
 * Creates a Cancer Study clinical attribute for use in coloring dropdowns.
 * This special attribute allows coloring samples by their study of origin.
 */
export function createCancerStudyAttribute(): ClinicalAttribute {
    return {
        clinicalAttributeId: SpecialAttribute.StudyOfOrigin,
        displayName: 'Cancer Study',
        description: 'The cancer study for each sample',
        datatype: 'STRING',
        patientAttribute: false,
        priority: '1',
        studyId: '',
    };
}

/**
 * Adds Cancer Study as a special attribute to the beginning of a clinical attributes list.
 */
export function addCancerStudyAttribute(
    baseAttributes: ClinicalAttribute[]
): ClinicalAttribute[] {
    return [createCancerStudyAttribute(), ...baseAttributes];
}
