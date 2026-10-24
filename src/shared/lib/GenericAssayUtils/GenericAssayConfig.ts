import { getServerConfig } from 'config/config';
import _ from 'lodash';

export type GenericAssayConfig = {
    genericAssayConfigByType: {
        [genericAssayType: string]: GenericAssayTypeConfig;
    };
    // Add more Generic Assay global config from here
};

export const GenericAssayTypeConstants: { [s: string]: string } = {
    TREATMENT_RESPONSE: 'TREATMENT_RESPONSE',
    MUTATIONAL_SIGNATURE: 'MUTATIONAL_SIGNATURE',
    ARMLEVEL_CNA: 'ARMLEVEL_CNA',
    LOH_HLA: 'LOH_HLA',
    METHYLATION: 'METHYLATION',
    ISIG_PROBABILITY: 'ISIG_PROBABILITY',
};

export type GenericAssayTypeConfig = {
    // Add more Generic Assay type specific config at here
    displayTitleText?: string;
    globalConfig?: GlobalConfig;
    oncoprintTrackConfig?: OncoprintTrackConfig;
    plotsTabConfig?: PlotsTabConfig;
    selectionConfig?: SelectionConfig;
    frequencyTableConfig?: FrequencyTableConfig;
    downloadTabConfig?: DownloadTabConfig;
};

export type GenericAssayOncoprintChartType =
    | 'heatmap'
    | 'bars'
    | 'composition'
    | 'absolute'
    | 'dominant';

export const GENERIC_ASSAY_CHART_TYPE_LABELS: {
    [type in GenericAssayOncoprintChartType]: string;
} = {
    heatmap: 'Separate rows (heatmap)',
    bars: 'Separate rows (bar chart)',
    composition: 'Stacked bar (composition)',
    absolute: 'Stacked bar (absolute)',
    dominant: 'Dominant category',
};

export type GenericAssayCategory = {
    stableId: string;
    label: string;
    color: string;
};

export type OncoprintTrackConfig = {
    formatNameUsingCompactLabel?: boolean;
    formatDescriptionUsingCommonLabel?: boolean;
    // Chart types offered for the profile, in menu order. The first one is
    // used when tracks are added. Defaults to every type except 'dominant'.
    chartTypes?: GenericAssayOncoprintChartType[];
    // Entities shown in the stacked bar and dominant category tracks, in
    // stacking order, with their legend labels and colors.
    categories?: GenericAssayCategory[];
};

export type PlotsTabConfig = {
    plotsTabUsecompactLabel?: boolean;
};

export type GlobalConfig = {
    geneRelatedGenericAssayType?: boolean;
    entityTitle?: string;
};

export type SelectionConfig = {
    placeHolderText?: string;
    formatChartNameUsingCompactLabel?: boolean;
};

export type DownloadTabConfig = {
    formatDownloadHeaderUsingCompactLabel?: boolean;
};

export type FrequencyTableConfig = {
    categoryPriority?: string[][];
    defaultHiddenCategories?: string[];
};

// We have some customizations for Gene related Generic Assay profiles (e.g. Methylation)
// One can add new GenericAssayTypes at here to enable those customization for added types
const geneRelatedGenericAssayTypes = [GenericAssayTypeConstants.METHYLATION];

const DEFAULT_GENE_RELATED_CONFIG = {
    genericAssayConfigByType: {
        // populate gene related configs
        ..._.reduce(
            geneRelatedGenericAssayTypes,
            (acc, type) => {
                acc[type] = {
                    globalConfig: {
                        geneRelatedGenericAssayType: true,
                    },
                };
                return acc;
            },
            {} as { [genericAssayType: string]: any }
        ),
    },
};

export function initializeGenericAssayServerConfig() {
    if (getServerConfig().generic_assay_display_text) {
        const typeWithTextList = getServerConfig().generic_assay_display_text.split(
            ','
        );
        _.each(typeWithTextList, typewWithText => {
            const typeAndText = typewWithText.split(':');
            if (typeAndText.length == 2) {
                const genericAssayConfigByType =
                    GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                        typeAndText[0]
                    ];
                if (!genericAssayConfigByType) {
                    GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                        typeAndText[0]
                    ] = {};
                }
                GENERIC_ASSAY_CONFIG.genericAssayConfigByType[typeAndText[0]][
                    'displayTitleText'
                ] = typeAndText[1];
            }
        });
    }
}

const DEFAULT_GENERIC_ASSAY_CONFIG: GenericAssayConfig = {
    genericAssayConfigByType: {
        [GenericAssayTypeConstants.TREATMENT_RESPONSE]: {
            displayTitleText: 'Treatment Response',
        },
        [GenericAssayTypeConstants.MUTATIONAL_SIGNATURE]: {
            displayTitleText: 'Mutational Signature',
        },
        [GenericAssayTypeConstants.ARMLEVEL_CNA]: {
            displayTitleText: 'Arm-level CNA',
            frequencyTableConfig: {
                categoryPriority: [
                    ['loss', 'deletion', 'gain', 'amp', 'amplification'],
                    ['unchanged', 'diploid', 'neutral'],
                ],
                defaultHiddenCategories: ['unchanged', 'unknown'],
            },
        },
        [GenericAssayTypeConstants.LOH_HLA]: {
            displayTitleText: 'HLA LOH',
            frequencyTableConfig: {
                categoryPriority: [['loss'], ['unchanged']],
                defaultHiddenCategories: ['unchanged', 'unknown'],
            },
        },
        [GenericAssayTypeConstants.METHYLATION]: {
            globalConfig: {
                entityTitle: 'Gene / Probe',
            },
            selectionConfig: {
                placeHolderText: 'Search for Gene / Probe...',
                formatChartNameUsingCompactLabel: true,
            },
            oncoprintTrackConfig: {
                formatDescriptionUsingCommonLabel: true,
                formatNameUsingCompactLabel: true,
            },
            plotsTabConfig: {
                plotsTabUsecompactLabel: true,
            },
            downloadTabConfig: {
                formatDownloadHeaderUsingCompactLabel: true,
            },
        },
        [GenericAssayTypeConstants.ISIG_PROBABILITY]: {
            displayTitleText: 'Immune Signature',
            oncoprintTrackConfig: {
                chartTypes: ['composition', 'dominant'],
                categories: [
                    {
                        stableId: 'ISIG_PROB_D',
                        label: 'Desert (D)',
                        color: '#c8b631',
                    },
                    {
                        stableId: 'ISIG_PROB_F',
                        label: 'Fibrotic (F)',
                        color: '#c4375b',
                    },
                    {
                        stableId: 'ISIG_PROB_IE',
                        label: 'Immune Enriched (IE)',
                        color: '#3b4fb8',
                    },
                    {
                        stableId: 'ISIG_PROB_IE_F',
                        label: 'Immune Enriched / Fibrotic (IE/F)',
                        color: '#2a9d8f',
                    },
                ],
            },
        },
    },
};

export const GENERIC_ASSAY_CONFIG: GenericAssayConfig = _.merge(
    DEFAULT_GENE_RELATED_CONFIG,
    DEFAULT_GENERIC_ASSAY_CONFIG
);

// 'absolute' is left out for fraction-like data, where every stacked bar
// would be full height.
export function getGenericAssayChartTypes(
    genericAssayType: string | undefined,
    isFractionLike: boolean = false
): GenericAssayOncoprintChartType[] {
    const configured = genericAssayType
        ? GENERIC_ASSAY_CONFIG.genericAssayConfigByType[genericAssayType]
              ?.oncoprintTrackConfig?.chartTypes
        : undefined;
    const types: GenericAssayOncoprintChartType[] = configured || [
        'heatmap',
        'bars',
        'composition',
        'absolute',
    ];
    return isFractionLike ? types.filter(t => t !== 'absolute') : types;
}

export function getGenericAssayCategories(
    genericAssayType: string | undefined
): GenericAssayCategory[] | undefined {
    return genericAssayType
        ? GENERIC_ASSAY_CONFIG.genericAssayConfigByType[genericAssayType]
              ?.oncoprintTrackConfig?.categories
        : undefined;
}

export function getFrequencyTableCategoryPriority(
    genericAssayType?: string
): string[][] | undefined {
    return genericAssayType
        ? GENERIC_ASSAY_CONFIG.genericAssayConfigByType[genericAssayType]
              ?.frequencyTableConfig?.categoryPriority
        : undefined;
}

export function getFrequencyTableDefaultHiddenCategories(
    genericAssayType?: string
): string[] | undefined {
    return genericAssayType
        ? GENERIC_ASSAY_CONFIG.genericAssayConfigByType[genericAssayType]
              ?.frequencyTableConfig?.defaultHiddenCategories
        : undefined;
}
