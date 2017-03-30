import {default as SampleGeneCache, SampleToEntrezList, Cache, CacheData} from './SampleGeneCache';
import * as _ from 'lodash';
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";
import {MrnaPercentile} from "../../../shared/api/generated/CBioPortalAPIInternal";

export type MrnaExprRankCacheType = Cache<MrnaPercentile>;
export type MrnaExprRankCacheDataType = CacheData<MrnaPercentile>;
export default class MrnaExprRankCache extends SampleGeneCache<MrnaPercentile> {

    constructor(sampleIds:string[], mrnaRankGeneticProfileId:string|null) {
        super(sampleIds, (d:MrnaPercentile)=>[d.sampleId, d.entrezGeneId], mrnaRankGeneticProfileId);
    }

    public async populate(sampleToEntrezList:SampleToEntrezList) {
        return super.populate(sampleToEntrezList);
    }

    public get(sampleId:string, entrezGeneId:number):MrnaExprRankCacheDataType | null {
        return this.getData(sampleId, entrezGeneId);
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