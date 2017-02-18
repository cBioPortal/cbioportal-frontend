import {default as SampleGeneCache, SampleToEntrezList, Cache, CacheData} from './SampleGeneCache';
import * as _ from 'lodash';
import {MrnaPercentile} from "../../../shared/api/CBioPortalAPIInternal";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";

export type MrnaExprRankCacheType = Cache<MrnaPercentile>;
export type MrnaExprRankCacheDataType = CacheData<MrnaPercentile>;
export default class MrnaExprRankCache extends SampleGeneCache<MrnaPercentile> {

    constructor(sampleIds:string[], mrnaRankGeneticProfileId:string|null) {
        super(sampleIds, mrnaRankGeneticProfileId);
    }

    public async populate(sampleToEntrezList:SampleToEntrezList) {
        return super.populate(sampleToEntrezList);
    }

    protected async fetch(sampleToEntrezList:SampleToEntrezList, mrnaRankGeneticProfileId:string|null):Promise<MrnaPercentile[]> {
        try {
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

}