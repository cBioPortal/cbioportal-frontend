import * as React from "react";
import AppConfig from "appConfig";
import {If, Then, Else} from 'react-if';
import internalClient from "shared/api/cbioportalInternalClientInstance";
import {AppStore} from "../../../AppStore";
import LoadingIndicator from "../loadingIndicator/LoadingIndicator";
import {observer} from "mobx-react";
import {observable} from "mobx";
import {buildCBioPortalPageUrl} from "../../api/urls";
import {isNullOrUndefined} from "util";
import fileDownload from 'react-file-download';

export class UserDataAccessToken {
    @observable token : string;
    @observable creationDate: string;
    @observable expirationDate: string;
    @observable username: string;
    constructor(token: string, creationDate: string, expirationDate: string, username: string) {
        this.token = token;
        this.creationDate = creationDate;
        this.expirationDate = expirationDate;
        this.username = username;
    }
}

export interface IDataAccessTokensProps {
    token?:string;
    creationDate?:string;
    expirationDate?:string;
    loadingComponent?:JSX.Element;
    appStore:AppStore;
}

function buildDataAccessTokenFileContents(dat:UserDataAccessToken | undefined) {
    if (!isNullOrUndefined(dat)) {
        const fileContents = "token: " + dat!.token + "\n" +
            "creation_date: " + new Date(dat!.creationDate).toISOString()+ "\n" +
            "expiration_date: " + new Date(dat!.expirationDate).toISOString();
        return fileContents;
    } else {
        alert("Cannot create Data Access Token file for user with non-existent tokens.");
        return null;
    }
}

@observer
export class DataAccessTokens extends React.Component<IDataAccessTokensProps, {}> {
    public static defaultProps: Partial<IDataAccessTokensProps> = {
        loadingComponent:<LoadingIndicator isLoading={true}/>
    };

    constructor(props: IDataAccessTokensProps) {
        super(props);
    }

    getDatDropdownList() {
        const listItems = [
            {
                id:"signout",
                action:<a href={buildCBioPortalPageUrl(this.props.appStore.logoutUrl)}>Sign out</a>,
                hide:false
            },
            {
                id:"datDownload",
                action:<a onClick={() => this.downloadDataAccessTokenFile()}>Download token</a>,
                hide:(AppConfig.serverConfig.authenticationMethod === "social_auth" || (AppConfig.serverConfig.dat_method !== "uuid" && AppConfig.serverConfig.dat_method !== "jwt"))
            }
        ];
        const shownListItems = listItems.filter((l)=>{
            return !l.hide;
        });

        return shownListItems.map((l)=>{
            return <li>{l.action}</li>;
        });
    }

    async downloadDataAccessTokenFile() {
        const dat = await this.generateNewDataAccessToken();
        if (!isNullOrUndefined(dat)) {
            const fileContents = buildDataAccessTokenFileContents(dat);
            fileDownload(fileContents, "cbioportal_data_access_token.txt");
        }
    }

    async generateNewDataAccessToken() {
        if (this.props.appStore.isLoggedIn) {
            let _token = await Promise.resolve(
                internalClient.createDataAccessTokenUsingPOST(
                    {'allowRevocationOfOtherTokens':AppConfig.serverConfig.dat_uuid_revoke_other_tokens}))
            const dat = new UserDataAccessToken(_token.token, _token.creation, _token.expiration, _token.username);
            return dat;
        } else {
            return undefined;
        }
    }

    render(){
        return(
        <ul className="list-unstyled">
            {
                this.getDatDropdownList()
            }
        </ul>
        );
    }
}
