import { Mutation as ApiMutation } from 'cbioportal-ts-api-client';
import {
    extractGenomicLocation,
    genomicLocationString,
    Mutation as CbioPortalMutation,
} from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';

type MutationWithGenomicLocation = Partial<
    ApiMutation & CbioPortalMutation & { chr?: string }
>;

export function getVariantAnnotationForMutation(
    mutation: MutationWithGenomicLocation,
    indexedVariantAnnotations?: {
        [genomicLocation: string]: VariantAnnotation;
    }
): VariantAnnotation | undefined {
    if (!indexedVariantAnnotations) {
        return undefined;
    }

    const genomicLocation = extractGenomicLocation(mutation);

    if (!genomicLocation) {
        return undefined;
    }

    return indexedVariantAnnotations[genomicLocationString(genomicLocation)];
}
