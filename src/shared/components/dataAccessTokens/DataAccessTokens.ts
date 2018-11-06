import * as React from "react";
import { DataAccessToken } from "../../../shared/api/generated/CBioPortalAPI";
import * as _ from 'lodash';
import client from "shared/api/cbioportalClientInstance";
import {remoteData} from "shared/api/remoteData";

export interface IDataAccessTokensProps {
    dataAccessToken?: DataAccessToken;
}

const userAccessToken = remoteData<DataAccessToken>({
    await: () => [
        this.dataAccessToken
    ],
    invoke: async () => {
        const result = await client.getUserDataAccessTokenUsingPOSTUrl({'allowRevocationOfOtherTokens': true});
        this.dataAccessToken = Promise.resolve(result);
        return Promise.resolve(result);
    }
});

export function getDataAccessTokens(username: string | undefined): string {
    if (_.isString(username)) {
        return this.userAccessToken.result.token;
    } else {
        return "undefined username";
    }
}
