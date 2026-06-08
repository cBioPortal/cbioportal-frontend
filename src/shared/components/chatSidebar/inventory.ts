// What is actually rendered on the cBioPortal results view right now — the
// DOM-scraped surface the highlights call grounds against, and the
// `cbioportal://page-inventory` MCP resource reads. Extracted verbatim from
// AlterationBeacons.buildInventory() so the beacons component and the MCP
// surface share one implementation.

// Map canonical alteration_type keys to the legend_label strings rendered by
// oncoprintjs/geneticrules.ts. Prefix-matched because oncoprint sometimes
// appends qualifiers like " (putative driver)".
export const LABEL_PREFIXES: Record<string, string[]> = {
    amplification: ['Amplification'],
    deep_deletion: ['Deep Deletion'],
    gain: ['Gain'],
    shallow_deletion: ['Shallow Deletion'],
    missense: ['Missense Mutation'],
    truncating: ['Truncating Mutation'],
    splice: ['Splice Mutation'],
    inframe: ['Inframe Mutation'],
    structural_variant: ['Structural Variant', 'Fusion'],
    mrna_high: ['mRNA High'],
    mrna_low: ['mRNA Low'],
    protein_high: ['Protein High'],
    protein_low: ['Protein Low'],
};

export const TAB_HINTS = [
    'oncoprint',
    'mutations',
    'cancerTypesSummary',
    'mutualExclusivity',
    'plots',
    'survival',
    'cnSegments',
    'coexpression',
    'comparison',
    'structuralVariants',
    'pathways',
] as const;

export type TabHint = typeof TAB_HINTS[number];

export interface PageInventory {
    /** Canonical alteration buckets visible in the oncoprint legend. */
    alterations: string[];
    /** Queried gene tracks present on the oncoprint. */
    genes: string[];
    /** Results-view tabs currently mounted. */
    tabs: string[];
}

// Scan the live DOM for the alteration buckets, gene tracks, and tabs the user
// can actually see. `genes` is passed in (the caller knows the queried set)
// rather than re-derived from the DOM.
export function scrapeInventory(genes: string[]): PageInventory {
    // Which canonical alteration buckets have visible legend labels.
    const presentAlterations = new Set<string>();
    const textNodes = document.querySelectorAll<SVGTextElement>('svg text');
    for (const t of Array.from(textNodes)) {
        const txt = (t.textContent || '').trim();
        if (!txt) continue;
        for (const [altType, prefixes] of Object.entries(LABEL_PREFIXES)) {
            if (prefixes.some(p => txt.startsWith(p))) {
                presentAlterations.add(altType);
                break;
            }
        }
    }
    // Tabs: which tab anchors exist on the page right now.
    const tabs = TAB_HINTS.filter(h =>
        document.querySelector(`.tabAnchor_${h}`)
    );
    return {
        alterations: Array.from(presentAlterations),
        genes: genes ?? [],
        tabs: tabs as string[],
    };
}
