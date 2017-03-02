import CBioPortalAPI from "./generated/CBioPortalAPI";
const client = new CBioPortalAPI(`//${(window as any)['__API_ROOT__']}`);
export default client;
