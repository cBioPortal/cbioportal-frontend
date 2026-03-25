const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || '';

async function findDeployUrl(sha) {
    const params = new URLSearchParams({ limit: '5' });
    params.append('meta-githubCommitSha', sha);
    if (VERCEL_TEAM_ID) {
        params.append('teamId', VERCEL_TEAM_ID);
    }

    const response = await fetch(
        `https://api.vercel.com/v6/deployments?${params}`,
        {
            headers: {
                Authorization: `Bearer ${VERCEL_TOKEN}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(
            `Vercel API error: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();
    const deployment = data.deployments?.[0];
    return deployment ? `https://${deployment.url}` : undefined;
}

function isMasterBranch(branch) {
    return branch && branch.toLowerCase() === 'master';
}

async function main() {
    const args = process.argv;
    const search = args.length > 2 ? args[2] : undefined;
    const branch = args.length > 3 ? args[3] : undefined;
    let deployUrl = search ? await findDeployUrl(search) : undefined;

    if (!deployUrl) {
        if (isMasterBranch(branch)) {
            // 'master' is a special sentinel value indicating the caller should
            // fall back to using the production/master branch deployment.
            deployUrl = 'master';
        } else {
            // exit with a non-zero value to indicate error
            process.exit(1);
        }
    }

    // output the result to stdout
    console.log(deployUrl);
}

main();
