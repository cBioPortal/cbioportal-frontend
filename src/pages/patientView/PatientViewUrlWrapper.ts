import URLWrapper from 'shared/lib/URLWrapper';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import { PagePath } from 'shared/enums/PagePaths';
import { computed, makeObservable } from 'mobx';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { PatientViewPageTabs } from './PatientViewPageTabs';
import {
    PlotsColoringParam,
    PlotsSelectionParam,
    PLOTS_TAB_URL_PARAMS,
} from 'shared/components/plots/PlotsTabUrlParameters';
import { clearWsiHashFromCurrentUrl } from 'shared/components/wsiViewer/wsiViewStateUtils';

export type PatientViewUrlQuery = {
    studyId: string;
    caseId?: string;
    sampleId?: string;
    stainFilter?: string;
    matchLevel?: string;
    specimenKey?: string;
    timepointDays?: string;
    wsiScope?: 'linkout' | 'patient';
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

    /**
     * Navigate to an internal WSI linkout without reloading the patient page.
     * Returns false for external or malformed linkouts so callers can retain
     * the browser's normal anchor behavior.
     */
    public navigateToWsiLinkout = (href: string): boolean => {
        let target: URL;
        try {
            target = new URL(href, getBrowserWindow().location.origin);
        } catch (_) {
            return false;
        }

        if (
            target.origin !== getBrowserWindow().location.origin ||
            target.pathname !==
                `/${PagePath.Patient}/${PatientViewPageTabs.WSIHESlides}`
        ) {
            return false;
        }

        const studyId = target.searchParams.get('studyId');
        if (!studyId) {
            return false;
        }

        this.updateURL(
            {
                studyId,
                caseId: target.searchParams.get('caseId') || undefined,
                sampleId: target.searchParams.get('sampleId') || undefined,
                stainFilter:
                    target.searchParams.get('stainFilter') || undefined,
                matchLevel: target.searchParams.get('matchLevel') || undefined,
                specimenKey:
                    target.searchParams.get('specimenKey') || undefined,
                timepointDays:
                    target.searchParams.get('timepointDays') || undefined,
                // Internal pathology links are already known to be scoped;
                // normalize legacy links that predate the explicit marker.
                wsiScope: 'linkout',
            },
            target.pathname,
            true
        );
        clearWsiHashFromCurrentUrl();

        return true;
    };

    public redirectUnavailableWsiRoute(): void {
        clearWsiHashFromCurrentUrl();
        this.updateURL(
            {
                stainFilter: undefined,
                matchLevel: undefined,
                specimenKey: undefined,
                timepointDays: undefined,
                wsiScope: undefined,
            },
            `${PagePath.Patient}/${PatientViewPageTabs.Summary}`
        );
    }

    @computed public get activeTabId() {
        const lastSlashIndex = this.pathName.lastIndexOf('/');
        const activeTab =
            lastSlashIndex >= 0
                ? this.pathName.slice(lastSlashIndex + 1)
                : this.pathName;
        return activeTab || PatientViewPageTabs.Summary;
    }

    public setResourceUrl(resourceUrl: string) {
        this.updateURL({ resourceUrl });
    }

    /**
     * Sample-only routes can omit caseId. Once a WSI facet is changed we
     * intentionally release the sample scope, but only after the patient
     * store supplies the authoritative patient identifier.
     */
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

    public setWsiTimepointDays(days?: number, patientId?: string): void {
        this.updateURL({
            ...this.patientScopeReleaseParams(patientId),
            ...(this.shouldReleaseSampleScope(patientId)
                ? { sampleId: undefined }
                : {}),
            specimenKey: undefined,
            timepointDays: days == null ? undefined : String(days),
            wsiScope: 'patient',
        });
    }

    public setWsiStainFilter(
        filter: 'all' | 'hne' | 'ihc',
        patientId?: string
    ): void {
        this.updateURL({
            ...this.patientScopeReleaseParams(patientId),
            ...(this.shouldReleaseSampleScope(patientId)
                ? { sampleId: undefined }
                : {}),
            specimenKey: undefined,
            stainFilter: filter === 'all' ? undefined : filter,
            wsiScope: 'patient',
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
            wsiScope: 'patient',
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
            wsiScope: 'patient',
        });
    }
}
