import {MobxPromise, MobxPromiseInputParams} from "mobxpromise";
import ListIndexedMap from "shared/lib/ListIndexedMap";

export default class MobxCache<Query, Result> {
    private cache:{[key:string]:MobxPromise<Result>};
    private allCache:ListIndexedMap<MobxPromise<Result[]>>;

    constructor(
        private queryToMobxPromiseInput:(q:Query)=>MobxPromiseInputParams<Result>,
        private queryToKey?:(q:Query)=>string
    ) {
        this.cache = {};
        this.allCache = new ListIndexedMap<>();

        this.queryToKey = this.queryToKey || JSON.stringify;
    }

    public get(q:Query):MobxPromise<Result> {
        const key = this.queryToKey(q);
        if (!this.cache[key]) {
            this.cache[key] = new MobxPromise<Result>(this.queryToMobxPromiseInput(q));
        }
        return this.cache[key];
    }

    public getAll(queries:Query[]):MobxPromise<Result>[] {
        const key = queries.map(q=>this.queryToKey(q));
        const existing = this.allCache.get(key);
        if (existing) {
            return existing;
        } else {
            const newPromise = MobxPromise.all(
                queries.map(q=>this.get(q))
            );
            this.allCache.set(key, newPromise);
            return newPromise;
        }
    }
}