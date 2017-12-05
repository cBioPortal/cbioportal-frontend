import client from "../api/cbioportalClientInstance";
import LazyMobXCache, {AugmentedData} from "../lib/LazyMobXCache";
import {MolecularProfile, MutationCount} from "../api/generated/CBioPortalAPI";
import _ from "lodash";

type Query = {
    sampleId: string;
    molecularProfileId: string;
};

function key(d:{molecularProfileId:string, sampleId:string}) {
    return `${d.molecularProfileId}~${d.sampleId}`;
}
export async function fetch(queries:Query[]):Promise<MutationCount[]> {
    const groupedQueries = _.groupBy(queries, x=>x.molecularProfileId);
    const molecularProfileIds = Object.keys(groupedQueries);
    const results:MutationCount[][] = await Promise.all(molecularProfileIds.map(molecularProfileId=>{
        const sampleIds = groupedQueries[molecularProfileId].map(d=>d.sampleId);
        if (sampleIds.length > 0) {
            return client.fetchMutationCountsInMolecularProfileUsingPOST({
                molecularProfileId,
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
