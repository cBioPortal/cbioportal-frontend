/**
 * Runs a benchmark set against the OQL API (/api/chat/oql) of a running server and scores each
 * case by DSL equivalence.
 *
 *   pnpm oql:bench bench/oql/goldstandard.jsonl [--concurrency 4] [--service http://127.0.0.1:4000] [--mode dsl|oql]
 *
 * Input: JSONL (or a JSON array) of { "prompt": string, "expected": string (OQL; "REJECT" when
 * the service should decline the request; "FAIL" when it should report a validation error),
 * "studyId"?: string, "id"?: string, "expectWarning"?: string (a warning code the response must
 * carry; with no "expected", only the warning is scored) }.
 * Two scores per case, both after alias resolution:
 *   exact       the returned DSL equals the expected OQL's DSL (normalized).
 *   equivalent  the same samples are selected and shown: DATATYPES defaults expanded into bare
 *               genes, alteration/modifier/track order ignored, merged-track labels ignored.
 * Extra fields (category, complexity, ...) are carried through and summarized.
 * Results are written to bench/oql/results/<set>-<timestamp>.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { normalize, parseOql } from '../src/oql/dsl/index.js';

type Case = {
    id?: string;
    prompt: string;
    expected?: string;
    expectWarning?: string;
    studyId?: string;
    tags: Record<string, string>;
};

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const flag = (name: string, dflt: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : dflt;
};
const SERVICE = flag(
    'service',
    process.env.OQL_SERVICE_URL ?? 'http://127.0.0.1:4000'
).replace(/\/+$/, '');
const CONCURRENCY = Number(flag('concurrency', '4'));
const MODE = flag('mode', '');

// Haiku 4.5 list prices, USD per million tokens.
const PRICE = { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 };

if (!file) {
    console.error(
        'usage: pnpm oql:bench <cases.jsonl> [--concurrency N] [--service URL] [--mode dsl|oql]'
    );
    process.exit(1);
}

function loadCases(path: string): Case[] {
    const text = readFileSync(path, 'utf8').trim();
    const rows = text.startsWith('[')
        ? JSON.parse(text)
        : text
              .split('\n')
              .filter(l => l.trim())
              .map(l => JSON.parse(l));
    const known = new Set([
        'id',
        'prompt',
        'question',
        'input',
        'expected',
        'expectWarning',
        'oql',
        'expected_oql',
        'studyId',
        'study_id',
    ]);
    return rows.map((r: any, i: number) => ({
        id: r.id ?? String(i + 1),
        prompt: r.prompt ?? r.question ?? r.input,
        expected: r.expected ?? r.oql ?? r.expected_oql,
        expectWarning: r.expectWarning,
        studyId: r.studyId ?? r.study_id,
        tags: Object.fromEntries(
            Object.entries(r).filter(
                ([k, v]) => !known.has(k) && typeof v === 'string'
            )
        ) as Record<string, string>,
    }));
}

async function post(path: string, body: unknown) {
    const res = await fetch(`${SERVICE}/api/chat/oql/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return { status: res.status, data: (await res.json()) as any };
}

/** Expected OQL → canonical DSL, with gene aliases resolved the same way the service does. */
async function expectedDsl(
    c: Case
): Promise<{ dsl?: unknown; error?: string }> {
    if (!c.expected || c.expected === 'REJECT' || c.expected === 'FAIL')
        return {};
    const p = parseOql(c.expected);
    if (!p.ok)
        return {
            error: `expected OQL does not parse: ${p.errors[0]?.message}`,
        };
    const v = await post('validate', { dsl: p.dsl });
    return {
        dsl: v.data.dsl ?? p.dsl,
        ...(v.data.valid
            ? {}
            : {
                  error: `expected OQL is not valid: ${(v.data.errors ?? [])
                      .map((e: any) => e.code)
                      .join(', ')}`,
              }),
    };
}

const key = (v: unknown) => JSON.stringify(normalize(v));

const CNA_SCALE = ['HOMDEL', 'HETLOSS', 'GAIN', 'AMP'];
// Rank on the copy-number scale, with diploid between HETLOSS and GAIN.
const CNA_RANK: Record<string, number> = {
    HOMDEL: -2,
    HETLOSS: -1,
    GAIN: 1,
    AMP: 2,
};
const CNA_CMP: Record<string, (a: number, b: number) => boolean> = {
    '>': (a, b) => a > b,
    '>=': (a, b) => a >= b,
    '<': (a, b) => a < b,
    '<=': (a, b) => a <= b,
};

/** Rewrites alterations into the explicit set of things they select (CNA comparisons → levels). */
function expandAlteration(a: any): any[] {
    if (a.type === 'cna' && a.level && a.op && a.op !== '=' && !a.driver) {
        return CNA_SCALE.filter(l =>
            CNA_CMP[a.op](CNA_RANK[l], CNA_RANK[a.level])
        ).map(level => ({ type: 'cna', level }));
    }
    if (a.type === 'fusion' && a.partner?.kind === 'gene' && a.track) {
        // A gene-pair fusion selects the same samples whichever gene names the track.
        const [five, three] =
            a.partner.side === 'downstream'
                ? [a.track, a.partner.gene]
                : [a.partner.gene, a.track];
        const modifiers = [...(a.modifiers ?? [])].sort((x: any, y: any) =>
            key(x).localeCompare(key(y))
        );
        return [{ type: 'fusion_pair', five, three, modifiers }];
    }
    if (a.modifiers) {
        const modifiers = a.modifiers
            .map((m: any) =>
                m.type === 'RANGE' && m.start === 1
                    ? (({ start, ...rest }) => rest)(m)
                    : m
            )
            .sort((x: any, y: any) => key(x).localeCompare(key(y)));
        return [{ ...a, modifiers }];
    }
    return [a];
}

/** Display-independent form: defaults expanded, labels dropped, everything order-insensitive. */
function equivalentForm(dsl: any): unknown {
    const defaults = dsl.defaults ?? [];
    const alts = (list: any[], track: string) => {
        const all = (list.length === 0 && defaults.length ? defaults : list)
            .flatMap((a: any) => expandAlteration({ ...a, track }))
            .map(({ track: _t, ...a }: any) => a);
        return [
            ...new Map(all.map((a: any) => [key(a), a])).values(),
        ].sort((x: any, y: any) => key(x).localeCompare(key(y)));
    };
    const gene = (t: any) => {
        const alterations = alts(t.alterations, t.gene);
        const pairsOnly =
            alterations.length > 0 &&
            alterations.every((a: any) => a.type === 'fusion_pair');
        return { kind: 'gene', gene: pairsOnly ? '' : t.gene, alterations };
    };
    const tracks = dsl.tracks
        .map((t: any) =>
            t.kind === 'gene'
                ? gene(t)
                : {
                      kind: 'merged',
                      genes: t.genes
                          .map(gene)
                          .sort((x: any, y: any) =>
                              key(x).localeCompare(key(y))
                          ),
                  }
        )
        .sort((x: any, y: any) => key(x).localeCompare(key(y)));
    return { tracks };
}

async function runCase(c: Case) {
    const [exp, got] = await Promise.all([
        expectedDsl(c),
        post('translate?debug=1', {
            prompt: c.prompt,
            studyId: c.studyId,
            ...(MODE ? { mode: MODE } : {}),
        }),
    ]);
    const status =
        got.status === 200 && got.data.oql
            ? 'ok'
            : got.data.rejected
            ? 'rejected'
            : 'fail';
    const wantsStatus =
        c.expected === 'REJECT'
            ? 'rejected'
            : c.expected === 'FAIL'
            ? 'fail'
            : null;
    const warned =
        !c.expectWarning ||
        (got.data.warnings ?? []).some((w: any) => w.code === c.expectWarning);
    const outputOnly = !c.expected && !!c.expectWarning;
    const scorable =
        outputOnly ||
        wantsStatus !== null ||
        (status === 'ok' && exp.dsl !== undefined);
    const exact = outputOnly
        ? status === 'ok' && warned
        : wantsStatus
        ? status === wantsStatus
        : scorable
        ? key(exp.dsl) === key(got.data.dsl) && warned
        : undefined;
    const pass = outputOnly
        ? status === 'ok' && warned
        : wantsStatus
        ? status === wantsStatus
        : scorable
        ? (exact ||
              key(equivalentForm(exp.dsl)) ===
                  key(equivalentForm(got.data.dsl))) &&
          warned
        : undefined;
    const u = got.data.meta?.usage ?? {};
    const cost =
        ((u.inputTokens ?? 0) * PRICE.input +
            (u.outputTokens ?? 0) * PRICE.output +
            (u.cacheReadTokens ?? 0) * PRICE.cacheRead +
            (u.cacheWriteTokens ?? 0) * PRICE.cacheWrite) /
        1e6;
    return {
        id: c.id,
        tags: c.tags,
        prompt: c.prompt,
        studyId: c.studyId,
        expected: c.expected,
        expectedError: exp.error,
        status,
        exact,
        pass,
        oql: got.data.oql,
        error: got.data.error,
        errors: got.data.errors,
        ms: got.data.meta?.ms,
        turns: u.turns,
        rejectedSubmits: (got.data.meta?.trace ?? [])
            .filter((t: any) => t.tool.startsWith('submit_') && !t.ok)
            .map((t: any) =>
                (t.output?.errors ?? [])
                    .map((e: any) => `${e.code}: ${e.message}`)
                    .join('; ')
            ),
        warnings: (got.data.warnings ?? []).map(
            (w: any) => `${w.code}: ${w.message}`
        ),
        cost,
    };
}

async function main() {
    const cases = loadCases(file!);
    const results: Awaited<ReturnType<typeof runCase>>[] = new Array(
        cases.length
    );
    let next = 0;
    let done = 0;
    await Promise.all(
        Array.from(
            { length: Math.min(CONCURRENCY, cases.length) },
            async () => {
                while (next < cases.length) {
                    const i = next++;
                    try {
                        results[i] = await runCase(cases[i]);
                    } catch (caught) {
                        const e = caught as any;
                        results[i] = {
                            id: cases[i].id,
                            prompt: cases[i].prompt,
                            status: 'fail',
                            error: String(e?.message ?? e),
                        } as any;
                    }
                    done++;
                    const r = results[i];
                    const mark = r.exact
                        ? 'PASS'
                        : r.pass
                        ? 'EQUIV'
                        : r.pass === false
                        ? 'MISS'
                        : r.status.toUpperCase();
                    console.log(
                        `[${done}/${cases.length}] ${mark.padEnd(7)} ${r.id}: ${
                            r.prompt
                        }`
                    );
                    if (
                        r.pass === false ||
                        (r.status === 'ok' && r.expectedError)
                    )
                        console.log(
                            `          expected: ${
                                r.expected
                            }\n          got:      ${r.oql?.replaceAll(
                                '\n',
                                ' | '
                            )}`
                        );
                    if (r.status === 'rejected' && !r.pass)
                        console.log(`          rejected: ${r.error}`);
                    if (r.status === 'fail')
                        console.log(
                            `          ${r.error} ${(r.errors ?? [])
                                .map((e: any) => e.message)
                                .join('; ')}`
                        );
                }
            }
        )
    );

    const scored = results.filter(r => r.pass !== undefined);
    const passed = scored.filter(r => r.pass).length;
    const ms = results.map(r => r.ms ?? 0).sort((a, b) => a - b);
    const summary = {
        cases: results.length,
        ok: results.filter(r => r.status === 'ok').length,
        fail: results.filter(r => r.status === 'fail').length,
        rejected: results.filter(r => r.status === 'rejected').length,
        scored: scored.length,
        exact: scored.filter(r => r.exact).length,
        equivalent: passed,
        exactAccuracy: results.length
            ? scored.filter(r => r.exact).length / results.length
            : null,
        equivalentAccuracy: results.length ? passed / results.length : null,
        p50ms: ms[Math.floor(ms.length / 2)],
        p95ms: ms[Math.min(ms.length - 1, Math.floor(ms.length * 0.95))],
        costUsd: Number(
            results.reduce((s, r) => s + (r.cost ?? 0), 0).toFixed(4)
        ),
    };
    const byTag: Record<string, Record<string, string>> = {};
    for (const tag of [
        ...new Set(results.flatMap(r => Object.keys(r.tags ?? {}))),
    ]) {
        const groups: Record<string, typeof results> = {};
        for (const r of results) {
            const k = r.tags?.[tag] ?? '-';
            (groups[k] = groups[k] ?? []).push(r);
        }
        byTag[tag] = Object.fromEntries(
            Object.entries(groups)
                .sort()
                .map(([k, rs]) => [
                    k,
                    `${rs.filter(r => r.pass).length}/${rs.length} (exact ${
                        rs.filter(r => r.exact).length
                    })`,
                ])
        );
    }
    console.log('\n' + JSON.stringify({ ...summary, byTag }, null, 2));

    const dir = join(process.cwd(), 'bench', 'oql', 'results');
    mkdirSync(dir, { recursive: true });
    const out = join(
        dir,
        `${basename(file!).replace(/\.[^.]+$/, '')}${
            MODE ? `-${MODE}` : ''
        }-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    writeFileSync(out, JSON.stringify({ summary, byTag, results }, null, 2));
    console.log(`results: ${out}`);
}

main();
