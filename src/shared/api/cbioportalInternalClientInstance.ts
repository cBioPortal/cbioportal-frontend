import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import { extendCBioPortalAPI } from 'shared/lib/extendCBioPortalAPI';

const ExtendedCBioPortalAPI = extendCBioPortalAPI(CBioPortalAPIInternal);

const internalClient = new ExtendedCBioPortalAPI();

export default internalClient;
