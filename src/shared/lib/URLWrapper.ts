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
        protected properties: Property<QueryParamsType>[],
        public sessionEnabled = false,
        public urlCharThresholdForSession = 1500
    ) {

        const initValues: Partial<QueryParamsType> = {};

        // init values MUST include all properties in type
        // even if they are not represented in browser url at the moment
        // they need to be there so that they will observable in the future upon assignment
        for (const property of properties) {
            let value = (routing.location
                .query as QueryParamsType)[property.name];
            if (_.isString(value)) {
                // @ts-ignore
                value = decodeURIComponent(value);
            }
            initValues[property.name] = value;
        }

        // consumers of wrapper read from this query
        this.query = observable<QueryParamsType>(initValues as QueryParamsType);


        // if we have a session id, set it so that fetching will begin
        if (sessionEnabled && routing.query.session_id) {
            this.setSessionId(routing.query.session_id);
        }

        //per reaction below, any update to URL will result in all properties being reset.
        //to avoid update signal when properties haven't actually changed (set to existing value)
        //we intercept changes and cancel them when old === new
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

        // whenever a change is made either to the url querystring or to internal representation of
        // query (when in session mode),
        // we want to sync query
        // note that the above intercept will avoid resetting properties with existing values
        this.reactionDisposer = reaction(
            () => {
                // this is necessary to establish observation of properties
                // at least in test context, it doesn't otherwise work
                //const queryProps = _.mapValues(routing.location.query);
                //const sessionProps = this._sessionData && this._sessionData.query && _.mapValues(this._sessionData.query);
                return [routing.location.query, this._sessionData && this._sessionData.query];
            },
            ([routeQuery,sessionQuery]) => {
                if (
                    this.pathContext &&
                    !new RegExp(`^/*${this.pathContext}`).test(
                        this.routing.location.pathname
                    )
                ) {
                    return;
                }

                runInAction(() => {
                    log("setting session", routeQuery.session_id);
                    this.setSessionId(routeQuery.session_id);
                    for (const property of properties) {
                        // if property is not a session prop
                        // it will always be represented in URL
                        if (this.hasSessionId && property.isSessionProp) {
                            // if there is a session, then sync it with session
                            sessionQuery && this.syncProperty(property, sessionQuery)
                        } else {
                            // @ts-ignore
                            this.syncProperty(property, routeQuery);
                        }
                    }
                });
            },
            { fireImmediately:true }
        );
    }

    @observable _sessionId: string;

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
                    // only do this if value is NOT undefined
                    // we don't nee to bother putting it in URL if it's undefined
                    if (mergedParams[paramKey] !== undefined) {
                        acc.nonSessionProps[paramKey] = mergedParams[paramKey];
                    }
                }
                return acc;
            },
            { sessionProps: {}, nonSessionProps: {} }
        );

        const url = _.reduce(paramsMap.sessionProps,(agg:string[], val, key)=>{
            if (val !== undefined) {
                agg.push(`${key}=${encodeURIComponent(val)}`);
            }
            return agg;
        }, []).join("&");

        // determine which of the MODIFIED params are session props
        const sessionParametersChanged = _.some(_.keys(updatedParams), (key)=>key in sessionProps);

        // we need session if url is longer than this
        const needSession = sessionParametersChanged && this.sessionEnabled &&
            (this._sessionId !== undefined || url.length > this.urlCharThresholdForSession);

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
                    version:3
                };

                // we need to make a new session
                this.routing.updateRoute(
                    Object.assign({}, paramsMap.nonSessionProps , {
                        session_id: 'pending',
                    }),
                    path,
                    true,
                    replace
                );

                log("updating URL (non session)", updatedParams);
                this.saveRemoteSession(paramsMap.sessionProps).then(data => {
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
            log("updating URL (non session)", clear);
            this.routing.updateRoute(updatedParams, path, clear, replace);
        }

    }

    saveRemoteSession(sessionProps:Partial<QueryParamsType>){
        return saveRemoteSession(sessionProps);
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

    @computed get isLoadingSession(){
        return (!_.isEmpty(this.sessionId) && this.remoteSessionData.isPending);
    }

    @computed get hasSessionId(){
        return this._sessionId !== undefined;
    }

    getRemoteSession(sessionId:string){
        return getRemoteSession(this.sessionId);
    }

    public remoteSessionData = remoteData({
        invoke: async () => {
            log("fetching remote session", this.sessionId);
            if (this.sessionId && this.sessionId !== 'pending') {
                let sessionData = await this.getRemoteSession(this.sessionId);

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
