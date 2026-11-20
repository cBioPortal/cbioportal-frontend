import { cached } from './cache.js';
import { getJson } from './upstream.js';

type CbioGene = { entrezGeneId: number; hugoGeneSymbol: string; type: string };

export type GeneResolution =
    | { input: string; status: 'found'; hugo: string; entrezGeneId: number }
    | { input: string; status: 'alias'; hugo: string; entrezGeneId: number }
    | { input: string; status: 'ambiguous'; candidates: string[] }
    | { input: string; status: 'unknown'; suggestions: string[] };

const DAY = 24 * 60 * 60 * 1000;
const geneCache = new Map<string, { at: number; gene: CbioGene | null }>();
const aliasCache = cached<GeneResolution>(DAY);

async function fetchGenes(
    portal: string,
    symbols: string[]
): Promise<Map<string, CbioGene | null>> {
    const out = new Map<string, CbioGene | null>();
    const missing: string[] = [];
    for (const s of symbols) {
        const hit = geneCache.get(`${portal}|${s}`);
        if (hit && Date.now() - hit.at < DAY) out.set(s, hit.gene);
        else missing.push(s);
    }
    if (missing.length) {
        const found = await getJson<CbioGene[]>(
            'cBioPortal',
            `${portal}/api/genes/fetch?geneIdType=HUGO_GENE_SYMBOL`,
            { method: 'POST', body: JSON.stringify(missing) }
        );
        const bySymbol = new Map(
            found.map(g => [g.hugoGeneSymbol.toUpperCase(), g])
        );
        for (const s of missing) {
            const gene = bySymbol.get(s) ?? null;
            geneCache.set(`${portal}|${s}`, { at: Date.now(), gene });
            out.set(s, gene);
        }
    }
    return out;
}

async function resolveAlias(
    portal: string,
    symbol: string
): Promise<GeneResolution> {
    return aliasCache(`${portal}|${symbol}`, async () => {
        const hits = await getJson<CbioGene[]>(
            'cBioPortal',
            `${portal}/api/genes?keyword=${encodeURIComponent(
                symbol
            )}&pageSize=10`
        );
        const exact: CbioGene[] = [];
        for (const g of hits) {
            const aliases = await getJson<string[]>(
                'cBioPortal',
                `${portal}/api/genes/${encodeURIComponent(
                    g.hugoGeneSymbol
                )}/aliases`
            ).catch(() => [] as string[]);
            if (aliases.some(a => a.toUpperCase() === symbol)) exact.push(g);
        }
        if (exact.length === 1) {
            return {
                input: symbol,
                status: 'alias',
                hugo: exact[0].hugoGeneSymbol,
                entrezGeneId: exact[0].entrezGeneId,
            };
        }
        if (exact.length > 1)
            return {
                input: symbol,
                status: 'ambiguous',
                candidates: exact.map(g => g.hugoGeneSymbol),
            };
        return {
            input: symbol,
            status: 'unknown',
            suggestions: hits
                .filter(g => g.type === 'protein-coding')
                .map(g => g.hugoGeneSymbol)
                .slice(0, 5),
        };
    });
}

/** Resolves symbols or aliases to canonical HUGO symbols using the portal's gene table. */
export async function resolveGenes(
    portal: string,
    symbols: string[]
): Promise<GeneResolution[]> {
    const upper = [
        ...new Set(symbols.map(s => s.trim().toUpperCase()).filter(Boolean)),
    ];
    const found = await fetchGenes(portal, upper);
    return Promise.all(
        upper.map(
            async (s): Promise<GeneResolution> => {
                const g = found.get(s);
                if (g)
                    return {
                        input: s,
                        status: 'found',
                        hugo: g.hugoGeneSymbol,
                        entrezGeneId: g.entrezGeneId,
                    };
                return resolveAlias(portal, s);
            }
        )
    );
}
