import * as React from 'react';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    CellExplorerDataset,
    CellExplorerPage,
    datasetPageUrl,
    datasetsForPage,
} from './cellExplorerUtils';
import styles from './styles.module.scss';

type ColorBy = { type: 'category' | 'gene'; value: string };

/**
 * The viewer bundles its own deck.gl and luma.gl. Each registers itself on globalThis when it
 * loads and refuses to load beside a different registered version, such as the portal's. The
 * two copies never share objects, so the portal's registration is set aside while the viewer
 * loads and put back after.
 */
async function importBesidePortalDeckGl(): Promise<any> {
    const global = globalThis as any;
    const saved = { deck: global.deck, luma: global.luma };
    delete global.deck;
    delete global.luma;
    try {
        // @ts-ignore
        return await import(
            /* webpackChunkName: "cell-explorer" */ '@cbioportal-cell-explorer/component'
        );
    } finally {
        global.deck = saved.deck;
        global.luma = saved.luma;
    }
}

type CellExplorerViewer = React.ComponentType<{
    url: string;
    filterConfig?: { colorBy: ColorBy };
}>;

let viewerImport: Promise<CellExplorerViewer> | undefined;

// The viewer bundle is large, so it is only fetched when a Cell Explorer resource is opened.
function loadViewer(): Promise<CellExplorerViewer> {
    if (!viewerImport) {
        viewerImport = importBesidePortalDeckGl().then(m => m.CellExplorer);
        viewerImport.catch(() => {
            viewerImport = undefined;
        });
    }
    return viewerImport;
}

const TOOLBAR_HEIGHT = 36;

export interface ICellExplorerResourceProps {
    page: CellExplorerPage;
    height: number;
    /** Shown when Cell Explorer's dataset list cannot be read or names no dataset for the page. */
    fallback: () => React.ReactElement;
}

type DatasetsState =
    | { status: 'pending' }
    | { status: 'error' }
    | { status: 'complete'; datasets: CellExplorerDataset[] };

function filterConfigFor(
    dataset: CellExplorerDataset
): { colorBy: ColorBy } | undefined {
    const view = dataset.default_view;
    if (view?.colorBy === 'category' && view.category) {
        return { colorBy: { type: 'category', value: view.category } };
    }
    if (view?.colorBy === 'gene' && view.gene) {
        return { colorBy: { type: 'gene', value: view.gene } };
    }
    return undefined;
}

/** Shows a Cell Explorer dataset in the page itself, with a picker for a collection's datasets. */
export const CellExplorerResource: React.FunctionComponent<ICellExplorerResourceProps> = ({
    page,
    height,
    fallback,
}) => {
    const [state, setState] = React.useState<DatasetsState>({
        status: 'pending',
    });
    const [selectedSlug, setSelectedSlug] = React.useState<string>();
    const [Viewer, setViewer] = React.useState<CellExplorerViewer>();
    const [viewerFailed, setViewerFailed] = React.useState(false);

    React.useEffect(() => {
        let cancelled = false;
        loadViewer().then(
            viewer => !cancelled && setViewer(() => viewer),
            () => !cancelled && setViewerFailed(true)
        );
        return () => {
            cancelled = true;
        };
    }, []);

    React.useEffect(() => {
        let cancelled = false;
        setState({ status: 'pending' });
        fetch(`${page.origin}/api/datasets`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.json();
            })
            .then((body: { datasets: CellExplorerDataset[] }) => {
                if (!cancelled) {
                    setState({
                        status: 'complete',
                        datasets: datasetsForPage(page, body.datasets),
                    });
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setState({ status: 'error' });
                }
            });
        return () => {
            cancelled = true;
        };
    }, [page.origin, 'dataset' in page ? page.dataset : page.collection]);

    const datasets = state.status === 'complete' ? state.datasets : [];
    const dataset = datasets.find(d => d.slug === selectedSlug) || datasets[0];
    const filterConfig = React.useMemo(
        () => (dataset ? filterConfigFor(dataset) : undefined),
        [dataset]
    );

    if (state.status === 'pending') {
        return <LoadingIndicator isLoading={true} center={true} />;
    }
    if (!dataset || viewerFailed) {
        return fallback();
    }

    return (
        <div
            className={styles.cellExplorerResource}
            style={{ height }}
            data-test="CellExplorerResource"
        >
            <div className={styles.toolbar} style={{ height: TOOLBAR_HEIGHT }}>
                {datasets.length > 1 && (
                    <select
                        className="form-control input-sm"
                        value={dataset.slug}
                        onChange={e => setSelectedSlug(e.target.value)}
                        data-test="CellExplorerDatasetSelect"
                    >
                        {datasets.map(d => (
                            <option key={d.slug} value={d.slug}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                )}
                <a
                    className={styles.openLink}
                    href={datasetPageUrl(page, dataset)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open in Cell Explorer <i className="fa fa-external-link" />
                </a>
            </div>
            <div
                className={styles.viewer}
                style={{ height: height - TOOLBAR_HEIGHT }}
            >
                {Viewer ? (
                    <Viewer
                        // A new dataset starts from a fresh viewer.
                        key={dataset.slug}
                        url={dataset.url}
                        filterConfig={filterConfig}
                    />
                ) : (
                    <LoadingIndicator isLoading={true} center={true} />
                )}
            </div>
        </div>
    );
};

export default CellExplorerResource;
