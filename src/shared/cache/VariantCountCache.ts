import client from 'shared/api/cbioportalInternalClientInstance';
import { VariantCount, VariantCountIdentifier } from 'cbioportal-ts-api-client';
import {
    createBatchedReactiveFetch,
    ReactiveFetchCache,
} from 'shared/lib/batchedReactiveFetch';

export type VariantCountCache = ReactiveFetchCache<
    VariantCountIdentifier,
    VariantCount
>;

function getKey<T extends { entrezGeneId: number; keyword?: string }>(
    obj: T
): string {
    return obj.keyword
        ? `${obj.entrezGeneId}~${obj.keyword}`
        : `${obj.entrezGeneId}`;
}

export function createVariantCountCache(
    mutationMolecularProfileId: string | undefined
): VariantCountCache {
    return createBatchedReactiveFetch<VariantCountIdentifier, VariantCount>({
        queryToKey: getKey,
        dataToKey: getKey,
        fetch: async queries => {
            if (!mutationMolecularProfileId) {
                throw new Error('No mutation molecular profile id given');
            }
            if (queries.length === 0) return [];
            return client.fetchVariantCountsUsingPOST({
                molecularProfileId: mutationMolecularProfileId,
                variantCountIdentifiers: queries,
            });
        },
    });
}
