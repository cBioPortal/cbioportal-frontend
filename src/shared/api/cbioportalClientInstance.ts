import CBioPortalAPI from "./generated/CBioPortalAPI";
import {proxyAllPostMethodsOnClient, proxyPost} from "../lib/proxyPost";

const client = new CBioPortalAPI();

export default client;
