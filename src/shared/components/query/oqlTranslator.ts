import { buildCBioPortalAPIUrl } from 'shared/api/urls';

// Natural language to OQL, served by the chat-sidebar-server behind the
// portal's /api/chat/oql proxy.

export type OqlIssue = { code: string; message: string };

export type OqlTranslation =
    | {
          kind: 'ok';
          oql: string;
          explanation: string[];
          warnings: OqlIssue[];
      }
    // The request names nothing that can be queried; the message says why.
    | { kind: 'rejected'; message: string }
    // The request names something that can't be queried, e.g. an unknown gene.
    | { kind: 'failed'; message: string; errors: OqlIssue[] };

let availability: Promise<boolean> | undefined;

// Whether this portal proxies a translator with a model configured. Checked
// once per page load.
export function isOqlTranslatorAvailable(): Promise<boolean> {
    if (!availability) {
        availability = fetch(buildCBioPortalAPIUrl('api/chat/oql/health'))
            .then(response => (response.ok ? response.json() : undefined))
            .then(body => Boolean(body?.model))
            .catch(() => false);
    }
    return availability;
}

// Rejects on a network or server error; a request the translator can't turn
// into a query resolves with the reason.
export async function translateToOql(prompt: string): Promise<OqlTranslation> {
    const response = await fetch(
        buildCBioPortalAPIUrl('api/chat/oql/translate'),
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        }
    );
    if (response.status !== 200 && response.status !== 422) {
        throw new Error(`OQL translation failed: ${response.status}`);
    }
    const body = await response.json();
    if (response.status === 200) {
        return {
            kind: 'ok',
            oql: body.oql,
            explanation: body.explanation ?? [],
            warnings: body.warnings ?? [],
        };
    }
    if (body.rejected) {
        return { kind: 'rejected', message: body.error };
    }
    return { kind: 'failed', message: body.error, errors: body.errors ?? [] };
}
