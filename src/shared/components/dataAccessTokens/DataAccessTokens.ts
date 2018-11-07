import * as React from "react";
import { DataAccessToken } from "../../../shared/api/generated/CBioPortalAPI";
import * as _ from 'lodash';
import * as request from "superagent";
import client from "shared/api/cbioportalClientInstance";
import {remoteData} from "shared/api/remoteData";


let userTokenValue : string;

export interface IDataAccessTokensProps {
    dataAccessToken: DataAccessToken;
}
async function getUserToken() {
    // must use await otherwise will return a promise instead of expected object
    let tokens = await Promise.resolve(
        client.createDataAccessTokenUsingPOST(
            {'allowRevocationOfOtherTokens':true}));
    const tokenValue = tokens.token.toString();
    console.log("-----ASYNC TOKEN VALUE AS .TOSTRING----");
    console.log(tokenValue);
    console.log("------ASYNC TOKEN VALUE AS VALUE OF ----");
    console.log(tokenValue.valueOf());
    console.log("------ASYNC TOKEN VALUE AS VALUE OF and TOSTRING----");
    console.log(tokenValue.valueOf().toString());
    userTokenValue = tokenValue;
    return tokenValue;
}
export async function getDataAccessTokens(username: string | undefined) {
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

        var myToken = await getUserToken();
        console.log("-------RESULT AS AWAIT FUNCTION--------");
        console.log(myToken);

        console.log("-------PARSED USER TOKEN VALUE-----------");
        console.log(myToken.toString());


        return myToken.toString();
    } else {
        return "undefined username";
    }
}
