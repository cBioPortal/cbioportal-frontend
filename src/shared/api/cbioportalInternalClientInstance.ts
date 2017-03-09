import CBioPortalAPIInternal from "./generated/CBioPortalAPIInternal";
import {getCbioPortalApiUrl} from "./urls";

const internalClient = new CBioPortalAPIInternal(getCbioPortalApiUrl());
export default internalClient;
