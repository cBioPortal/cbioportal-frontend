import CBioPortalAPIInternal from "./CBioPortalAPIInternal";
const client = new CBioPortalAPIInternal(`//${(window as any)['__API_ROOT__']}`);
export default client;
