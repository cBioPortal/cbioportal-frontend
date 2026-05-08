import * as React from 'react';
import {
    CellExplorerView,
    MappedColumnSpec,
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

// The zarr obs column whose values are matched against the host's clinical
// identifiers (PATIENT_DISPLAY_NAME). MSK SPECTRUM–specific; mirrors the
// hardcoding in PR #5535.
const DIMMING_OBS_COLUMN = 'donor_id';

export function hasCellExplorerDataset(studyId: string | undefined): boolean {
    return !!studyId && studyId in STUDY_TO_DATASET;
}

interface CellExplorerTabProps {
    studyId?: string;
    mappedColumns?: MappedColumnSpec[];
    selectedDisplayNames?: string[];
}

export const CellExplorerTab: React.FunctionComponent<CellExplorerTabProps> = ({
    studyId,
    mappedColumns,
    selectedDisplayNames,
}) => {
    const datasetUrl = studyId ? STUDY_TO_DATASET[studyId] : undefined;
    const [loadedUrl, setLoadedUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!datasetUrl || loadedUrl === datasetUrl) return;
        useAppStore.getState().openDataset(datasetUrl);
        setLoadedUrl(datasetUrl);
    }, [datasetUrl, loadedUrl]);

    // Mapped columns arrive from the host asynchronously (remoteData). The
    // `@computed get` on the host re-creates the array on each access, so we
    // key the effect on the serialized content rather than reference.
    const mappedColumnsKey = React.useMemo(
        () => JSON.stringify(mappedColumns ?? []),
        [mappedColumns]
    );
    React.useEffect(() => {
        useAppStore.getState().setMappedColumns(mappedColumns ?? []);
        return () => {
            useAppStore.getState().setMappedColumns([]);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mappedColumnsKey]);

    const selectedDisplayNamesKey = React.useMemo(
        () => JSON.stringify(selectedDisplayNames ?? []),
        [selectedDisplayNames]
    );
    React.useEffect(() => {
        if (!selectedDisplayNames || selectedDisplayNames.length === 0) return;
        useAppStore
            .getState()
            .selectByIds(DIMMING_OBS_COLUMN, selectedDisplayNames);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDisplayNamesKey]);

    if (!datasetUrl) return null;

    return (
        <div style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>
            <CellExplorerView />
        </div>
    );
};
