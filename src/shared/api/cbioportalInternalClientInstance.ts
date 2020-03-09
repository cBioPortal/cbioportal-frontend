import CBioPortalAPIInternal from './generated/CBioPortalAPIInternal';
import { extendCBioPortalAPI } from 'shared/lib/extendCBioPortalAPI';

const ExtendedCBioPortalAPI = extendCBioPortalAPI(CBioPortalAPIInternal);

const internalClient = new ExtendedCBioPortalAPI();

export default internalClient;
