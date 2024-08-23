import { AlphaMissense, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { Mutation, RemoteData } from 'cbioportal-utils';
import { getAnnotation } from './VariantAnnotationHelper';
//
// export function getHgvsgColumnData(mutation: Mutation): string | null {
//     return generateHgvsgByMutation(mutation) || null;
// }

export function getAlphaMissenseColumnData(
    mutation: Mutation,
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >
): string | null {
    const variantAnnotation = getAnnotation(
        mutation,
        indexedVariantAnnotations
    );

    if (!variantAnnotation) {
        console.log('asdd');
        return null;
    }

    // return data from transcriptConsequenceSummaries if transcript dropdown is enabled
    // if (selectedTranscriptId) {
    //     const transcriptConsequenceSummary = variantAnnotation.annotation_summary?.transcriptConsequenceSummaries?.find(
    //         transcriptConsequenceSummary =>
    //             transcriptConsequenceSummary.transcriptId ===
    //             selectedTranscriptId
    //     );
    //     data = transcriptConsequenceSummary
    //         ? transcriptConsequenceSummary.hgvsc
    //         : null;
    // }

    return 'path|0.996';

    // console.log("sss"+JSON.stringify(variantAnnotation.annotation_summary?.transcriptConsequenceSummary))
    // return ((variantAnnotation.annotation_summary?.transcriptConsequenceSummary
    //     ?.alphaMissense.pathogenicity)  + "|" + (variantAnnotation.annotation_summary?.transcriptConsequenceSummary
    //     ?.alphaMissense.score ))||'N/A';
}
