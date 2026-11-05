import _ from 'lodash';
import {
    ResourceTableRow,
    ResourceTableTab,
} from 'shared/api/resourceTableClient';

/**
 * A row as the table renders it. `patientId` and `sampleId` are display labels and fall back to
 * the row's scope ("Study-wide", "Sample-level"), so the stable ids are carried separately for the
 * patient and sample links.
 */
export interface IResourceTableRow {
    key: string;
    studyId: string;
    patientId: string;
    sampleId: string;
    patientStableId?: string;
    sampleStableId?: string;
    resourceType: string;
    resourceScope: string;
    resourceId: string;
    description: string;
    url: string;
    metadata: Record<string, string>;
}

export interface IResourceTableTab {
    id: string;
    label: string;
    totalCount: number;
    patientCount: number;
    sampleCount: number;
}

/**
 * Several resources a resource table shows as one tab, read together through the API's
 * `resourceIds`, in place of each resource's own tab. `id` names the tab, not a resource.
 */
export interface CombinedResourceTab {
    id: string;
    label: string;
    resourceIds: string[];
}

/** How a resource table lists resources; all optional, the default lists each in its own tab. */
export interface ResourceTableStoreOptions {
    /** Resources left out of the table, e.g. ones another view shows. */
    hideResource?: (resourceId: string) => boolean;
    /**
     * Tabs that show several resources together, in place of their own tabs. hideResource is
     * asked about a combined tab's id, not about its resources.
     */
    combinedTabs?: CombinedResourceTab[];
    /**
     * Metadata keys a table over these resources leaves out of its columns and its download,
     * e.g. ones only another view reads.
     */
    hideMetadataKey?: (
        resourceIds: readonly string[],
        metadataKey: string
    ) => boolean;
}

/**
 * Whether a table with these options lists a resource: in a combined tab, or in its own tab
 * unless hidden.
 */
export function isResourceListedInTable(
    resourceId: string,
    options: ResourceTableStoreOptions
): boolean {
    return (
        (options.combinedTabs || []).some(tab =>
            tab.resourceIds.includes(resourceId)
        ) ||
        !options.hideResource ||
        !options.hideResource(resourceId)
    );
}

export function getResourceTableMetadataKeys(rows: IResourceTableRow[]) {
    return _.sortBy(
        _.uniq(
            _.flatMap(rows, row => Object.keys(row.metadata)).filter(
                key => key.length > 0
            )
        ),
        key => key.toLowerCase()
    );
}

/**
 * Maps API rows onto the shape the table renders. Shared by the table, the download and the
 * viewer, so all three see the same synthesized metadata keys.
 */
export function toResourceTableRows(
    rows: ResourceTableRow[]
): IResourceTableRow[] {
    return rows.map((row: ResourceTableRow, index: number) => {
        const metadata: Record<string, string> = {};
        if (row.metadata) {
            Object.entries(row.metadata).forEach(([key, value]) => {
                if (value != null) {
                    metadata[key] = String(value);
                }
            });
        }
        metadata['resource_scope'] = row.resourceType || '';
        try {
            const url = new URL(row.url, 'https://www.cbioportal.org');
            metadata['host'] = url.hostname;
            const ext = url.pathname.split('.').pop();
            metadata['file_type'] =
                ext && ext.length <= 5 ? ext.toLowerCase() : 'link';
        } catch {
            metadata['file_type'] = 'link';
        }

        return {
            key: `${row.resourceId}::${row.patientId ||
                'study'}::${row.sampleId || row.resourceType}::${index}`,
            patientId: row.patientId || 'Study-wide',
            sampleId:
                row.sampleId ||
                (row.resourceType === 'SAMPLE'
                    ? 'Sample-level'
                    : row.resourceType === 'PATIENT'
                    ? 'Patient-level'
                    : 'Study-level'),
            resourceType: row.resourceDisplayName || row.resourceId,
            resourceScope: row.resourceType,
            resourceId: row.resourceId,
            description: row.displayName || '',
            url: row.url,
            metadata,
            studyId: row.studyId,
            patientStableId: row.patientId || undefined,
            sampleStableId: row.sampleId || undefined,
        } as IResourceTableRow;
    });
}

/** Lowercased extension of the URL's path; the base lets a relative URL parse. */
export function getFileExtension(url: string): string | undefined {
    try {
        const urlObj = new URL(url, 'https://www.cbioportal.org');
        const match = urlObj.pathname.match(/.+\.(.+)/);
        return match ? match[1].toLowerCase() : undefined;
    } catch {
        return undefined;
    }
}

/** True when every row of the resource applies to the study as a whole rather than to a case. */
export function isStudyWideResource(
    tab: Pick<ResourceTableTab, 'totalCount' | 'patientCount' | 'sampleCount'>
): boolean {
    return (
        tab.totalCount > 0 && tab.patientCount === 0 && tab.sampleCount === 0
    );
}
