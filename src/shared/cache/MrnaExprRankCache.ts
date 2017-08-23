import * as _ from 'lodash';
import {default as SampleGeneCache, Query} from 'shared/lib/SampleGeneCache';
import internalClient from "shared/api/cbioportalInternalClientInstance";
import {MrnaPercentile} from "shared/api/generated/CBioPortalAPIInternal";
import {CacheData} from "shared/lib/LazyMobXCache";

export type MrnaExprRankCacheDataType = CacheData<MrnaPercentile>;

async function fetch(queries:Query[], mrnaRankGeneticProfileId:string|null):Promise<MrnaPercentile[]> {
    try {
        const sampleToEntrezList:{[sampleId:string]:number[]} = {};
        for (const query of queries) {
            sampleToEntrezList[query.sampleId] = sampleToEntrezList[query.sampleId] || [];
            sampleToEntrezList[query.sampleId].push(query.entrezGeneId);
        }
        const allMrnaPercentiles:MrnaPercentile[][] = await Promise.all(Object.keys(sampleToEntrezList).map((sampleId:string)=>
            ( mrnaRankGeneticProfileId === null ?
                    Promise.reject("No genetic profile id given.") :
                    internalClient.fetchMrnaPercentileUsingPOST({
                        geneticProfileId: mrnaRankGeneticProfileId,
                        sampleId,
                        entrezGeneIds: sampleToEntrezList[sampleId]
                    })
            ))
        );
        return _.flatten(allMrnaPercentiles);
    } catch (err) {
        throw err;
    }
}

export default class MrnaExprRankCache extends SampleGeneCache<MrnaPercentile> {

    constructor(mrnaRankGeneticProfileId:string|null) {
        super(fetch, mrnaRankGeneticProfileId);
    }
}