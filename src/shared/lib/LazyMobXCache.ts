import Immutable from "seamless-immutable"; // need to use immutables so mobX can observe the cache shallowly
import accumulatingDebounce from "./accumulatingDebounce";
import {observable, action} from "mobx";
import {AccumulatingDebouncedFunction} from "./accumulatingDebounce";

export type CacheData<T> = {
    status: "complete" | "error";
    data: null;
} | {
    status: "complete",
    data: T
};

export type Cache<T> = {
    [key:string]:CacheData<T>;
};

type Pending = {
    [key:string]:boolean;
};

type ImmutableCache<T> = Cache<T> & Immutable.ImmutableObject<Cache<T>>;

type QueryKeyToQuery<Q> = { [queryKey:string]:Q };

export default class LazyMobXCache<Data, Query> {
    @observable.ref private _cache:ImmutableCache<Data>;
    private pending: Pending;

    private staticDependencies:any[];
    private debouncedPopulate:AccumulatingDebouncedFunction<Query>;

    constructor(private queryToKey:(q:Query)=>string, // query maps to the key of the datum it will fill
                private dataToKey:(d:Data)=>string, // should uniquely identify the data - for indexing in cache
                private fetch:(queries:Query[], ...staticDependencies:any[])=>Promise<Data[]>,
                ...staticDependencies:any[]) {
        this.init();
        this.staticDependencies = staticDependencies;
        this.debouncedPopulate = accumulatingDebounce<QueryKeyToQuery<Query>, Query>(
            (queryMap:QueryKeyToQuery<Query>)=>{
                const queries:Query[] = Object.keys(queryMap).map(k=>queryMap[k]);
                this.populate(queries);
            },
            (queryMap:QueryKeyToQuery<Query>, newQuery:Query)=>{
                queryMap[this.queryToKey(newQuery)] = newQuery;
                return queryMap;
            },
            ()=>{return {};},
            0
        );
    }

    private init() {
        this.pending = {};
        this._cache = Immutable.from<Cache<Data>>({});
    }
    public get cache() {
        return this._cache;
    }

    public peek(query:Query):CacheData<Data> | null {
        const key = this.queryToKey(query);
        const cacheData:CacheData<Data> | undefined = this._cache[key];
        return cacheData || null;
    }

    public get(query:Query):CacheData<Data> | null {
        this.debouncedPopulate(query);

        return this.peek(query);
    }

    public addData(data:Data[]):void {
        const toMerge:Cache<Data> = {};
        for (const datum of data) {
            toMerge[this.dataToKey(datum)] = {
                status: "complete",
                data: datum
            };
        }
        this.updateCache(toMerge);
    }

    private async populate(queries:Query[]) {
        const missing:Query[] = this.getMissing(queries);
        if (missing.length === 0) {
            return;
        }
        this.markPending(missing);
        try {
            const data:Data[] = await this.fetch(missing, ...this.staticDependencies);
            this.putData(missing, data);
            return true;
        } catch (err) {
            this.markError(missing);
            return false;
        } finally {
            this.unmarkPending(missing);
        }
    }

    private getMissing(queries:Query[]):Query[] {
        const cache = this._cache;
        const pending = this.pending;

        return queries.filter(q=>{
            const key = this.queryToKey(q);
            return (!cache[key] && !pending[key]);
        });
    }

    private markPending(queries:Query[]):void {
        const pending = this.pending;
        for (const query of queries) {
            pending[this.queryToKey(query)] = true;
        }
    }

    private unmarkPending(queries:Query[]):void {
        const pending = this.pending;
        for (const query of queries) {
            pending[this.queryToKey(query)] = false;
        }
    }

    private markError(queries:Query[]) {
        const toMerge:Cache<Data> = {};
        const error:CacheData<Data> = {
            status: "error",
            data:null
        };
        for (const query of queries) {
            toMerge[this.queryToKey(query)] = error;
        }
        this.updateCache(toMerge);
    }

    private putData(queries:Query[], data:Data[]) {
        const toMerge:Cache<Data> = {};
        const queryKeyHasData:{[queryKey:string]:boolean} = {};

        for (const query of queries) {
            queryKeyHasData[this.queryToKey(query)] = false;
        }

        for (const datum of data) {
            const datumKey = this.dataToKey(datum);
            toMerge[datumKey] = {
                status: "complete",
                data: datum
            };
            queryKeyHasData[datumKey] = true;
        }

        for (const queryKey of Object.keys(queryKeyHasData)) {
            if (!queryKeyHasData[queryKey]) {
                toMerge[queryKey] = {
                    status: "complete",
                    data: null
                };
            }
        }
        this.updateCache(toMerge);
    }

    @action private updateCache(toMerge:Cache<Data>) {
        if (Object.keys(toMerge).length > 0) {
            this._cache = this._cache.merge(toMerge, {deep:true}) as ImmutableCache<Data>;
        }
    }
}