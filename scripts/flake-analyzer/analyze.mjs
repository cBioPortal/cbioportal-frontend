#!/usr/bin/env node
// Cross-run flake analyzer for cbioportal-frontend's `remote_e2e` job.
//
// Pulls the last N pipelines' merged Playwright results.json from the
// CircleCI artifacts API, summarizes each run's per-test outcomes,
// caches them across CI invocations (via CircleCI's save_cache /
// restore_cache wrapping this directory), then identifies tests that
// pass in some runs and fail in others. For each such "cross-run
// flaky" test, asks Claude to propose a likely cause and a concrete
// fix — output as a markdown report stored as a build artifact.
//
// Read-only: this script never modifies tests or opens PRs. It exists
// to surface a draft analysis for a human reviewer.
//
// Env:
//   ANTHROPIC_API_KEY   required for the LLM analysis step. If unset,
//                       the report still lists detected flakes but
//                       skips the analysis section.
//   CLAUDE_MODEL        override; default 'claude-haiku-4-5'.
//   CIRCLECI_PROJECT    override CircleCI project slug; default
//                       'gh/cBioPortal/cbioportal-frontend'.
//   FLAKE_WINDOW        how many recent runs to consider; default 15.
//   FLAKE_MAX           max flakes to analyze per invocation (token
//                       budget); default 10.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SPEC_ROOT = path.join(REPO_ROOT, 'end-to-end-test-playwright', 'tests');
const CACHE_DIR = path.join(__dirname, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'jobs.json');
const REPORT_FILE = path.join(__dirname, 'flake-report.md');

const CIRCLECI_PROJECT =
  process.env.CIRCLECI_PROJECT ?? 'gh/cBioPortal/cbioportal-frontend';
const REMOTE_E2E_JOB_NAME = 'remote_e2e';
const RESULTS_PATH = 'test-results/results.json';
const WINDOW = Math.max(3, Number(process.env.FLAKE_WINDOW) || 15);
const MAX_FLAKES = Math.max(1, Number(process.env.FLAKE_MAX) || 10);
const MAX_CACHED_JOBS = 50;
const MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function main() {
  // Skip the report entirely when this run's remote_e2e was clean —
  // there's nothing actionable, no point burning API tokens, and the
  // dashboard's "flakes" link should only light up when there's
  // actual flakiness to look at. We DON'T skip for non-success
  // statuses (failed / timed out / etc.) because those are exactly
  // the situations where surfacing recent cross-run flakes is most
  // helpful. Running locally (no CIRCLE_WORKFLOW_ID) always proceeds
  // so the script stays useful for ad-hoc debugging.
  if (process.env.CIRCLE_WORKFLOW_ID) {
    const status = await getThisRunRemoteE2EStatus(process.env.CIRCLE_WORKFLOW_ID);
    if (status === 'success') {
      log("this run's remote_e2e succeeded — skipping flake analysis");
      // Make sure no stale report from a previous build's restored
      // workspace lingers and gets uploaded as our artifact.
      try {
        fs.unlinkSync(REPORT_FILE);
      } catch {
        // file didn't exist — that's the desired state
      }
      return;
    }
    log(`this run's remote_e2e status: ${status ?? 'unknown'} — proceeding with analysis`);
  }

  if (!ANTHROPIC_API_KEY) {
    log('ANTHROPIC_API_KEY not set — detection only, no LLM analysis');
  }
  const cache = loadCache();
  log(`cache: ${Object.keys(cache.jobs).length} jobs already cached`);

  const recent = await listRecentRemoteE2EJobs(WINDOW);
  log(`circleci: ${recent.length} recent remote_e2e jobs in window`);

  const missing = recent.filter((j) => !cache.jobs[j.jobNumber]);
  log(`fetching results.json for ${missing.length} new job(s)`);

  const fetched = await Promise.all(
    missing.map(async (j) => {
      try {
        const summary = await fetchJobSummary(j);
        return { j, summary };
      } catch (err) {
        log(`  ! job ${j.jobNumber}: ${err.message}`);
        return { j, summary: null };
      }
    }),
  );
  for (const { j, summary } of fetched) {
    if (summary) cache.jobs[j.jobNumber] = summary;
  }

  // Trim cache to avoid unbounded growth across CI runs.
  const sortedKeys = Object.keys(cache.jobs)
    .map(Number)
    .sort((a, b) => b - a);
  for (const k of sortedKeys.slice(MAX_CACHED_JOBS)) delete cache.jobs[k];
  saveCache(cache);

  const window = recent
    .map((r) => cache.jobs[r.jobNumber])
    .filter(Boolean)
    .slice(0, WINDOW);

  if (window.length < 3) {
    writeReport({
      message: `Only ${window.length} cached run${
        window.length === 1 ? '' : 's'
      } available — need at least 3 to look for cross-run patterns. The cache will fill in over the next few runs.`,
      flakes: [],
    });
    return;
  }

  const flakes = detectFlakes(window);
  log(`detected ${flakes.length} cross-run flake(s)`);

  const analyzed = [];
  for (const flake of flakes.slice(0, MAX_FLAKES)) {
    log(`  analyzing ${flake.title} (${flake.numFails}f / ${flake.numPasses}p)`);
    const analysis = ANTHROPIC_API_KEY ? await analyzeFlake(flake) : null;
    analyzed.push({ flake, analysis });
  }
  writeReport({ flakes: analyzed, totalDetected: flakes.length });
}

function loadCache() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (!fs.existsSync(CACHE_FILE)) return { jobs: {} };
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    return { jobs: data.jobs ?? {} };
  } catch {
    return { jobs: {} };
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  log(`cache: saved (${Object.keys(cache.jobs).length} jobs)`);
}

// Look up THIS workflow's remote_e2e job and return its current
// status. Used to decide whether the analyzer should run at all.
// Returns null on any API hiccup so the caller can default to "run".
async function getThisRunRemoteE2EStatus(workflowId) {
  try {
    const wf = await getJSON(`https://circleci.com/api/v2/workflow/${workflowId}/job`);
    const remote = (wf.items ?? []).find((j) => j.name === REMOTE_E2E_JOB_NAME);
    return remote?.status ?? null;
  } catch (err) {
    log(`could not read this workflow's job list: ${err.message}`);
    return null;
  }
}

async function listRecentRemoteE2EJobs(targetCount) {
  // Walk pipelines newest-first, collecting matching jobs. The first
  // page (~20 pipelines) is enough on master + active feature branches.
  const found = [];
  const pipelines = await getJSON(
    `https://circleci.com/api/v2/project/${CIRCLECI_PROJECT}/pipeline`,
  );
  for (const p of pipelines.items ?? []) {
    if (found.length >= targetCount) break;
    let workflows;
    try {
      workflows = await getJSON(`https://circleci.com/api/v2/pipeline/${p.id}/workflow`);
    } catch {
      continue;
    }
    for (const w of workflows.items ?? []) {
      if (found.length >= targetCount) break;
      let jobs;
      try {
        jobs = await getJSON(`https://circleci.com/api/v2/workflow/${w.id}/job`);
      } catch {
        continue;
      }
      for (const j of jobs.items ?? []) {
        if (found.length >= targetCount) break;
        if (j.name !== REMOTE_E2E_JOB_NAME) continue;
        if (!j.job_number) continue;
        if (['running', 'queued', 'not_run'].includes(j.status)) continue;
        found.push({
          jobNumber: j.job_number,
          status: j.status,
          pipelineNumber: p.number,
          branch: p.vcs?.branch ?? '',
          revision: p.vcs?.revision ?? '',
          commitSubject: ((p.vcs?.commit?.subject ?? '').split('\n')[0]).slice(0, 100),
          startedAt: j.started_at ?? p.created_at,
        });
      }
    }
  }
  return found;
}

async function fetchJobSummary(job) {
  const arts = await getJSON(
    `https://circleci.com/api/v2/project/${CIRCLECI_PROJECT}/${job.jobNumber}/artifacts`,
  );
  const target = (arts.items ?? []).find((a) => a.path === RESULTS_PATH);
  if (!target) return null;
  const data = await getJSON(target.url, { redirect: 'follow' });

  const tests = {};
  const walk = (node) => {
    for (const spec of node.specs ?? []) {
      const t = spec.tests?.[0];
      if (!t || !spec.id) continue;
      const status = classify(t);
      const entry = {
        status,
        title: spec.title,
        file: spec.file,
        line: spec.line,
      };
      // Save short error snippet only for failure-shaped outcomes.
      if (status === 'failed' || status === 'flaky') {
        const msg = stripAnsi(t.results?.[0]?.errors?.[0]?.message ?? '').slice(0, 1500);
        if (msg) entry.error = msg;
      }
      tests[spec.id] = entry;
    }
    for (const child of node.suites ?? []) walk(child);
  };
  for (const top of data.suites ?? []) walk(top);

  return {
    pipelineNumber: job.pipelineNumber,
    branch: job.branch,
    commitSubject: job.commitSubject,
    revision: job.revision,
    startedAt: job.startedAt,
    jobStatus: job.status,
    tests,
  };
}

function classify(t) {
  if (t.expectedStatus === 'skipped') return 'skipped';
  switch (t.status) {
    case 'expected':
      return 'passed';
    case 'unexpected':
      return 'failed';
    case 'flaky':
      return 'flaky';
    case 'skipped':
      return 'did_not_run';
    default:
      return 'failed';
  }
}

function stripAnsi(s) {
  // Strip CSI escape sequences from Playwright's colored error strings.
  return s.replace(/\[[0-9;]*m/g, '');
}

async function getJSON(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { Accept: 'application/json', ...(opts.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

function detectFlakes(window) {
  // Sort runs oldest→newest so 'recent' = end of array.
  const sorted = [...window].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const byTest = new Map();
  for (let i = 0; i < sorted.length; i++) {
    for (const [testId, t] of Object.entries(sorted[i].tests ?? {})) {
      if (!byTest.has(testId)) {
        byTest.set(testId, {
          id: testId,
          title: t.title,
          file: t.file,
          line: t.line,
          runs: [],
        });
      }
      byTest.get(testId).runs.push({
        runIdx: i,
        pipelineNumber: sorted[i].pipelineNumber,
        branch: sorted[i].branch,
        commitSubject: sorted[i].commitSubject,
        revision: sorted[i].revision,
        startedAt: sorted[i].startedAt,
        status: t.status,
        error: t.error,
      });
    }
  }

  const flakes = [];
  for (const test of byTest.values()) {
    const fails = test.runs.filter((r) => r.status === 'failed' || r.status === 'flaky');
    const passes = test.runs.filter((r) => r.status === 'passed');
    if (fails.length === 0 || passes.length === 0) continue;
    // Filter regressions: if the most recent 3 runs are all failures,
    // assume this is a regression rather than a flake.
    const tail3 = test.runs.slice(-3);
    if (tail3.length === 3 && tail3.every((r) => r.status !== 'passed')) continue;
    test.numFails = fails.length;
    test.numPasses = passes.length;
    flakes.push(test);
  }
  // Higher fail counts first; tiebreak on title for stable ordering.
  flakes.sort((a, b) => b.numFails - a.numFails || a.title.localeCompare(b.title));
  return flakes;
}

async function analyzeFlake(flake) {
  const sourcePath = path.join(SPEC_ROOT, flake.file);
  let sourceSnippet = '';
  let snippetStart = 1;
  let snippetEnd = 1;
  try {
    const lines = fs.readFileSync(sourcePath, 'utf8').split('\n');
    snippetStart = Math.max(1, (flake.line ?? 1) - 30);
    snippetEnd = Math.min(lines.length, (flake.line ?? 1) + 50);
    sourceSnippet = lines
      .slice(snippetStart - 1, snippetEnd)
      .map((l, i) => `${snippetStart + i}\t${l}`)
      .join('\n');
  } catch (err) {
    sourceSnippet = `(could not read ${path.relative(REPO_ROOT, sourcePath)}: ${err.message})`;
  }

  const history = flake.runs
    .map((r) =>
      r.status === 'passed'
        ? 'P'
        : r.status === 'failed'
        ? 'F'
        : r.status === 'flaky'
        ? 'f'
        : '.',
    )
    .join(' ');
  const lastFailure = [...flake.runs].reverse().find((r) => r.error);

  const prompt = `You are diagnosing a flaky end-to-end test in cbioportal-frontend. The test passes in some CI runs and fails in others, suggesting a timing or environment-sensitivity issue rather than a real bug. Your job is to read the test source and a sample failure, then propose a concrete code change to fix the flake.

Test: ${flake.title}
File: end-to-end-test-playwright/tests/${flake.file}:${flake.line}

Outcome history (oldest→newest, P=pass, F=fail, f=within-run-flaky, .=other):
${history}
Failed in ${flake.numFails} of ${flake.runs.length} recent runs.

Source (lines ${snippetStart}–${snippetEnd}):
\`\`\`ts
${sourceSnippet}
\`\`\`

Most recent failure error (truncated):
\`\`\`
${(lastFailure?.error ?? '(no error captured)').slice(0, 2000)}
\`\`\`

Identify the most likely cause of the flake and propose a concrete code change. Be specific — point at selectors, waits, masks, or other deterministic conditions. **Do not suggest \`page.waitForTimeout\` or arbitrary sleeps**; use locator-based or condition-based waits instead. Keep your response under 200 words.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return `_(Claude API error ${res.status}: ${errText.slice(0, 200)})_`;
    }
    const data = await res.json();
    return data.content?.[0]?.text ?? '_(empty response)_';
  } catch (err) {
    return `_(Claude API call threw: ${err.message})_`;
  }
}

function writeReport({ flakes, totalDetected, message }) {
  const buildNum = process.env.CIRCLE_BUILD_NUM ?? '(local)';
  let md = `# Cross-Run Flake Analysis\n\n`;
  md += `_Generated ${new Date().toISOString()} — build ${buildNum} — model ${MODEL}_\n\n`;
  if (message) md += `${message}\n\n`;
  if (!flakes || flakes.length === 0) {
    md += `**No cross-run flakes detected** in the last ${WINDOW} runs.\n`;
    fs.writeFileSync(REPORT_FILE, md);
    log(`wrote ${REPORT_FILE} (no flakes)`);
    return;
  }

  if (totalDetected && totalDetected > flakes.length) {
    md += `Detected **${totalDetected}** cross-run flaky test${
      totalDetected === 1 ? '' : 's'
    }; analyzing top **${flakes.length}** by failure count.\n\n`;
  } else {
    md += `Detected **${flakes.length}** cross-run flaky test${
      flakes.length === 1 ? '' : 's'
    } in the last ${WINDOW} runs.\n\n`;
  }

  md += `| Test | File | Pass | Fail |\n`;
  md += `|------|------|------|------|\n`;
  for (const { flake } of flakes) {
    md += `| ${escapeMd(flake.title)} | \`${flake.file}:${flake.line}\` | ${flake.numPasses} | ${flake.numFails} |\n`;
  }
  md += `\n---\n\n`;

  for (const { flake, analysis } of flakes) {
    md += `## ${escapeMd(flake.title)}\n\n`;
    md += `**File:** \`end-to-end-test-playwright/tests/${flake.file}:${flake.line}\`  \n`;
    md += `**Recent history:** ${flake.numPasses} pass / ${flake.numFails} fail in last ${flake.runs.length} runs\n\n`;
    md += `| # | Pipeline | Branch | Commit | Status |\n`;
    md += `|---|----------|--------|--------|--------|\n`;
    for (const r of flake.runs) {
      md += `| ${r.runIdx + 1} | #${r.pipelineNumber} | \`${r.branch}\` | ${escapeMd(r.commitSubject)} | ${r.status} |\n`;
    }
    md += `\n`;
    if (analysis) {
      md += `### Analysis\n\n${analysis}\n\n`;
    } else {
      md += `_(LLM analysis disabled — set \`ANTHROPIC_API_KEY\` to enable)_\n\n`;
    }
    md += `---\n\n`;
  }

  fs.writeFileSync(REPORT_FILE, md);
  log(`wrote ${REPORT_FILE}`);
}

function escapeMd(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function log(msg) {
  console.log(`[flake-analyzer] ${msg}`);
}

main().catch((err) => {
  console.error('[flake-analyzer] fatal:', err);
  // Exit 0 even on failure: this is advisory only, never block the build.
  process.exitCode = 0;
});
