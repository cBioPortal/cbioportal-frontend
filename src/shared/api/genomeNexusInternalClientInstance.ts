import {
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';
import { extendCBioPortalAPI } from 'shared/lib/extendCBioPortalAPI';

export const ExtendedGenomeNexusAPIInternal = extendCBioPortalAPI(
    GenomeNexusAPIInternal
);

const client = new ExtendedGenomeNexusAPIInternal();

ExtendedGenomeNexusAPIInternal.prototype.defaultError = function(error: any) {
    return {
        mode: 'alert',
        title: `There has been an error retrieving data from the GenomeNexus api`,
    };
};

export default client;
