import LazyMobXCache from "shared/lib/LazyMobXCache";
import client from "shared/api/cbioportalInternalClientInstance";
import {VariantCount, VariantCountIdentifier} from "shared/api/generated/CBioPortalAPIInternal";

function getKey<T extends { entrezGeneId:number, keyword?:string}>(obj:T):string {
    if (obj.keyword) {
        return obj.entrezGeneId+"~"+obj.keyword;
    } else {
        return obj.entrezGeneId+"";
    }
}

function fetch(queries:VariantCountIdentifier[], mutationGeneticProfileId:string|undefined):Promise<VariantCount[]> {
    if (!mutationGeneticProfileId) {
        return Promise.reject("No mutation genetic profile id given");
    } else if (queries.length > 0) {
        return client.fetchVariantCountsUsingPOST({
            geneticProfileId: mutationGeneticProfileId,
            variantCountIdentifiers: queries
        });
    } else {
        return Promise.resolve([]);
    }
}

export default class VariantCountCache extends LazyMobXCache<VariantCount, VariantCountIdentifier> {
    constructor(mutationGeneticProfileId:string|undefined) {
        super(getKey, getKey,
            fetch, mutationGeneticProfileId);
    }
}
