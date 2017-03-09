import CBioPortalAPI from "./generated/CBioPortalAPI";
import {getCbioPortalApiUrl} from "./urls";

const client = new CBioPortalAPI(getCbioPortalApiUrl());
export default client;
