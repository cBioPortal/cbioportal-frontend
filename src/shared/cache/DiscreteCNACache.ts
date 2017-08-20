import * as _ from 'lodash';
import {default as SampleGeneCache, SampleAndGene} from "shared/lib/SampleGeneCache";
import {CacheData} from "shared/lib/LazyMobXCache";
import client from "shared/api/cbioportalClientInstance";
import {DiscreteCopyNumberData, DiscreteCopyNumberFilter} from "shared/api/generated/CBioPortalAPI";

export type DiscreteCNACacheDataType = CacheData<DiscreteCopyNumberData>;

async function fetch(queries:SampleAndGene[], geneticProfileIdDiscrete:string|undefined):Promise<DiscreteCopyNumberData[]> {
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
        return _.flatten(allData);
    } catch (err) {
        throw err;
    }
}
export default class DiscreteCNACache extends SampleGeneCache<DiscreteCopyNumberData> {

    private _geneticProfileIdDiscrete:string|undefined;

    constructor(geneticProfileIdDiscrete:string|undefined) {
        super(fetch, geneticProfileIdDiscrete);
        this._geneticProfileIdDiscrete = geneticProfileIdDiscrete;
    }

    get geneticProfileIdDiscrete():string|undefined {
        return this._geneticProfileIdDiscrete;
    }
}