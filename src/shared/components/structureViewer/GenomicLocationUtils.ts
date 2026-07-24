import { Mutation } from 'cbioportal-ts-api-client';
import { GenomicLocation, VariantAnnotation } from 'genome-nexus-ts-api-client';

function findChromosome(
    mutation: Partial<Mutation & { chr?: string; chromosome?: string }>
): string | undefined {
    return mutation.chromosome || mutation.chr;
}

export function extractGenomicLocation(
    mutation: Partial<Mutation & { chr?: string; chromosome?: string }>
): GenomicLocation | undefined {
    const chromosome = findChromosome(mutation);

    if (
        chromosome &&
        mutation.startPosition &&
        mutation.endPosition &&
        mutation.referenceAllele &&
        mutation.variantAllele
    ) {
        return {
            chromosome: chromosome.replace(/^chr/i, ''),
            start: mutation.startPosition,
            end: mutation.endPosition,
            referenceAllele: mutation.referenceAllele,
            variantAllele: mutation.variantAllele,
        };
    }

    return undefined;
}

export function genomicLocationString(genomicLocation: GenomicLocation): string {
    return `${genomicLocation.chromosome},${genomicLocation.start},${genomicLocation.end},${genomicLocation.referenceAllele},${genomicLocation.variantAllele}`;
}

export function getVariantAnnotationForMutation(
    mutation: Partial<Mutation>,
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
