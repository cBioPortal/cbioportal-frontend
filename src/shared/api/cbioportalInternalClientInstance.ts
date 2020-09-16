import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import { addErrorHandlingtoAPIClient } from 'cbioportal-utils';

const ExtendedCBioPortalAPI = addErrorHandlingtoAPIClient(
    CBioPortalAPIInternal
);

const internalClient = new ExtendedCBioPortalAPI();

export default internalClient;
