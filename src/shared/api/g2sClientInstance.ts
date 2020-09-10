import {
    Genome2StructureAPI,
    GenomeNexusAPI,
} from 'genome-nexus-ts-api-client';
import { extendCBioPortalAPI } from 'shared/lib/extendCBioPortalAPI';

const ExtendedGenome2StructureAPI = extendCBioPortalAPI(Genome2StructureAPI);

const client = new ExtendedGenome2StructureAPI();

client.defaultError = function(error: any) {
    // try to derive url
    return {
        mode: 'screen',
        title: `There has been an error retrieving data from the GenomeNexus api`,
    };
};

export default client;
