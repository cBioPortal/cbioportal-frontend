import {default as SampleGeneCache, SampleToEntrezListOrNull, Cache, CacheData} from './SampleGeneCache';
import * as _ from 'lodash';
import client from "../../../shared/api/cbioportalClientInstance";
import {DiscreteCopyNumberData, DiscreteCopyNumberFilter} from "../../../shared/api/generated/CBioPortalAPI";

export type DiscreteCNACacheType = Cache<DiscreteCopyNumberData>;
export type DiscreteCNACacheDataType = CacheData<DiscreteCopyNumberData>;
export default class DiscreteCNACache extends SampleGeneCache<DiscreteCopyNumberData> {

    constructor(sampleIds:string[], geneticProfileIdDiscrete:string|undefined) {
        super(sampleIds, (d:DiscreteCopyNumberData)=>[d.sampleId, d.entrezGeneId], geneticProfileIdDiscrete);
    }

    public async populate(sampleToEntrezListOrNull: SampleToEntrezListOrNull) {
        return super.populate(sampleToEntrezListOrNull);
    }

    public get(sampleId:string, entrezGeneId:number):DiscreteCNACacheDataType | null {
        return this.getData(sampleId, entrezGeneId);
    }

    protected async fetch(sampleToEntrezListOrNull:SampleToEntrezListOrNull,
                          geneticProfileIdDiscrete:string|undefined):Promise<DiscreteCopyNumberData[]> {

        try {
            const allData:DiscreteCopyNumberData[][] = await Promise.all(Object.keys(sampleToEntrezListOrNull).map(
                (sampleId:string)=> {
                    if (typeof geneticProfileIdDiscrete === "undefined") {
                        return Promise.reject("No genetic profile id given.");
                    } else {
                        const entrezListOrNull = sampleToEntrezListOrNull[sampleId];
                        let filter:DiscreteCopyNumberFilter;
                        if (entrezListOrNull === null) {
                            filter = {
                                sampleIds: [sampleId]
                            } as DiscreteCopyNumberFilter;
                        } else {
                            filter = {
                                sampleIds: [sampleId],
                                entrezGeneIds: entrezListOrNull
                            };
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
}