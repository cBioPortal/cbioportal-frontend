import { StructuralVariant } from 'cbioportal-ts-api-client';

export interface GenePartnerCount {
    gene: string;
    count: number;
}

export function getGenePartnerCounts(
    variants: StructuralVariant[],
    queryGene: string
): GenePartnerCount[] {
    if (!queryGene || !queryGene.trim()) {
        return [];
    }

    const counts = new Map<string, number>();
    const query = queryGene.trim().toUpperCase();

    variants.forEach(variant => {
        const gene1 = variant.site1HugoSymbol;
        const gene2 = variant.site2HugoSymbol;

        let partner: string | undefined;

        if (gene1 && gene1.toUpperCase() === query) {
            partner = gene2;
        } else if (gene2 && gene2.toUpperCase() === query) {
            partner = gene1;
        }

        if (partner && partner.toUpperCase() !== query) {
            counts.set(partner, (counts.get(partner) || 0) + 1);
        }
    });

    return Array.from(counts, ([gene, count]) => ({ gene, count })).sort(
        (a, b) => b.count - a.count || a.gene.localeCompare(b.gene)
    );
}
