import {observable} from "mobx";
export default class DebouncingCache {
    private toFetch:Set<string>;
    private fetchTimeout:number;
    @observable.ref private cache:{[firstName:string]:string|null};

    private fetchDebounced(id:string) {
        if (this.toFetch.has(id)) {
            // Just let it go as it was if we're already planning to query this
            return;
        }
        clearTimeout(this.fetchTimeout);
        this.toFetch.add(id);
        this.fetchTimeout = window.setTimeout(()=>{
            if (this.toFetch.has("ADAM")) {
                this.cache["ADAM"] = "ABESHOUSE";
            }
            if (this.toFetch.has("ONUR")) {
                this.cache["ONUR"] = "SUMER";
            }
            if (this.toFetch.has("AARON")) {
                this.cache["AARON"] = "LISMAN";
            }
            if (this.toFetch.has("NONAME")) {
                this.cache["NONAME"] = null;
            }
            if (this.toFetch.size > 0) {
                this.cache = {...this.cache}; // trigger change
            }
            this.toFetch = new Set<string>();
        }, 2000);
    }

    public get(firstName:string) {
        const existing = this.cache[firstName];
        if (typeof existing === "undefined") {
            this.fetchDebounced(firstName);
        }
        return existing;
    }

    constructor() {
        this.cache = {};
        this.toFetch = new Set<string>();
    }
}