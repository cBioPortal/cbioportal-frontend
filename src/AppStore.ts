import {computed, observable} from "mobx";
import {addErrorHandler, remoteData} from "shared/api/remoteData";
import {initializeAPIClients} from "./config/config";
import * as _ from 'lodash';
import internalClient from "shared/api/cbioportalInternalClientInstance";
import {sendSentryMessage} from "./shared/lib/tracking";


export class AppStore {

    constructor(){
        addErrorHandler((error: any) => {
            try{
                sendSentryMessage("ERRORHANDLER:" + error);
            } catch (ex) {};
            this.ajaxErrors.push(error);
        });
    }

    @observable ajaxErrors: Error[] = [];

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