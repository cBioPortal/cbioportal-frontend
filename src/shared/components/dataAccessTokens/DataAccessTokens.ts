import * as React from "react";
import { DataAccessToken } from "../../../shared/api/generated/CBioPortalAPI";
import * as _ from 'lodash';
import client from "shared/api/cbioportalClientInstance";
import {remoteData} from "shared/api/remoteData";

export interface IDataAccessTokensProps {
    dataAccessToken?: DataAccessToken;
    userToken ? : string;
}

export function userAccessTokenPromise() : Promise <DataAccessToken> {
    return Promise.resolve(client.getUserDataAccessTokenUsingPOSTUrl({'allowRevocationOfOtherTokens': true}));
}
export function getDataAccessTokens(username: string | undefined): string {
    if (_.isString(username)) {
        const result =  userAccessTokenPromise().then(function(response) {
            this.dataAccessToken = response;
            this.userToken = response.token.toString();
            console.log(response.token);
        });
        return this.userToken;
    } else {
        return "undefined username";
    }
}
