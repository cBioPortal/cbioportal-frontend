import client from 'shared/api/cbioportalInternalClientInstance';
import { VariantCount, VariantCountIdentifier } from 'cbioportal-ts-api-client';
import {
    batchify,
    memoize,
    reactive,
    ReactiveCache,
} from 'shared/lib/batchedFetch';

export type VariantCountCache = ReactiveCache<
    VariantCountIdentifier,
    VariantCount
>;

const keyOf = (x: { entrezGeneId: number; keyword?: string }) =>
    x.keyword ? `${x.entrezGeneId}~${x.keyword}` : `${x.entrezGeneId}`;

export function createVariantCountCache(
    mutationMolecularProfileId: string | undefined,
): VariantCountCache {
    const fetchOne = memoize<VariantCountIdentifier, VariantCount | null>(
        batchify<VariantCountIdentifier, VariantCount>(
            qs => {
                if (!mutationMolecularProfileId) {
                    return Promise.reject(
                        new Error('No mutation molecular profile id given'),
                    );
                }
                if (qs.length === 0) return Promise.resolve([]);
                return client.fetchVariantCountsUsingPOST({
                    molecularProfileId: mutationMolecularProfileId,
                    variantCountIdentifiers: qs,
                });
            },
            keyOf,
            keyOf,
        ),
        keyOf,
    );
    return reactive(fetchOne, keyOf);
}
