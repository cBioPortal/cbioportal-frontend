import * as React from 'react';
import {
    CellExplorerView,
    useAppStore,
} from 'cbioportal-cell-explorer-highperformer';
import 'antd/dist/antd.css';
import './CellExplorerTab.css';

// Prototype study→dataset mapping. Real integration would fetch this from the
// backend (e.g. via a `cellExplorerDataset` field on the study metadata).
const STUDY_TO_DATASET: Record<string, string> = {
    msk_spectrum_tme_2022:
        'https://cbioportal-public-imaging.assets.cbioportal.org/msk_spectrum_tme_2022/zarr/spectrum_all_cells-f16-zstd-c1s30-v3.zarr/',
};

export function hasCellExplorerDataset(studyId: string | undefined): boolean {
    return !!studyId && studyId in STUDY_TO_DATASET;
}

interface CellExplorerTabProps {
    studyId?: string;
}

export const CellExplorerTab: React.FunctionComponent<CellExplorerTabProps> = ({
    studyId,
}) => {
    const datasetUrl = studyId ? STUDY_TO_DATASET[studyId] : undefined;
    const [loadedUrl, setLoadedUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!datasetUrl || loadedUrl === datasetUrl) return;
        useAppStore.getState().openDataset(datasetUrl);
        setLoadedUrl(datasetUrl);
    }, [datasetUrl, loadedUrl]);

    if (!datasetUrl) return null;

    return (
        <div style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>
            <CellExplorerView />
        </div>
    );
};
