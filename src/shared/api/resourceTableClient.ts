import axios from 'axios';
import { getCbioPortalApiUrl } from 'shared/api/urls';
import {
    PatientIdentifier,
    SampleIdentifier,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ResourceTableTab {
    resourceId: string;
    label: string;
    totalCount: number;
    patientCount: number;
    sampleCount: number;
}

export interface ResourceTableRow {
    studyId: string;
    resourceId: string;
    resourceDisplayName: string;
    resourceType: string;
    patientId: string | null;
    sampleId: string | null;
    url: string;
    displayName: string | null;
    metadata: { [key: string]: any };
}

/**
 * The half of the resource table that does not depend on which page is shown. Fetch it once per
 * study/resource/cohort/search/filter combination and keep it while the user pages; recomputing
 * facets and key discovery per page is the expensive part of a large resource's response.
 */
export interface ResourceTableMetadataResult {
    columns: ResourceColumnInfo[];
    totalRowCount: number;
    filteredPatientCount: number;
    filteredSampleCount: number;
    facets: { [columnId: string]: ResourceFacetOption[] };
    facetRanges: { [columnId: string]: ResourceNumericRange };
    distinctValueCounts: { [backendField: string]: number };
}

export interface ResourceColumnInfo {
    id: string;
    label: string;
    source: string; // 'builtin' | 'metadata'
    dataType: string;
    filterable: boolean;
    sortable: boolean;
    visibleByDefault: boolean;
    // From the resource_definition.custom_metadata contract, when the curator declared one.
    description?: string | null;
}

export interface ResourceFacetOption {
    value: string;
    count: number;
}

export interface ResourceNumericRange {
    min: number;
    max: number;
}

/**
 * resource_data stores *stable* ids, which are unique only within a study, so the cohort has to
 * travel as (studyId, id) pairs. Sending bare id lists alongside a separate study list lets the
 * backend match the cross product instead of the cohort: with two studies that each contain a
 * sample called TCGA-A1-A0SB-01, selecting one study's copy would also pull in the other's rows,
 * and the distinct counts would report the two samples as one.
 */
export interface ResourceTabsRequest {
    studyIds: string[];
    patientIdentifiers: PatientIdentifier[];
    sampleIdentifiers: SampleIdentifier[];
}

export interface ResourceColumnFilter {
    columnId: string;
    operator: string;
    values: string[];
}

/**
 * The request body of query/fetch, metadata/fetch and groups/fetch.
 *
 * The cohort is either the identifier lists or `studyViewFilter`, which the backend resolves to its
 * samples and their patients the way the study-view charts do; when present it replaces the lists.
 * Sending neither means every case in `studyIds`.
 *
 * `resourceId` names one resource; `resourceIds` reads several together as one table, and the two
 * combine when both are given.
 */
export interface ResourceTableQuery {
    studyIds: string[];
    resourceId?: string;
    resourceIds?: string[];
    patientIdentifiers?: PatientIdentifier[];
    sampleIdentifiers?: SampleIdentifier[];
    studyViewFilter?: StudyViewFilter;
    search?: string;
    pageNumber: number;
    pageSize: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
    filters?: ResourceColumnFilter[];
    /**
     * One entry per patient or per sample instead of one per row. Required by groups/fetch; on
     * metadata/fetch it makes each facet value count the groups carrying it. query/fetch rejects it.
     */
    groupBy?: ResourceGroupBy;
    /** Columns whose values groups/fetch counts per group: `metadata:<key>` or `resourceId`. */
    groupCounts?: string[];
    /** A group whose position under the current filters and sort groups/fetch reports. */
    locate?: ResourceGroupLocator;
}

export type ResourceGroupBy = 'patient' | 'sample';

/** Columns groups/fetch can sort groups by; `sampleId` only under sample grouping. */
export type ResourceGroupSort =
    | 'patientId'
    | 'sampleId'
    | 'studyId'
    | 'rowCount';

/** groups/fetch accepts pages of 1 to this many groups. */
export const RESOURCE_GROUPS_MAX_PAGE_SIZE = 1000;

/** groups/fetch counts at most this many columns per request. */
export const RESOURCE_GROUPS_MAX_COUNTS = 10;

/**
 * A patient under patient grouping or a sample under sample grouping, qualified by its study since
 * stable ids repeat across studies.
 */
export interface ResourceGroupLocator {
    studyId: string;
    patientId?: string;
    sampleId?: string;
}

/** One patient or sample of a grouped resource table. */
export interface ResourceTableGroup {
    studyId: string;
    patientId: string;
    /** Present under sample grouping only. */
    sampleId?: string;
    /** Rows the group holds once filters and search are applied. */
    rowCount: number;
    /** For each requested groupCounts column, how many of the group's rows carry each value. */
    counts: { [columnId: string]: { [value: string]: number } };
}

/** One page of a grouped resource table. */
export interface ResourceTableGroupPage {
    /** Groups left after filters and search, across every page. */
    totalGroups: number;
    /** Rows those groups hold together. */
    totalRows: number;
    /**
     * Zero-based position of the `locate` group under the current filters and sort; null when no
     * group was asked for or it has been filtered out.
     */
    locatedIndex: number | null;
    groups: ResourceTableGroup[];
}

// ── API helpers ────────────────────────────────────────────────────────────────

function resourceTableApiUrl(path: string): string {
    return `${getCbioPortalApiUrl()}/api/resource-table/${path}`;
}

export async function fetchResourceTableTabs(
    request: ResourceTabsRequest
): Promise<ResourceTableTab[]> {
    const response = await axios.post<ResourceTableTab[]>(
        resourceTableApiUrl('tabs/fetch'),
        request
    );
    return response.data;
}

export async function fetchResourceTableData(
    query: ResourceTableQuery
): Promise<ResourceTableRow[]> {
    const response = await axios.post<ResourceTableRow[]>(
        resourceTableApiUrl('query/fetch'),
        query
    );
    return response.data;
}

export async function fetchResourceTableMetadata(
    query: ResourceTableQuery
): Promise<ResourceTableMetadataResult> {
    const response = await axios.post<ResourceTableMetadataResult>(
        resourceTableApiUrl('metadata/fetch'),
        query
    );
    return response.data;
}

export async function fetchResourceTableGroups(
    query: ResourceTableQuery
): Promise<ResourceTableGroupPage> {
    const response = await axios.post<ResourceTableGroupPage>(
        resourceTableApiUrl('groups/fetch'),
        query
    );
    return response.data;
}
