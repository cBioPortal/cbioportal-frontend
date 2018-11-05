import {computed, observable} from "mobx";
import {initializeAPIClients} from "./config/config";
import * as _ from 'lodash';

export class AppStore {

    @observable userName:string | undefined;

    @observable authMethod:string | undefined;

    @computed get isLoggedIn(){
        return _.isString(this.userName) && this.userName !== "anonymousUser"
    }

    @computed get logoutUrl(){
        if (this.authMethod === "saml") {
            return "/saml/logout";
        } else {
            return "j_spring_security_logout"
        }
    }

}