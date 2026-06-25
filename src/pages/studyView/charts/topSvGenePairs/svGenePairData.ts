import { SampleIdentifier, StructuralVariant } from 'cbioportal-ts-api-client';

export interface SvGenePairRow {
    uniqueKey: string; // canonical "GENEA::GENEB", alphabetical
    gene1: string;
    gene2: string;
    sampleCount: number; // distinct samples
    sampleIdentifiers: SampleIdentifier[];
}

export function buildPairKey(g1: string, g2: string): string {
    const a = g1 || '-';
    const b = g2 || '-';
    return [a, b].sort().join('::');
}

export function buildSvGenePairRows(svs: StructuralVariant[]): SvGenePairRow[] {
    const pairMap = new Map<
        string,
        { sampleSet: Map<string, SampleIdentifier> }
    >();

    for (const sv of svs) {
        const g1 = sv.site1HugoSymbol || '';
        const g2 = sv.site2HugoSymbol || '';

        // skip when both symbols are missing
        if (!g1 && !g2) {
            continue;
        }

        const key = buildPairKey(g1, g2);
        if (!pairMap.has(key)) {
            pairMap.set(key, { sampleSet: new Map() });
        }
        const entry = pairMap.get(key)!;
        const sampleKey = `${sv.studyId}:${sv.sampleId}`;
        if (!entry.sampleSet.has(sampleKey)) {
            entry.sampleSet.set(sampleKey, {
                studyId: sv.studyId,
                sampleId: sv.sampleId,
            });
        }
    }

    const rows: SvGenePairRow[] = [];
    for (const [key, { sampleSet }] of pairMap.entries()) {
        const [gene1, gene2] = key.split('::');
        const sampleIdentifiers = Array.from(sampleSet.values());
        rows.push({
            uniqueKey: key,
            gene1,
            gene2,
            sampleCount: sampleIdentifiers.length,
            sampleIdentifiers,
        });
    }

    rows.sort((a, b) => b.sampleCount - a.sampleCount);
    return rows;
}
