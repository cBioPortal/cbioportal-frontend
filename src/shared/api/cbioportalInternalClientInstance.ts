import CBioPortalAPIInternal from "./generated/CBioPortalAPIInternal";
const internalClient = new CBioPortalAPIInternal(`//${(window as any)['__API_ROOT__']}`);
export default internalClient;
