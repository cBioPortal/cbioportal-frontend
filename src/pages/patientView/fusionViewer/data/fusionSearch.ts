import { FusionEvent, GenePartner } from './types';

/**
 * Coordinate terms: `chr7`, `7`, `chr7:55,019,017`, `chr21:39000000-40000000`.
 * A trailing `:` or `-` is accepted so a half-typed coordinate still narrows.
 * A term is only read as a coordinate when it is unambiguous (a `chr` prefix,
 * a colon, or all digits) -- a bare `m` or `x` is the start of a gene symbol.
 */
const COORD_RE = /^(?:chr)?([0-9]{1,2}|x|y|mt?)(?::([\d,]*)(-([\d,]*))?)?$/i;

function toInt(s: string): number {
    return parseInt(s.replace(/,/g, ''), 10);
}

/** Chromosome name without `chr`, with the mitochondrial `M` folded into `MT`. */
function normChrom(c: string): string {
    const u = c.replace(/^chr/i, '').toUpperCase();
    return u === 'M' ? 'MT' : u;
}

function partnerMatchesCoord(p: GenePartner, m: RegExpMatchArray): boolean {
    if (normChrom(p.chromosome) !== normChrom(m[1])) {
        return false;
    }
    if (!m[2]) {
        return true; // chromosome only, or a bare trailing colon
    }
    if (m[3]) {
        const lo = toInt(m[2]);
        // `chr7:1000-` is open-ended; a reversed range is read as written.
        const hi = m[4] ? toInt(m[4]) : Infinity;
        return p.position >= Math.min(lo, hi) && p.position <= Math.max(lo, hi);
    }
    // A single position matches as a digit prefix, so `chr7:5501` finds
    // breakpoints while the user is still typing.
    return String(p.position).startsWith(String(toInt(m[2])));
}

/** `A::B` and `A-B` in both orders, so a pasted fusion name finds the row. */
function fusionNames(partners: GenePartner[]): string[] {
    if (partners.length < 2) {
        return [];
    }
    const [a, b] = partners.map(p => p.symbol.toLowerCase());
    return [`${a}::${b}`, `${b}::${a}`, `${a}-${b}`, `${b}-${a}`];
}

function termMatches(fusion: FusionEvent, term: string): boolean {
    const partners = fusion.gene2
        ? [fusion.gene1, fusion.gene2]
        : [fusion.gene1];
    const coord = term.match(COORD_RE);
    if (
        coord &&
        /^chr|:|^\d+$/.test(term) &&
        partners.some(p => partnerMatchesCoord(p, coord))
    ) {
        return true;
    }
    // A coordinate-shaped term that matches no breakpoint falls through to the
    // text match: `chrm` is the start of CHRM1 as well as the mitochondrion.
    if (fusionNames(partners).some(n => n.startsWith(term))) {
        return true;
    }
    // A sample id matches typed from the start, or by any one of its parts,
    // so `t02` finds the second specimen.
    const sample = fusion.tumorId.toLowerCase();
    if (
        sample.startsWith(term) ||
        sample.split(/[-_.]/).some(part => part.startsWith(term))
    ) {
        return true;
    }
    // Word-prefix, not substring: `erg` must not hit "intERGenic".
    const words = [
        ...partners.map(p => p.symbol),
        fusion.gene2 ? '' : 'IGR',
        fusion.callMethod, // the SV's variantClass
        fusion.svIdiom,
    ]
        .join(' ')
        .toLowerCase()
        .split(/[\s_]+/);
    return words.some(w => w.startsWith(term));
}

/**
 * Sidebar search: whitespace-separated terms, all of which must match
 * as a word prefix (gene / partner symbol, sample, variant class, SV type)
 * or as a coordinate.
 */
export function filterFusions(
    fusions: FusionEvent[],
    query: string
): FusionEvent[] {
    const terms = query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
    if (terms.length === 0) {
        return fusions;
    }
    return fusions.filter(f => terms.every(t => termMatches(f, t)));
}
