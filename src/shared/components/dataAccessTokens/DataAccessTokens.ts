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
    const tokenValue = tokens.token.toString();
    return tokenValue;
}
export async function getDataAccessTokens(username: string | undefined) {
    if (_.isString(username)) {
        let result = await Promise.resolve(
            client.createDataAccessTokenUsingPOST(
                {'allowRevocationOfOtherTokens':true}));
        console.log("---------RESULT AS AWAIT CALL--------");
        console.log(result);

        console.log("------- RESULT PARSED AS STRING FROM AWAIT CALL -------");
        console.log(result.token.toString());

        var myToken = await getUserToken();
        console.log("-------RESULT AS AWAIT FUNCTION--------");
        console.log(myToken);

        return myToken.toString();
    } else {
        return "undefined username";
    }
}
