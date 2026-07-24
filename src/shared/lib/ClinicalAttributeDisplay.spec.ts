import { getClinicalAttributeDisplayName } from './ClinicalAttributeDisplay';

describe('getClinicalAttributeDisplayName', () => {
    it('labels the WSI slide count as viewable', () => {
        expect(
            getClinicalAttributeDisplayName({
                clinicalAttributeId: 'WSI_SLIDE_COUNT',
                displayName: 'WSI Slide Count',
            })
        ).toBe('WSI Slide Count (Viewable)');
    });

    it('labels legacy non-servable count attributes as non-viewable', () => {
        expect(
            getClinicalAttributeDisplayName({
                clinicalAttributeId: 'WSI_NON_SERVABLE_HNE_SLIDE_COUNT',
                displayName: 'Non-servable H&E Slide Count',
            })
        ).toBe('Non-viewable H&E Slide Count');
        expect(
            getClinicalAttributeDisplayName({
                clinicalAttributeId: 'WSI_NON_SERVABLE_IHC_SLIDE_COUNT',
                displayName: 'Non-servable IHC Slide Count',
            })
        ).toBe('Non-viewable IHC Slide Count');
    });

    it('preserves display names without an override', () => {
        expect(
            getClinicalAttributeDisplayName({
                clinicalAttributeId: 'OTHER_ATTRIBUTE',
                displayName: 'Other Attribute',
            })
        ).toBe('Other Attribute');
    });
});
