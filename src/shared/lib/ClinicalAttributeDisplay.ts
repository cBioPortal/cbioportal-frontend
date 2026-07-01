import { ClinicalAttribute } from 'cbioportal-ts-api-client';

const CLINICAL_ATTRIBUTE_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
    WSI_TIMEPOINT: 'WSI Timepoint Bin',
};

export function getClinicalAttributeDisplayName(
    clinicalAttribute:
        | Pick<ClinicalAttribute, 'clinicalAttributeId' | 'displayName'>
        | undefined
): string {
    if (!clinicalAttribute) {
        return '';
    }

    return (
        CLINICAL_ATTRIBUTE_DISPLAY_NAME_OVERRIDES[
            clinicalAttribute.clinicalAttributeId
        ] ||
        clinicalAttribute.displayName ||
        ''
    );
}
