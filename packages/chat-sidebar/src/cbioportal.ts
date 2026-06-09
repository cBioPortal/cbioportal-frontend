export interface Study {
    studyId: string;
    name: string;
    description: string;
    pmid: string;
    citation: string;
    publicStudy: boolean;
}

function joinUrl(root: string, path: string): string {
    const r = root.endsWith('/') ? root.slice(0, -1) : root;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${r}${p}`;
}

export async function fetchStudy(
    apiRoot: string,
    studyId: string
): Promise<Study> {
    const url = joinUrl(apiRoot, `api/studies/${encodeURIComponent(studyId)}`);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch study ${studyId}: HTTP ${res.status}`);
    }
    return (await res.json()) as Study;
}
