import client from "../api/cbioportalClientInstance";
import LazyMobXCache from "../lib/LazyMobXCache";
import {MutationCount} from "../api/generated/CBioPortalAPI";

function fetch(sampleIds:string[], geneticProfileId:string|undefined):Promise<MutationCount[]> {
    if (!geneticProfileId) {
        return Promise.reject("No mutation genetic profile id given");
    } else {
        return client.fetchMutationCountsInGeneticProfileUsingPOST({
            geneticProfileId,
            sampleIds
        });
    }
}
export default class MutationCountCache extends LazyMobXCache<MutationCount, string> {
    constructor(geneticProfileId:string|undefined) {
        super(q=>q, (d:MutationCount)=>d.sampleId, fetch, geneticProfileId);
    }
}
