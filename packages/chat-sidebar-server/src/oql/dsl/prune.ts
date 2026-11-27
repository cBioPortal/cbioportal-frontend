import { Alteration, GeneTrack, Issue, OqlQuery } from './schema.js';
import { describeAlteration } from './describe.js';
import { serializeAlteration } from './serialize.js';

type Path = (string | number)[];

/** What an error path points at: a whole gene (track or merged member), or one alteration. */
function target(path: Path): { kind: 'gene' | 'alteration'; at: Path } | null {
    const altIdx = path.indexOf('alterations');
    if (altIdx >= 0 && typeof path[altIdx + 1] === 'number')
        return { kind: 'alteration', at: path.slice(0, altIdx + 2) };
    if (path[0] === 'defaults' && typeof path[1] === 'number')
        return { kind: 'alteration', at: path.slice(0, 2) };
    if (path.at(-1) === 'gene' && (path.length === 3 || path.length === 5))
        return { kind: 'gene', at: path.slice(0, -1) };
    return null;
}

/** OQL for an alteration, or plain words when it has no OQL form yet (an unresolved exon). */
function label(a: Alteration, gene: string): string {
    try {
        return `${gene}: ${serializeAlteration(a)}`;
    } catch {
        return `${gene} ${describeAlteration(a, gene)}`;
    }
}

const same = (a: Path, b: Path) =>
    a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Removes the genes and alterations that request errors point at and returns the rest, with a
 * warning per removed part. Returns null when the errors cannot be pinned to a part, or when
 * removing them would change what the remaining query means (an emptied DATATYPES line, or a
 * gene left with no alterations, would fall back to the portal's default alterations).
 */
export function pruneQuery(
    dsl: OqlQuery,
    errors: Issue[]
): { dsl: OqlQuery; warnings: Issue[]; leftOut: string[] } | null {
    const targets: {
        kind: 'gene' | 'alteration';
        at: Path;
        error: Issue;
    }[] = [];
    for (const e of errors) {
        const t = target(e.path);
        if (!t) return null;
        targets.push({ ...t, error: e });
    }
    const removed = (at: Path, kind: 'gene' | 'alteration') =>
        targets.some(t => t.kind === kind && same(t.at, at));
    const warnings: Issue[] = [];
    /** Genes and terms no longer in the query, so other checks don't report them again. */
    const leftOut = new Set<string>(
        errors.flatMap(e => (e.term ? [e.term] : []))
    );
    const note = (label: string, e: Issue) =>
        warnings.some(w => w.message.startsWith(`Left out ${label} `)) ||
        warnings.push({
            code: 'LEFT_OUT',
            path: e.path,
            message: `Left out ${label} (${e.message})`,
            ...(e.term ? { term: e.term } : {}),
        });

    const keepAlts = (
        alts: Alteration[],
        base: Path,
        gene: string
    ): Alteration[] =>
        alts.filter((a, k) => {
            const hit = targets.find(
                t =>
                    t.kind === 'alteration' &&
                    same(t.at, [...base, 'alterations', k])
            );
            if (hit) note(label(a, gene), hit.error);
            return !hit;
        });

    /** A gene that keeps none of its listed alterations is dropped rather than left bare. */
    const keepGene = (g: GeneTrack, base: Path): GeneTrack | null => {
        if (removed(base, 'gene')) {
            leftOut.add(g.gene);
            note(
                g.gene,
                targets.find(t => t.kind === 'gene' && same(t.at, base))!.error
            );
            return null;
        }
        const alterations = keepAlts(g.alterations, base, g.gene);
        if (g.alterations.length > 0 && alterations.length === 0) {
            leftOut.add(g.gene);
            return null;
        }
        return { ...g, alterations };
    };

    let defaults = dsl.defaults;
    if (defaults) {
        defaults = defaults.filter((a, k) => {
            const hit = targets.find(
                t => t.kind === 'alteration' && same(t.at, ['defaults', k])
            );
            if (hit)
                note(
                    `DATATYPES ${label(a, 'the gene').replace(
                        /^the gene:? /,
                        ''
                    )}`,
                    hit.error
                );
            return !hit;
        });
        if (defaults.length === 0) return null;
    }

    const tracks: OqlQuery['tracks'] = [];
    dsl.tracks.forEach((t, i) => {
        if (t.kind === 'gene') {
            const kept = keepGene(t, ['tracks', i]);
            if (kept) tracks.push(kept);
            return;
        }
        const genes = t.genes.flatMap(
            (g, j) => keepGene(g, ['tracks', i, 'genes', j]) ?? []
        );
        if (genes.length >= 2) tracks.push({ ...t, genes });
        else if (genes.length === 1) tracks.push(genes[0]);
    });
    if (tracks.length === 0) return null;
    return {
        dsl: defaults ? { defaults, tracks } : { tracks },
        warnings,
        leftOut: [...leftOut],
    };
}
