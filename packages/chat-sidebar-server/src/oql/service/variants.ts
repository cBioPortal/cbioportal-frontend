import { cached } from './cache.js';
import { ENSEMBL_URL, GENOME_NEXUS_URL, getJson, getText } from './upstream.js';

type CanonicalTranscript = {
    transcriptId: string;
    proteinId?: string;
    proteinLength?: number;
    exons?: { exonStart: number; exonEnd: number; rank: number }[];
    utrs?: { start: number; end: number }[];
};
export type Protein = {
    transcriptId: string;
    proteinId: string;
    length: number;
    sequence: string;
};

const DAY = 24 * 60 * 60 * 1000;
const proteinCache = cached<Protein | null>(DAY);

/** Canonical (MSKCC isoform) protein for a gene, as Genome Nexus annotates it. */
export function canonicalProtein(gene: string): Promise<Protein | null> {
    return proteinCache(gene, async () => {
        const t = await getJson<CanonicalTranscript>(
            'Genome Nexus',
            `${GENOME_NEXUS_URL}/ensembl/canonical-transcript/hgnc/${encodeURIComponent(
                gene
            )}?isoformOverrideSource=mskcc`
        ).catch(() => null);
        if (!t?.proteinId) return null;
        const sequence = await getText(
            'Ensembl',
            `${ENSEMBL_URL}/sequence/id/${t.proteinId}?type=protein;content-type=text/plain`
        );
        return {
            transcriptId: t.transcriptId,
            proteinId: t.proteinId,
            length: sequence.length,
            sequence,
        };
    });
}

export type VariantCheck =
    | {
          ok: true;
          gene: string;
          change: string;
          proteinLength: number;
          transcriptId: string;
      }
    | {
          ok: false;
          gene: string;
          change: string;
          code: string;
          message: string;
          suggestion?: string;
      };

// Reference residue + position at the start, and an optional second "_A123" coordinate.
const COORDS_RE = /^([A-Z*])(\d+)(?:_([A-Z*])(\d+))?/;

/**
 * Checks that a protein change (or a bare residue position) is consistent with the gene's
 * canonical protein: positions in range and reference residues matching the sequence.
 */
export async function checkProteinChange(
    gene: string,
    change: string
): Promise<VariantCheck> {
    const protein = await canonicalProtein(gene);
    if (!protein) {
        return {
            ok: false,
            gene,
            change,
            code: 'NO_PROTEIN',
            message: `${gene} has no canonical protein-coding transcript`,
        };
    }
    const m = COORDS_RE.exec(change);
    if (!m)
        return {
            ok: false,
            gene,
            change,
            code: 'VARIANT_FORMAT',
            message: `cannot read a position from ${change}`,
        };
    const coords: [string, number][] = [[m[1], Number(m[2])]];
    if (m[3]) coords.push([m[3], Number(m[4])]);
    for (const [ref, pos] of coords) {
        if (pos < 1 || pos > protein.length) {
            return {
                ok: false,
                gene,
                change,
                code: 'POSITION_OUT_OF_RANGE',
                message: `${gene} ${change}: position ${pos} is outside the ${protein.length} aa canonical protein (${protein.transcriptId})`,
            };
        }
        // X marks splice sites in cBioPortal notation and has no reference residue.
        if (ref === 'X' || ref === '*') continue;
        const actual = protein.sequence[pos - 1];
        if (actual !== ref) {
            return {
                ok: false,
                gene,
                change,
                code: 'VARIANT_REF_MISMATCH',
                message: `${gene} ${change}: residue ${pos} is ${actual}, not ${ref}, on ${protein.transcriptId}`,
                suggestion: `${actual}${change.slice(1)}`,
            };
        }
    }
    return {
        ok: true,
        gene,
        change,
        proteinLength: protein.length,
        transcriptId: protein.transcriptId,
    };
}

export type ExonTable = {
    transcriptId: string;
    exonCount: number;
    /** Residue range per exon number; null for an exon with no coding sequence. */
    residues: Map<number, { start: number; end: number } | null>;
};

const exonCache = cached<ExonTable | null>(DAY);

/**
 * Residue range of each exon of the gene's canonical (MSKCC isoform) transcript, from Genome
 * Nexus exon and UTR coordinates. A codon split across two exons counts toward both.
 */
export function canonicalExons(gene: string): Promise<ExonTable | null> {
    return exonCache(gene, async () => {
        const t = await getJson<CanonicalTranscript>(
            'Genome Nexus',
            `${GENOME_NEXUS_URL}/ensembl/canonical-transcript/hgnc/${encodeURIComponent(
                gene
            )}?isoformOverrideSource=mskcc`
        ).catch(() => null);
        if (!t?.exons?.length || !t.proteinLength) return null;
        const residues = new Map<
            number,
            { start: number; end: number } | null
        >();
        let coding = 0;
        for (const e of [...t.exons].sort((a, b) => a.rank - b.rank)) {
            let n = e.exonEnd - e.exonStart + 1;
            for (const u of t.utrs ?? []) {
                const lo = Math.max(e.exonStart, u.start);
                const hi = Math.min(e.exonEnd, u.end);
                if (lo <= hi) n -= hi - lo + 1;
            }
            residues.set(
                e.rank,
                n > 0
                    ? {
                          start: Math.floor(coding / 3) + 1,
                          end: Math.min(
                              Math.ceil((coding + n) / 3),
                              t.proteinLength
                          ),
                      }
                    : null
            );
            coding += Math.max(n, 0);
        }
        return {
            transcriptId: t.transcriptId,
            exonCount: t.exons.length,
            residues,
        };
    });
}
