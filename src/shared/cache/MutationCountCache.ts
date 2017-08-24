import client from "../api/cbioportalClientInstance";
import LazyMobXCache, {AugmentedData} from "../lib/LazyMobXCache";
import {GeneticProfile, MutationCount} from "../api/generated/CBioPortalAPI";
import _ from "lodash";

type Query = {
    sampleId: string;
    geneticProfileId: string;
};

function key(d:{geneticProfileId:string, sampleId:string}) {
    return `${d.geneticProfileId}~${d.sampleId}`;
}
async function fetch(queries:Query[]):Promise<MutationCount[]> {
    const groupedQueries = _.groupBy(queries, x=>x.geneticProfileId);
    const geneticProfileIds = Object.keys(groupedQueries);
    const results:MutationCount[][] = await Promise.all(geneticProfileIds.map(geneticProfileId=>{
        const sampleIds = groupedQueries[geneticProfileId].map(d=>d.sampleId);
        if (sampleIds.length > 0) {
            return client.fetchMutationCountsInGeneticProfileUsingPOST({
                geneticProfileId,
                sampleIds
            });
        } else {
            return Promise.resolve([]);
        }
    }));
    return _.flatten(results);
}
export default class MutationCountCache extends LazyMobXCache<MutationCount, Query, string> {
    constructor() {
        super(key, key, fetch);
    }
}
