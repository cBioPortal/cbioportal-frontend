import { remoteData } from 'cbioportal-frontend-commons';
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
    saveRemoteSession,
} from './ExtendedRouterStore';
import hashString from 'shared/lib/hashString';
import * as _ from 'lodash';
import { log } from 'shared/lib/consoleLog';
import { QueryParams } from 'url';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import { Omit } from './TypeScriptUtils';

export type BooleanString = string;
export type NumberString = string;

export type Property<T> = {
    name: keyof T;
    isSessionProp: boolean;
    aliases?: string[];
};

export function needToLoadSession(
    obj: Partial<ResultsViewURLWrapper>
): boolean {
    return (
        obj.sessionId !== undefined &&
        obj.sessionId !== 'pending' &&
        (obj._sessionData === undefined ||
            obj._sessionData.id !== obj.sessionId)
    );
}

export default class URLWrapper<
    QueryParamsType extends { [key: string]: string | undefined }
> {
    public query: QueryParamsType;
    public reactionDisposer: IReactionDisposer;
    protected pathContext: string;
    protected readonly properties: Property<QueryParamsType>[];

    @observable sessionProps = {};

    constructor(
        protected routing: ExtendedRouterStore,
        // pass it in in a map so that typescript can ensure that every property is accounted for
        protected propertiesMap: {
            [property in keyof QueryParamsType]: Omit<
                Property<QueryParamsType>,
                'name'
            >;
        },
        public sessionEnabled = false,
        public urlCharThresholdForSession = 1500
    ) {
        this.properties = _.entries(this.propertiesMap).map(entry => ({
            name: entry[0],
            ...entry[1],
        }));

        const initValues: Partial<QueryParamsType> = {};

        // init values MUST include all properties in type
        // even if they are not represented in browser url at the moment
        // they need to be there so that they will observable in the future upon assignment
        for (const property of this.properties) {
            let value = (routing.location.query as QueryParamsType)[
                property.name
            ];
            if (_.isString(value)) {
                // @ts-ignore
                value = decodeURIComponent(value);
            }
            initValues[property.name] = value;
        }

        // consumers of wrapper read from this query
        this.query = observable<QueryParamsType>(initValues as QueryParamsType);

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
                return [
                    routing.location.query,
                    this._sessionData && this._sessionData.query,
                ];
            },
            ([routeQuery, sessionQuery]) => {
                if (
                    this.pathContext &&
                    !new RegExp(`^/*${this.pathContext}`).test(
                        this.routing.location.pathname
                    )
                ) {
                    return;
                }

                runInAction(() => {
                    log('setting session', routeQuery.session_id);

                    for (const property of this.properties) {
                        // if property is not a session prop
                        // it will always be represented in URL
                        if (this.hasSessionId && property.isSessionProp) {
                            // if there is a session, then sync it with session
                            sessionQuery &&
                                this.syncProperty(property, sessionQuery);
                        } else {
                            // @ts-ignore
                            this.syncProperty(property, routeQuery);
                        }
                    }
                });
            },
            { fireImmediately: true }
        );
    }

    //@observable _sessionId: string;

    @action
    public updateURL(
        updatedParams: Partial<QueryParamsType>,
        path: string | undefined = undefined,
        clear = false,
        replace = false
    ) {
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

        const url = _.reduce(
            paramsMap.sessionProps,
            (agg: string[], val, key) => {
                if (val !== undefined) {
                    agg.push(`${key}=${encodeURIComponent(val)}`);
                }
                return agg;
            },
            []
        ).join('&');

        log('url length', url.length);

        // determine which of the MODIFIED params are session props
        const sessionParametersChanged = _.some(
            _.keys(updatedParams),
            key => key in sessionProps
        );

        // we need session if url is longer than this
        // or if we already have session
        const inSessionMode =
            this.sessionEnabled &&
            (this.hasSessionId || url.length > this.urlCharThresholdForSession);

        // if we need to make a new session due to url constraints AND we have a changed session prop
        // then save a new remote session and put the session props in memory for consumption by app
        // otherwise just update the URL
        if (inSessionMode) {
            if (sessionParametersChanged) {
                // keep a timestamp to make sure
                // that async session response matches the
                // current session and hasn't been invalidated by subsequent session
                var timeStamp = Date.now();

                this._sessionData = {
                    id: 'pending',
                    query: paramsMap.sessionProps,
                    path: path || this.pathName,
                    version: 3,
                    timeStamp,
                };

                // we need to make a new session
                this.routing.updateRoute(
                    Object.assign({}, paramsMap.nonSessionProps, {
                        session_id: 'pending',
                    }),
                    path,
                    true,
                    false
                );

                log('updating URL (non session)', updatedParams);

                this.saveRemoteSession(paramsMap.sessionProps).then(data => {
                    // make sure that we have sessionData and that timestamp on the session hasn't
                    // been changed since it started
                    if (
                        this._sessionData &&
                        timeStamp === this._sessionData.timeStamp
                    ) {
                        this._sessionData.id = data.id;
                        this.routing.updateRoute(
                            { session_id: data.id },
                            path,
                            false,
                            true // we don't want pending to show up in history
                        );
                    }
                });
            } else {
                // we already have session, we just need to update path or non session params
                this.routing.updateRoute(
                    Object.assign({}, paramsMap.nonSessionProps),
                    path,
                    clear,
                    replace
                );
            }
        } else {
            // WE ARE NOT IN SESSION MODE
            //this._sessionData = undefined;
            //updatedParams.session_id = undefined;
            this.routing.updateRoute(updatedParams, path, clear, replace);
        }
    }

    saveRemoteSession(sessionProps: Partial<QueryParamsType>) {
        return saveRemoteSession(sessionProps);
    }

    @computed public get isPendingSession() {
        return this.sessionId === 'pending';
    }

    @computed public get sessionId() {
        return this.routing.location.query.session_id === ''
            ? undefined
            : this.routing.location.query.session_id;
    }

    @observable public _sessionData: PortalSession | undefined;

    @computed get isLoadingSession() {
        return !_.isEmpty(this.sessionId) && this.remoteSessionData.isPending;
    }

    @computed get hasSessionId() {
        return this.sessionId !== undefined;
    }

    getRemoteSession(sessionId: string) {
        return getRemoteSession(this.sessionId);
    }

    @computed get needToLoadSession() {
        // if we have a session id
        // it's NOT equal to pending
        // we either have NO session data or the existing session data is
        // not in sync with sessionId from url
        return needToLoadSession(this);
        // return this.sessionId && this.sessionId !== 'pending' &&
        //     (this._sessionData === undefined || this._sessionData.id !== this.sessionId);
    }

    public remoteSessionData = remoteData({
        invoke: async () => {
            if (this.needToLoadSession) {
                log('fetching remote session', this.sessionId);

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
            extendObservable(this.query, { [property.name]: processedValue });
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
