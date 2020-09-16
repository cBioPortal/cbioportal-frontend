import {
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';
import { addErrorHandlingtoAPIClient } from 'cbioportal-utils';

export const ExtendedGenomeNexusAPIInternal = addErrorHandlingtoAPIClient(
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
