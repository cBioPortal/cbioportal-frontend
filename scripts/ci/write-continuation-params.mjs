#!/usr/bin/env node

const REPO_OWNER = 'cBioPortal';
const REPO_NAME = 'cbioportal-frontend';

try {
    const params = await buildParams();
    process.stdout.write(`${JSON.stringify(params)}\n`);
} catch (error) {
    console.error(
        `[draft-pr-config] continuing with heavy workflows enabled because draft detection failed: ${
            error instanceof Error ? error.message : String(error)
        }`,
    );
    process.stdout.write(
        `${JSON.stringify({
            remote_spec_pattern: process.env.CONT_REMOTE_SPEC_PATTERN,
            localdb_spec_pattern: process.env.CONT_LOCALDB_SPEC_PATTERN,
            enable_remote_e2e: parseBoolean(process.env.CONT_ENABLE_REMOTE_E2E),
            enable_localdb_e2e: parseBoolean(
                process.env.CONT_ENABLE_LOCALDB_E2E,
            ),
            manual_trigger_branch_env:
                process.env.CONT_MANUAL_TRIGGER_BRANCH_ENV || 'master',
            run_heavy_jobs: true,
            show_draft_notice: false,
        })}\n`,
    );
}

async function buildParams() {
    const override = process.env.CI_DRAFT_PR_STATE;
    const prNumber = await resolvePullRequestNumber();
    const isDraft =
        override === 'draft'
            ? true
            : override === 'ready'
              ? false
              : prNumber
                ? await isDraftPullRequest(prNumber)
                : false;

    if (override === 'draft') {
        console.error(
            '[draft-pr-config] CI_DRAFT_PR_STATE=draft override detected; heavy workflows will be omitted',
        );
    } else if (override === 'ready') {
        console.error(
            '[draft-pr-config] CI_DRAFT_PR_STATE=ready override detected; heavy workflows remain enabled',
        );
    } else if (isDraft) {
        console.error(
            `[draft-pr-config] draft PR #${prNumber} detected; heavy workflows will be omitted`,
        );
    } else if (prNumber) {
        console.error(
            `[draft-pr-config] PR #${prNumber} is ready for review; heavy workflows remain enabled`,
        );
    } else {
        console.error(
            '[draft-pr-config] not a pull-request pipeline; heavy workflows remain enabled',
        );
    }

    return {
        remote_spec_pattern: process.env.CONT_REMOTE_SPEC_PATTERN,
        localdb_spec_pattern: process.env.CONT_LOCALDB_SPEC_PATTERN,
        enable_remote_e2e: parseBoolean(process.env.CONT_ENABLE_REMOTE_E2E),
        enable_localdb_e2e: parseBoolean(
            process.env.CONT_ENABLE_LOCALDB_E2E,
        ),
        manual_trigger_branch_env:
            process.env.CONT_MANUAL_TRIGGER_BRANCH_ENV || 'master',
        run_heavy_jobs: !isDraft,
        show_draft_notice: isDraft,
    };
}

async function resolvePullRequestNumber() {
    if (process.env.CIRCLE_PR_NUMBER) {
        return process.env.CIRCLE_PR_NUMBER;
    }

    const pullRequestUrl = process.env.CIRCLE_PULL_REQUEST;
    if (pullRequestUrl) {
        const match = pullRequestUrl.match(/\/pull\/(\d+)/);
        if (match) {
            return match[1];
        }
    }

    const branch = process.env.CIRCLE_BRANCH;
    if (!branch) {
        return null;
    }

    const pulls = await githubJson(
        `/repos/${REPO_OWNER}/${REPO_NAME}/pulls?state=open&head=${REPO_OWNER}:${encodeURIComponent(branch)}`,
    );

    if (!Array.isArray(pulls) || pulls.length === 0) {
        return null;
    }

    return String(pulls[0].number);
}

async function isDraftPullRequest(prNumber) {
    const pr = await githubJson(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}`);
    return !!pr?.draft;
}

async function githubJson(path) {
    const response = await fetch(`https://api.github.com${path}`, {
        headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'cbioportal-frontend-draft-pr-config',
        },
    });

    if (!response.ok) {
        throw new Error(
            `GitHub API ${path} failed with ${response.status} ${response.statusText}`,
        );
    }

    return response.json();
}

function parseBoolean(value) {
    return value === 'true';
}
