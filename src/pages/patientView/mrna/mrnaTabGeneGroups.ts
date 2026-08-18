// Predefined gene-group "presets" surfaced in the mRNA tab's Genes picker.
// Each group is a single first-class item in the picker: selecting one adds
// every constituent gene as a chart row. Groups can be combined with picks
// of individual genes; selections are stored as a flat list where each entry
// is either a Hugo symbol or the token `group:<id>`.

export interface GeneGroup {
    id: string;
    label: string;
    // Short label shown as a GitHub-style chip in the expression table's
    // "Labels" column (the full `label` is the chip's tooltip).
    abbrev: string;
    // Chip background color (solid; chip text is white).
    color: string;
    genes: string[];
}

export const STUDY_VIEW_DEFAULT_GENE_SPECIFIC_VIOLIN_GROUP_ID = 'msk-target';

export const MRNA_TAB_GENE_GROUPS: GeneGroup[] = [
    {
        id: STUDY_VIEW_DEFAULT_GENE_SPECIFIC_VIOLIN_GROUP_ID,
        label: 'Study view default ADC targets',
        abbrev: 'MSK-T',
        color: '#1f5fa8',
        genes: [
            'CD276',
            'CLDN18',
            'DLL3',
            'EGFR',
            'ERBB2',
            'ERBB3',
            'FOLR1',
            'MET',
            'NECTIN4',
            'TACSTD2',
        ],
    },
    {
        id: 'fda-adc',
        label: 'FDA-approved ADC targets',
        abbrev: 'FDA',
        color: '#3f72af',
        // adcs_approved
        genes: [
            'CCR4',
            'CD19',
            'CD22',
            'CD274',
            'CD33',
            'CD38',
            'CD52',
            'CD79B',
            'DLL3',
            'EGFR',
            'ERBB2',
            'ERBB3',
            'F3',
            'FOLR1',
            'IL6',
            'KDR',
            'MAGEA4',
            'MET',
            'MS4A1',
            'NECTIN4',
            'PMEL',
            'SLAMF7',
            'TACSTD2',
            'TNFRSF17',
            'TNFRSF8',
            'TNFSF11',
        ],
    },
    {
        id: 'msk-trial',
        label: 'ADC targets in trial at MSK',
        abbrev: 'MSK',
        color: '#e08a1e',
        // adcs_at_msk (DAM9 corrected to ADAM9)
        genes: [
            'CSF1R',
            'DLL3',
            'F3',
            'FOLH1',
            'FOLR1',
            'B4GALNT1',
            'PMEL',
            'ERBB2',
            'KIT',
            'MAGEA4',
            'MET',
            'NECTIN4',
            'SSTR2',
            'TACSTD2',
            'TNFRSF8',
            'CD276',
            'CEACAM5',
            'CLDN18',
            'EGFR',
            'ERBB3',
            'KLK2',
            'STEAP1',
            'AXL',
            'CDH17',
            'CDH6',
            'CEACAM6',
            'CLDN6',
            'FAP',
            'FGFR2',
            'GPC3',
            'LRRC15',
            'LY6E',
            'MSLN',
            'MUC16',
            'NCAM1',
            'CTAG1B',
            'PRAME',
            'SLC34A2',
            'SLC39A6',
            'VTCN1',
            'WT1',
            'ALCAM',
            'ENPP3',
            'GRPR',
            'LGR5',
            'MUC1',
            'PTK7',
            'ROR1',
            'SEZ6',
            'TFRC',
            'ADAM9',
            'CA9',
            'CD274',
            'CD70',
            'CDH3',
            'CFC1B',
            'EPHA2',
            'FGFR3',
            'ITGB6',
            'NT5E',
        ],
    },
    {
        id: 'other-trial',
        label: 'ADC targets in trial other places',
        abbrev: 'TRIAL',
        color: '#5aa454',
        // adcs_investigational (ALPGvALPP split into ALPG + ALPP)
        genes: [
            'ACVRL1',
            'ADAM9',
            'ADGRE2',
            'AFP',
            'ALCAM',
            'AXL',
            'BSG',
            'BTN1A1',
            'BTN3A1',
            'BTN3A2',
            'CA6',
            'CA9',
            'CALR',
            'CCKBR',
            'CCR7',
            'CD200',
            'CD24',
            'CD276',
            'CD37',
            'CD40',
            'CD46',
            'CD47',
            'CD48',
            'KRAS',
            'CD5',
            'CD70',
            'CD74',
            'CDH17',
            'CDH3',
            'CDH6',
            'CEACAM1',
            'CEACAM5',
            'CEACAM6',
            'CLDN6',
            'CLEC12A',
            'CLU',
            'CTAG1A',
            'CTAG1B',
            'CXCL8',
            'DKK1',
            'CXCR4',
            'DDR1',
            'DLK1',
            'DLL4',
            'DPEP3',
            'EDNRB',
            'EFNA4',
            'ALPG',
            'ALPP',
            'B4GALNT1',
            'ENG',
            'ENPP3',
            'EPCAM',
            'EPHA2',
            'EPHA5',
            'CCN2',
            'FAP',
            'FCRL5',
            'FGFR2',
            'FGFR3',
            'FLT3',
            'CD44',
            'FOLH1',
            'FUT2',
            'GDF15',
            'CD180',
            'GJA1',
            'CDCP1',
            'GPC2',
            'GPC3',
            'GPNMB',
            'GPRC5D',
            'GUCY2C',
            'HAVCR1',
            'CLDN18',
            'IGF1',
            'IGF1R',
            'CNTN4',
            'IGF2',
            'IL13RA2',
            'IL1RAP',
            'IL2RA',
            'IL3RA',
            'DPP4',
            'ITGA5',
            'ITGAV',
            'ITGB1',
            'ITGB3',
            'ITGB6',
            'KAAG1',
            'FCGR1A',
            'KIR3DL2',
            'KIT',
            'KLK2',
            'LAIR1',
            'LAMP1',
            'LGR5',
            'LIF',
            'LILRB1',
            'LILRB2',
            'LILRB3',
            'LILRB4',
            'LRP1',
            'LRRC15',
            'LY75',
            'ITGA2',
            'MAGEA1',
            'MAGEA3',
            'MAGEA6',
            'MAGEC2',
            'MICA',
            'MICB',
            'MLANA',
            'MMP14',
            'MMP2',
            'MSLN',
            'MUC1',
            'MUC16',
            'LY6E',
            'MYO1G',
            'NCAM1',
            'NCR3LG1',
            'NOTCH3',
            'NRG1',
            'NRP1',
            'NT5E',
            'NTN1',
            'NTSR1',
            'PDCD1LG2',
            'PLEC',
            'PRAME',
            'PTK7',
            'PTPRC',
            'PVR',
            'PVRIG',
            'RAET1E',
            'RAET1G',
            'RAET1L',
            'ROBO1',
            'ROR1',
            'ROR2',
            'PRND',
            'PSCA',
            'SDC1',
            'SEMA4D',
            'SEZ6',
            'SIGLEC15',
            'SLC34A2',
            'SLC39A6',
            'SLC3A2',
            'SLC44A4',
            'SLITRK6',
            'SORT1',
            'SSTR2',
            'SLC1A5',
            'ST8SIA1',
            'STAB1',
            'STEAP1',
            'TFRC',
            'TGFB1',
            'TGFB2',
            'TGFB3',
            'TMEFF2',
            'TNFRSF10B',
            'TNFRSF13C',
            'TM4SF1',
            'TM4SF5',
            'TNFSF13B',
            'TPBG',
            'TRPV6',
            'ULBP1',
            'ULBP2',
            'ULBP3',
            'VEGFA',
            'VEGFB',
            'VEGFC',
            'VEGFD',
            'VIM',
            'VTCN1',
        ],
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

// Patient-derived "dynamic" gene sets. Unlike the static groups above, their
// member genes are computed at runtime from the current patient's own data
// (mutations, structural variants, copy-number alterations), so they carry
// only an id + label here; PlotsStore resolves the genes (see
// dynamicGroupSymbols) and effectiveGeneSymbols expands the token.
export const PATIENT_MUTATIONS_GROUP_ID = 'patient-mutations';
export const PATIENT_SV_GROUP_ID = 'patient-sv';
export const PATIENT_CNA_GROUP_ID = 'patient-cna';

export interface DynamicGeneGroup {
    id: string;
    label: string;
    abbrev: string;
    color: string;
}

export const MRNA_TAB_PATIENT_GENE_GROUPS: DynamicGeneGroup[] = [
    {
        id: PATIENT_MUTATIONS_GROUP_ID,
        label: 'Genes with mutations in this patient',
        abbrev: 'MUT',
        color: '#c0392b',
    },
    {
        id: PATIENT_SV_GROUP_ID,
        label: 'Genes with structural variants in this patient',
        abbrev: 'SV',
        color: '#8e44ad',
    },
    {
        id: PATIENT_CNA_GROUP_ID,
        label: 'Genes with CNA in this patient',
        abbrev: 'CNA',
        color: '#16a085',
    },
];

// Unified label metadata for every gene group (static presets + patient-derived
// dynamic groups), in the order they should appear as chips / filter options.
// `id` matches the token used in PlotsStore.mrnaTabSelections (`group:<id>`).
export interface GeneGroupLabelMeta {
    id: string;
    label: string;
    abbrev: string;
    color: string;
}

export const ALL_GENE_GROUP_LABEL_META: GeneGroupLabelMeta[] = [
    ...MRNA_TAB_GENE_GROUPS.map(g => ({
        id: g.id,
        label: g.label,
        abbrev: g.abbrev,
        color: g.color,
    })),
    ...MRNA_TAB_PATIENT_GENE_GROUPS.map(g => ({
        id: g.id,
        label: g.label,
        abbrev: g.abbrev,
        color: g.color,
    })),
];

const GENE_GROUP_LABEL_META_BY_ID: {
    [id: string]: GeneGroupLabelMeta;
} = ALL_GENE_GROUP_LABEL_META.reduce((acc, m) => {
    acc[m.id] = m;
    return acc;
}, {} as { [id: string]: GeneGroupLabelMeta });

export function getGeneGroupLabelMeta(
    id: string
): GeneGroupLabelMeta | undefined {
    return GENE_GROUP_LABEL_META_BY_ID[id];
}
