import { Alteration, GeneTrack, Issue, OqlQuery } from './schema.js';

/** Default expression/protein thresholds the service's rules supply when the user gives none. */
const DEFAULT_Z_SCORES = new Set([2, -2]);

/** Every number written in the request, including those inside tokens like "G12" or "V600E". */
export function numbersInText(text: string): Set<number> {
    return new Set([...text.matchAll(/\d+(?:\.\d+)?/g)].map(m => Number(m[0])));
}

type Found = {
    gene: string;
    numbers: number[];
    what: 'residue' | 'z-score';
    path: (string | number)[];
};

function numbersIn(
    a: Alteration
): { numbers: number[]; what: 'residue' | 'z-score' } | null {
    if (a.type === 'expression' || a.type === 'protein') {
        return DEFAULT_Z_SCORES.has(a.zScore)
            ? null
            : { numbers: [Math.abs(a.zScore), a.zScore], what: 'z-score' };
    }
    if (a.type !== 'mutation') return null;
    const numbers: number[] = [];
    if (a.match?.by === 'position') numbers.push(a.match.position);
    if (a.match?.by === 'protein_change')
        numbers.push(
            ...[...a.match.value.matchAll(/\d+/g)].map(m => Number(m[0]))
        );
    for (const m of a.modifiers ?? []) {
        if (m.type === 'RANGE') {
            if (m.start !== undefined) numbers.push(m.start);
            if (m.end !== undefined) numbers.push(m.end);
        }
    }
    return numbers.length ? { numbers, what: 'residue' } : null;
}

/**
 * Warns about residue numbers and thresholds that neither the user wrote nor a lookup produced:
 * the model chose them from memory, so they are unchecked. A number one away from one the user
 * wrote counts as theirs ("after position 1500" is written (1501-)).
 */
export function unverifiedNumbers(
    dsl: OqlQuery,
    prompt: string,
    trusted: Iterable<number> = []
): Issue[] {
    const fromUser = numbersInText(prompt);
    const known = new Set(trusted);
    const isTheirs = (n: number) =>
        known.has(n) ||
        fromUser.has(n) ||
        fromUser.has(n - 1) ||
        fromUser.has(n + 1);
    const found: Found[] = [];
    const visit = (
        alts: Alteration[],
        gene: string,
        base: (string | number)[]
    ) =>
        alts.forEach((a, k) => {
            const r = numbersIn(a);
            if (!r) return;
            const chosen =
                r.what === 'z-score'
                    ? r.numbers.some(isTheirs)
                        ? []
                        : [r.numbers[1]]
                    : r.numbers.filter(n => !isTheirs(n));
            if (chosen.length)
                found.push({
                    gene,
                    numbers: chosen,
                    what: r.what,
                    path: [...base, 'alterations', k],
                });
        });
    const visitGene = (t: GeneTrack, base: (string | number)[]) =>
        visit(t.alterations, t.gene, base);
    dsl.tracks.forEach((t, i) =>
        t.kind === 'gene'
            ? visitGene(t, ['tracks', i])
            : t.genes.forEach((g, j) => visitGene(g, ['tracks', i, 'genes', j]))
    );
    if (dsl.defaults) visit(dsl.defaults, 'DATATYPES', ['defaults']);

    const byGene = new Map<string, Found[]>();
    for (const f of found)
        byGene.set(`${f.gene}|${f.what}`, [
            ...(byGene.get(`${f.gene}|${f.what}`) ?? []),
            f,
        ]);
    return [...byGene.values()].map(group => {
        const { gene, what } = group[0];
        const numbers = [...new Set(group.flatMap(f => f.numbers))].sort(
            (a, b) => a - b
        );
        const label =
            what === 'z-score'
                ? `z-score threshold ${numbers.join(', ')}`
                : `residue${numbers.length > 1 ? 's' : ''} ${numbers.join(
                      ', '
                  )}`;
        return {
            code: 'UNVERIFIED_NUMBERS',
            path: group[0].path,
            message: `${gene}: ${label} chosen by the model, not taken from your request or looked up; please check`,
        };
    });
}
