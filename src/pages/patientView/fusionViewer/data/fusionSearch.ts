import { FusionEvent, GenePartner } from './types';

/**
 * Coordinate terms: `chr7`, `7`, `chr7:55,019,017`, `chr21:39000000-40000000`.
 * A term is only read as a coordinate when it is unambiguous (a `chr` prefix,
 * a colon, or all digits) -- a bare `m` or `x` is the start of a gene symbol.
 */
const COORD_RE = /^(?:chr)?([0-9]{1,2}|x|y|mt?)(?::([\d,]+)(?:-([\d,]+))?)?$/i;

function toInt(s: string): number {
    return parseInt(s.replace(/,/g, ''), 10);
}

function partnerMatchesCoord(p: GenePartner, m: RegExpMatchArray): boolean {
    const chrom = p.chromosome.replace(/^chr/i, '').toUpperCase();
    const want = m[1].toUpperCase() === 'M' ? 'MT' : m[1].toUpperCase();
    if (chrom !== want) {
        return false;
    }
    if (!m[2]) {
        return true;
    }
    if (m[3]) {
        return p.position >= toInt(m[2]) && p.position <= toInt(m[3]);
    }
    // A single position matches as a digit prefix, so `chr7:5501` finds
    // breakpoints while the user is still typing.
    return String(p.position).startsWith(String(toInt(m[2])));
}

function termMatches(fusion: FusionEvent, term: string): boolean {
    const partners = fusion.gene2
        ? [fusion.gene1, fusion.gene2]
        : [fusion.gene1];
    const coord = term.match(COORD_RE);
    if (coord && /^chr|:|^\d+$/.test(term)) {
        return partners.some(p => partnerMatchesCoord(p, coord));
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
 * as a word prefix (gene / partner symbol, variant class, SV type) or as a
 * coordinate.
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
