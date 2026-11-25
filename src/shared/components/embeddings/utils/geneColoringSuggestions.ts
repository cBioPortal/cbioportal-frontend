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

type GeneCount = {
    entrezGeneId: number;
    hugoGeneSymbol: string;
    numberOfAlteredCases: number;
    numberOfProfiledCases: number;
};

// How many kinds a cohort suggestion notes, largest first; more would not fit
// beside the symbol.
const MAX_KINDS_NOTED = 2;
// A further kind is noted only when it is at least this share of the gene's
// most frequent one, so "Del 10% · Mut 5%" shows but "Mut 45% · Del 1%" is
// just "Mut 45%".
const MIN_NOTED_KIND_SHARE = 0.25;

/**
 * The cohort's most frequently altered genes, by mutation, amplification,
 * deep deletion or structural variant, since colouring by a gene shows all of
 * them. Each kind keeps its own count: the API counts them separately, and
 * adding them up would count a case with two kinds twice. A gene ranks by its
 * most frequent kind, by cases as the study view's gene tables rank them;
 * ranking by share of profiled cases instead would let a gene profiled in
 * only a few cases outrank the cohort's real drivers. Ties go alphabetically
 * so the list is stable.
 */
export function mostFrequentlyAlteredGenes(
    counts: {
        mutations: GeneCount[];
        cnas: (GeneCount & { alteration: number })[];
        structuralVariants: GeneCount[];
    },
    count: number = GENE_COLORING_SUGGESTION_COUNT
): GeneColoringSuggestion[] {
    const byGene = new Map<
        number,
        {
            hugoGeneSymbol: string;
            kinds: { kind: string; altered: number; profiled: number }[];
        }
    >();
    const add = (row: GeneCount, kind: string) => {
        if (!(row.numberOfAlteredCases > 0)) {
            return;
        }
        const entry = byGene.get(row.entrezGeneId) || {
            hugoGeneSymbol: row.hugoGeneSymbol,
            kinds: [],
        };
        entry.kinds.push({
            kind,
            altered: row.numberOfAlteredCases,
            profiled: row.numberOfProfiledCases,
        });
        byGene.set(row.entrezGeneId, entry);
    };
    counts.mutations.forEach(row => add(row, 'Mut'));
    counts.cnas.forEach(row => {
        if (row.alteration === 2) {
            add(row, 'Amp');
        } else if (row.alteration === -2) {
            add(row, 'Del');
        }
    });
    counts.structuralVariants.forEach(row => add(row, 'SV'));

    const top = (kinds: { altered: number }[]) =>
        Math.max(...kinds.map(k => k.altered));
    return Array.from(byGene.entries())
        .sort(
            ([, a], [, b]) =>
                top(b.kinds) - top(a.kinds) ||
                a.hugoGeneSymbol.localeCompare(b.hugoGeneSymbol)
        )
        .slice(0, count)
        .map(([entrezGeneId, { hugoGeneSymbol, kinds }]) => ({
            entrezGeneId,
            hugoGeneSymbol,
            detail: kinds
                .slice()
                .sort((a, b) => b.altered - a.altered)
                .filter(
                    (k, i, sorted) =>
                        i === 0 ||
                        k.altered >= MIN_NOTED_KIND_SHARE * sorted[0].altered
                )
                .slice(0, MAX_KINDS_NOTED)
                .map(
                    k =>
                        `${k.kind} ${formatAlteredFraction(
                            k.altered,
                            k.profiled
                        )}`
                )
                .join(' · '),
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
