export const DEFAULT_PORTAL =
    process.env.CBIOPORTAL_URL ?? 'https://www.cbioportal.org';
export const GENOME_NEXUS_URL =
    process.env.GENOME_NEXUS_URL ?? 'https://www.genomenexus.org';
// Genome Nexus annotates against GRCh37, so protein sequences come from the GRCh37 Ensembl mirror.
export const ENSEMBL_URL =
    process.env.ENSEMBL_URL ?? 'https://grch37.rest.ensembl.org';

export class UpstreamError extends Error {
    constructor(
        public service: string,
        public status: number,
        message: string
    ) {
        super(`${service} ${status}: ${message}`);
    }
}

export async function getJson<T>(
    service: string,
    url: string,
    init?: RequestInit
): Promise<T> {
    const res = await fetch(url, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
            ...init?.headers,
        },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new UpstreamError(
            service,
            res.status,
            (await res.text()).slice(0, 200)
        );
    return (await res.json()) as T;
}

export async function getText(service: string, url: string): Promise<string> {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok)
        throw new UpstreamError(
            service,
            res.status,
            (await res.text()).slice(0, 200)
        );
    return (await res.text()).trim();
}
