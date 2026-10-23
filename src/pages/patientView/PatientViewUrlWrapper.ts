import URLWrapper from 'shared/lib/URLWrapper';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import { PagePath } from 'shared/enums/PagePaths';
import { computed, makeObservable } from 'mobx';
import { PatientViewPageTabs } from './PatientViewPageTabs';
import {
    PlotsColoringParam,
    PlotsSelectionParam,
    PLOTS_TAB_URL_PARAMS,
} from 'shared/components/plots/PlotsTabUrlParameters';

export type PatientViewUrlQuery = {
    studyId: string;
    caseId?: string;
    sampleId?: string;
    resourceUrl?: string;
    /** Resources whose viewer tab is open beside their table tab, comma separated. */
    openResources?: string;
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

export default class PatientViewUrlWrapper extends URLWrapper<
    PatientViewUrlQuery
> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            studyId: { isSessionProp: false, isHashedProp: true },
            caseId: { isSessionProp: false, isHashedProp: true },
            sampleId: { isSessionProp: false, isHashedProp: true },
            resourceUrl: { isSessionProp: false },
            openResources: { isSessionProp: false },
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
            ...PLOTS_TAB_URL_PARAMS,
            geneset_list: { isSessionProp: true },
            generic_assay_groups: { isSessionProp: false },
        });
        makeObservable(this);
    }

    public setActiveTab(tab: string, replace = false): void {
        this.updateURL({}, `${PagePath.Patient}/${tab}`, false, replace);
    }

    /** Changes tab and query together, so one user action leaves one history entry. */
    public setActiveTabWith(
        tab: string,
        params: Partial<PatientViewUrlQuery>
    ): void {
        this.updateURL(params, `${PagePath.Patient}/${tab}`);
    }

    @computed public get activeTabId() {
        return this.pathName.split('/').pop() || PatientViewPageTabs.Summary;
    }

    public setResourceUrl(resourceUrl: string, replace = false) {
        this.updateURL({ resourceUrl }, undefined, false, replace);
    }
}
