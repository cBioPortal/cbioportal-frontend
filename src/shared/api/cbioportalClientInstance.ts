import { CBioPortalAPI } from 'cbioportal-ts-api-client';
import { addErrorHandlingtoAPIClient } from 'cbioportal-utils';

const ExtendedCBioPortalAPI = addErrorHandlingtoAPIClient(CBioPortalAPI);

const client = new ExtendedCBioPortalAPI();

export default client;
