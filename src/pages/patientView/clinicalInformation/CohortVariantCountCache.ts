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
            // for each gene
            const entrezGeneId = parseInt(entrez, 10);
            // missing keywords are those for which we dont have data, and are not pending
            const missingKeywords = entrezToKeywordList[entrezGeneId].filter((kw:string)=>!cache.keyword[kw] && !pending.keyword[kw]);

            if (missingKeywords.length > 0) {
                // if there are missing keywords, set up to query them
                ret[entrezGeneId] = missingKeywords;
            } else {
                // if no missing keywords, set up to query the gene without keywords (for # mutation in gene),
                //  only if we don't have that data and its not pending
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
            // if we queried for this gene
            if (query.hasOwnProperty(datum.entrezGeneId)) {
                // set # mutation in gene
                toMerge.mutationInGene[datum.entrezGeneId] = {
                    status: "complete",
                    data: datum.numberOfSamplesWithMutationInGene
                };
                // if there's keyword data, set it
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

    private markError(entrezToKeywordList:EntrezToKeywordList) {
        const cache = this._cache;
        const toMerge:VariantCountCacheMerge = { mutationInGene: {}, keyword: {}};
        for (const entrez of Object.keys(entrezToKeywordList)) {
            const entrezGeneId = parseInt(entrez, 10);
            const keywordList = entrezToKeywordList[entrezGeneId];
            // if we don't already have data, mark it as error
            if (!cache.mutationInGene[entrezGeneId]) {
                toMerge.mutationInGene[entrezGeneId] = {status:"error"};
            }
            for (const keyword of keywordList) {
                toMerge.keyword[keyword] = {status: "error"};
            }
        }
        this.updateCache(toMerge);
    }

    private markPendingStatus(entrezToKeywordList:EntrezToKeywordList, status:boolean) {
        // Helper function for markPending and unmarkPending
        const pending = this._pending;

        for (const entrez of Object.keys(entrezToKeywordList)) {
            // for each gene
            const entrezGeneId = parseInt(entrez, 10);
            const keywordList = entrezToKeywordList[entrezGeneId];

            // set pending
            pending.mutationInGene[entrezGeneId] = status;

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