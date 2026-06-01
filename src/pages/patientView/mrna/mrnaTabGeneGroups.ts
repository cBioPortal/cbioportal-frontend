// Predefined gene-group "presets" surfaced in the mRNA tab's Genes picker.
// Each group is a single first-class item in the picker: selecting one adds
// every constituent gene as a chart row. Groups can be combined with picks
// of individual genes; selections are stored as a flat list where each entry
// is either a Hugo symbol or the token `group:<id>`.

export interface GeneGroup {
    id: string;
    label: string;
    genes: string[];
}

export const MRNA_TAB_GENE_GROUPS: GeneGroup[] = [
    {
        id: 'fda-adc',
        label: 'FDA-approved ADC targets',
        genes: [
            'ERBB2', // HER2 — Trastuzumab emtansine (Kadcyla), Trastuzumab deruxtecan (Enhertu)
            'ERBB3', // HER3 — Patritumab deruxtecan
            'TACSTD2', // TROP2 — Sacituzumab govitecan (Trodelvy), Datopotamab deruxtecan
            'TNFRSF8', // CD30 — Brentuximab vedotin (Adcetris)
            'CD22', // Inotuzumab ozogamicin (Besponsa)
            'CD79B', // Polatuzumab vedotin (Polivy)
            'CD33', // Gemtuzumab ozogamicin (Mylotarg)
            'TNFRSF17', // BCMA — Belantamab mafodotin (Blenrep)
            'FOLR1', // Folate receptor alpha — Mirvetuximab soravtansine (Elahere)
            'NECTIN4', // Enfortumab vedotin (Padcev)
            'F3', // Tissue Factor — Tisotumab vedotin (Tivdak)
        ],
    },
    {
        id: 'msk-trial',
        label: 'ADC targets in trial at MSK',
        // Placeholder — replace with the canonical MSK-trial ADC target list.
        genes: ['TP53', 'BRCA1', 'BRCA2', 'EGFR', 'KRAS', 'BRAF', 'PTEN', 'MYC'],
    },
    {
        id: 'other-trial',
        label: 'ADC targets in trial other places',
        // Placeholder — replace with the canonical non-MSK-trial ADC list.
        genes: ['RB1', 'APC', 'ATM', 'CDKN2A', 'PIK3CA', 'AKT1', 'NF1', 'VHL'],
    },
    {
        id: 'in-dev',
        label: 'ADC targets in development',
        // Placeholder — replace with the canonical in-development ADC list.
        genes: ['CDH1', 'SMAD4', 'NOTCH1', 'MTOR', 'FBXW7', 'ARID1A', 'MYB', 'MET'],
    },
];

export const GENE_GROUP_VALUE_PREFIX = 'group:';

export function groupValue(group: GeneGroup): string {
    return `${GENE_GROUP_VALUE_PREFIX}${group.id}`;
}

export function isGroupValue(value: string): boolean {
    return value.startsWith(GENE_GROUP_VALUE_PREFIX);
}

export function findGroupByValue(value: string): GeneGroup | undefined {
    if (!isGroupValue(value)) {
        return undefined;
    }
    const id = value.slice(GENE_GROUP_VALUE_PREFIX.length);
    return MRNA_TAB_GENE_GROUPS.find(g => g.id === id);
}
