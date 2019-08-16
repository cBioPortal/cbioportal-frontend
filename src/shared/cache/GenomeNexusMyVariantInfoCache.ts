import * as _ from "lodash";
import {fetchVariantAnnotationsByMutation} from "shared/lib/StoreUtils";
import {extractGenomicLocation, genomicLocationString} from "shared/lib/MutationUtils";
import {VariantAnnotation} from "public-lib/api/generated/GenomeNexusAPI";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import LazyMobXCache, {CacheData} from "shared/lib/LazyMobXCache";
import AppConfig from "appConfig";

export type GenomeNexusCacheDataType = CacheData<VariantAnnotation>;


export function fetch(queries: Mutation[]):Promise<VariantAnnotation[]> {
    if (queries.length > 0) {

        return fetchVariantAnnotationsByMutation(queries, ["my_variant_info"], AppConfig.serverConfig.isoformOverrideSource);

    } else {
        return Promise.resolve([]);
    }
}

export function queryToKey(m:Mutation) {
    const genomicLocation = extractGenomicLocation(m);
    if (genomicLocation) {
        return genomicLocationString(genomicLocation);
    } else {
        // TODO: might be a better way to handle mutations w/o genomic location
        // info. They should maybe not be fed to the cache in the first place
        return "";
    }
}


export function generateGenomicLocationString(chromosome: string, start: number, end: number, allele: string) {
    let ref = allele.split("/")[0];
    let alt = allele.split("/")[1];
    
    return chromosome + "," + start.toString() + "," + end.toString() + "," + ref + "," + alt;
}


export default class GenomeNexusMyVariantInfoCache extends LazyMobXCache<VariantAnnotation, Mutation> {

    constructor() {
        super((m:Mutation) => (queryToKey(m)), // queryToKey
              (v:VariantAnnotation) => generateGenomicLocationString(v.seq_region_name,
                                                                     v.start,
                                                                     v.end,
                                                                     v.allele_string), // dataToKey
              fetch);
              
    }
}