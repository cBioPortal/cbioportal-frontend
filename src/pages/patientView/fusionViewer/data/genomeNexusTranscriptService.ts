import {
    GenomeNexusAPI,
    EnsemblTranscript as GNEnsemblTranscript,
    Exon as GNExon,
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

function mapDomains(
    pfamRanges: PfamDomainRange[],
    pfamLookup: Record<string, PfamDomain>
): ProteinDomain[] {
    return pfamRanges.map(range => ({
        pfamId: range.pfamDomainId,
        name: pfamLookup[range.pfamDomainId]?.name || range.pfamDomainId,
        startAA: range.pfamDomainStart,
        endAA: range.pfamDomainEnd,
        startGenomic: 0,
        endGenomic: 0,
        source: 'Pfam',
    }));
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
        domains: mapDomains(gn.pfamDomains || [], pfamLookup),
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
