import { ResourceTableMetadataResult } from 'shared/api/resourceTableClient';

/**
 * Which tabs a resource gets on the patient page.
 *
 * A resource whose rows carry metadata keeps its table, since the columns and filters are how
 * the user finds an item; its viewer opens beside it from the View action. A resource without
 * metadata has nothing for a table to show but a list of links, so its tab is the viewer.
 */

// Same as PatientViewPageTabs' prefixes; importing them here would cycle through the page.
const VIEWER_TAB_PREFIX = 'openResource_';
const TABLE_TAB_PREFIX = 'resourceTable_';

/** True when the backend reports at least one metadata column for the resource. */
export function hasMetadataColumns(
    metadata: Pick<ResourceTableMetadataResult, 'columns'>
): boolean {
    return metadata.columns.some(column => column.source === 'metadata');
}

/** The `openResources` URL parameter as a list of resource ids. */
export function parseOpenResources(param: string | undefined): string[] {
    return (param || '').split(',').filter(id => id.length > 0);
}

/** The parameter for a list of ids; undefined removes it from the URL when nothing is open. */
export function serializeOpenResources(ids: string[]): string | undefined {
    return ids.length > 0 ? ids.join(',') : undefined;
}

/**
 * The tab to show instead, when the URL names a table tab for a resource that has none.
 * Links to `resourceTable_<id>` come from the study view table and from earlier shared URLs.
 */
export function redirectForViewerOnly(
    activeTabId: string,
    viewerOnlyIds: string[]
): string | undefined {
    if (!activeTabId.startsWith(TABLE_TAB_PREFIX)) {
        return undefined;
    }
    const resourceId = activeTabId.slice(TABLE_TAB_PREFIX.length);
    return viewerOnlyIds.includes(resourceId)
        ? `${VIEWER_TAB_PREFIX}${resourceId}`
        : undefined;
}

/**
 * The resource to add to the open set, when the URL shows a table resource's viewer that the
 * set does not list. That happens for a shared or bookmarked link to the viewer; without adding
 * it, the viewer would close as soon as the user moved to another tab.
 */
export function viewerToAdopt(
    activeTabId: string,
    presence: { [resourceId: string]: boolean },
    openIds: string[]
): string | undefined {
    if (!activeTabId.startsWith(VIEWER_TAB_PREFIX)) {
        return undefined;
    }
    const resourceId = activeTabId.slice(VIEWER_TAB_PREFIX.length);
    // Only a resource with a table has a closable viewer to keep; a viewer-only resource's
    // viewer is its one tab and is always there.
    return presence[resourceId] && !openIds.includes(resourceId)
        ? resourceId
        : undefined;
}
