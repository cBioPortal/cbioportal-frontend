import LazyMobXCache from "../../../shared/lib/LazyMobXCache";
import {CopyNumberCount, CopyNumberCountIdentifier} from "shared/api/generated/CBioPortalAPI";
import client from "shared/api/cbioportalClientInstance";

function getKey<T extends { entrezGeneId: number, alteration: number}>(obj:T):string {
    return obj.entrezGeneId + "~" + obj.alteration;
}

function fetch(queries:CopyNumberCountIdentifier[], geneticProfileIdDiscrete:string|undefined):Promise<CopyNumberCount[]> {
    if (!geneticProfileIdDiscrete) {
        return Promise.reject("No discrete CNA genetic profile id given");
    } else {
        if (queries.length) {
            return client.fetchCopyNumberCountsUsingPOST({
                geneticProfileId: geneticProfileIdDiscrete,
                copyNumberCountIdentifiers: queries
            });
        } else {
            return Promise.resolve([]);
        }
    }
}

export default class CopyNumberCountCache extends LazyMobXCache<CopyNumberCount, CopyNumberCountIdentifier> {
    constructor(geneticProfileIdDiscrete:string|undefined) {
        super(getKey, getKey,
            fetch, geneticProfileIdDiscrete);
    }
}