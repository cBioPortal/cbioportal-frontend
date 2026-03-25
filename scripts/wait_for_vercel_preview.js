const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || '';

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function getDeployments(sha) {
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
    return data.deployments || [];
}

async function waitForVercelDeployment(sha) {
    let state = 'pending';
    // Allow some retries when no deployment is found yet, as Vercel may
    // not have created the deployment immediately after the push.
    let notFoundRetries = 10;

    while (state === 'pending') {
        const deployments = await getDeployments(sha);
        const matching = deployments[0];

        if (!matching) {
            if (notFoundRetries > 0) {
                notFoundRetries--;
                const waitSec = 20;
                console.log(
                    `No deployment found for ${sha}. Retrying in ${waitSec} seconds (${notFoundRetries} retries remaining).`
                );
                await sleep(waitSec * 1000);
            } else {
                state = 'not found';
            }
        } else if (
            matching.state === 'ERROR' ||
            matching.state === 'CANCELED'
        ) {
            state = 'error';
        } else if (matching.state === 'READY') {
            state = 'ready';
        } else {
            const waitSec = 20;

            console.log(
                `Deploy ${sha} is ${matching.state}. Waiting for ${waitSec} seconds before polling again.`
            );
            await sleep(waitSec * 1000);
        }
    }

    return state;
}

async function main() {
    const args = process.argv;
    const search = args.length > 2 ? args[2] : undefined;
    const state = search ? await waitForVercelDeployment(search) : undefined;

    console.log(`Deploy ${search} ${state}`);

    if (state !== 'ready') {
        // exit with a non-zero value to indicate error
        process.exit(1);
    }
}

main();
