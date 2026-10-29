/** A Cell Explorer page a resource links to: one dataset, or a collection of them. */
export type CellExplorerPage =
    | { origin: string; dataset: string }
    | { origin: string; collection: string };

/** A dataset as Cell Explorer's `/api/datasets` lists it. */
export interface CellExplorerDataset {
    slug: string;
    name: string;
    url: string;
    default_view?: {
        colorBy?: 'category' | 'gene';
        category?: string;
        gene?: string;
    } | null;
    collection?: { slug: string; name: string } | null;
}

const CELL_EXPLORER_HOSTS = ['cell-explorer.cbioportal.org'];

/** The Cell Explorer page a URL opens, or undefined for any other URL. */
export function parseCellExplorerUrl(
    url: string
): CellExplorerPage | undefined {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return undefined;
    }
    if (!CELL_EXPLORER_HOSTS.includes(parsed.hostname)) {
        return undefined;
    }
    const dataset = parsed.searchParams.get('dataset');
    if (parsed.pathname === '/view' && dataset) {
        return { origin: parsed.origin, dataset };
    }
    const collection = parsed.pathname.match(/^\/collections\/([^/]+)\/?$/);
    if (collection) {
        return {
            origin: parsed.origin,
            collection: decodeURIComponent(collection[1]),
        };
    }
    return undefined;
}

/** The datasets a page shows, in the order Cell Explorer lists them. */
export function datasetsForPage(
    page: CellExplorerPage,
    datasets: CellExplorerDataset[]
): CellExplorerDataset[] {
    if ('dataset' in page) {
        return datasets.filter(d => d.slug === page.dataset);
    }
    return datasets.filter(d => d.collection?.slug === page.collection);
}

/** The dataset's own page on Cell Explorer. */
export function datasetPageUrl(
    page: CellExplorerPage,
    dataset: CellExplorerDataset
): string {
    return `${page.origin}/view?dataset=${encodeURIComponent(dataset.slug)}`;
}
