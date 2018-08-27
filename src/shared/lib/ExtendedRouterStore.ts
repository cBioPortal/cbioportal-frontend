import { RouterStore } from 'mobx-react-router';
import {action, computed, observable, runInAction} from 'mobx';
import * as _ from 'lodash';
import URL, {QueryParams} from 'url';
import {remoteData} from "../api/remoteData";
import sessionClient from "../api/sessionServiceInstance";

export function getSessionKey(hash:string){
    return `session_${hash}`
}

export interface PortalSession {
    id:string;
    query:{ [key:string] : any };
    path:string;
}

function saveRemoteSession(data:any){
    return sessionClient.saveSession(data);
}

function getRemoteSession(sessionId:string){
    return sessionClient.getSession(sessionId)
}

function normalizeLegacySession(sessionData:any){
    // legacy sessions were stored with values as first item in arrays, so undo this
    sessionData.data = _.mapValues(sessionData.data, (value: any) => {
        if (_.isArray(value)) {
            return value[0];
        } else {
            return value;
        }
    });

    // convert cancer_study_id to cancer_study_list and get rid of cancer_study_id
    if (sessionData.data.cancer_study_id && !sessionData.data.cancer_study_list) {
        sessionData.data.cancer_study_list = sessionData.data.cancer_study_id;
    }
    delete sessionData.data.cancer_study_id;

    return sessionData;
}


export default class ExtendedRouterStore extends RouterStore {

    // this has to be computed to avoid annoying problem where
    // remoteSessionData fires every time new route is pushed, even
    // if sessionId has stayed the same
    @computed get sessionId(){
        return this.location.query.session_id;
    }

    localStorageSessionData = remoteData({
        invoke: () => {
            if (this.sessionId) {
                const p = new Promise((resolve) => {
                    setTimeout(() => {
                        resolve()
                    }, 0);
                });
                return p;
            } else {
                return Promise.resolve({});
            }

        },
        onResult:()=>{
            this._session = JSON.parse(localStorage.getItem(getSessionKey(this.location.query.sessionId!))!);
        }
    });

    remoteSessionData = remoteData({
        invoke: async () => {
            let sessionData = await getRemoteSession(this.sessionId);

            // if it has no version, it's a legacy session and needs to be normalized
            if (sessionData.version === undefined) {
                sessionData = normalizeLegacySession(sessionData);
            }

            return sessionData;
        },
        onResult:()=>{
            this._session = {
                id:this.remoteSessionData.result!.id,
                query:this.remoteSessionData.result!.data,
                path:this.location.pathname
            }
        }
    });

    sessionEnabledForPath(path:string){
        const tests = [
          /^\/results/,
        ];
        return _.some(tests,(test)=>test.test(path));
    }

    @action updateRoute(newParams: QueryParams, path = this.location.pathname) {

        let newQuery = _.clone(this.query);

        _.each(newParams, (v, k: string)=>{
            if (v === undefined) {
                delete newQuery[k];
            } else {
                newQuery[k] = v;
            }
        });

        // put a leading slash if there isn't one
        path = URL.resolve('/', path);

        let session:any = null;

        // if we're changing the query AND query meets a certain threshold, switch to session
        if (this.sessionEnabledForPath(path) && _.size(newParams) > 0 && JSON.stringify(newQuery).length > 10) {
            session = {
                id:'pending',
                query:newQuery,
                path:path
            };

            // add session version
            session.query.version = 2;

            this._session = session;

            saveRemoteSession(session.query).then((key)=>{
                this.push( URL.format({pathname: path, query: {session_id:key.id}, hash:this.location.hash}) );
                //localStorage.setItem(getSessionKey(session.id), JSON.stringify(session));
            });

        }

        // if we have a session then we want to push it's id to url
        // otherwise, we are employing url as source of truth, so push real query to it
        const sessionId = (session) ? session.id : (this.location.query.session_id);
        const pushToUrl = sessionId ? {session_id:sessionId} : newQuery;

        this.push( URL.format({pathname: path, query: pushToUrl, hash:this.location.hash}) );
    }

    @observable public _session:PortalSession | null = null;

    @computed
    public get query(){
        if (this.location.query.session_id && this._session) {
            return this._session.query;
        } else {
            return this.location.query;
        }
    }

}
