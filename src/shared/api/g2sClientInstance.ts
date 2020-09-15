import {
    Genome2StructureAPI,
    GenomeNexusAPI,
} from 'genome-nexus-ts-api-client';
import { addErrorHandlingtoAPIClient } from 'shared/lib/addErrorHandlingtoAPIClient';

const ExtendedGenome2StructureAPI = addErrorHandlingtoAPIClient(
    Genome2StructureAPI
);

const client = new ExtendedGenome2StructureAPI();

client.defaultError = function(error: any) {
    // try to derive url
    return {
        mode: 'screen',
        title: `There has been an error retrieving data from the GenomeNexus api`,
    };
};

export default client;
