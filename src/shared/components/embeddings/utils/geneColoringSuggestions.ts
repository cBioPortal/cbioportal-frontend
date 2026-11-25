import { GeneColoringSuggestion } from '../EmbeddingsPanelStore';

/** How many genes the colour-by menu suggests before anyone searches. */
export const GENE_COLORING_SUGGESTION_COUNT = 10;

/** "38%", or "<1%" for a gene altered in too few cases to round up to one. */
export function formatAlteredFraction(altered: number, profiled: number) {
    if (!(profiled > 0) || !(altered > 0)) {
        return '0%';
    }
    const percent = (100 * altered) / profiled;
    return percent < 1 ? '<1%' : `${Math.round(percent)}%`;
}

/**
 * The most frequently mutated genes, ranked by mutated cases as the study
 * view's Mutated Genes table ranks them, and noted with the share of profiled
 * cases. Ranking by that share instead would let a gene profiled in only a
 * few cases outrank the cohort's real drivers. Ties go alphabetically so the
 * list is stable.
 */
export function mostFrequentlyMutatedGenes(
    rows: {
        entrezGeneId: number;
        hugoGeneSymbol: string;
        numberOfAlteredCases: number;
        numberOfProfiledCases: number;
    }[],
    count: number = GENE_COLORING_SUGGESTION_COUNT
): GeneColoringSuggestion[] {
    return rows
        .filter(row => row.numberOfAlteredCases > 0)
        .slice()
        .sort(
            (a, b) =>
                b.numberOfAlteredCases - a.numberOfAlteredCases ||
                a.hugoGeneSymbol.localeCompare(b.hugoGeneSymbol)
        )
        .slice(0, count)
        .map(row => ({
            entrezGeneId: row.entrezGeneId,
            hugoGeneSymbol: row.hugoGeneSymbol,
            detail: formatAlteredFraction(
                row.numberOfAlteredCases,
                row.numberOfProfiledCases
            ),
        }));
}

type GeneRef = { entrezGeneId: number; hugoGeneSymbol: string };

// Short enough to sit beside a gene symbol in a 190px menu.
const ALTERATION_KINDS = ['Mut', 'Amp', 'Del', 'SV'] as const;
type AlterationKind = typeof ALTERATION_KINDS[number];

/**
 * The genes one patient has alterations in, each noted with the kinds of
 * alteration. Cancer genes come first, since a patient can carry hundreds of
 * passenger mutations; then genes with more kinds of alteration, then
 * alphabetical. Germline mutations and copy-number changes short of an
 * amplification or deep deletion are left out.
 */
export function genesAlteredInPatient(
    alterations: {
        mutations: { gene: GeneRef; mutationStatus?: string }[];
        cnas: { gene: GeneRef; alteration: number }[];
        structuralVariants: {
            site1EntrezGeneId?: number;
            site1HugoSymbol?: string;
            site2EntrezGeneId?: number;
            site2HugoSymbol?: string;
        }[];
    },
    cancerGeneEntrezGeneIds: Set<number>,
    count: number = GENE_COLORING_SUGGESTION_COUNT
): GeneColoringSuggestion[] {
    const byGene = new Map<
        number,
        { hugoGeneSymbol: string; kinds: Set<AlterationKind> }
    >();
    const add = (
        entrezGeneId: number | undefined,
        hugoGeneSymbol: string | undefined,
        kind: AlterationKind
    ) => {
        if (!entrezGeneId || !hugoGeneSymbol) {
            return;
        }
        const entry = byGene.get(entrezGeneId) || {
            hugoGeneSymbol,
            kinds: new Set<AlterationKind>(),
        };
        entry.kinds.add(kind);
        byGene.set(entrezGeneId, entry);
    };

    alterations.mutations
        .filter(m => (m.mutationStatus || '').toLowerCase() !== 'germline')
        .forEach(m => add(m.gene.entrezGeneId, m.gene.hugoGeneSymbol, 'Mut'));
    alterations.cnas.forEach(c => {
        if (c.alteration === 2) {
            add(c.gene.entrezGeneId, c.gene.hugoGeneSymbol, 'Amp');
        } else if (c.alteration === -2) {
            add(c.gene.entrezGeneId, c.gene.hugoGeneSymbol, 'Del');
        }
    });
    alterations.structuralVariants.forEach(sv => {
        add(sv.site1EntrezGeneId, sv.site1HugoSymbol, 'SV');
        add(sv.site2EntrezGeneId, sv.site2HugoSymbol, 'SV');
    });

    return Array.from(byGene.entries())
        .sort(
            ([idA, a], [idB, b]) =>
                Number(cancerGeneEntrezGeneIds.has(idB)) -
                    Number(cancerGeneEntrezGeneIds.has(idA)) ||
                b.kinds.size - a.kinds.size ||
                a.hugoGeneSymbol.localeCompare(b.hugoGeneSymbol)
        )
        .slice(0, count)
        .map(([entrezGeneId, { hugoGeneSymbol, kinds }]) => ({
            entrezGeneId,
            hugoGeneSymbol,
            detail: ALTERATION_KINDS.filter(k => kinds.has(k)).join(' · '),
        }));
}
