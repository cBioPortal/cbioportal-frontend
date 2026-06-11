import {
    GenomeNexusAPI,
    EnsemblTranscript as GNEnsemblTranscript,
    Exon as GNExon,
    UntranslatedRegion,
    PfamDomainRange,
    PfamDomain,
} from 'genome-nexus-ts-api-client';
import { getServerConfig } from 'config/config';
import { TranscriptData, Exon, ProteinDomain } from './types';

export type GenomeBuild = 'GRCh38' | 'GRCh37';

// ---------------------------------------------------------------------------
// Genome Nexus client management (one per build, cached)
// ---------------------------------------------------------------------------

const clientCache: Partial<Record<GenomeBuild, GenomeNexusAPI>> = {};

function getGenomeNexusDomain(build: GenomeBuild): string {
    if (build === 'GRCh38') {
        return (
            getServerConfig().genomenexus_url_grch38 ||
            'https://grch38.genomenexus.org'
        );
    }
    return getServerConfig().genomenexus_url || 'https://v1.genomenexus.org';
}

function getClient(build: GenomeBuild): GenomeNexusAPI {
    if (!clientCache[build]) {
        clientCache[build] = new GenomeNexusAPI(getGenomeNexusDomain(build));
    }
    return clientCache[build]!;
}

// ---------------------------------------------------------------------------
// Transcript data cache
// ---------------------------------------------------------------------------

const transcriptCache: Record<string, TranscriptData[]> = {};

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function stripVersion(ensemblId: string): string {
    return ensemblId.replace(/\.\d+$/, '');
}

function mapExons(gnExons: GNExon[]): Exon[] {
    return gnExons
        .slice()
        .sort((a, b) => a.rank - b.rank)
        .map(exon => ({
            number: exon.rank,
            start: exon.exonStart,
            end: exon.exonEnd,
            ensemblId: exon.exonId,
        }));
}

/**
 * Genomic interval of CDS within a single exon (UTR regions removed).
 * Both strands: start <= end. Transcription-order is handled separately.
 */
interface CdsSegment {
    start: number;
    end: number;
}

/**
 * Build CDS-only genomic segments for a transcript in transcription order.
 *
 * Each exon is clipped against every UTR range; the resulting pieces are
 * emitted in transcription order (low→high coord on + strand, high→low
 * on − strand) so walking the list accumulates coding bp in the correct
 * direction.
 */
function buildCdsSegments(
    gnExons: GNExon[],
    utrs: UntranslatedRegion[],
    strand: '+' | '-'
): CdsSegment[] {
    const sortedExons = [...gnExons].sort((a, b) =>
        strand === '+' ? a.exonStart - b.exonStart : b.exonStart - a.exonStart
    );

    const segments: CdsSegment[] = [];
    for (const exon of sortedExons) {
        let parts: CdsSegment[] = [
            { start: exon.exonStart, end: exon.exonEnd },
        ];
        for (const utr of utrs) {
            const next: CdsSegment[] = [];
            for (const p of parts) {
                if (utr.end < p.start || utr.start > p.end) {
                    next.push(p);
                    continue;
                }
                if (utr.start > p.start) {
                    next.push({ start: p.start, end: utr.start - 1 });
                }
                if (utr.end < p.end) {
                    next.push({ start: utr.end + 1, end: p.end });
                }
            }
            parts = next;
        }
        parts.sort((a, b) =>
            strand === '+' ? a.start - b.start : b.start - a.start
        );
        segments.push(...parts);
    }
    return segments;
}

/**
 * Map a 1-indexed amino-acid position to its genomic coordinate by
 * walking CDS bp in transcription direction. The start of aa N is at
 * CDS nt offset (N - 1) * 3.
 */
function aaToGenomic(
    aa: number,
    cdsSegments: CdsSegment[],
    strand: '+' | '-'
): number {
    if (cdsSegments.length === 0 || aa < 1) return 0;
    const targetNt = (aa - 1) * 3;
    let cumulative = 0;
    for (const seg of cdsSegments) {
        const segLen = seg.end - seg.start + 1;
        if (cumulative + segLen > targetNt) {
            const offset = targetNt - cumulative;
            return strand === '+' ? seg.start + offset : seg.end - offset;
        }
        cumulative += segLen;
    }
    const last = cdsSegments[cdsSegments.length - 1];
    return strand === '+' ? last.end : last.start;
}

function mapDomains(
    pfamRanges: PfamDomainRange[],
    pfamLookup: Record<string, PfamDomain>,
    cdsSegments: CdsSegment[],
    strand: '+' | '-'
): ProteinDomain[] {
    return pfamRanges.map(range => {
        // Map aa range to two genomic coords; canonicalize as [min, max]
        // so downstream filters can treat start <= end regardless of strand.
        const g1 = aaToGenomic(range.pfamDomainStart, cdsSegments, strand);
        const g2 = aaToGenomic(range.pfamDomainEnd, cdsSegments, strand);
        return {
            pfamId: range.pfamDomainId,
            name: pfamLookup[range.pfamDomainId]?.name || range.pfamDomainId,
            startAA: range.pfamDomainStart,
            endAA: range.pfamDomainEnd,
            startGenomic: Math.min(g1, g2),
            endGenomic: Math.max(g1, g2),
            source: 'Pfam',
        };
    });
}

function mapTranscript(
    gn: GNEnsemblTranscript,
    geneSymbol: string,
    pfamLookup: Record<string, PfamDomain>
): TranscriptData {
    const exons = mapExons(gn.exons || []);
    const strand: '+' | '-' =
        gn.exons && gn.exons.length > 0 && gn.exons[0].strand === -1
            ? '-'
            : '+';

    const allStarts = exons.map(e => e.start);
    const allEnds = exons.map(e => e.end);

    const cdsSegments = buildCdsSegments(gn.exons || [], gn.utrs || [], strand);

    return {
        transcriptId: stripVersion(gn.transcriptId),
        displayName: gn.transcriptId,
        gene: (gn.hugoSymbols && gn.hugoSymbols[0]) || geneSymbol,
        biotype:
            gn.proteinLength > 0 ? 'protein_coding' : 'processed_transcript',
        strand,
        txStart: allStarts.length > 0 ? Math.min(...allStarts) : 0,
        txEnd: allEnds.length > 0 ? Math.max(...allEnds) : 0,
        exons,
        isForteSelected: false,
        proteinLength: gn.proteinLength > 0 ? gn.proteinLength : undefined,
        domains: mapDomains(
            gn.pfamDomains || [],
            pfamLookup,
            cdsSegments,
            strand
        ),
        // Genome Nexus reports UTR type as "five_prime_UTR" / "three_prime_UTR";
        // normalize to the 'five_prime' | 'three_prime' enum the renderers use
        // (a bare cast left the raw string, silently breaking every
        // u.type === 'five_prime' check).
        utrs: (gn.utrs || []).map(u => ({
            start: u.start,
            end: u.end,
            type: /^five/i.test(u.type)
                ? ('five_prime' as const)
                : ('three_prime' as const),
        })),
    };
}

// ---------------------------------------------------------------------------
// Public API (same signatures as before)
// ---------------------------------------------------------------------------

async function fetchTranscriptsFromEnsembl(
    geneSymbol: string,
    build: GenomeBuild = 'GRCh38'
): Promise<TranscriptData[]> {
    const cacheKey = `${build}:${geneSymbol}`;
    if (transcriptCache[cacheKey]) {
        return transcriptCache[cacheKey];
    }

    try {
        const client = getClient(build);

        // Fetch all transcripts and canonical transcript in parallel
        const [gnTranscripts, canonicalTranscript] = await Promise.all([
            client.fetchEnsemblTranscriptsGET({ hugoSymbol: geneSymbol }),
            client
                .fetchCanonicalEnsemblTranscriptByHugoSymbolGET({
                    hugoSymbol: geneSymbol,
                    isoformOverrideSource: 'mskcc',
                })
                .catch(() => null),
        ]);

        if (!gnTranscripts || gnTranscripts.length === 0) {
            console.warn(
                `No transcripts returned from Genome Nexus (${build}) for ${geneSymbol}`
            );
            return [];
        }

        // Collect unique PFAM IDs for name resolution
        const pfamIds = new Set<string>();
        for (const t of gnTranscripts) {
            if (t.pfamDomains) {
                for (const d of t.pfamDomains) {
                    pfamIds.add(d.pfamDomainId);
                }
            }
        }

        // Fetch PFAM domain names if any domains exist
        let pfamLookup: Record<string, PfamDomain> = {};
        if (pfamIds.size > 0) {
            try {
                const pfamDomains = await client.fetchPfamDomainsByPfamAccessionPOST(
                    {
                        pfamAccessions: Array.from(pfamIds),
                    }
                );
                for (const d of pfamDomains) {
                    pfamLookup[d.pfamAccession] = d;
                }
            } catch (e) {
                console.warn(
                    `Failed to fetch PFAM domain names for ${geneSymbol}:`,
                    e
                );
            }
        }

        // Map to TranscriptData, storing the canonical transcript ID for later
        const canonicalId = canonicalTranscript
            ? stripVersion(canonicalTranscript.transcriptId)
            : null;

        const transcripts: TranscriptData[] = gnTranscripts.map(gn => {
            const td = mapTranscript(gn, geneSymbol, pfamLookup);
            // Tag the MSK canonical transcript
            if (canonicalId && td.transcriptId === canonicalId) {
                td.displayName = `${td.transcriptId} (canonical)`;
            }
            return td;
        });

        transcriptCache[cacheKey] = transcripts;
        return transcripts;
    } catch (error) {
        console.warn(
            `Error fetching Genome Nexus (${build}) transcripts for ${geneSymbol}:`,
            error
        );
        return [];
    }
}

async function fetchTranscriptsForGeneWithFallback(
    geneSymbol: string,
    ensemblTranscriptId?: string,
    build: GenomeBuild = 'GRCh38'
): Promise<TranscriptData[]> {
    const cached = await fetchTranscriptsFromEnsembl(geneSymbol, build);

    if (cached.length === 0) {
        return cached;
    }

    // Clone so we don't mutate the cached objects
    const transcripts = cached.map(t => ({ ...t, isForteSelected: false }));

    // First priority: match the transcript ID from the SV data
    if (ensemblTranscriptId) {
        const baseId = stripVersion(ensemblTranscriptId);
        const matched = transcripts.find(t => t.transcriptId === baseId);

        if (matched) {
            matched.isForteSelected = true;
            return transcripts;
        }
    }

    // Second priority: MSK canonical transcript (tagged with "(canonical)" in displayName)
    const canonical = transcripts.find(t =>
        t.displayName.includes('(canonical)')
    );
    if (canonical) {
        canonical.isForteSelected = true;
        return transcripts;
    }

    // Third priority: first protein_coding transcript
    const proteinCoding = transcripts.find(t => t.biotype === 'protein_coding');
    if (proteinCoding) {
        proteinCoding.isForteSelected = true;
    } else {
        transcripts[0].isForteSelected = true;
    }

    return transcripts;
}

export { fetchTranscriptsFromEnsembl, fetchTranscriptsForGeneWithFallback };
