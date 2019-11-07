import {
    action,
    autorun,
    computed,
    extendObservable,
    intercept,
    IObservableObject,
    IReactionDisposer,
    observable,
    reaction,
    runInAction,
} from 'mobx';
import ExtendedRouterStore, {
    getRemoteSession,
    normalizeLegacySession,
    PortalSession,
    saveRemoteSession
} from './ExtendedRouterStore';
import hashString from 'shared/lib/hashString';
import * as _ from 'lodash';
import { log } from 'shared/lib/consoleLog';
import { remoteData } from 'public-lib';
import {QueryParams} from "url";

export type BooleanString = string;
export type NumberString = string;

export type Property<T> = {
    name: keyof T;
    isSessionProp: boolean;
    aliases?: string[];
};

export default class URLWrapper<
    QueryParamsType extends { [key: string]: string | undefined }
> {
    public query: QueryParamsType;
    public reactionDisposer: IReactionDisposer;
    protected pathContext: string;

    @observable sessionProps = {};

    constructor(
        protected routing: ExtendedRouterStore,
        protected properties: Property<QueryParamsType>[]
    ) {
        const initValues: Partial<QueryParamsType> = {};
        for (const property of properties) {
            //only init the property if it exists in url
            //if (property.name in routing.location.query) {
                let value = (routing.location
                    .query as QueryParamsType)[property.name];
                if (_.isString(value)) {
                    value = decodeURIComponent(value);
                }
                initValues[property.name] = value;
           // }
        }

        this.query = observable<QueryParamsType>(initValues as QueryParamsType);

        this.setSessionId(routing.query.session_id);

        intercept(this.query, change => {
            if (
                change.newValue ===
                this.query[change.name as keyof QueryParamsType]
            ) {
                // if same value, cancel change to prevent unnecessary changing data
                return null;
            } else {
                log(
                    'changing',
                    change.name,
                    change.newValue,
                    this.query[change.name as keyof QueryParamsType]
                );
                return change;
            }
        });
        this.reactionDisposer = reaction(
            () => {
                // this is necessary to register these properties reaction
                // it doesn't work if it happens inside runInAction below
                return [this.routing.location.query, this._sessionData && this._sessionData.query];
                // for (const property of properties) {
                //     // @ts-ignore
                //
                // }
                // for (const property of properties) {
                //     // @ts-ignore
                //     this.query[property.name];
                // }
            },
            ([routeQuery,sessionQuery]) => {
                //const query = this.routing.location.query as QueryParamsType;
                // if there is a path context and it is not
                if (
                    this.pathContext &&
                    !new RegExp(`^/*${this.pathContext}`).test(
                        routing.location.pathname
                    )
                ) {
                    console.log("killing update b/c path doesn't match")
                    return;
                }
                runInAction(() => {

                    this.setSessionId(routeQuery.session_id);

                    for (const property of properties) {
                        if (!property.isSessionProp) {
                            // @ts-ignore
                            this.syncProperty(property, routeQuery);
                        } else {
                            sessionQuery && this.syncProperty(property, sessionQuery)
                        }
                    }
                });
            }
        );
    }

    @observable _sessionId: string;

    //@observable sessionParams = {};

    @action
    public updateURL(updatedParams: Partial<QueryParamsType>, path:string | undefined = undefined, clear = false, replace = false) {

        // get the names of the props that are designated as session props
        const sessionProps = this.getSessionProps();

        // overwrite params onto the existing params
        const mergedParams = _.assign({}, this.query, updatedParams);

        //put params in buckets according to whether they are session or non session
        const paramsMap = _.reduce(
            mergedParams,
            (
                acc: { sessionProps: any; nonSessionProps: any },
                value,
                paramKey
            ) => {
                if (paramKey in sessionProps) {
                    acc.sessionProps[paramKey] = mergedParams[paramKey];
                } else {
                    acc.nonSessionProps[paramKey] = mergedParams[paramKey];
                }
                return acc;
            },
            { sessionProps: {}, nonSessionProps: {} }
        );

        const needSession = true;

        // determine which of the MODIFIED params are session props
        const sessionParametersChanged = _.some(_.keys(updatedParams), (key)=>key in sessionProps);

        // if we need to make a new session due to url constraints AND we have a changed session prop
        // then save a new remote session and put the session props in memory for consumption by app
        // otherwise just update the URL

        if (
            needSession
        ) {
            if (sessionParametersChanged) {

                this._sessionData = {
                    id: "pending",
                    query: paramsMap.sessionProps,
                    path: path || this.pathName,
                    version:""
                };

                // we need to make a new session
                this.routing.updateRoute(
                    Object.assign({}, paramsMap.nonSessionProps, {
                        session_id: 'pending',
                    }),
                    path,
                    true,
                    replace
                );
               // debugger;
                saveRemoteSession(paramsMap.sessionProps).then(data => {
                    //debugger;
                    this.routing.updateRoute(
                        { session_id: data.id },
                        path,
                        false,
                        true
                    );
                });
            } else {
                this.routing.updateRoute(
                    Object.assign({}, paramsMap.nonSessionProps),
                    path,
                    clear,
                    replace
                );
            }
        } else {
            this.routing.updateRoute(updatedParams, path, clear, replace);
        }

    }

    @computed public get isPendingSession() {
        return this._sessionId === 'pending';
    }

    public setSessionId(val:string){
        if (val !== this._sessionId) {
            this._sessionId = val;
        }
    }

    @computed public get sessionId(){
        return this._sessionId;
    }

    @observable public _sessionData:PortalSession | undefined;

    @computed get isSessionLoading(){
        return (!_.isEmpty(this.sessionId) && this.remoteSessionData.isPending);
    }

    @computed get hasSessionId(){
        return this._sessionId !== undefined;
    }

    public remoteSessionData = remoteData({
        invoke: async () => {
            if (this.sessionId && this.sessionId !== 'pending') {
                let sessionData = await getRemoteSession(this.sessionId);

                // if it has no version, it's a legacy session and needs to be normalized
                if (sessionData.version === undefined) {
                    sessionData = normalizeLegacySession(sessionData);
                }

                return sessionData;
            } else {
                return undefined;
            }
        },
        onResult: () => {
            if (this.remoteSessionData.result) {
                // we have to do this because session service attaches
                // other data to response
                this._sessionData = {
                    id: this.remoteSessionData.result!.id,
                    query: this.remoteSessionData.result!.data,
                    path: this.routing.location.pathname,
                    version: this.remoteSessionData.result!.version,
                };
            } else {
                if (this._sessionData && this._sessionData.id !== 'pending')
                    delete this._sessionData;
            }
        },
    });

    private syncProperty(
        property: Property<QueryParamsType>,
        query: QueryParamsType
    ) {
        // first determine what value should be
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

    private trySyncProperty(
        property: Property<QueryParamsType>,
        value: string | undefined
    ) {

        const processedValue =
            typeof value === 'string' ? decodeURIComponent(value) : undefined;

        if (property.name in this.query) {
            // @ts-ignore
            this.query[property.name] = processedValue;
        } else {
            extendObservable(this.query, { [property.name]:processedValue });
        }

        return processedValue !== undefined;
    }

    public getSessionProps() {
        const ret: Partial<QueryParamsType> = {};
        for (const property of this.properties) {
            if (property.isSessionProp) {
                ret[property.name] = this.query[property.name];
            }
        }
        return ret;
    }

    @computed get hash(): number {
        const stringified = _.reduce(
            this.properties,
            (acc, nextVal) => {
                // @ts-ignore
                if (nextVal.isSessionProp)
                    acc = `${acc},${nextVal.name}:${this.query[nextVal.name]}`;
                return acc;
            },
            ''
        );
        return hashString(stringified);
    }

    @computed public get pathName() {
        return this.routing.location.pathname;
    }

    public destroy() {
        this.reactionDisposer();
    }
}
