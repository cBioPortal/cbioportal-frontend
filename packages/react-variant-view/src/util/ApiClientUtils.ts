import { GenomeNexusAPI } from 'genome-nexus-ts-api-client';
import { OncoKbAPI } from 'oncokb-ts-api-client';

// TODO customize domain?
export const genomeNexusDomain = 'https://www.genomenexus.org/';
const genomeNexusInternalClient = new GenomeNexusAPI(genomeNexusDomain);

export function getGenomeNexusClient() {
    return genomeNexusInternalClient;
}

// TODO This is not a good way
const oncokbClient = new OncoKbAPI('https://www.cbioportal.org/proxy/oncokb');

export function getOncokbClient() {
    return oncokbClient;
}
