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
 * `resourceIds`, in place of each resource's own tab. `id` names the tab.
 *
 * `id` may equal one of its own members' ids: that resource is then read through this tab, like
 * the others. A fetched resource with this id that is not a member is not shown; the tab takes its
 * place. A resource listed by two combined tabs belongs to the first of them (the configuration
 * is warned about once).
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
     * Metadata keys a table over these resources does not show: they are not columns and not in
     * the download. The rows still carry them, and server-side search and facets still see them,
     * so this is display-only, not a security boundary.
     */
    hideMetadataKey?: (
        resourceIds: readonly string[],
        metadataKey: string
    ) => boolean;
}

const warnedCombinedTabOverlaps = new Set<string>();

/**
 * The combined tab each resource belongs to. A resource two combined tabs list belongs to the
 * first of them; that misconfiguration is warned about once.
 */
export function combinedTabOwners(
    combinedTabs: readonly CombinedResourceTab[] = []
): Map<string, CombinedResourceTab> {
    const owners = new Map<string, CombinedResourceTab>();
    combinedTabs.forEach(tab =>
        tab.resourceIds.forEach(resourceId => {
            const owner = owners.get(resourceId);
            if (!owner) {
                owners.set(resourceId, tab);
                return;
            }
            const key = [resourceId, owner.id, tab.id].join('\u0000');
            if (owner !== tab && !warnedCombinedTabOverlaps.has(key)) {
                warnedCombinedTabOverlaps.add(key);
                console.warn(
                    `Resource ${resourceId} is in combined tabs ${owner.id} and ${tab.id}; ` +
                        `it is shown only in ${owner.id}.`
                );
            }
        })
    );
    return owners;
}

/**
 * The id of the tab a table with these options lists a resource in: its combined tab, or else its
 * own; undefined when hideResource hides that tab, or when a combined tab takes the place of a
 * resource that is not one of its members.
 */
export function resourceTabIdInTable(
    resourceId: string,
    options: ResourceTableStoreOptions
): string | undefined {
    const combinedTabs = options.combinedTabs || [];
    const owner = combinedTabOwners(combinedTabs).get(resourceId);
    if (!owner && combinedTabs.some(tab => tab.id === resourceId)) {
        return undefined;
    }
    const tabId = owner ? owner.id : resourceId;
    const hide = options.hideResource;
    return hide && hide(tabId) ? undefined : tabId;
}

/** Whether a table with these options lists a resource; see resourceTabIdInTable. */
export function isResourceListedInTable(
    resourceId: string,
    options: ResourceTableStoreOptions
): boolean {
    return resourceTabIdInTable(resourceId, options) !== undefined;
}

/**
 * The tabs a table with these options lists for these resources, in the order of their first
 * resource: a combined tab once, under its label, and any other resource under its display name.
 */
export function listedResourceTabs(
    definitions: readonly { resourceId: string; displayName: string }[],
    options: ResourceTableStoreOptions
): { id: string; label: string }[] {
    const combinedTabs = options.combinedTabs || [];
    const tabs: { id: string; label: string }[] = [];
    definitions.forEach(definition => {
        const id = resourceTabIdInTable(definition.resourceId, options);
        if (id === undefined || tabs.some(tab => tab.id === id)) {
            return;
        }
        const combined = combinedTabs.find(tab => tab.id === id);
        tabs.push({
            id,
            label: combined ? combined.label : definition.displayName,
        });
    });
    return tabs;
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

/**
 * Whether study view shows a tab as the resource itself, in a viewer, rather than as a table: a
 * resource's own tab whose rows are all study-wide. A combined tab is always a table, since its
 * id names no resource the viewer could read.
 */
export function isResourceViewerTab(
    tab: Pick<
        ResourceTableTab,
        'resourceId' | 'totalCount' | 'patientCount' | 'sampleCount'
    > & { resourceIds: readonly string[] },
    options: ResourceTableStoreOptions = {}
): boolean {
    const isCombined = (options.combinedTabs || []).some(
        combined => combined.id === tab.resourceId
    );
    return (
        !isCombined &&
        tab.resourceIds.length === 1 &&
        tab.resourceIds[0] === tab.resourceId &&
        isStudyWideResource(tab)
    );
}
