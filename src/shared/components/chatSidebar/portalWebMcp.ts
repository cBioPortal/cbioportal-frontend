// Registers go_to_page as a native WebMCP tool (document.modelContext draft)
// so browser agents can navigate the portal without our iframe's
// postMessage transport. Registered on the host document, not the iframe.
//
// The API is experimental and still churning, so we feature-detect both
// shapes and guard the registration.

import {
    goToPage,
    GO_TO_PAGE_TOOL_NAME,
    GO_TO_PAGE_DESCRIPTION,
} from './navigateTool';

// Minimal structural type — the real API isn't in lib.dom yet.
interface ModelContextLike {
    registerTool: (
        descriptor: {
            name: string;
            description: string;
            inputSchema: Record<string, unknown>;
            execute: (params: any) => Promise<string> | string;
        },
        options?: { signal?: AbortSignal }
    ) => unknown;
}

function getModelContext(): ModelContextLike | null {
    // document.modelContext is current; navigator.modelContext is the
    // deprecated fallback.
    if (typeof document !== 'undefined') {
        const d = (document as any).modelContext;
        if (d && typeof d.registerTool === 'function') return d;
    }
    if (typeof navigator !== 'undefined') {
        const n = (navigator as any).modelContext;
        if (n && typeof n.registerTool === 'function') return n;
    }
    return null;
}

const WEBMCP_ENABLED_STORAGE_KEY = 'chat-sidebar:mcp';

// Off by default — opens go_to_page to any WebMCP agent, not just our
// iframe. Checked inside start() so no caller can skip it.
function webMcpEnabled(): boolean {
    try {
        return localStorage.getItem(WEBMCP_ENABLED_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

export class PortalWebMcp {
    private abort?: AbortController;

    static isSupported(): boolean {
        return getModelContext() !== null;
    }

    /** Registers the tool; false if unsupported or opted out. */
    start(): boolean {
        if (!webMcpEnabled()) return false;
        const mc = getModelContext();
        if (!mc || this.abort) return false;
        this.abort = new AbortController();
        try {
            mc.registerTool(
                {
                    name: GO_TO_PAGE_TOOL_NAME,
                    description: GO_TO_PAGE_DESCRIPTION,
                    inputSchema: {
                        type: 'object',
                        properties: {
                            url: {
                                type: 'string',
                                description:
                                    'A cBioPortal path, e.g. "/study?id=brca_tcga_pan_can_atlas_2018".',
                            },
                        },
                        required: ['url'],
                    },
                    execute: (params: any) =>
                        JSON.stringify(goToPage(params?.url)),
                },
                { signal: this.abort.signal }
            );
        } catch {
            // Experimental API signature drift must never break page load.
        }
        return true;
    }

    /** Unregister via the AbortSignal passed at registration. */
    stop() {
        this.abort?.abort();
        this.abort = undefined;
    }
}
