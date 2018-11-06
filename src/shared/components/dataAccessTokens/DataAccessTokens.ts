import * as React from "react";
import {DataAccessToken} from "../../../shared/api/generated/CBioPortalAPI";
import * as _ from 'lodash';

export interface IDataAccessTokensProps {
    dataAccessToken?: DataAccessToken;
}
export function getDataAccessTokens(username: string | undefined): string {
    if (_.isString(this.userName)) {
        return "myDataAccessToken" + username;
    } else {
        return "undefined username";
    }
}
