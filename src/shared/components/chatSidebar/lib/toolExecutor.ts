import { getBrowserWindow } from 'cbioportal-frontend-commons';

// Tools executed in the browser. Any tool name not in this set is assumed to
// be executed server-side (e.g. MCP tools) and its result arrives over the
// stream rather than being produced here.
export const CLIENT_TOOL_NAMES = new Set<string>([
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
