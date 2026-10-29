import * as React from 'react';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { IResourceTableRow } from 'shared/lib/ResourceTableUtils';
import {
    CELL_EXPLORER_METADATA,
    CellExplorerColorBy,
    colorByFor,
} from './cellExplorerUtils';
import styles from './styles.module.scss';

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
    filterConfig?: { colorBy: CellExplorerColorBy };
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
    /** The resource's datasets, one row each. */
    rows: IResourceTableRow[];
    /** Which dataset is shown. */
    index: number;
    onIndexChange: (index: number) => void;
    height: number;
}

const CellExplorerError: React.FunctionComponent<{
    message: string;
    url: string;
}> = ({ message, url }) => (
    <div className={styles.error} data-test="CellExplorerError">
        <span>{message}</span>
        <a href={url} target="_blank" rel="noopener noreferrer">
            Open in Cell Explorer <i className="fa fa-external-link" />
        </a>
    </div>
);

/**
 * Shows a Cell Explorer resource's datasets in the page itself, never in a frame, with a picker
 * when there is more than one. Each row's metadata names the dataset's zarr store.
 */
export const CellExplorerResource: React.FunctionComponent<ICellExplorerResourceProps> = ({
    rows,
    index,
    onIndexChange,
    height,
}) => {
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

    const row = rows[index];
    const zarrUrl = row.metadata[CELL_EXPLORER_METADATA.zarrUrl];
    const colorBy = colorByFor(row.metadata);
    const filterConfig = React.useMemo(
        () => (colorBy ? { colorBy } : undefined),
        [colorBy?.type, colorBy?.value]
    );

    let body: React.ReactNode;
    if (!zarrUrl) {
        body = (
            <CellExplorerError
                message={`This dataset has no ${CELL_EXPLORER_METADATA.zarrUrl} in its metadata.`}
                url={row.url}
            />
        );
    } else if (viewerFailed) {
        body = (
            <CellExplorerError
                message="The Cell Explorer viewer could not be loaded."
                url={row.url}
            />
        );
    } else if (Viewer) {
        // A new dataset starts from a fresh viewer.
        body = (
            <Viewer key={zarrUrl} url={zarrUrl} filterConfig={filterConfig} />
        );
    } else {
        body = <LoadingIndicator isLoading={true} center={true} />;
    }

    return (
        <div
            className={styles.cellExplorerResource}
            style={{ height }}
            data-test="CellExplorerResource"
        >
            <div className={styles.toolbar} style={{ height: TOOLBAR_HEIGHT }}>
                {rows.length > 1 && (
                    <select
                        className="form-control input-sm"
                        value={index}
                        onChange={e => onIndexChange(Number(e.target.value))}
                        data-test="CellExplorerDatasetSelect"
                    >
                        {rows.map((r, i) => (
                            <option key={r.key} value={i}>
                                {r.description || r.url}
                            </option>
                        ))}
                    </select>
                )}
                <a
                    className={styles.openLink}
                    href={row.url}
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
                {body}
            </div>
        </div>
    );
};

export default CellExplorerResource;
