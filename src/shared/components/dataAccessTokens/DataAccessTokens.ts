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
        const result = Promise.resolve(client.createDataAccessTokenUsingPOST({'allowRevocationOfOtherTokens':true}));
        console.log(result);
        return "mytoken-" + username;
    } else {
        return "undefined username";
    }
}
