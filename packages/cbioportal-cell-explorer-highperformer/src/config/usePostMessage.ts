// Library-mode stub: the original file drove a postMessage listener gated
// behind Vite-specific env flags (VITE_ENABLE_POSTMESSAGE etc.). Inside
// cbioportal-frontend we mount the viewer directly, so the iframe-oriented
// listener is unneeded — this is a no-op.
export function patternToRegex(pattern: string): RegExp {
    const escaped = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
}

export function isOriginAllowed(
    origin: string,
    patterns: RegExp[] | null
): boolean {
    if (!patterns) return true;
    return patterns.some(p => p.test(origin));
}

export function usePostMessage(): void {
    // no-op
}
