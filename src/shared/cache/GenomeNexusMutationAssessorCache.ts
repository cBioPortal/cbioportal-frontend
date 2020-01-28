import * as _ from 'lodash';
import { fetchVariantAnnotationsByMutation } from 'shared/lib/StoreUtils';
import {
    extractGenomicLocation,
    genomicLocationString,
} from 'shared/lib/MutationUtils';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import LazyMobXCache, { CacheData } from 'shared/lib/LazyMobXCache';
import AppConfig from 'appConfig';
import { VariantAnnotation } from 'cbioportal-frontend-commons';

export type GenomeNexusCacheDataType = CacheData<VariantAnnotation>;

export function fetch(queries: Mutation[]): Promise<VariantAnnotation[]> {
    if (queries.length > 0) {
        return fetchVariantAnnotationsByMutation(
            queries,
            ['annotation_summary', 'mutation_assessor'],
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

export default class GenomeNexusMutationAssessorCache extends LazyMobXCache<
    VariantAnnotation,
    Mutation
> {
    constructor() {
        super(
            (m: Mutation) => queryToKey(m), // queryToKey
            (v: VariantAnnotation) =>
                genomicLocationString(v.annotation_summary.genomicLocation), // dataToKey
            fetch
        );
    }
}
