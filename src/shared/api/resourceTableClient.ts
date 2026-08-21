import axios from 'axios';
import { getCbioPortalApiUrl } from 'shared/api/urls';

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
    priority: number;
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
}

export interface ResourceFacetOption {
    value: string;
    count: number;
}

export interface ResourceTableResult {
    tabs: ResourceTableTab[];
    columns: ResourceColumnInfo[];
    rows: ResourceTableRow[];
    totalRowCount: number;
    filteredPatientCount: number;
    filteredSampleCount: number;
    facets: { [columnId: string]: ResourceFacetOption[] };
}

export interface ResourceTabsRequest {
    studyIds: string[];
    patientIds: string[];
    sampleIds: string[];
}

export interface ResourceColumnFilter {
    columnId: string;
    operator: string;
    values: string[];
}

export interface ResourceTableQuery {
    studyIds: string[];
    resourceId: string;
    patientIds: string[];
    sampleIds: string[];
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
