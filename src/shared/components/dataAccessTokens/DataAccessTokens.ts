import * as React from "react";
import { DataAccessToken } from "../../../shared/api/generated/CBioPortalAPI";
import * as _ from 'lodash';
import * as request from "superagent";
import client from "shared/api/cbioportalClientInstance";
import {remoteData} from "shared/api/remoteData";

export interface IDataAccessTokensProps {
    dataAccessToken: DataAccessToken;
}
async function getUserToken() {
    // must use await otherwise will return a promise instead of expected object
    let tokens = await Promise.resolve(
        client.createDataAccessTokenUsingPOST(
            {'allowRevocationOfOtherTokens':true}));
    return tokens.token;
}
export function getDataAccessTokens(username: string | undefined) {
    if (_.isString(username)) {
        var token : Promise<string>;
        const result = Promise.resolve(
            client.createDataAccessTokenUsingPOST(
                {'allowRevocationOfOtherTokens':true}));
        console.log("RESULT AS PROMISE");
        console.log(result);


        token = result.then(function(response) {
            return response.token as string;
        });
        console.log("-------TOKEN AS PROMISE--------");
        console.log(token);


        console.log("-------RESULT AS AWAIT FUNCTION--------");
        console.log(getUserToken());

        return getUserToken();
    } else {
        return "undefined username";
    }
}
