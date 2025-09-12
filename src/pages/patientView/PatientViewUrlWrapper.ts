import URLWrapper from 'shared/lib/URLWrapper';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import { PagePath } from 'shared/enums/PagePaths';
import { computed, makeObservable } from 'mobx';
import { PatientViewPageTabs } from './PatientViewPageTabs';

export type PatientViewUrlQuery = {
    studyId: string;
    caseId?: string;
    sampleId?: string;
    resourceUrl?: string;
    genomicEvolutionSettings: {
        showTimeline?: string;

        clusterHeatmap?: string;
        transposeHeatmap?: string;
        showMutationLabelsInHeatmap?: string;

        showOnlySelectedMutationsInChart?: string;
        logScaleChart?: string;
        yAxisDataRangeInChart?: string;

        showOnlySelectedMutationsInTable?: string;
    };
    plots_horz_selection: PlotsSelectionParam;
    plots_vert_selection: PlotsSelectionParam;
    plots_coloring_selection: PlotsColoringParam;
    geneset_list: any;
    generic_assay_groups: any;
};

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

export default class PatientViewUrlWrapper extends URLWrapper<
    PatientViewUrlQuery
> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            studyId: { isSessionProp: false, isHashedProp: true },
            caseId: { isSessionProp: false, isHashedProp: true },
            sampleId: { isSessionProp: false, isHashedProp: true },
            resourceUrl: { isSessionProp: false },
            genomicEvolutionSettings: {
                isSessionProp: false,
                nestedObjectProps: {
                    showTimeline: '',

                    clusterHeatmap: '',
                    transposeHeatmap: '',
                    showMutationLabelsInHeatmap: '',

                    showOnlySelectedMutationsInChart: '',
                    logScaleChart: '',
                    yAxisDataRangeInChart: '',

                    showOnlySelectedMutationsInTable: '',
                },
            },
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
            geneset_list: { isSessionProp: true },
            generic_assay_groups: { isSessionProp: false },
        });
        makeObservable(this);
    }

    public setActiveTab(tab: string): void {
        this.updateURL({}, `${PagePath.Patient}/${tab}`);
    }

    @computed public get activeTabId() {
        return this.pathName.split('/').pop() || PatientViewPageTabs.Summary;
    }

    public setResourceUrl(resourceUrl: string) {
        this.updateURL({ resourceUrl });
    }
}
