import { CBioPortalAPI } from 'cbioportal-ts-api-client';

const client = new CBioPortalAPI();

export function getClient() {
    return client;
}

export default client;
