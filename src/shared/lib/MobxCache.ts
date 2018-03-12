import {action, autorun, computed, IReactionDisposer, observable} from "mobx";
import {MobxPromise} from "mobxpromise";

export class CacheLeaf<Data> implements MobxPromise<Data> {
    @observable status = "complete" | "pending" | "error";
    @observable result:Data|undefined = undefined;
    @observable error:any;
    @computed get isComplete() {
        return this.status === "complete";
    }
    @computed get isPending() {
        return this.status === "pending";
    }
    @computed get isError() {
        return this.status === "error";
    }

    constructor(private promise:Promise<Data>) {
        promise.then(
            action(result=>{
                this.result = result;
                this.status = "complete";
            }),
            action(error=>{
                this.error = error;
                this.status = "error";
            })
        );
    }
}

export default class MobxCache<Args, Data> {
    private cache:{[key:string]:CacheLeaf<Data>};

    private clearReaction?:IReactionDisposer;
    private argsToKey?:(args:Args)=>string;

    constructor(
        private argsToData:(args:Args)=>Promise<Data>,
        options?:{
            clearReactionTrigger?:()=>void,
            argsToKey?:(args:Args)=>string
        }
    ) {
        this.cache = {};

        if (options && options.clearReactionTrigger) {
            this.clearReaction = autorun(()=>{
                options.clearReactionTrigger(); // any observables referenced in this function will now trigger a cache clear
                this.cache = {};
            });
        }
    }

    public get(args:Args) {
        const key = this.argsToKey ? this.argsToKey(args) : JSON.stringify(args);
        cache[key] = cache[key] || new CacheLeaf<Data>(this.argsToData(args));
        return cache[key];
    }

    public destroy() {
        this.clearReaction && this.clearReaction();
    }
}