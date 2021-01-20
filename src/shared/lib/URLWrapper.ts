import {autorun, computed, extendObservable, intercept, IObservableObject, observable} from "mobx";
import ExtendedRouterStore from "./ExtendedRouterStore";

export type Property<T> = {
    name: keyof T,
    isSessionProp: boolean
};

export default class URLWrapper<QueryParamsType> {
    public query:Partial<QueryParamsType>;

    constructor(
        protected routing:ExtendedRouterStore,
        protected properties:Property<QueryParamsType>[]
    ) {
        const initValues:Partial<QueryParamsType> = {};
        for (const property of properties) {
            initValues[property.name] = undefined;
        }
        this.query = observable<Partial<QueryParamsType>>(initValues);

        intercept(this.query, change=>{
            if (change.newValue === this.query[change.name as keyof QueryParamsType]) {
                // if same value, cancel change to prevent unnecessary changing data
                return null;
            } else {
                return change;
            }
        });
        autorun(()=>{
            const query = routing.query as QueryParamsType;
            for (const property of properties) {
                this.query[property.name] = query[property.name];
            }
        });
    }

    public updateQuery(query:Partial<QueryParamsType>) {
        this.routing.updateRoute(query as any);
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

    @computed public get pathName() {
        return this.routing.location.pathname;
    }
}