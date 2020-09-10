import { CBioPortalAPI } from 'cbioportal-ts-api-client';
import { AppStore, SiteError } from 'AppStore';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { extendCBioPortalAPI } from 'shared/lib/extendCBioPortalAPI';

const ExtendedCBioPortalAPI = extendCBioPortalAPI(CBioPortalAPI);

const client = new ExtendedCBioPortalAPI();

export default client;
