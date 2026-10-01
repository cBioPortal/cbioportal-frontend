import { ComparisonRow } from './comparisonRows';
import { GenomeBuild } from './genomeNexusTranscriptService';

// Transcript cache key: a gene may be fetched as its canonical isoform (empty
// id) AND as one or more caller-selected isoforms. Keyed on genome build too:
// a fetch before the build is known must not shadow the correct-build
// transcript; after a build change lookups miss under the new key and refetch.
export const txKey = (build: string, symbol: string, transcriptId?: string) =>
    `${build}|${symbol}|${transcriptId || ''}`;

// The build a single row's coordinates are on. The row outranks the cohort:
// a mixed-build export has no single correct cohort build.
export const buildForRow = (
    row: ComparisonRow,
    fallback: GenomeBuild
): GenomeBuild => {
    const b = row.event.ncbiBuild;
    return b === 'GRCh37' || b === 'GRCh38' ? b : fallback;
};

export interface TranscriptRequest {
    symbol: string;
    transcriptId: string;
    build: GenomeBuild;
}

// Deduped requests. Resolution reads every gene's bare-symbol key at the
// COHORT build; each row's caller isoform and row-build canonical are needed
// only at that row's own build.
export function transcriptRequestsForRows(
    rows: ComparisonRow[],
    cohortBuild: GenomeBuild
): TranscriptRequest[] {
    const map = new Map<string, TranscriptRequest>();
    const add = (symbol: string, transcriptId: string, build: GenomeBuild) => {
        if (!symbol) return;
        const k = txKey(build, symbol, transcriptId);
        if (!map.has(k)) map.set(k, { symbol, transcriptId, build });
    };
    rows.forEach(r => {
        const e = r.event;
        const rowBuild = buildForRow(r, cohortBuild);
        add(e.gene1.symbol, '', rowBuild);
        add(e.gene1.symbol, e.gene1.selectedTranscriptId || '', rowBuild);
        if (e.gene2) {
            add(e.gene2.symbol, '', rowBuild);
            add(e.gene2.symbol, e.gene2.selectedTranscriptId || '', rowBuild);
        }
        add(e.gene1.symbol, '', cohortBuild);
        if (e.gene2) add(e.gene2.symbol, '', cohortBuild);
    });
    return Array.from(map.values());
}
