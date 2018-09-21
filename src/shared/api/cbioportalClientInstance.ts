import CBioPortalAPI from "./generated/CBioPortalAPI";
import {proxyAllPostMethodsOnClient, proxyPost} from "../lib/proxyPost";

const client = new CBioPortalAPI();

proxyAllPostMethodsOnClient(CBioPortalAPI);

export default client;
