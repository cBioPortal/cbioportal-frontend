import { ClinicalAttribute } from 'cbioportal-ts-api-client';

export enum ColoringType {
    ClinicalData,
    MutationType,
    CopyNumber,
    LimitVal,
    StructuralVariant,
    None,
}

export enum PotentialColoringType {
    GenomicData,
    None,
    LimitValGenomicData,
    LimitVal,
}

export type SelectedColoringTypes = Partial<{ [c in ColoringType]: any }>;

export enum PlotType {
    ScatterPlot,
    WaterfallPlot,
    BoxPlot,
    DiscreteVsDiscrete,
}

export enum DiscreteVsDiscretePlotType {
    Bar = 'Bar',
    StackedBar = 'StackedBar',
    PercentageStackedBar = 'PercentageStackedBar',
    Table = 'Table',
}

export enum SortByOptions {
    Alphabetically = 'alphabetically',
    SortByTotalSum = 'SortByTotalSum',
}

export enum MutationCountBy {
    MutationType = 'MutationType',
    MutatedVsWildType = 'MutatedVsWildType',
    DriverVsVUS = 'DriverVsVUS',
    VariantAlleleFrequency = 'VariantAlleleFrequency',
    CancerCellFraction = 'CancerCellFraction',
    Clonality = 'Clonality',
}

export enum StructuralVariantCountBy {
    VariantType = 'VariantType',
    MutatedVsWildType = 'MutatedVsWildType',
}

export type PlotsTabDataSource = {
    [dataType: string]: { value: string; label: string }[];
};

export type PlotsTabOption = {
    value: string;
    label: string;
    plotAxisLabel?: string;
    genericAssayDataType?: string;
};

export type PlotsTabGeneOption = {
    value: number; // entrez id
    label: string; // hugo symbol
};

export type SampleIdsForPatientIds = {
    [patientId: string]: string[];
};

export type AxisMenuSelection = {
    entrezGeneId?: number;
    genesetId?: string;
    genericAssayEntityId?: string;
    selectedGeneOption?: PlotsTabGeneOption;
    selectedDataSourceOption?: PlotsTabOption;
    selectedGenesetOption?: PlotsTabOption;
    selectedGenericAssayOption?: PlotsTabOption;
    genericAssayDataType?: string; // LIMIT-VALUE, CATEGORICAL, BINARY
    selectedCategories: any[];
    dataType?: string; // Generic Assay saves genericAssayType as dataType
    dataSourceId?: string;
    mutationCountBy: MutationCountBy;
    structuralVariantCountBy: StructuralVariantCountBy;
    logScale: boolean;
};

export type ColoringMenuOmnibarOption = {
    label: string;
    value: string;
    info: {
        entrezGeneId?: number;
        clinicalAttribute?: ClinicalAttribute;
    };
};

export type ColoringMenuOmnibarGroup = {
    label: string;
    options: ColoringMenuOmnibarOption[];
};

export type ColoringMenuSelection = {
    selectedOption: ColoringMenuOmnibarOption | undefined;
    logScale?: boolean;
    readonly colorByMutationType: boolean;
    readonly colorByCopyNumber: boolean;
    readonly colorByStructuralVariant: boolean;
    default: {
        entrezGeneId?: number;
    };
};

export const NONE_SELECTED_OPTION_STRING_VALUE = 'none';
export const NONE_SELECTED_OPTION_NUMERICAL_VALUE = -10000;
export const NONE_SELECTED_OPTION_LABEL = 'Ordered samples';
export const ALL_SELECTED_OPTION_NUMERICAL_VALUE = -30000;
export const SAME_SELECTED_OPTION_STRING_VALUE = 'same';
export const SAME_SELECTED_OPTION_NUMERICAL_VALUE = -20000;
