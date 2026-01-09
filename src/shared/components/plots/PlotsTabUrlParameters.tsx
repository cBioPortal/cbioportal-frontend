export type PlotsSelectionParam = {
    selectedGeneOption?: string;
    selectedGenesetOption?: string;
    selectedGenericAssayOption?: string;
    dataType?: string;
    selectedDataSourceOption?: string;
    mutationCountBy?: string;
    structuralVariantCountBy?: string;
    logScale?: string;
};

const PlotsSelectionParamProps: Required<PlotsSelectionParam> = {
    selectedGeneOption: '',
    selectedGenesetOption: '',
    selectedGenericAssayOption: '',
    dataType: '',
    selectedDataSourceOption: '',
    mutationCountBy: '',
    structuralVariantCountBy: '',
    logScale: '',
};

export type PlotsColoringParam = {
    selectedOption?: string;
    logScale?: string;
    colorByMutationType?: string;
    colorByCopyNumber?: string;
    colorBySv?: string;
};

const PlotsColoringParamProps: Required<PlotsColoringParam> = {
    selectedOption: '',
    logScale: '',
    colorByMutationType: '',
    colorByCopyNumber: '',
    colorBySv: '',
};

export const PLOTS_TAB_URL_PARAMS = {
    plots_horz_selection: {
        isSessionProp: false,
        nestedObjectProps: PlotsSelectionParamProps,
    },
    plots_vert_selection: {
        isSessionProp: false,
        nestedObjectProps: PlotsSelectionParamProps,
    },
    plots_coloring_selection: {
        isSessionProp: false,
        nestedObjectProps: PlotsColoringParamProps,
    },
};
