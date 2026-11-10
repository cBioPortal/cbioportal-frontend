import { UIMessage } from 'ai';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

// Numbered in order of first appearance, as the server labels them for the
// report model.
export function screenshotParts(
    messages: UIMessage[]
): Extract<UIMessage['parts'][number], { type: 'file' }>[] {
    const seen = new Set<string>();
    return messages
        .flatMap(m => m.parts)
        .filter(
            (
                part
            ): part is Extract<UIMessage['parts'][number], { type: 'file' }> =>
                part.type === 'file' && part.mediaType.startsWith('image/')
        )
        .filter(part => {
            if (seen.has(part.url)) return false;
            seen.add(part.url);
            return true;
        });
}

// The parts of the parsed markdown that cleanReport reads.
interface MarkdownNode {
    type: string;
    url?: string;
    alt?: string | null;
    identifier?: string;
    children?: MarkdownNode[];
    position?: { start: { offset?: number }; end: { offset?: number } };
}

const SCREENSHOT_SRC = /^screenshot:(\d+)$/;

const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
};

// Shows the markup as written, as the chat does.
function escapeHtml(html: string): string {
    return html.replace(/[&<>"]/g, c => HTML_ESCAPES[c]);
}

/**
 * Rewrites everything in a model-written report that a markdown viewer would
 * load on its own, since a prompt-injected URL could carry the report off-site.
 * An image placing screenshot N gets resolve(N) as its source, or is removed
 * when that is undefined; any other image is removed; raw HTML is escaped to
 * text. The rest keeps its exact source.
 */
export function cleanReport(
    text: string,
    resolve: (n: number) => string | undefined
): { markdown: string; placed: Set<number> } {
    const tree = (unified()
        .use(remarkParse)
        .use(remarkGfm)
        .parse(text) as unknown) as MarkdownNode;
    const definitions = new Map<string, string>();
    const collect = (node: MarkdownNode) => {
        if (node.type === 'definition' && node.identifier && node.url) {
            definitions.set(node.identifier, node.url);
        }
        node.children?.forEach(collect);
    };
    collect(tree);

    const placed = new Set<number>();
    const edits: { start: number; end: number; text: string }[] = [];
    const visit = (node: MarkdownNode) => {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        if (start === undefined || end === undefined) {
            node.children?.forEach(visit);
            return;
        }
        if (node.type === 'image' || node.type === 'imageReference') {
            const url =
                node.type === 'image'
                    ? node.url
                    : definitions.get(node.identifier ?? '');
            const n = Number(SCREENSHOT_SRC.exec(url ?? '')?.[1]);
            const src = n ? resolve(n) : undefined;
            if (src) placed.add(n);
            const alt = (node.alt ?? '').replace(/[[\]\\]/g, '\\$&');
            edits.push({ start, end, text: src ? `![${alt}](${src})` : '' });
        } else if (node.type === 'html') {
            edits.push({
                start,
                end,
                text: escapeHtml(text.slice(start, end)),
            });
        } else {
            node.children?.forEach(visit);
        }
    };
    visit(tree);

    let markdown = text;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
        markdown =
            markdown.slice(0, edit.start) +
            edit.text +
            markdown.slice(edit.end);
    }
    return { markdown, placed };
}

/**
 * The cleaned report with each screenshot's source from toSrc, and, with
 * appendix, the screenshots it didn't place after it. Screenshots come from
 * the chat itself, never from the model.
 */
export function composeReport(
    text: string,
    messages: UIMessage[],
    toSrc: (url: string, n: number) => string,
    appendix: boolean
): string {
    const screenshots = screenshotParts(messages);
    const resolve = (n: number) => {
        const url = screenshots[n - 1]?.url;
        return url?.startsWith('data:image/') ? toSrc(url, n) : undefined;
    };
    const { markdown, placed } = cleanReport(text, resolve);
    const rest = screenshots
        .map((_, i) => i + 1)
        .filter(n => !placed.has(n) && resolve(n));
    if (!appendix || rest.length === 0) return markdown;
    const images = rest
        .map(n => `![Screenshot ${n}](${resolve(n)})`)
        .join('\n\n');
    return `${markdown}\n\n## Appendix: Captured Screenshots\n\n${images}\n`;
}

// The last complete report, so reopening with no new messages shows it again.
let lastReport: { key: string; text: string } | undefined;

// A new message or a different model makes it a different report.
export function reportKey(
    messages: UIMessage[],
    model: string | undefined
): string {
    return `${messages.at(-1)?.id ?? ''}:${model ?? ''}`;
}

export function getCachedReport(key: string): string | undefined {
    return lastReport?.key === key ? lastReport.text : undefined;
}

export function cacheReport(key: string, text: string): void {
    lastReport = { key, text };
}

// The endpoint streams plain text; onText gets the report so far after each
// chunk. Rejects if the stream is cut before the end.
export async function streamReport(
    messages: UIMessage[],
    model: string | undefined,
    signal: AbortSignal,
    onText: (text: string) => void
): Promise<string> {
    const res = await fetch('/api/chat/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model }),
        signal,
    });
    if (!res.ok || !res.body) {
        const body = await res.json().catch(() => undefined);
        throw new Error(body?.error ?? `report failed (${res.status})`);
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let text = '';
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += value;
        onText(text);
    }
    if (!text) throw new Error('empty report');
    return text;
}
