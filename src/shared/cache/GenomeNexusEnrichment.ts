import genomeNexusClient from "shared/api/genomeNexusClientInstance";
import {generateGenomeNexusQuery} from "shared/lib/GenomeNexusUtils";
import {VariantAnnotation, Hotspot, MutationAssessor} from "shared/api/generated/GenomeNexusAPI";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import LazyMobXCache, {CacheData} from "shared/lib/LazyMobXCache";

// TODO: Genome Nexus should change response type based on fields parameter,
// but this is only possible in swagger version 3
export type VariantAnnotationEnriched = (
    VariantAnnotation & 
    {hotspots: {license: string, annotation: Hotspot}} &
    {mutation_assessor: {license: string, annotation: MutationAssessor}}
);

export type GenomeNexusCacheDataType = CacheData<VariantAnnotationEnriched>;


function fetch(queries: Mutation[]):Promise<VariantAnnotationEnriched[]> {
    if (queries.length > 0) {
        return genomeNexusClient.postVariantAnnotation(
            {
                variants: queries.map((m) => generateGenomeNexusQuery(m)),
                // TODO: update genome nexus API to return all fields by
                // default
                fields: ['hotspots', 'mutation_assessor']
            }
        ) as Promise<VariantAnnotationEnriched[]>; 
    } else {
        return Promise.resolve([]);
    }
}



export default class GenomeNexusCache extends LazyMobXCache<VariantAnnotationEnriched, Mutation> {
    constructor() {
        super((m:Mutation) => (generateGenomeNexusQuery(m)), // queryToKey
              (v:VariantAnnotationEnriched) => (v.id), // dataToKey
              fetch);
    }
}
