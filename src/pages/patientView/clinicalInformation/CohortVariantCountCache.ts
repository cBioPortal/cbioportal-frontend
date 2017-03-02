import {observable} from "../../../../node_modules/mobx/lib/mobx";
import Immutable from "seamless-immutable";
import {VariantCount, VariantCountIdentifier} from "../../../shared/api/CBioPortalAPIInternal";
import client from "../../../shared/api/cbioportalInternalClientInstance";

export type VariantCountCacheDataType = { status: "complete", data:number | null}
                                        | { status:"error" };

export type VariantCountCacheMerge = {
    numberOfSamples?: number | null;
    mutationInGene: { [entrezGeneId: string]:VariantCountCacheDataType | null };
    keyword: { [kw:string]: VariantCountCacheDataType | null };
};

export type VariantCountCacheType = {
    numberOfSamples: number | null;
    mutationInGene: { [entrezGeneId: string]:VariantCountCacheDataType | null };
    keyword: { [kw:string]: VariantCountCacheDataType | null };
};

type PendingCacheType = {
    numberOfSamples: boolean;
    mutationInGene: { [entrezGeneId: string]:boolean};
    keyword: { [kw:string]: boolean }
};

export type EntrezToKeywordList = {
    [entrezGeneId:number]:string[]
};

export default class CohortVariantCountCache {

    @observable.ref private _cache:VariantCountCacheType & Immutable.ImmutableObject<VariantCountCacheType>;
    private _pending:PendingCacheType;

    constructor(private mutationGeneticProfileId:string) {
        this._cache = Immutable.from<VariantCountCacheType>({
            numberOfSamples: null,
            mutationInGene: {},
            keyword: {}
        });
        this._pending = {
            numberOfSamples: false,
            mutationInGene: {},
            keyword: {}
        };
    }
    public get cache() {
        return this._cache;
    }

    public async populate(entrezToKeywordList:EntrezToKeywordList) {
        const missing = this.getMissing(entrezToKeywordList);
        this.markPending(missing);
        try {
            const data:VariantCount[] = await this.fetch(missing, this.mutationGeneticProfileId);
            this.putData(missing, data);
        } catch (err) {
            this.markError(missing);
        } finally {
            this.unmarkPending(missing);
        }
    }

    protected fetch(entrezToKeywordList:EntrezToKeywordList,
                  mutationGeneticProfileId:string):Promise<VariantCount[]> {
        let variantCountIdentifiers:VariantCountIdentifier[] = [];
        for (const entrez of Object.keys(entrezToKeywordList)) {
            const entrezGeneId = parseInt(entrez, 10);
            const keywordList = entrezToKeywordList[entrezGeneId];
            if (keywordList.length === 0) {
                variantCountIdentifiers.push({
                    entrezGeneId
                } as VariantCountIdentifier);
            } else {
                variantCountIdentifiers = variantCountIdentifiers.concat(
                    keywordList.map((keyword:string)=>{
                        return {
                            entrezGeneId,
                            keyword
                        };
                    })
                );
            }
        }
        if (variantCountIdentifiers.length > 0) {
            return client.fetchVariantCountsUsingPOST({
                geneticProfileId: mutationGeneticProfileId,
                variantCountIdentifiers
            });
        } else {
            return Promise.resolve([]);
        }
    }

    private getMissing(entrezToKeywordList:EntrezToKeywordList):EntrezToKeywordList {
        const cache = this._cache;
        const pending = this._pending;
        const ret:EntrezToKeywordList = {};
        for (const entrez of Object.keys(entrezToKeywordList)) {
            const entrezGeneId = parseInt(entrez, 10);
            const missingKeywords = entrezToKeywordList[entrezGeneId].filter((kw:string)=>!cache.keyword[kw] && !pending.keyword[kw]);
            if (missingKeywords.length > 0) {
                ret[entrezGeneId] = missingKeywords;
            } else {
                if (!cache.mutationInGene[entrezGeneId] && !pending.mutationInGene[entrezGeneId]) {
                    ret[entrezGeneId] = [];
                }
            }
        }
        return ret;
    }

    private putData(query:EntrezToKeywordList, data:VariantCount[]) {
        const cache = this._cache;
        const toMerge:VariantCountCacheMerge = {
            mutationInGene: {},
            keyword: {}
        };
        // By default, set all queried to null, no data found
        for (const entrez of Object.keys(query)) {
            const keywords = query[parseInt(entrez,10)];
            const mutationInGene = cache.mutationInGene[entrez];
            if (!mutationInGene) {
                // only set this if we don't already have it
                toMerge.mutationInGene[entrez] = {
                    status: "complete",
                    data: null
                };
            }
            for (const keyword of keywords) {
                toMerge.keyword[keyword] = {
                    status: "complete",
                    data: null
                };
            }
        }
        // Set data retrieved, that was also queried, overriding the default null set above if there is any
        if (data.length > 0 && cache.numberOfSamples === null) {
            toMerge.numberOfSamples = data[0].numberOfSamples;
        }
        for (const datum of data) {
            if (query.hasOwnProperty(datum.entrezGeneId)) {
                toMerge.mutationInGene[datum.entrezGeneId] = {
                    status: "complete",
                    data: datum.numberOfSamplesWithMutationInGene
                };
                if (datum.keyword && query[datum.entrezGeneId].indexOf(datum.keyword) > -1) {
                    toMerge.keyword[datum.keyword] = {
                        status: "complete",
                        data: datum.numberOfSamplesWithKeyword
                    }
                }
            }
        }
        this.updateCache(toMerge);
    }

    private markPendingStatus(entrezToKeywordList:EntrezToKeywordList, status:boolean) {
        // Helper function for markPending and unmarkPending
        const cache = this._cache;
        const pending = this._pending;

        for (const entrez of Object.keys(entrezToKeywordList)) {
            const entrezGeneId = parseInt(entrez, 10);
            const keywordList = entrezToKeywordList[entrezGeneId];
            if (!cache.mutationInGene[entrezGeneId] || !status) {
                pending.mutationInGene[entrezGeneId] = status;
            }
            for (const keyword of keywordList) {
                pending.keyword[keyword] = status;
            }
        }
    }

    private markPending(entrezToKeywordList:EntrezToKeywordList) {
        this.markPendingStatus(entrezToKeywordList, true);
    }

    private unmarkPending(entrezToKeywordList:EntrezToKeywordList) {
        this.markPendingStatus(entrezToKeywordList, false);

    }

    private updateCache(toMerge:VariantCountCacheMerge) {
        if (Object.keys(toMerge.mutationInGene).length > 0 ||
            Object.keys(toMerge.keyword).length ||
            toMerge.hasOwnProperty("numberOfSamples")) {
            this._cache = this._cache.merge(toMerge, {deep:true}) as VariantCountCacheType & Immutable.ImmutableObject<VariantCountCacheType>;
        }
    }

}