import {action, computed, observable} from "mobx";
import {addServiceErrorHandler, remoteData} from "shared/api/remoteData";
import {initializeAPIClients} from "./config/config";
import * as _ from 'lodash';
import internalClient from "shared/api/cbioportalInternalClientInstance";
import {sendSentryMessage} from "./shared/lib/tracking";
import getBrowserWindow from "./shared/lib/getBrowserWindow";

type SiteError = {
    message:string;
    dismissed?:boolean;
};

export class AppStore {

    constructor(){

        getBrowserWindow().me = this;
        addServiceErrorHandler((error: any) => {
            try{
                sendSentryMessage("ERRORHANDLER:" + error);
            } catch (ex) {};

            if (/Error: 400|Error: 500/.test(error)) {
                sendSentryMessage("ERROR DIALOG SHOWN:" + error);
                this.siteErrors.push({ message:error });
            }
        });
    }

    @observable siteErrors: SiteError[] = [];

    @observable userName:string | undefined;

    @observable authMethod:string | undefined;

    @computed get isLoggedIn(){
        return _.isString(this.userName) && this.userName !== "anonymousUser";
    }

    @computed get logoutUrl(){
        if (this.authMethod === "saml") {
            return "saml/logout";
        } else {
            return "j_spring_security_logout";
        }
    }

    @computed get undismissedSiteErrors(){
        const me =  _.filter(this.siteErrors.slice(), (err)=>!err.dismissed);
        return me;
    }

    @computed get isErrorCondition(){
        return this.undismissedSiteErrors.length > 0;
    }

    @action
    public dismissErrors(){
        this.siteErrors = this.siteErrors.map((err)=>{
           err.dismissed = true;
           return err;
        });
    }

    readonly portalVersion = remoteData<string | undefined>({
        invoke:async()=>{
            const portalVersionResult = await internalClient.getInfoUsingGET({});
            if (portalVersionResult && portalVersionResult.portalVersion) {
                return Promise.resolve("v" + portalVersionResult.portalVersion.split('-')[0]);
            }
            return undefined; 
        }
    });
}