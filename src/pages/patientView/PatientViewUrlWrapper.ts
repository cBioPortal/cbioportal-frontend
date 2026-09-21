import {
    WsiTimepointSelection,
    WsiStainFilter,
} from 'shared/components/wsiViewer/wsiViewerTypes';
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
    stainFilter?: string;
    matchLevel?: string;
    specimenKey?: string;
    timepointDays?: string;
    wsiScope?: 'linkout';
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

const PATIENT_VIEW_URL_PROPS = {
    studyId: { isSessionProp: false, isHashedProp: true },
    caseId: { isSessionProp: false, isHashedProp: true },
    sampleId: { isSessionProp: false, isHashedProp: true },
    stainFilter: { isSessionProp: false },
    matchLevel: { isSessionProp: false },
    specimenKey: { isSessionProp: false },
    timepointDays: { isSessionProp: false },
    wsiScope: { isSessionProp: false },
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
    ...PLOTS_TAB_URL_PARAMS,
    geneset_list: { isSessionProp: true },
    generic_assay_groups: { isSessionProp: false },
};

export default class PatientViewUrlWrapper extends URLWrapper<
    PatientViewUrlQuery
> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, PATIENT_VIEW_URL_PROPS);
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

    private patientScopeReleaseParams(
        patientId?: string
    ): Partial<PatientViewUrlQuery> {
        if (this.query.caseId || !this.query.sampleId || !patientId) {
            return {};
        }
        return { caseId: patientId };
    }

    private shouldReleaseSampleScope(patientId?: string): boolean {
        return !!this.query.caseId || !this.query.sampleId || !!patientId;
    }

    public setWsiTimepointDays(
        days?: WsiTimepointSelection,
        patientId?: string
    ): void {
        this.updateURL({
            ...this.patientScopeReleaseParams(patientId),
            ...(this.shouldReleaseSampleScope(patientId)
                ? { sampleId: undefined }
                : {}),
            specimenKey: undefined,
            timepointDays: days == null ? undefined : String(days),
            wsiScope: undefined,
        });
    }

    public setWsiStainFilter(filter: WsiStainFilter, patientId?: string): void {
        this.updateURL({
            ...this.patientScopeReleaseParams(patientId),
            ...(this.shouldReleaseSampleScope(patientId)
                ? { sampleId: undefined }
                : {}),
            specimenKey: undefined,
            stainFilter: filter === 'all' ? undefined : filter,
            wsiScope: undefined,
        });
    }

    public setWsiMatchFilter(
        filter: 'all' | 'part' | 'block' | 'unmatched',
        patientId?: string
    ): void {
        this.updateURL({
            ...this.patientScopeReleaseParams(patientId),
            ...(this.shouldReleaseSampleScope(patientId)
                ? { sampleId: undefined }
                : {}),
            specimenKey: undefined,
            matchLevel: filter === 'all' ? undefined : filter.toUpperCase(),
            wsiScope: undefined,
        });
    }

    public clearWsiFilters(patientId?: string): void {
        this.updateURL({
            ...this.patientScopeReleaseParams(patientId),
            ...(this.shouldReleaseSampleScope(patientId)
                ? { sampleId: undefined }
                : {}),
            stainFilter: undefined,
            matchLevel: undefined,
            specimenKey: undefined,
            timepointDays: undefined,
            wsiScope: undefined,
        });
    }
}
