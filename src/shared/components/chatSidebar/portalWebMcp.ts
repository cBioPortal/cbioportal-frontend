// portalWebMcp — registers the portal's capability surface as native WebMCP
// tools (the W3C draft `document.modelContext` API), so in-browser agents that
// speak the standard — the MCP-B bridge extension and the model-context tool
// inspector today; Gemini-in-Chrome / Edge Copilot as their consumption lands —
// can discover and call them without our bespoke postMessage transport.
//
// Same capability surface (PortalContext) and same catalog (getServerSpec) as
// PortalMcpServer; only the wire differs. Register on the HOST document (where
// PortalContext runs), not the iframe — the host's own tools need no
// `allow="tools"` permissions-policy plumbing.
//
// The API is experimental and still churning (navigator.modelContext ->
// document.modelContext, flag/origin-trial gated), so we feature-detect both
// shapes and wrap each registration so a signature mismatch can never break
// page load.

import { PortalContext, Annotation } from './PortalContext';
import { getServerSpec } from './portalMcpServer';

// Minimal structural type for the parts of the WebMCP API we touch — the real
// API isn't in lib.dom yet.
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
    // Prefer document.modelContext (current); fall back to the deprecated
    // navigator.modelContext for older Canary builds.
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

export interface WebMcpOptions {
    /** Register only read-scope tools (capture_viewport), leaving out the
     *  action tools (annotate/clear/navigate). */
    readOnly?: boolean;
    /** Which query params `navigate` may set; mirrors PortalMcpServer. */
    writableParams?: string[];
}

export class PortalWebMcp {
    private abort?: AbortController;

    constructor(private ctx: PortalContext, private opts: WebMcpOptions = {}) {}

    static isSupported(): boolean {
        return getModelContext() !== null;
    }

    /** Register the tools. Returns true if the WebMCP API was present and
     *  registration ran. No-op (false) where the API is absent. */
    start(): boolean {
        const mc = getModelContext();
        if (!mc || this.abort) return false;
        this.abort = new AbortController();
        const { signal } = this.abort;
        for (const tool of getServerSpec().tools) {
            if (this.opts.readOnly && tool.scope !== 'read') continue;
            try {
                mc.registerTool(
                    {
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema,
                        execute: (params: any) =>
                            this.invoke(tool.name, params ?? {}),
                    },
                    { signal }
                );
            } catch {
                // Experimental API signature drift must never break the page.
            }
        }
        return true;
    }

    /** Unregister every tool via the AbortSignal passed at registration. */
    stop() {
        this.abort?.abort();
        this.abort = undefined;
    }

    // WebMCP tool results are strings; JSON-encode structured returns.
    private async invoke(name: string, args: any): Promise<string> {
        switch (name) {
            case 'capture_viewport': {
                const url = await this.ctx.captureViewport({
                    waitForIdle: args.waitForIdle,
                });
                return url ?? 'screenshot unavailable';
            }
            case 'annotate_elements':
                return JSON.stringify(
                    await this.ctx.annotate(args.annotations as Annotation[])
                );
            case 'clear_annotations':
                await this.ctx.clearAnnotations();
                return JSON.stringify({ ok: true });
            case 'navigate': {
                const allow = this.opts.writableParams;
                const params: Record<string, string | undefined> =
                    args.params ?? {};
                if (allow) {
                    for (const key of Object.keys(params)) {
                        if (!allow.includes(key)) {
                            throw new Error(
                                `param "${key}" is not writable (allowed: ${allow.join(
                                    ', '
                                )})`
                            );
                        }
                    }
                }
                return JSON.stringify(
                    await this.ctx.navigate({
                        path: args.path,
                        params,
                        clear: !!args.clear,
                        replace: !!args.replace,
                    })
                );
            }
            default:
                throw new Error(`unknown tool: ${name}`);
        }
    }
}
