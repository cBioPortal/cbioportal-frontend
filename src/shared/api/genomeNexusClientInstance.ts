import { GenomeNexusAPI } from 'genome-nexus-ts-api-client';

async function checkVersion(client: GenomeNexusAPI) {
    const versionResp = await client.fetchVersionGET({});
    if (parseInt(versionResp.version.split('.')[0]) !== 1) {
        console.error(
            'Expected version of Genome Nexus to be 1.x.y, but found: ' +
                versionResp.version
        );
    }
}

const client = new GenomeNexusAPI();
//checkVersion(client);

export default client;
