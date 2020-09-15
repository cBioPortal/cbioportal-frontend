import { CBioPortalAPI } from 'cbioportal-ts-api-client';
import { addErrorHandlingtoAPIClient } from 'shared/lib/addErrorHandlingtoAPIClient';

const ExtendedCBioPortalAPI = addErrorHandlingtoAPIClient(CBioPortalAPI);

const client = new ExtendedCBioPortalAPI();

export default client;
