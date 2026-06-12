/**
 * This file provides backward compatibility for type names that were changed
 * in the generated API clients. Specifically, the following types were renamed
 * to include the DTO suffix in a recent API regeneration:
 * - ClinicalDataEnrichment → ClinicalDataEnrichmentDTO
 * - ResponseEntityListSample → ResponseEntityListSampleDTO
 * - Sample → SampleDTO
 *
 * Note: ClinicalAttribute was also renamed to ClinicalAttributeDTO, but since
 * the original ClinicalAttribute still exists for backward compatibility in the
 * generated code, we don't need to alias it here.
 *
 * This module re-exports the renamed types with their original names, allowing
 * existing code to continue working without modifications.
 * New code should use the DTO-suffixed names directly.
 */

export {
    ClinicalDataEnrichmentDTO as ClinicalDataEnrichment,
    ResponseEntityListSampleDTO as ResponseEntityListSample,
    SampleDTO as Sample,
} from '../generated/CBioPortalAPIInternal';
