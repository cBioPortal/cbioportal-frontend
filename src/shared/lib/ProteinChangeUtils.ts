import { Mutation } from 'cbioportal-ts-api-client';
import { findMatchingAnnotatedMutation } from './MutationUtils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import {
    extractGenomicLocation,
    genomicLocationString,
} from 'cbioportal-utils';
import MutationTypeColumnFormatter from 'shared/components/mutationTable/column/MutationTypeColumnFormatter';

export function getProteinChangeData(
    originalMutation: Mutation,
    indexedAnnotatedMutationsByGenomicLocation?: {
        [genomicLocation: string]: Mutation;
    },
    isCanonicalTranscript?: boolean
) {
    // // non-canonical
    // //if (isCanonicalTranscript === false) {
    //     const annotatedMutation = indexedAnnotatedMutationsByGenomicLocation
    //         ? findMatchingAnnotatedMutation(
    //               originalMutation,
    //               indexedAnnotatedMutationsByGenomicLocation
    //           )
    //         : undefined;
    //     if (annotatedMutation) {
    //         console.log(annotatedMutation);

    //         // non-canonical, GN has data, but data is empty, show empty
    //         if (annotatedMutation.proteinChange.length === 0) {
    //             return '';
    //         }
    //         // non-canonical, GN has data, show GN annotated result
    //         return annotatedMutation.proteinChange;
    //     }
    //     else {
    //         return undefined;
    //     }
    //     // non-canonical and GN doesn't have data, show data from database
    // //}
    // // canonical, show database result

    return originalMutation.proteinChange;
}

export function shouldShowWarningForProteinChangeDifference(
    originalMutation: Mutation,
    indexedAnnotatedMutationsByGenomicLocation?: {
        [genomicLocation: string]: Mutation;
    },
    indexedVariantAnnotations?: {
        [genomicLocation: string]: VariantAnnotation;
    }
): boolean {
    // get mutation type from MutationTypeColumnFormatter (need to check if the mutation is Fusion)
    const mutationType = MutationTypeColumnFormatter.getDisplayValue([
        originalMutation,
    ]);
    const genomicLocation = extractGenomicLocation(originalMutation);
    const annotatedMutation =
        genomicLocation && indexedVariantAnnotations
            ? indexedVariantAnnotations[genomicLocationString(genomicLocation)]
            : undefined;
    // check if indexedAnnotatedMutationsByGenomicLocation exists
    // (only results view with enabled transcript dropdown will pass indexedAnnotatedMutationsByGenomicLocation)
    if (indexedAnnotatedMutationsByGenomicLocation !== undefined) {
        // check if current mutation is annotated by genome nexus successfully
        if (annotatedMutation) {
            // GN has data, do not show warning
            return false;
        } else {
            // don't add warning to fusion mutations
            return mutationType !== 'Fusion';
        }
    } else {
        return false;
    }
}
