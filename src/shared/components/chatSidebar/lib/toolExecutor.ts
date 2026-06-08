import { getBrowserWindow } from 'cbioportal-frontend-commons';

// Tools executed in the browser. Any tool name not in this set is assumed to
// be executed server-side (e.g. MCP tools) and its result arrives over the
// stream rather than being produced here.
export const CLIENT_TOOL_NAMES = new Set<string>([
    'get_current_page',
    'navigate_to_url',
    'navigate_to_study',
    'query_available_charts',
    'apply_study_filter',
    'clear_study_filter',
]);

export function isClientTool(toolName: string): boolean {
    return CLIENT_TOOL_NAMES.has(toolName);
}

export async function executeToolCall(
    toolName: string,
    args: Record<string, unknown>
): Promise<unknown> {
    switch (toolName) {
        case 'get_current_page':
            return getCurrentPage();
        case 'navigate_to_url':
            return navigateToUrl(args);
        case 'navigate_to_study':
            return navigateToStudy(args);
        case 'query_available_charts':
            return queryAvailableCharts();
        case 'apply_study_filter':
            return applyStudyFilter(args);
        case 'clear_study_filter':
            return clearStudyFilter(args);
        default:
            return { error: `Unknown tool: ${toolName}` };
    }
}

function getCurrentPage(): unknown {
    try {
        const routingStore = getBrowserWindow().routingStore;
        const location = routingStore?.location;
        if (!location) {
            return { error: 'Routing store not available' };
        }
        return {
            pathname: location.pathname,
            search: location.search || '',
            hash: location.hash || '',
            href: window.location.href,
        };
    } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
    }
}

function navigateToUrl(args: Record<string, unknown>): unknown {
    const url = args.url as string;
    if (!url) return { error: 'url is required' };
    try {
        // Parse the URL to extract the pathname + search + hash.
        // Supports both full URLs (https://cbioportal.org/study?id=x) and
        // relative paths (/study?id=x).
        let pathname: string;
        let search: string;
        let hash: string;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            const parsed = new URL(url);
            pathname = parsed.pathname;
            search = parsed.search;
            hash = parsed.hash;
        } else {
            // Relative URL — use URL with a dummy base to parse
            const parsed = new URL(url, 'http://localhost');
            pathname = parsed.pathname;
            search = parsed.search;
            hash = parsed.hash;
        }
        getBrowserWindow().routingStore.push(`${pathname}${search}${hash}`);
        return { success: true, navigatedTo: `${pathname}${search}${hash}` };
    } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
    }
}

function navigateToStudy(args: Record<string, unknown>): unknown {
    const studyId = args.studyId as string;
    if (!studyId) return { error: 'studyId is required' };
    try {
        getBrowserWindow().routingStore.push(`/study?id=${studyId}`);
        return { success: true, studyId };
    } catch (e) {
        return { error: e.message };
    }
}

function getStudyViewStore(): any | null {
    return (getBrowserWindow() as any).studyViewPageStore ?? null;
}

function queryAvailableCharts(): unknown {
    const store = getStudyViewStore();
    if (!store) {
        return {
            error: 'Not on study view page. Navigate to a study first.',
        };
    }
    try {
        const charts = store.visibleAttributes ?? [];
        return {
            charts: charts.map((c: any) => ({
                uniqueKey: c.uniqueKey,
                displayName: c.displayName,
                dataType: c.dataType,
            })),
        };
    } catch (e) {
        return { error: e.message };
    }
}

function applyStudyFilter(args: Record<string, unknown>): unknown {
    const store = getStudyViewStore();
    if (!store) {
        return {
            error: 'Not on study view page. Navigate to a study first.',
        };
    }
    try {
        const { chartUniqueKey, filterType, values } = args as {
            chartUniqueKey: string;
            filterType: 'categorical' | 'interval';
            values: any[];
        };
        if (filterType === 'categorical') {
            // The store expects DataFilterValue objects ({ value }); the model
            // supplies plain strings, so wrap them. Objects are passed through.
            const dataFilterValues = (values ?? []).map(v =>
                typeof v === 'string' ? { value: v } : v
            );
            store.updateClinicalDataFilterByValues(
                chartUniqueKey,
                dataFilterValues
            );
        } else if (filterType === 'interval') {
            // updateClinicalDataIntervalFilters reads { start, end } off each
            // entry, which matches the model's range objects.
            store.updateClinicalDataIntervalFilters(
                chartUniqueKey,
                values ?? []
            );
        } else {
            return { error: `Unknown filterType: ${filterType}` };
        }
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}

function clearStudyFilter(args: Record<string, unknown>): unknown {
    const store = getStudyViewStore();
    if (!store) {
        return {
            error: 'Not on study view page. Navigate to a study first.',
        };
    }
    try {
        const { chartUniqueKey } = args as { chartUniqueKey: string };
        // Clear both categorical and interval filters — no-op if chart isn't that type
        store.updateClinicalDataFilterByValues(chartUniqueKey, []);
        store.updateClinicalDataIntervalFilters(chartUniqueKey, []);
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}
