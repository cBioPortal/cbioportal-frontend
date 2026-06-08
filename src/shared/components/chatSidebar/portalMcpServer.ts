// portalMcpServer — a thin Model Context Protocol server exposed over
// window.postMessage, so any in-browser MCP client (the chat sidebar iframe,
// a browser-extension agent, Claude-in-the-browser) can discover and drive
// cBioPortal through ONE surface instead of reverse-engineering the DOM.
//
// Transport: JSON-RPC 2.0 framed in postMessage envelopes. Method names mirror
// the MCP wire spec (initialize, tools/list, tools/call, resources/list,
// resources/read) so a future drop-in to a ratified WebMCP browser transport is
// a transport swap, not a re-model.
//
// This is a SHIM over PortalContext — it owns no portal logic, only protocol
// framing, an origin allowlist, and capability scoping.

import { PortalContext, Annotation } from './PortalContext';

const PROTOCOL_VERSION = '2025-06-18';
const ENVELOPE = 'mcp'; // postMessage discriminator

type Scope = 'read' | 'act';

export interface ServerOptions {
    /** Exact origins allowed to connect (e.g. the sidebar's Vercel origin). */
    allowedOrigins: string[];
    /** What an allowed peer may do. Default 'read' — actions are opt-in per origin. */
    scopeFor?: (origin: string) => Scope;
    /** Which query params `navigate` may set. Undefined = all (NOT recommended
     *  in prod — gate cohort/study swaps; allow e.g. tab + plot selections). */
    writableParams?: string[];
}

// --- catalog: resources are reads; tools are reads + actions ---------------

const RESOURCES = [
    {
        uri: 'cbioportal://current-view',
        name: 'Current view',
        description: 'Open study, queried genes, and active results-view tab.',
        mimeType: 'application/json',
    },
    {
        uri: 'cbioportal://location',
        name: 'URL / location',
        description:
            'Current results-view URL: href, path, parsed query params, and active tab. The portal is fully URL-driven, so this IS the page state.',
        mimeType: 'application/json',
    },
    {
        uri: 'cbioportal://page-inventory',
        name: 'Page inventory',
        description:
            'Alteration buckets, gene tracks, and tabs actually rendered right now.',
        mimeType: 'application/json',
    },
] as const;

const TOOLS = [
    {
        name: 'capture_viewport',
        scope: 'read' as Scope,
        description:
            'Screenshot the current cBioPortal viewport (PNG), excluding the chat sidebar. Waits for network idle first.',
        inputSchema: {
            type: 'object',
            properties: { waitForIdle: { type: 'boolean', default: true } },
        },
    },
    {
        name: 'annotate_elements',
        scope: 'act' as Scope,
        description:
            'Place paper-grounded beacons on oncoprint legend labels, gene tracks, or tabs.',
        inputSchema: {
            type: 'object',
            required: ['annotations'],
            properties: {
                annotations: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['target', 'note'],
                        properties: {
                            target: { type: 'object' },
                            note: { type: 'string' },
                            quote: { type: 'string' },
                            importance: { enum: ['high', 'medium', 'low'] },
                        },
                    },
                },
            },
        },
    },
    {
        name: 'clear_annotations',
        scope: 'act' as Scope,
        description: 'Remove beacons previously placed on the page.',
        inputSchema: { type: 'object', properties: {} },
    },
    {
        name: 'navigate',
        scope: 'act' as Scope,
        description:
            'URL-driven navigation (soft, no reload). Set the path and/or query params: switch tab (path "results/survival"), change genes ({gene_list:"TP53 KRAS"}), thresholds, plot selections — anything URL-encoded. Read cbioportal://location first to see the current state.',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description:
                        'e.g. "results/mutations". Omit to keep current tab.',
                },
                params: {
                    type: 'object',
                    additionalProperties: { type: ['string', 'null'] },
                    description: 'Query params to merge. null clears a param.',
                },
                clear: { type: 'boolean', default: false },
                replace: { type: 'boolean', default: false },
            },
        },
    },
] as const;

// --- JSON-RPC plumbing ------------------------------------------------------

interface RpcRequest {
    jsonrpc: '2.0';
    id: number | string;
    method: string;
    params?: any;
}

const ok = (id: any, result: any) => ({ jsonrpc: '2.0' as const, id, result });
const fail = (id: any, code: number, message: string) => ({
    jsonrpc: '2.0' as const,
    id,
    error: { code, message },
});

export class PortalMcpServer {
    private listening = false;

    constructor(private ctx: PortalContext, private opts: ServerOptions) {}

    start() {
        if (this.listening) return;
        this.listening = true;
        window.addEventListener('message', this.onMessage);
    }

    stop() {
        this.listening = false;
        window.removeEventListener('message', this.onMessage);
    }

    private scopeFor(origin: string): Scope {
        return this.opts.scopeFor?.(origin) ?? 'read';
    }

    private onMessage = async (e: MessageEvent) => {
        // Origin gate — the single most important line in this file. An unscoped
        // postMessage surface that can screenshot and navigate the page is a
        // data-exfil + clickjack vector.
        if (!this.opts.allowedOrigins.includes(e.origin)) return;

        const msg = e.data;
        if (!msg || msg.envelope !== ENVELOPE || !msg.request) return;

        const req: RpcRequest = msg.request;
        const reply = (payload: any) =>
            (e.source as Window | null)?.postMessage(
                { envelope: ENVELOPE, response: payload },
                e.origin // echo back to the exact origin, never '*'
            );

        try {
            reply(await this.dispatch(req, this.scopeFor(e.origin)));
        } catch (ex) {
            reply(fail(req.id, -32603, ex?.message ?? 'internal error'));
        }
    };

    private async dispatch(req: RpcRequest, scope: Scope) {
        switch (req.method) {
            case 'initialize':
                return ok(req.id, {
                    protocolVersion: PROTOCOL_VERSION,
                    serverInfo: { name: 'cbioportal-portal', version: '0.1.0' },
                    capabilities: { resources: {}, tools: {} },
                });

            case 'resources/list':
                return ok(req.id, { resources: RESOURCES });

            case 'resources/read':
                return ok(req.id, {
                    contents: [await this.readResource(req.params?.uri)],
                });

            case 'tools/list':
                // Read-only peers never even see the action tools.
                return ok(req.id, {
                    tools: TOOLS.filter(
                        t => scope === 'act' || t.scope === 'read'
                    ).map(({ scope: _omit, ...t }) => t),
                });

            case 'tools/call':
                return ok(
                    req.id,
                    await this.callTool(
                        req.params?.name,
                        req.params?.arguments ?? {},
                        scope
                    )
                );

            default:
                return fail(req.id, -32601, `method not found: ${req.method}`);
        }
    }

    private async readResource(uri: string) {
        if (uri === 'cbioportal://current-view') {
            return {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(await this.ctx.getCurrentView()),
            };
        }
        if (uri === 'cbioportal://location') {
            return {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(await this.ctx.getLocation()),
            };
        }
        if (uri === 'cbioportal://page-inventory') {
            return {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(await this.ctx.getInventory()),
            };
        }
        throw new Error(`unknown resource: ${uri}`);
    }

    private async callTool(name: string, args: any, scope: Scope) {
        const tool = TOOLS.find(t => t.name === name);
        if (!tool) throw new Error(`unknown tool: ${name}`);
        if (tool.scope === 'act' && scope !== 'act') {
            throw new Error(`tool "${name}" requires 'act' scope`);
        }

        const asText = (v: any) => ({
            content: [
                {
                    type: 'text',
                    text: typeof v === 'string' ? v : JSON.stringify(v),
                },
            ],
        });

        switch (name) {
            case 'capture_viewport': {
                const dataUrl = await this.ctx.captureViewport({
                    waitForIdle: args.waitForIdle,
                });
                return {
                    content: dataUrl
                        ? [
                              {
                                  type: 'image',
                                  data: dataUrl.split(',')[1], // strip data: prefix
                                  mimeType: 'image/png',
                              },
                          ]
                        : [{ type: 'text', text: 'screenshot unavailable' }],
                };
            }
            case 'annotate_elements':
                return asText(
                    await this.ctx.annotate(args.annotations as Annotation[])
                );
            case 'clear_annotations':
                await this.ctx.clearAnnotations();
                return asText({ ok: true });
            case 'navigate': {
                // Enforce the writable-param allowlist before touching the URL.
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
                return asText(
                    await this.ctx.navigate({
                        path: args.path,
                        params,
                        clear: !!args.clear,
                        replace: !!args.replace,
                    })
                );
            }
            default:
                throw new Error(`unhandled tool: ${name}`);
        }
    }
}
