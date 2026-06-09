# cBioPortal portal MCP surface

The results-view page exposes a small [Model Context Protocol](https://modelcontextprotocol.io)
server over `window.postMessage`, so an allowlisted in-browser agent can read the
current view/URL/inventory, screenshot the page, place beacons, and URL-navigate
— through one discoverable surface instead of scraping the DOM. It is opt-in
(`localStorage['chat-sidebar:mcp'] = '1'`) and answers only allowlisted origins.

See `portalMcpServer.ts` (server), `PortalContext.ts` (capability surface), and
`5-wiring` in the design gist for how it's wired into `ChatSidebar`.

## Two ways the surface is exposed

The same `PortalContext` capability surface is published over two transports,
both from the same catalog (`getServerSpec()`):

1. **`portalMcpServer.ts`** — a bespoke `postMessage` + JSON-RPC server. Used by
   the chat sidebar iframe today; origin-allowlisted.
2. **`portalWebMcp.ts`** — registers the tools as native **WebMCP** tools via the
   browser's `document.modelContext` API (W3C draft). This is what standard
   in-browser agents consume: the **MCP-B bridge extension** and the
   **model-context tool inspector** can call them today in Chrome Canary
   (`enable-webmcp-testing` flag); Gemini-in-Chrome / Edge Copilot when their
   consumption ships. No-op in browsers without the API. Registered on the host
   document, so no `allow="tools"` iframe plumbing is needed.

`navigate` is constrained by the same `writableParams` allowlist on both.

## Obtaining the specification

**Statically** — read [`mcp.json`](./mcp.json). It is generated from
`getServerSpec()` and kept honest by `portalMcpServer.spec.ts` (the test fails if
they drift). Regenerate after changing the catalogs:

```ts
import { getServerSpec } from './portalMcpServer';
// write JSON.stringify(getServerSpec(), null, 4) to mcp.json, then prettier --write
```

Unlike the runtime `tools/list` (which hides `act` tools from read-only peers),
`mcp.json` lists **every** tool with its required `scope`.

**At runtime** — connect from an allowlisted origin and use the standard MCP
discovery handshake. Minimal client over the postMessage/JSON-RPC envelope:

```ts
const ENVELOPE = 'mcp';
function rpc(target: Window, origin: string, method: string, params?: unknown) {
    const id = Math.random().toString(36).slice(2);
    return new Promise(resolve => {
        const onMsg = (e: MessageEvent) => {
            if (e.origin !== origin) return;
            const m = e.data;
            if (m?.envelope !== ENVELOPE || m.response?.id !== id) return;
            window.removeEventListener('message', onMsg);
            resolve(m.response.result ?? m.response.error);
        };
        window.addEventListener('message', onMsg);
        target.postMessage(
            { envelope: ENVELOPE, request: { jsonrpc: '2.0', id, method, params } },
            origin
        );
    });
}

// e.g. from the sidebar iframe, target = window.parent
await rpc(window.parent, 'https://cbioportal.org', 'initialize');
const { resources } = await rpc(window.parent, 'https://cbioportal.org', 'resources/list');
const { tools } = await rpc(window.parent, 'https://cbioportal.org', 'tools/list');
```

## Surface (v0.1.0)

- **Transport:** `postMessage`, JSON-RPC 2.0, envelope `{ envelope: "mcp", request|response: <jsonrpc> }`
- **Methods:** `initialize`, `resources/list`, `resources/read`, `tools/list`, `tools/call`
- **Resources:** `cbioportal://current-view`, `cbioportal://location`, `cbioportal://page-inventory`
- **Tools:** `capture_viewport` (read), `annotate_elements` (act), `clear_annotations` (act), `navigate` (act)
- **Security:** exact-origin allowlist; per-origin `read|act` scope; `navigate` constrained by a `writableParams` allowlist.

The authoritative, machine-readable version of the above is `mcp.json`.
