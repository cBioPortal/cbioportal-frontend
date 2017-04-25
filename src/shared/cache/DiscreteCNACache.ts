import * as _ from 'lodash';
import {default as SampleGeneCache, SampleAndGene} from "shared/lib/SampleGeneCache";
import {CacheData} from "shared/lib/LazyMobXCache";
import client from "shared/api/cbioportalClientInstance";
import {DiscreteCopyNumberData, DiscreteCopyNumberFilter} from "shared/api/generated/CBioPortalAPI";

export type DiscreteCNACacheDataType = CacheData<DiscreteCopyNumberData>;

async function fetch(queries:SampleAndGene[], geneticProfileIdDiscrete:string|undefined):Promise<DiscreteCopyNumberData[]> {
    try {
        const sampleToEntrezList:{[sampleId:string]:number[]} = {};
        for (const query of queries) {
            sampleToEntrezList[query.sampleId] = sampleToEntrezList[query.sampleId] || [];
            sampleToEntrezList[query.sampleId].push(query.entrezGeneId);
        }
        const allData:DiscreteCopyNumberData[][] = await Promise.all(Object.keys(sampleToEntrezList).map(
            (sampleId:string)=> {
                if (typeof geneticProfileIdDiscrete === "undefined") {
                    return Promise.reject("No genetic profile id given.");
                } else {
                    const entrezList = sampleToEntrezList[sampleId];
                    let filter:DiscreteCopyNumberFilter;
                    if (entrezList === null) {
                        filter = {
                            sampleIds: [sampleId]
                        } as DiscreteCopyNumberFilter;
                    } else {
                        filter = {
                            sampleIds: [sampleId],
                            entrezGeneIds: entrezList
                        } as DiscreteCopyNumberFilter;
                    }
                    return client.fetchDiscreteCopyNumbersInGeneticProfileUsingPOST({
                        projection: "DETAILED",
                        geneticProfileId: geneticProfileIdDiscrete,
                        discreteCopyNumberFilter: filter,
                        discreteCopyNumberEventType: "ALL"
                    })
                }
            }));
        return _.flatten(allData);
    } catch (err) {
        throw err;
    }
}
export default class DiscreteCNACache extends SampleGeneCache<DiscreteCopyNumberData> {

    constructor(geneticProfileIdDiscrete:string|undefined) {
        super(fetch, geneticProfileIdDiscrete);
    }
}