import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { Mutation } from '../model/Mutation';
import { extractGenomicLocation, genomicLocationString } from './MutationUtils';

export function getMyVariantInfoAnnotationsFromIndexedVariantAnnotations(indexedVariantAnnotations?: {
    [genomicLocation: string]: VariantAnnotation;
}) {
    const indexedMyVariantAnnotations: {
        [genomicLocation: string]: MyVariantInfo;
    } = {};

    if (indexedVariantAnnotations) {
        Object.keys(indexedVariantAnnotations).forEach(genomicLocation => {
            const myVariantInfo = getMyVariantInfoFromVariantAnnotation(
                indexedVariantAnnotations[genomicLocation]
            );
            if (myVariantInfo) {
                indexedMyVariantAnnotations[genomicLocation] = myVariantInfo;
            }
        });
    }

    return indexedMyVariantAnnotations;
}

export function getMyVariantInfoFromVariantAnnotation(
    annotation?: VariantAnnotation
): MyVariantInfo | undefined {
    return annotation && annotation.my_variant_info
        ? annotation.my_variant_info.annotation
        : undefined;
}

export function getMyVariantInfoAnnotation(
    mutation?: Mutation,
    indexedMyVariantInfoAnnotations?: {
        [genomicLocation: string]: MyVariantInfo;
    }
) {
    let myVariantInfo: MyVariantInfo | undefined;

    if (mutation && indexedMyVariantInfoAnnotations) {
        const genomicLocation = extractGenomicLocation(mutation);
        const key = genomicLocation
            ? genomicLocationString(genomicLocation)
            : undefined;

        if (key) {
            myVariantInfo = indexedMyVariantInfoAnnotations[key];
        }
    }

    return myVariantInfo;
}

export function getVariantAnnotation(
    mutation?: Mutation,
    indexedVariantAnnotations?: { [genomicLocation: string]: VariantAnnotation }
) {
    let variantAnnotation: VariantAnnotation | undefined;

    if (mutation && indexedVariantAnnotations) {
        const genomicLocation = extractGenomicLocation(mutation);
        const key = genomicLocation
            ? genomicLocationString(genomicLocation)
            : undefined;

        if (key) {
            variantAnnotation = indexedVariantAnnotations[key];
        }
    }

    return variantAnnotation;
}
