import { RouterStore } from 'mobx-react-router';
import {action, computed, observable, runInAction} from 'mobx';
import * as _ from 'lodash';
import URL, {QueryParams} from 'url';
import {remoteData} from "../api/remoteData";

export function getSessionKey(hash:string){
    return `session_${hash}`
}

export interface PortalSession {
    id:string;
    query:{ [key:string] : any };
    path:string;
}


export default class ExtendedRouterStore extends RouterStore {

    // this has to be computed to avoid annoying problem where
    // remoteSessionData fires every time new route is pushed, even
    // if sessionId has stayed the same
    @computed get sessionId(){
        return this.location.query.sessionId;
    }

    remoteSessionData = remoteData({
        invoke: () => {
            if (this.sessionId) {
                console.log("fetching session");
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
                id:Date.now(),
                query:newQuery,
                path:path
            };
            this._session = session;
            localStorage.setItem(getSessionKey(session.id), JSON.stringify(session));
        }

        // if we have a session then we want to push it's id to url
        // otherwise, we are employing url as source of truth, so push real query to it
        const sessionId = (session) ? session.id : (this.location.query.sessionId);
        const pushToUrl = sessionId ? {sessionId:sessionId} : newQuery;

        this.push( URL.format({pathname: path, query: pushToUrl, hash:this.location.hash}) );
    }

    //@observable public _query = undefined;
    @observable public _session:PortalSession | null = null;

    @computed
    public get query(){
        if (this.location.query.sessionId && this._session) {
            return this._session.query;
        } else {
            return this.location.query;
        }
    }

}
