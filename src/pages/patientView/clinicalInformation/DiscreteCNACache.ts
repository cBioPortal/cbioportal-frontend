import {default as SampleGeneCache, SampleToEntrezListOrNull, Cache, CacheData} from './SampleGeneCache';
import * as _ from 'lodash';
import {DiscreteCopyNumberFilter, DiscreteCopyNumberData} from "../../../shared/api/CBioPortalAPI";
import client from "../../../shared/api/cbioportalClientInstance";

export type DiscreteCNACacheType = Cache<DiscreteCopyNumberData>;
export type DiscreteCNACacheDataType = CacheData<DiscreteCopyNumberData>;
export default class DiscreteCNACache extends SampleGeneCache<DiscreteCopyNumberData> {

    constructor(sampleIds:string[], geneticProfileIdDiscrete:string|undefined) {
        super(sampleIds, geneticProfileIdDiscrete);
    }

    public async populate(sampleToEntrezListOrNull: SampleToEntrezListOrNull) {
        return super.populate(sampleToEntrezListOrNull);
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
                            discreteCopyNumberFilter: filter
                        })
                    }
                }));
            return _.flatten(allData);
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
}