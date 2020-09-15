import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import { addErrorHandlingtoAPIClient } from 'shared/lib/addErrorHandlingtoAPIClient';

const ExtendedCBioPortalAPI = addErrorHandlingtoAPIClient(
    CBioPortalAPIInternal
);

const internalClient = new ExtendedCBioPortalAPI();

export default internalClient;
