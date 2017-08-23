import client from "../api/cbioportalClientInstance";
import LazyMobXCache, {AugmentedData} from "../lib/LazyMobXCache";
import {MutationCount} from "../api/generated/CBioPortalAPI";
import {getStudyToSamples} from "../lib/CacheUtils";

type Query = {
    studyId: string;
    sampleId: string;
};
function key(d:{studyId?:string, sampleId:string}, m?:string) {
    const studyId = d.studyId ? d.studyId : m;
    return `${studyId}~${d.sampleId}`;
}
async function fetch(queries:Query[], studyToGeneticProfileId:{[studyId:string]:string|undefined}|undefined):Promise<AugmentedData<MutationCount, string>[]> {
    if (!studyToGeneticProfileId) {
        return Promise.reject("No mutation genetic profile ids given");
    } else {
        const studyToSamples = getStudyToSamples(queries);
        for (const q of queries) {
            studyToSamples[q.studyId] = studyToSamples[q.studyId] || [];
            studyToSamples[q.studyId].push(q.sampleId);
        }
        const studiesToQuery = Object.keys(studyToSamples).filter(studyId=>!!studyToGeneticProfileId[studyId]);
        const results:MutationCount[][] = await Promise.all(studiesToQuery.map(studyId=>{
            return client.fetchMutationCountsInGeneticProfileUsingPOST({
                geneticProfileId: studyToGeneticProfileId[studyId]!,
                sampleIds: studyToSamples[studyId]
            });
        }));
        return results.map((counts:MutationCount[], index:number)=>({ data: counts, meta:studiesToQuery[index] }));
    }
}
export default class MutationCountCache extends LazyMobXCache<MutationCount, Query, string> {
    constructor(studyToGeneticProfileId:{[studyId:string]:string|undefined}|undefined) {
        super(key, key, fetch, studyToGeneticProfileId);
    }
}
