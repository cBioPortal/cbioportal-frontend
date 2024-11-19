import { CBioPortalAPIFederated } from 'cbioportal-ts-api-client';

const federatedClient = new CBioPortalAPIFederated('http://localhost:8080');

export default federatedClient;
