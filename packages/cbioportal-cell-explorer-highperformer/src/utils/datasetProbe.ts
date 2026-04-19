export async function probeStore(
    url: string,
    signal: AbortSignal
): Promise<{ ok: boolean; version?: number }> {
    const base = url.endsWith('/') ? url : url + '/';

    // Try zarr.json (v3), then .zmetadata (v2) — simple GET, no preflight
    const v3 = await fetch(base + 'zarr.json', { method: 'GET', signal });
    if (v3.ok) return { ok: true, version: 3 };

    const v2 = await fetch(base + '.zmetadata', { method: 'GET', signal });
    if (v2.ok) return { ok: true, version: 2 };

    return { ok: false };
}

export function isLocalUrl(url: string): boolean {
    try {
        const host = new URL(url).hostname;
        return (
            host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0'
        );
    } catch {
        return false;
    }
}
