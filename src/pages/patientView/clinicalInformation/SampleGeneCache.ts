import {observable} from "../../../../node_modules/mobx/lib/mobx";
import Immutable from "seamless-immutable";
import * as _ from "lodash";

export type CacheData<T> = { status: "complete", data: T | null} | { status: "pending" };
export type Cache<T> = {
    [sampleId:string]: {
        fetchedWithoutGeneArgument: "complete" | "pending" | false,
        geneData: {[entrezGeneId: number]: CacheData<T> | null}
    }
};
type CacheMerge<T> = {
    [sampleId:string]: {
        fetchedWithoutGeneArgument?: "complete" | "pending" | false,
        geneData?: {[entrezGeneId: number]: CacheData<T> | null}
    }
}
export type SampleToEntrezListOrNull = { [sampleId:string]:number[]|null };
export type SampleToEntrezList = { [sampleId:string]:number[] };

export default class SampleGeneCache<T extends { sampleId: string; entrezGeneId:number; }> {
    @observable.ref private _cache: Cache<T> & Immutable.ImmutableObject<Cache<T>>;
    private dependencies:any[];

    constructor(sampleIds:string[], ...dependencies:any[]) {
        this.dependencies = dependencies;
        this.initCache(sampleIds);
    }

    public get cache() {
        return this._cache;
    }

    public get data():T[] {
        const ret:T[] = [];
        for (const sampleId of Object.keys(this._cache)) {
            const geneData = this._cache[sampleId].geneData || {};
            for (const entrezGeneId of Object.keys(geneData)) {
                const datum:CacheData<T> | null = geneData[parseInt(entrezGeneId,10)];
                if (datum !== null && datum.status === "complete" && datum.data !== null) {
                    ret.push(datum.data);
                }
            }
        }
        return ret;
    }

    protected async populate(sampleToEntrezList: SampleToEntrezListOrNull) {
        // Subclasses extending this need to redefine this with the proper argument,
        // i.e. should it be SampleToEntrezList or SampleToEntrezListOrNull
        // See MrnaExprRankCache for an example
        const missing = this.getMissing(sampleToEntrezList);
        this.markPending(missing);
        try {
            const data:T[] = await this.fetch(missing, ...this.dependencies);
            this.putData(missing, data);
            return true;
        } catch (err) {
            this.unmarkPending(missing);
            return false;
        }
    }

    protected fetch(sampleToEntrezList:SampleToEntrezListOrNull, ...dependencies:any[]):Promise<T[]> {
        throw "Not implemented in abstract class.";
    }

    private initCache(sampleIds:string[]) {
        const _cache:Cache<T> = {};
        for (const sampleId of sampleIds) {
            _cache[sampleId] = {
                fetchedWithoutGeneArgument: false,
                geneData: {}
            };
        }
        this._cache = Immutable.from<Cache<T>>(_cache);
    }

    private getMissing(sampleToEntrezList:SampleToEntrezListOrNull):SampleToEntrezListOrNull {
        const ret:SampleToEntrezListOrNull = {};
        for (const sampleId of Object.keys(sampleToEntrezList)) {
            const entrezList = sampleToEntrezList[sampleId];
            const subCache = this._cache[sampleId];
            if (!subCache) {
                ret[sampleId] = entrezList;
            } else {
                if (entrezList === null) {
                    if (subCache.fetchedWithoutGeneArgument === false) {
                        ret[sampleId] = null;
                    }
                } else {
                    const missingEntrez = entrezList.filter((g:number) => !subCache.geneData[g]);
                    if (missingEntrez.length > 0) {
                        ret[sampleId] = missingEntrez;
                    }
                }
            }
        }
        return ret;
    }

    private markEntries(sampleToEntrezList:SampleToEntrezListOrNull, status:"pending"|null) {
        // Helper function for markPending and unmarkPending
        const toMerge:CacheMerge<T> = {};
        for (const sampleId of Object.keys(sampleToEntrezList)) {
            const entrezList = sampleToEntrezList[sampleId];
            toMerge[sampleId] = {};
            if (entrezList === null) {
                toMerge[sampleId].fetchedWithoutGeneArgument = (!status ? false : "pending");
            } else {
                toMerge[sampleId].geneData = {};
                for (const entrezGene of entrezList) {
                    toMerge[sampleId].geneData![entrezGene] = (!status ? null : {
                        status:"pending"
                    });
                }
            }
        }
        if (Object.keys(toMerge).length > 0) {
            this._cache = this._cache.merge(toMerge, {deep:true}) as Cache<T> & Immutable.ImmutableObject<Cache<T>>;
        }
    }

    private markPending(sampleToEntrezList:SampleToEntrezListOrNull):void {
        this.markEntries(sampleToEntrezList, "pending");
    }

    private unmarkPending(sampleToEntrezList:SampleToEntrezListOrNull):void {
        // When we set pending, it's like a mutex for fetching that data -
        //  any queries that come in concurrently won't also query for that data.
        //  So we can be assured that there's no pending requests for it
        //  besides ours, and so we can clear pending here.
        this.markEntries(sampleToEntrezList, null);
    }

    private putData(query:SampleToEntrezListOrNull, fetchedData:T[]):void {
        const dataMap:{ [sampleId:string]: { [entrezGeneId:number]: T } } = {};
        for (const fetchedDatum of fetchedData) {
            dataMap[fetchedDatum.sampleId] = dataMap[fetchedDatum.sampleId] || {};
            dataMap[fetchedDatum.sampleId][fetchedDatum.entrezGeneId] = fetchedDatum;
        }
        const toMerge:CacheMerge<T> = {};
        for (const sampleId of Object.keys(query)) {
            const entrezList = query[sampleId];
            toMerge[sampleId] = { geneData: {} };
            const sampleData = dataMap[sampleId];

            if (entrezList === null) {
                toMerge[sampleId].fetchedWithoutGeneArgument = "complete";
                // Put all fetched data for this sample
                if (sampleData) {
                    for (const entrezGene in sampleData) {
                        if (sampleData.hasOwnProperty(entrezGene)) {
                            toMerge[sampleId].geneData![entrezGene] = {
                                status:"complete",
                                data: sampleData[entrezGene]
                            }
                        }
                    }
                }
            } else {
                for (const entrezGene of entrezList) {
                    toMerge[sampleId].geneData![entrezGene] = {
                        status:"complete",
                        data: (sampleData && sampleData[entrezGene]) || null
                    };
                }
            }
        }
        if (Object.keys(toMerge).length > 0) {
            this._cache = this._cache.merge(toMerge, {deep:true}) as Cache<T> & Immutable.ImmutableObject<Cache<T>>;
        }
    }
}