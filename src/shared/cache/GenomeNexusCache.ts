import { fetchVariantAnnotationsByMutation } from 'shared/lib/StoreUtils';
import { genomicLocationString } from 'shared/lib/MutationUtils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { extractGenomicLocation } from 'cbioportal-utils';
import { Mutation } from 'cbioportal-ts-api-client';
import LazyMobXCache, { CacheData } from 'shared/lib/LazyMobXCache';
import AppConfig from 'appConfig';

export type GenomeNexusCacheDataType = CacheData<VariantAnnotation>;

export function defaultGNFetch(
    queries: Mutation[]
): Promise<VariantAnnotation[]> {
    if (queries.length > 0) {
        return fetchVariantAnnotationsByMutation(
            queries,
            ['annotation_summary'],
            AppConfig.serverConfig.isoformOverrideSource
        );
    } else {
        return Promise.resolve([]);
    }
}

export function queryToKey(m: Mutation) {
    const genomicLocation = extractGenomicLocation(m);
    if (genomicLocation) {
        return genomicLocationString(genomicLocation);
    } else {
        // TODO: might be a better way to handle mutations w/o genomic location
        // info. They should maybe not be fed to the cache in the first place
        return '';
    }
}

export default class GenomeNexusCache extends LazyMobXCache<
    VariantAnnotation,
    Mutation
> {
    constructor(customFetch?: any) {
        super(
            (m: Mutation) => queryToKey(m), // queryToKey
            (v: VariantAnnotation) =>
                genomicLocationString(v.annotation_summary.genomicLocation), // dataToKey
            customFetch || defaultGNFetch
        );
    }
}
