import * as React from "react";
import { DataAccessToken } from "../../../shared/api/generated/CBioPortalAPI";
import * as _ from 'lodash';
import * as request from "superagent";
import client from "shared/api/cbioportalClientInstance";
import {remoteData} from "shared/api/remoteData";

export interface IDataAccessTokensProps {
    dataAccessToken?: DataAccessToken;
}

export function getDataAccessTokens(username: string | undefined): string {
    if (_.isString(username)) {
        var token : Promise<string>;
        const result = Promise.resolve(
            client.createDataAccessTokenUsingPOST(
                {'allowRevocationOfOtherTokens':true}));
        console.log(result);
        token = result.then(function(response) {
            return response.token as string;
        });
        console.log(token);
        return "mytoken-" + username;
    } else {
        return "undefined username";
    }
}
