import * as React from 'react';
import {
    CellExplorer,
    MappedColumnSpec,
} from '@cbioportal-cell-explorer/component';
import './CellExplorerTab.css';

// Prototype study→dataset mapping. Real integration would fetch this from the
// backend (e.g. via a `cellExplorerDataset` field on the study metadata).
const STUDY_TO_DATASET: Record<string, string> = {
    msk_spectrum_tme_2022:
        'https://cbioportal-public-imaging.assets.cbioportal.org/msk_spectrum_tme_2022/zarr/spectrum_all_cells-f16-zstd-c1s30-v3.zarr/',
};

// The zarr obs column whose values are matched against the host's clinical
// identifiers (PATIENT_DISPLAY_NAME). MSK SPECTRUM–specific; mirrors PR #5535.
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

    const filterConfig = React.useMemo(() => {
        const cfg: {
            ids?: string[];
            obsColumn?: string;
            mappedColumns?: MappedColumnSpec[];
        } = {};
        if (selectedDisplayNames && selectedDisplayNames.length > 0) {
            cfg.ids = selectedDisplayNames;
            cfg.obsColumn = DIMMING_OBS_COLUMN;
        }
        if (mappedColumns && mappedColumns.length > 0) {
            cfg.mappedColumns = mappedColumns;
        }
        return cfg;
    }, [
        // key effects on content, not reference identity — MobX @computed
        // re-creates arrays on each access
        JSON.stringify(selectedDisplayNames ?? []),
        JSON.stringify(mappedColumns ?? []),
    ]);

    if (!datasetUrl) return null;

    return (
        <div style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>
            <CellExplorer url={datasetUrl} filterConfig={filterConfig} />
        </div>
    );
};
