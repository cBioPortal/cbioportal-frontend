import { ClinicalAttribute } from 'cbioportal-ts-api-client';

const CLINICAL_ATTRIBUTE_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
    WSI_TIMEPOINT: 'WSI Timepoint Bin',
    WSI_SLIDE_COUNT: 'WSI Slide Count (Viewable)',
    WSI_NON_SERVABLE_HNE_SLIDE_COUNT: 'Non-viewable H&E Slide Count',
    WSI_NON_SERVABLE_IHC_SLIDE_COUNT: 'Non-viewable IHC Slide Count',
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
