const NetlifyAPI = require('netlify');

const SITE_ID = 'c1e6c264-2677-4c6d-b283-b949d7489b9a';

const TOKEN = process.env.NETLIFY_API_KEY || '';

async function findDeployId(search) {
    const client = new NetlifyAPI(TOKEN);

    const sites = await client.listSiteDeploys({ site_id: SITE_ID });
    const matching = sites.find(s => s.commit_ref.includes(search));

    return matching ? matching.id : undefined;
}

async function main() {
    const args = process.argv;
    const search = args.length > 2 ? args[2] : undefined;
    const deployId = search ? await findDeployId(search) : undefined;

    if (!deployId) {
        // exit with a non-zero value to indicate error
        process.exit(1);
    }

    // output the result to stdout
    console.log(deployId);
}

main();
