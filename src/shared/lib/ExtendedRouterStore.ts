import { RouterStore } from 'mobx-react-router';
import {action, computed, observable, runInAction} from 'mobx';
import * as _ from 'lodash';
import URL, {QueryParams} from 'url';
import {remoteData} from "../api/remoteData";
import sessionClient from "../api/sessionServiceInstance";
import AppConfig from "appConfig";
import {ServerConfigHelpers} from "../../config/config";
import hashString from "./hashString";

export function getSessionKey(hash:string){
    return `session_${hash}`
}

export interface PortalSession {
    id:string;
    query:{ [key:string] : any };
    path:string;
    version:number;
}

function saveRemoteSession(data:any){
    const dataCopy = Object.assign({}, data);
    delete dataCopy[""]; // artifact of mobx RouterStore URL serialization, when theres & at end of URL, which breaks session service
    return sessionClient.saveSession(dataCopy);
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

export enum QueryParameter {
    GENE_LIST="gene_list",
    Z_SCORE_THRESHOLD="Z_SCORE_THRESHOLD",
    RPPA_SCORE_THRESHOLD="RPPA_SCORE_THRESHOLD",
    CANCER_STUDY_LIST="cancer_study_list",
    CASE_IDS="case_ids",
    CASE_SET_ID="case_set_id",
    GENE_SET_CHOICE="gene_set_choice",
    GENETIC_PROFILE_IDS="genetic_profile_ids",
    CANCER_STUDY_ID="cancer_study_id",
    DATA_PRIORITY="data_priority",
    GENESET_LIST="geneset_list",
    TREATMENT_LIST="treatment_list",
    TAB_INDEX="tab_index",
    TRANSPOSE_MATRIX="transpose_matrix",
    ACTION="Action"
}

export default class ExtendedRouterStore extends RouterStore {


    _urlLengthThresholdForSession:number;

    public saveRemoteSession = saveRemoteSession;

    public getRemoteSession = getRemoteSession;

    public sessionVersion = 2;

    // this has to be computed to avoid annoying problem where
    // remoteSessionData fires every time new route is pushed, even
    // if sessionId has stayed the same
    @computed get session_id(){
        return this.location.query.session_id;
    }

    public get urlLengthThresholdForSession():number {
        return this._urlLengthThresholdForSession || parseInt(AppConfig.serverConfig.session_url_length_threshold,10);
    }

    public set urlLengthThresholdForSession(val:number) {
        this._urlLengthThresholdForSession = val;
    }

    @computed get needsRemoteSessionLookup(){
        if (!ServerConfigHelpers.sessionServiceIsEnabled()) {
            return false;
        }
        const needsRemoteSessionLookup = this.session_id !== undefined && this.session_id !== "pending"
            && (this._session === undefined || (this._session.id !== this.session_id));
        return needsRemoteSessionLookup;
    }

    remoteSessionData = remoteData({
        invoke: async () => {
            if (this.session_id && this.session_id !== "pending") {
                let sessionData = await this.getRemoteSession(this.session_id);

                // if it has no version, it's a legacy session and needs to be normalized
                if (sessionData.version === undefined) {
                    sessionData = normalizeLegacySession(sessionData);
                }

                return sessionData;
            } else {
                return undefined;
            }

        },
        onResult:()=> {
            if (this.remoteSessionData.result) {
                // we have to do this because session service attaches
                // other data to response
                this._session = {
                    id: this.remoteSessionData.result!.id,
                    query: this.remoteSessionData.result!.data,
                    path: this.location.pathname,
                    version:this.remoteSessionData.result!.version
                };
            } else {
                if (this._session && this._session.id !== "pending") delete this._session;
            }
        }
    });

    sessionEnabledForPath(path:string){
        const tests = [
          /^\/results/,
        ];
        return _.some(tests,(test)=>test.test(path));
    }

    @action updateRoute(newParams: QueryParams, path:string | undefined = undefined, clear = false, replace = false) {
        // default to current path
        path = (path !== undefined) ? path : this.location.pathname;

        // if we're not clearing, we want to merge newParams onto existing query
        // but if we're clearing, we want to use newParams ONLY and wipe out existing query;
        let newQuery:any;
        if (!clear) {
            newQuery = _.clone(this.query);
            _.each(newParams, (v, k: string) => {
                if (v === undefined) {
                    delete newQuery[k];
                } else {
                    newQuery[k] = v;
                }
            });
        } else {
            newQuery = newParams;
        }

        // put a leading slash if there isn't one
        path = URL.resolve('/', path);

        // we don't use session
        if (!ServerConfigHelpers.sessionServiceIsEnabled() || !this.sessionEnabledForPath(path) || JSON.stringify(newQuery).length < this.urlLengthThresholdForSession){
            // if there happens to be session, kill it because we're going URL, baby
            delete this._session;
            this[replace ? "replace" : "push"]( URL.format({pathname: path, query: newQuery, hash:this.location.hash}) );
        } else {
            // we are using session: do we need to make a new session?

            if (!this._session || !_.isEqual(this._session.query,newQuery) || _.size(newParams) > 0) {
                const pendingSession = {
                    id:'pending',
                    query:newQuery,
                    path:path,
                    version:this.sessionVersion
                };
                // add session version
                this._session = pendingSession;

                this[replace ? "replace" : "push"]( URL.format({pathname: path, query: { session_id:'pending'}, hash:this.location.hash}) );
                this.saveRemoteSession(pendingSession.query).then((sessionResponse)=>{
                    this._session!.id = sessionResponse.id;
                    // we use replace because we don't want the pending state ("?session_id=pending") in the history
                    // we need to use `this.location.pathname` instead of `path` as the "pathname" parameter because
                    //  in the meantime the user (more likely, the E2E test runner) could have navigated to a different
                    //  tab and thus changed the path. If we used `path`, we'd be bringing them back to the
                    //  tab they were at when the session saving was initiated. We don't care about the
                    //  fact that this overwrites their history of that original tab, because this would likely go
                    //  so quickly that they wouldn't miss that in their history anyway.
                    this.replace( URL.format({pathname: this.location.pathname, query: {session_id:sessionResponse.id}, hash:this.location.hash}) );
                });
            } else { // we already have a session but we only need to update path or hash
                this[replace ? "replace" : "push"]( URL.format({pathname: path, query: {session_id:this._session.id}, hash:this.location.hash}) );
            }
        }

    }

    @observable public _session:PortalSession | undefined;

    @computed
    public get query(){
        // this allows url based query to override a session (if sessionId has been cleared in url)
        if (this._session && this.location.query.session_id) {
            return this._session.query;
        } else {
            return this.location.query;
        }
    }

    @computed
    public get queryHash():string {
        // hash representation of current query
        return hashString(JSON.stringify(this.query)).toString();
    }

}
