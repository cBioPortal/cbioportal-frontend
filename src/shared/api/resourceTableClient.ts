import axios from 'axios';
import { getCbioPortalApiUrl } from 'shared/api/urls';
import { PatientIdentifier, SampleIdentifier } from 'cbioportal-ts-api-client';

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
    type: string | null;
    metadata: { [key: string]: any };
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

export interface ResourceTableResult {
    tabs: ResourceTableTab[];
    columns: ResourceColumnInfo[];
    rows: ResourceTableRow[];
    totalRowCount: number;
    filteredPatientCount: number;
    filteredSampleCount: number;
    facets: { [columnId: string]: ResourceFacetOption[] };
    facetRanges: { [columnId: string]: ResourceNumericRange };
    // How many distinct values a few builtin columns carry across the whole filtered set,
    // keyed by backend field name. Used to hide columns that say the same thing in every row.
    distinctValueCounts?: { [backendField: string]: number };
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

export interface ResourceTableQuery {
    studyIds: string[];
    resourceId: string;
    patientIdentifiers: PatientIdentifier[];
    sampleIdentifiers: SampleIdentifier[];
    search?: string;
    pageNumber: number;
    pageSize: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
    filters?: ResourceColumnFilter[];
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
): Promise<ResourceTableResult> {
    const response = await axios.post<ResourceTableResult>(
        resourceTableApiUrl('query/fetch'),
        query
    );
    return response.data;
}
