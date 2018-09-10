import CBioPortalAPI from "./generated/CBioPortalAPI";
import {proxyPost} from "../lib/proxyPost";

const client = new CBioPortalAPI();

proxyPost(client, "fetchGenePanelDataInMultipleMolecularProfilesUsingPOST");

export default client;
