#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const jobName = process.argv[2] ?? 'job';
const REPO_OWNER = 'cBioPortal';
const REPO_NAME = 'cbioportal-frontend';

try {
    await main();
} catch (error) {
    log(
        `${jobName} kept because draft detection failed: ${
            error instanceof Error ? error.message : String(error)
        }`,
    );
}

async function main() {
    const override = process.env.CI_DRAFT_PR_STATE;
    if (override === 'draft') {
        skipJob(`${jobName} skipped because CI_DRAFT_PR_STATE=draft.`);
        return;
    }
    if (override === 'ready') {
        log(`${jobName} kept because CI_DRAFT_PR_STATE=ready.`);
        return;
    }

    const prNumber = await resolvePullRequestNumber();
    if (!prNumber) {
        log(`${jobName} kept because this is not a pull-request build.`);
        return;
    }

    const pr = await githubJson(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}`);
    if (!pr || typeof pr.draft !== 'boolean') {
        log(`${jobName} kept because draft state could not be determined.`);
        return;
    }

    if (pr.draft) {
        skipJob(`${jobName} skipped because PR #${prNumber} is still a draft.`);
        return;
    }

    log(`${jobName} kept because PR #${prNumber} is ready for review.`);
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

async function githubJson(path) {
    const response = await fetch(`https://api.github.com${path}`, {
        headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'cbioportal-frontend-draft-pr-guard',
        },
    });

    if (!response.ok) {
        throw new Error(
            `GitHub API ${path} failed with ${response.status} ${response.statusText}`,
        );
    }

    return response.json();
}

function skipJob(reason) {
    log(reason);

    if (!process.env.CIRCLECI) {
        return;
    }

    const result = spawnSync('circleci-agent', ['step', 'halt'], {
        stdio: 'inherit',
    });

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function log(message) {
    console.log(`[draft-pr-guard] ${message}`);
}
