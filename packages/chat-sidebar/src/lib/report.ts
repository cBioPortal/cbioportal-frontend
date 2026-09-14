import { UIMessage } from 'ai';

// Screenshots are re-attached deterministically instead of trusting the LLM
// to reproduce raw image bytes — it may only reference them in prose.
export function appendScreenshotAppendix(
    report: string,
    messages: UIMessage[]
): string {
    const seen = new Set<string>();
    const images = messages
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

    if (images.length === 0) return report;

    const appendix = images
        .map(
            (part, i) =>
                `![${part.filename ?? `Screenshot ${i + 1}`}](${part.url})`
        )
        .join('\n\n');

    return `${report}\n\n## Appendix: Captured Screenshots\n\n${appendix}\n`;
}
