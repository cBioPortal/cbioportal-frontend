import * as _ from 'lodash';
import {AugmentedData, CacheData, default as LazyMobXCache} from "shared/lib/LazyMobXCache";
import client from "shared/api/cbioportalClientInstance";
import {DiscreteCopyNumberData, DiscreteCopyNumberFilter, GeneticProfile} from "shared/api/generated/CBioPortalAPI";

export type DiscreteCNACacheDataType = CacheData<DiscreteCopyNumberData>;
type Query = {studyId:string, sampleId:string, entrezGeneId:number};

async function fetchForStudy(queries:Query[], studyId:string, geneticProfileIdDiscrete:string|undefined):Promise<AugmentedData<DiscreteCopyNumberData, string>> {
    try {
        const uniqueSamples = _.uniq(queries.map(q=>q.sampleId));
        const uniqueGenes = _.uniq(queries.map(q=>q.entrezGeneId));
        let filters:DiscreteCopyNumberFilter[];
        if (uniqueSamples.length < uniqueGenes.length) {
            // Make one query per sample, since there are fewer samples than genes
            const sampleToEntrezList:{[sampleId:string]:number[]} = {};
            for (const query of queries) {
                sampleToEntrezList[query.sampleId] = sampleToEntrezList[query.sampleId] || [];
                sampleToEntrezList[query.sampleId].push(query.entrezGeneId);
            }
            filters = Object.keys(sampleToEntrezList).map(sample=>{
                return {
                    sampleIds: [sample],
                    entrezGeneIds: sampleToEntrezList[sample]
                } as DiscreteCopyNumberFilter;
            });
        } else {
            // Make one query per gene
            const entrezToSampleList:{[entrez:string]:string[]} = {};
            for (const query of queries) {
                entrezToSampleList[query.entrezGeneId] = entrezToSampleList[query.entrezGeneId] || [];
                entrezToSampleList[query.entrezGeneId].push(query.sampleId);
            }
            filters = Object.keys(entrezToSampleList).map(entrez=>{
                return {
                    sampleIds: entrezToSampleList[entrez],
                    entrezGeneIds: [parseInt(entrez, 10)]
                } as DiscreteCopyNumberFilter;
            });
        }
        const allData:DiscreteCopyNumberData[][] = await Promise.all(filters.map(filter=>{
            if (typeof geneticProfileIdDiscrete === "undefined") {
                return Promise.reject("No genetic profile id given.");
            } else {
                return client.fetchDiscreteCopyNumbersInGeneticProfileUsingPOST({
                    projection: "DETAILED",
                    geneticProfileId: geneticProfileIdDiscrete,
                    discreteCopyNumberFilter: filter,
                    discreteCopyNumberEventType: "ALL"
                });
            }
        }));
        return {data:_.flatten(allData), meta:studyId};
    } catch (err) {
        throw err;
    }
}
function fetch(queries:Query[], studyToGeneticProfileDiscrete:{[studyId:string]:GeneticProfile}):Promise<AugmentedData<DiscreteCopyNumberData, string>[]> {
    if (!studyToGeneticProfileDiscrete) {
        throw "No study to genetic profile id map given";
    } else {
        const studyToQueries = _.groupBy(queries, 'studyId');
        return Promise.all(Object.keys(studyToQueries)
            .map(studyId=>{
                const profile = studyToGeneticProfileDiscrete[studyId];
                if (profile) {
                    return fetchForStudy(studyToQueries[studyId], studyId, profile.geneticProfileId);
                } else {
                    return Promise.resolve({data: [], meta: studyId});
                }
            }));
    }
}
function key(d:{studyId?:string, sampleId:string, entrezGeneId:number}, m?:string) {
    const studyId = d.studyId ? d.studyId : m;
    return `${studyId}~${d.sampleId}~${d.entrezGeneId}`;
}
export default class DiscreteCNACache extends LazyMobXCache<DiscreteCopyNumberData, Query, string> {
    constructor(private studyToGeneticProfileDiscrete?:{[studyId:string]:GeneticProfile}) {
        super(key, key, fetch, studyToGeneticProfileDiscrete);
    }
    public get isActive():boolean {
        return !!(this.studyToGeneticProfileDiscrete && Object.keys(this.studyToGeneticProfileDiscrete).length > 0);
    }
}