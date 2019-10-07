import * as React from "react";
import AppConfig from "appConfig";
import { Link } from 'react-router';
import {AppStore} from "../../../AppStore";
import LoadingIndicator from "../loadingIndicator/LoadingIndicator";
import {observer} from "mobx-react";
import {observable, computed} from "mobx";
import {buildCBioPortalPageUrl} from "../../api/urls";

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

@observer
export class DataAccessTokensDropdown extends React.Component<IDataAccessTokensProps, {}> {
    public static defaultProps: Partial<IDataAccessTokensProps> = {
        loadingComponent:<LoadingIndicator isLoading={true}/>
    };

    constructor(props: IDataAccessTokensProps) {
        super(props);
    }

    @computed get getDatDropdownList() : any {
        const listItems = [
            {
                id:"signout",
                action:<a href={buildCBioPortalPageUrl(this.props.appStore.logoutUrl)}>Sign out</a>,
                hide:false
            },
            {
                id:"datDownload",
                action:<Link to="/webAPI#using-data-access-tokens">Data Access Token</Link>,
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

    render(){
        return(
        <ul className="list-unstyled">
            {
                this.getDatDropdownList
            }
        </ul>
        );
    }
}
