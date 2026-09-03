// Dispatches the current page store (currentPageStore.ts) to the
// get_page_details payload and the auto-sent context href.

import _ from 'lodash';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import { USER_SETTINGS_QUERY_PARAM } from 'pages/resultsView/ResultsViewURLWrapper';
import GroupComparisonStore from 'pages/groupComparison/GroupComparisonStore';
import {
    getNumSamples,
    getNumPatients,
} from 'pages/groupComparison/GroupComparisonUtils';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';
import { getCurrentPageStore } from './currentPageStore';

interface StudyViewVisibleChart {
    uniqueKey: string;
    displayName: string;
    dataType: string;
}

interface StudyViewDetails {
    available: true;
    pageType: 'study';
    currentTab: string;
    selectedSampleCount: number;
    selectedPatientCount: number;
    isFiltered: boolean;
    // Filters aren't repeated here — already in the auto-sent href
    // (getCurrentContextHref below) as #filterJson=...
    visibleCharts: StudyViewVisibleChart[];
}

interface ResultsViewDetails {
    available: true;
    pageType: 'results';
    currentTab: string;
    oqlText: string;
    hugoGeneSymbols: string[];
    caseSetId: string | undefined;
    sampleCount: number;
    patientCount: number;
    // Empty until customized — default tracks are computed client-side in
    // the OncoPrint component, not here.
    clinicalTrackAttributeIds: string[];
    // Raw heatmap_track_groups/generic_assay_groups URL params, unparsed.
    heatmapTrackGroups: string | undefined;
    genericAssayTrackGroups: string | undefined;
}

interface GroupComparisonGroupSummary {
    name: string;
    description: string;
    sampleCount: number;
    patientCount: number;
}

interface GroupComparisonDetails {
    available: true;
    pageType: 'groupComparison';
    groups: GroupComparisonGroupSummary[];
}

interface PatientViewDetails {
    available: true;
    pageType: 'patient';
    currentTab: string;
    pageMode: 'patient' | 'sample';
    // Set only when pageMode is 'sample' — the URL is scoped to one sample.
    sampleId: string | undefined;
    sampleCount: number;
    cancerType: string | undefined;
    timelineEventTypes: string[];
    // More than one id means panel coverage may differ across samples.
    genePanelIds: string[];
}

interface UnavailableDetails {
    available: false;
}

export type PageDetails =
    | StudyViewDetails
    | ResultsViewDetails
    | GroupComparisonDetails
    | PatientViewDetails
    | UnavailableDetails;

function getStudyViewDetails(store: StudyViewPageStore): StudyViewDetails {
    return {
        available: true,
        pageType: 'study',
        currentTab: store.currentTab,
        selectedSampleCount: store.selectedSamples.result.length,
        selectedPatientCount: store.selectedPatients.length,
        isFiltered: store.chartsAreFiltered,
        visibleCharts: store.visibleAttributes.map(c => ({
            uniqueKey: c.uniqueKey,
            displayName: c.displayName,
            dataType: c.dataType,
        })),
    };
}

function getResultsViewDetails(
    store: ResultsViewPageStore
): ResultsViewDetails {
    return {
        available: true,
        pageType: 'results',
        currentTab: store.tabId,
        oqlText: store.oqlText,
        hugoGeneSymbols: store.hugoGeneSymbols,
        caseSetId: store.urlWrapper.query.case_set_id,
        sampleCount: store.filteredSamples.result?.length ?? 0,
        patientCount: store.filteredPatients.result?.length ?? 0,
        clinicalTrackAttributeIds: (
            store.pageUserSession.userSettings?.clinicallist ?? []
        ).map(c => String(c.stableId)),
        heatmapTrackGroups: store.urlWrapper.query.heatmap_track_groups,
        genericAssayTrackGroups: store.urlWrapper.query.generic_assay_groups,
    };
}

function getGroupComparisonDetails(
    store: GroupComparisonStore
): GroupComparisonDetails {
    return {
        available: true,
        pageType: 'groupComparison',
        groups: (store.activeGroups.result ?? []).map(g => ({
            name: g.name,
            description: g.description,
            sampleCount: getNumSamples(g),
            patientCount: getNumPatients(g),
        })),
    };
}

function getPatientViewDetails(
    store: PatientViewPageStore
): PatientViewDetails {
    return {
        available: true,
        pageType: 'patient',
        currentTab: store.currentTab,
        pageMode: store.pageMode,
        sampleId: store.pageMode === 'sample' ? store.sampleId : undefined,
        sampleCount: store.sampleIds.length,
        cancerType: store.studyMetaData.result?.cancerType?.name,
        timelineEventTypes: _.uniq(
            (store.clinicalEvents.result ?? []).map(e => e.eventType)
        ),
        genePanelIds: _.uniq(
            Object.values(store.sampleToMutationGenePanelId.result)
        ),
    };
}

export function getCurrentPageDetails(): PageDetails {
    const store = getCurrentPageStore();
    if (store instanceof StudyViewPageStore) {
        return getStudyViewDetails(store);
    }
    if (store instanceof ResultsViewPageStore) {
        return getResultsViewDetails(store);
    }
    if (store instanceof GroupComparisonStore) {
        return getGroupComparisonDetails(store);
    }
    if (store instanceof PatientViewPageStore) {
        return getPatientViewDetails(store);
    }
    return { available: false };
}

// Mirrors StudyViewPage.tsx's bookmark-link formula — Study View never puts
// filters in the address bar otherwise.
function getStudyViewContextHref(store: StudyViewPageStore): string {
    return `${window.location.protocol}//${window.location.host}${
        window.location.pathname
    }${window.location.search}#filterJson=${JSON.stringify(store.filters)}`;
}

// Mirrors ShareUI.tsx's bookmark-link formula — adds the OncoPrint track
// selection the plain URL doesn't carry.
function getResultsViewContextHref(store: ResultsViewPageStore): string {
    const userSettings = store.pageUserSession.userSettings;
    if (!userSettings) {
        return window.location.href;
    }
    const url = new URL(window.location.href);
    url.hash = `${USER_SETTINGS_QUERY_PARAM}=${JSON.stringify(userSettings)}`;
    return url.toString();
}

// Page-agnostic to callers — always one string. Group Comparison isn't
// special-cased: its URL already round-trips full state.
export function getCurrentContextHref(): string {
    const store = getCurrentPageStore();
    if (store instanceof StudyViewPageStore) {
        return getStudyViewContextHref(store);
    }
    if (store instanceof ResultsViewPageStore) {
        return getResultsViewContextHref(store);
    }
    return window.location.href;
}
