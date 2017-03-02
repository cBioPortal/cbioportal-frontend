import CBioPortalAPIInternal from "./generated/CBioPortalAPIInternal";
import AppConfig from 'appConfig';

const internalClient = new CBioPortalAPIInternal(`//${AppConfig.apiRoot}`);
export default internalClient;
