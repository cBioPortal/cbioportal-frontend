import * as React from "react";
import {DataAccessToken} from "../../../shared/api/generated/CBioPortalAPI";

export interface IDataAccessTokensProps {
    dataAccessToken?: DataAccessToken;
}
export function getDataAccessTokens(username:string){
    return "myDataAccessToken2" + username;
}
