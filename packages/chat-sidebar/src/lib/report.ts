import { UIMessage } from 'ai';

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

// Screenshots are re-attached deterministically instead of trusting the LLM
// to reproduce raw image bytes — it may only reference them in prose.
export function appendScreenshotAppendix(
    report: string,
    messages: UIMessage[]
): string {
    const images = screenshotParts(messages);
    if (images.length === 0) return report;

    const appendix = images
        .map(
            (part, i) =>
                `![${part.filename ?? `Screenshot ${i + 1}`}](${part.url})`
        )
        .join('\n\n');

    return `${report}\n\n## Appendix: Captured Screenshots\n\n${appendix}\n`;
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
