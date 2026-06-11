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
    onLassoSelectionChange?: (patientIds: string[]) => void;
}

export const CellExplorerTab: React.FunctionComponent<CellExplorerTabProps> = ({
    studyId,
    mappedColumns,
    selectedDisplayNames,
    onLassoSelectionChange,
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
    // Register the "apply current spatial selection to Study View" action on
    // the store so the toolbar button can invoke it. The translation
    // (cell sourceColumn values → clinical patient identifier) stays in the
    // host because the mapping lives here.
    React.useEffect(() => {
        if (!onLassoSelectionChange || !dimmingColumn) {
            useAppStore.getState().setApplySelectionHandler(null);
            return;
        }
        useAppStore.getState().setApplySelectionHandler(async () => {
            const counts = await useAppStore
                .getState()
                .getSelectedValueCountsForColumn(dimmingColumn);
            if (counts.size === 0) return;
            // Drop "straggler" donors that contribute a trivial fraction of
            // the lasso — these are usually UMAP-overlap noise, not intended.
            // Require each donor to account for ≥1% OR ≥10 cells of the
            // selection (whichever is higher).
            const total = Array.from(counts.values()).reduce(
                (a, b) => a + b,
                0
            );
            const threshold = Math.max(10, Math.ceil(total * 0.01));
            const filtered = Array.from(counts.entries())
                .filter(([, count]) => count >= threshold)
                .map(([id]) => id);
            if (filtered.length > 0) onLassoSelectionChange(filtered);
        });
        return () => {
            useAppStore.getState().setApplySelectionHandler(null);
        };
    }, [onLassoSelectionChange, dimmingColumn]);

    React.useEffect(() => {
        if (!dimmingColumn) return;
        if (!selectedDisplayNames || selectedDisplayNames.length === 0) {
            // No active Study View filter → drop any custom group we may
            // have created earlier, so the cell explorer doesn't echo
            // "all patients" back as a redundant selection.
            useAppStore.getState().clearCustomGroup();
            return;
        }
        useAppStore.getState().selectByIds(dimmingColumn, selectedDisplayNames);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDisplayNamesKey, dimmingColumn]);

    if (!datasetUrl) return null;

    return (
        <div
            style={{
                height: 'calc(100vh - 180px)',
                minHeight: 500,
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
            }}
        >
            <CellExplorerView />
        </div>
    );
};
