import {
    getCdnaChange,
    isGermlineMutationStatus,
    Mutation,
    RemoteData,
} from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { getHgvscColumnData } from './HgvsHelper';

export type IndexedVariantAnnotations = {
    [genomicLocation: string]: VariantAnnotation;
};

// getHgvscColumnData expects the annotations wrapped in a RemoteData; the OncoKB
// alteration callers only ever have the resolved map, so wrap it once here.
function getHgvsc(
    mutation: Mutation,
    indexedVariantAnnotations?: IndexedVariantAnnotations
): string | null {
    return getHgvscColumnData(
        mutation,
        indexedVariantAnnotations
            ? ({ result: indexedVariantAnnotations } as RemoteData<
                  IndexedVariantAnnotations | undefined
              >)
            : undefined
    );
}

export function getGermlineCdnaChange(
    mutation: Mutation,
    indexedVariantAnnotations?: IndexedVariantAnnotations
): string | undefined {
    if (!isGermlineMutationStatus(mutation.mutationStatus)) {
        return undefined;
    }
    return getCdnaChange(getHgvsc(mutation, indexedVariantAnnotations));
}

// Single source of truth for the OncoKB alteration string. Both the query-id
// generation (DefaultMutationMapperDataFetcher) and the lookup-id generation
// (Annotation column) derive their id from this value, so the two can never
// drift out of sync.
//
// Germline mutations are annotated by their "HUGO:cDNA" HGVSc alteration and
// MUST NEVER use the somatic protein change. When the HGVSc alteration is
// unavailable the germline mutation is left unannotated (empty alteration)
// rather than falling back to a genomic change, keeping the flow simple.
export function getOncoKbAlteration(
    mutation: Mutation,
    indexedVariantAnnotations?: IndexedVariantAnnotations
): string {
    if (isGermlineMutationStatus(mutation.mutationStatus)) {
        const cDnaChange = getGermlineCdnaChange(
            mutation,
            indexedVariantAnnotations
        );
        const hugoSymbol = mutation.gene?.hugoGeneSymbol;
        return hugoSymbol && cDnaChange ? `${hugoSymbol}:${cDnaChange}` : '';
    }
    return mutation.proteinChange;
}
