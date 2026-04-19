import * as React from 'react';
import {
    CellExplorerView,
    MappedColumnSpec,
    useAppStore,
} from 'cbioportal-cell-explorer-highperformer';
import 'antd/dist/antd.css';
import './CellExplorerTab.css';

// Prototype per-study configuration. Real integration would fetch this from
// the backend (e.g. on the study metadata). It declares:
//   - the zarr dataset URL,
//   - how patient-level cBioPortal clinical data joins to the zarr (which
//     clinical attribute's value matches which zarr obs column).
// Patient attributes are discovered dynamically from the study's clinical-
// attribute list — no hardcoded allowlist here.
export interface CellExplorerStudyConfig {
    datasetUrl: string;
    patientIdentifier: {
        clinicalAttributeId: string; // e.g. PATIENT_DISPLAY_NAME
        sourceColumn: string; // matching zarr obs column, e.g. donor_id
    };
}

export const CELL_EXPLORER_STUDY_CONFIGS: Record<
    string,
    CellExplorerStudyConfig
> = {
    msk_spectrum_tme_2022: {
        datasetUrl:
            'https://cbioportal-public-imaging.assets.cbioportal.org/msk_spectrum_tme_2022/zarr/spectrum_all_cells-f16-zstd-c1s30-v3.zarr/',
        patientIdentifier: {
            clinicalAttributeId: 'PATIENT_DISPLAY_NAME',
            sourceColumn: 'donor_id',
        },
    },
};

export function getCellExplorerConfig(
    studyId: string | undefined
): CellExplorerStudyConfig | undefined {
    return studyId ? CELL_EXPLORER_STUDY_CONFIGS[studyId] : undefined;
}

export function hasCellExplorerDataset(studyId: string | undefined): boolean {
    return !!getCellExplorerConfig(studyId);
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
    const config = getCellExplorerConfig(studyId);
    const datasetUrl = config?.datasetUrl;
    const dimmingColumn = config?.patientIdentifier.sourceColumn;
    const [loadedUrl, setLoadedUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        // Hide the standalone app's branding + dataset picker — inside cBioPortal
        // we already have a tab title and are showing a known dataset.
        useAppStore.getState().setEmbeddedMode(true);
    }, []);

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
        if (
            !selectedDisplayNames ||
            selectedDisplayNames.length === 0 ||
            !dimmingColumn
        )
            return;
        useAppStore.getState().selectByIds(dimmingColumn, selectedDisplayNames);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDisplayNamesKey, dimmingColumn]);

    if (!datasetUrl) return null;

    return (
        <div style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>
            <CellExplorerView />
        </div>
    );
};
