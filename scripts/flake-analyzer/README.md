# Cross-run flake analyzer

Read-only CI helper that surfaces tests in `remote_e2e` whose
pass/fail outcome flips across recent CI runs (cross-run flakes), and
asks Claude to propose a fix.

## What it does

For every CI invocation of `remote_e2e`:

1. **Short-circuit on green runs.** If this pipeline's `remote_e2e`
   succeeded, the analyzer exits without producing a report — there's
   nothing actionable, and no point burning API tokens. The
   dashboard's "flakes" link only lights up on red/incomplete runs.
2. Pulls the last N (default 15) `remote_e2e` runs' merged
   `test-results/results.json` from the CircleCI artifacts API.
   Per-job summaries are cached locally — once a job is in the cache,
   subsequent invocations skip its download. The cache lives in
   `scripts/flake-analyzer/.cache/jobs.json` and is preserved across
   CI runs by CircleCI's `save_cache` / `restore_cache`.
3. Identifies tests that have **both** passes and failures in the
   window. Tests whose recent runs are an unbroken trail of failures
   are filtered out as regressions, not flakes.
4. For each flake (capped at 10 per invocation), reads the spec
   source, picks the most recent failure error, and asks Claude
   (`claude-haiku-4-5` by default) for a likely cause + concrete fix.
5. Writes `flake-report.md` as a CircleCI build artifact.

The script never modifies tests, never opens PRs, and never blocks
the build — it exits 0 even on internal failure.

## Run locally

```sh
ANTHROPIC_API_KEY=sk-ant-… node scripts/flake-analyzer/analyze.mjs
```

Then open `scripts/flake-analyzer/flake-report.md`.

Without `ANTHROPIC_API_KEY` the script still detects flakes and emits
the report — just without the per-flake LLM analysis section.

## Env knobs

| var | default | purpose |
|-----|---------|---------|
| `ANTHROPIC_API_KEY` | — | required for LLM analysis |
| `CLAUDE_MODEL` | `claude-haiku-4-5` | model id |
| `CIRCLECI_PROJECT` | `gh/cBioPortal/cbioportal-frontend` | which repo to read |
| `FLAKE_WINDOW` | `15` | how many recent runs to consider |
| `FLAKE_MAX` | `10` | max flakes to analyze per invocation |
