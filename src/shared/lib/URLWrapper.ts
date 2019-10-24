import {
    autorun,
    computed,
    extendObservable,
    intercept,
    IObservableObject,
    IReactionDisposer,
    observable,
    runInAction
} from "mobx";
import ExtendedRouterStore from "./ExtendedRouterStore";
import hashString from "shared/lib/hashString";
import * as _ from "lodash";
import {log} from "shared/lib/consoleLog";

export type BooleanString = string;
export type NumberString = string;

export type Property<T> = {
    name: keyof T,
    isSessionProp: boolean,
    aliases?: string[],
};

export default class URLWrapper<QueryParamsType extends { [key:string] : string | undefined }> {
    public query:QueryParamsType;
    public reactionDisposer: IReactionDisposer;
    protected pathContext:string;

    constructor(
        protected routing:ExtendedRouterStore,
        protected properties:Property<QueryParamsType>[]
    ) {
        const initValues:Partial<QueryParamsType> = {};
        for (const property of properties) {
            initValues[property.name] = (routing.query as QueryParamsType)[property.name];
        }
        this.query = observable<QueryParamsType>(initValues as QueryParamsType);

        intercept(this.query, change=>{
            if (change.newValue === this.query[change.name as keyof QueryParamsType]) {
                // if same value, cancel change to prevent unnecessary changing data
                return null;
            } else {
                log("changing", change.name, change.newValue, this.query[change.name as keyof QueryParamsType]);
                return change;
            }
        });
        this.reactionDisposer = autorun(()=>{
            const query = routing.query as QueryParamsType;
            // if there is a path context and it is not

            // this is necessary to register these properties reaction
            // it doesn't work if it happens inside runInAction below
            for (const property of properties) {
                // @ts-ignore
                query[property.name];
            }

            if (this.pathContext && !(new RegExp(`^/*${this.pathContext}`)).test(routing.location.pathname)) {
                return;
            }
            runInAction(()=>{
                for (const property of properties) {
                    // @ts-ignore
                    this.syncProperty(property, query);
                }
            });
        });
    }

    public updateQuery(query:Partial<QueryParamsType>) {
        this.routing.updateRoute(query as any);
    }

    private syncProperty(property:Property<QueryParamsType>, query:QueryParamsType){

        // first deterimine what value should be
        // resolving to aliases IF they exist
        let value = undefined;
        if (query[property.name] !== undefined) {
            value = query[property.name];
        } else if (property.aliases && property.aliases.length) {
            for (const alias of property.aliases) {
                value = query[alias];
                // once you've set it, don't bother with any other aliases
                if (value !== undefined) break;
            }
        }
        this.trySyncProperty(property, value);
    }

    private trySyncProperty(property:Property<QueryParamsType>, value:string|undefined){
        // @ts-ignore
        this.query[property.name] = typeof value === "string" ? decodeURIComponent(value) : undefined;
        return value !== undefined;
    }

    public getSessionProps() {
        const ret:Partial<QueryParamsType> = {};
        for (const property of this.properties) {
            if (property.isSessionProp) {
                ret[property.name] = this.query[property.name];
            }
        }
        return ret;
    }

    @computed get hash():number {
        const stringified = _.reduce(this.properties,(acc, nextVal)=>{
            // @ts-ignore
            if (nextVal.isSessionProp) acc = `${acc},${nextVal.name}:${this.query[nextVal.name]}`;
            return acc;
        }, "");
        return hashString(stringified);
    }

    @computed public get pathName() {
        return this.routing.location.pathname;
    }

    public destroy(){
        this.reactionDisposer();
    }

}
