import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import { AgGridReact } from 'ag-grid-react';
import {
    ColDef,
    ICellRendererParams,
    RowClickedEvent,
} from 'ag-grid-community';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import {
    getPatientViewUrlWithPathname,
    getSampleViewUrlWithPathname,
} from 'shared/api/urls';
import { ResourceNodeRow } from 'shared/lib/ResourceNodeTypes';
import { getFileExtension } from './ResourcesTableUtils';

export interface IHierarchicalResourcesTableProps {
    data: ResourceNodeRow[];
    studyId?: string;
    searchTerm?: string;
}

// ─── Internal flat row types for AG Grid ─────────────────────────────────────

type PatientGridRow = {
    rowType: 'patient';
    id: string;
    patientId: string;
    studyId: string;
    isExpanded: boolean;
    totalItemCount: number;
};

type SampleGridRow = {
    rowType: 'sample';
    id: string;
    patientId: string;
    studyId: string;
    sampleId: string;
    isExpanded: boolean;
    itemCount: number;
};

type ResourceDefGridRow = {
    rowType: 'resourceDef';
    id: string;
    patientId: string;
    sampleId: string;
    resourceId: string;
    isExpanded: boolean;
    itemCount: number;
};

type GroupNodeGridRow = {
    rowType: 'groupNode';
    id: string;
    patientId: string;
    sampleId: string;
    groupPath: string;
    indentLevel: number;
    isExpanded: boolean;
    itemCount: number;
};

type ItemNodeGridRow = {
    rowType: 'itemNode';
    id: string;
    patientId: string;
    sampleId: string;
    row: ResourceNodeRow;
    indentLevel: number;
};

type GridRow =
    | PatientGridRow
    | SampleGridRow
    | ResourceDefGridRow
    | GroupNodeGridRow
    | ItemNodeGridRow;

// ─── Cell renderers ───────────────────────────────────────────────────────────

const INDENT_PX = 20;

function fileIcon(url: string): React.ReactElement | null {
    let className = '';
    try {
        const ext = getFileExtension(url);
        switch (ext) {
            case 'pdf':
                className = 'fa fa-file-pdf-o';
                break;
            case 'png':
            case 'jpeg':
            case 'jpg':
            case 'gif':
                className = 'fa fa-file-image-o';
                break;
            case 'm4a':
            case 'flac':
            case 'mp3':
            case 'mp4':
            case 'wav':
                className = 'fa fa-file-audio-o';
                break;
        }
    } catch {
        // ignore
    }
    return className ? (
        <i className={`${className} fa-sm`} style={{ marginRight: 5 }} />
    ) : null;
}

const EntityCellRenderer: React.FC<ICellRendererParams> = ({ data }) => {
    const row = data as GridRow;

    if (row.rowType === 'patient') {
        return (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i
                    className={`fa ${
                        row.isExpanded ? 'fa-caret-down' : 'fa-caret-right'
                    }`}
                    style={{ width: 10, color: '#555' }}
                />
                <a
                    href={getPatientViewUrlWithPathname(
                        row.studyId,
                        row.patientId,
                        'patient/filesAndLinks'
                    )}
                    onClick={e => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 600 }}
                >
                    {row.patientId}
                </a>
            </span>
        );
    }

    if (row.rowType === 'sample') {
        return (
            <span
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    paddingLeft: INDENT_PX,
                }}
            >
                <i
                    className={`fa ${
                        row.isExpanded ? 'fa-caret-down' : 'fa-caret-right'
                    }`}
                    style={{ width: 10, color: '#777' }}
                />
                <a
                    href={getSampleViewUrlWithPathname(
                        row.studyId,
                        row.sampleId,
                        'patient/filesAndLinks'
                    )}
                    onClick={e => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {row.sampleId}
                </a>
            </span>
        );
    }

    if (row.rowType === 'resourceDef') {
        return (
            <span
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    paddingLeft: 2 * INDENT_PX,
                }}
            >
                <i
                    className={`fa ${
                        row.isExpanded ? 'fa-caret-down' : 'fa-caret-right'
                    }`}
                    style={{ width: 10, color: '#999' }}
                />
                <span style={{ fontStyle: 'italic' }}>{row.resourceId}</span>
            </span>
        );
    }

    if (row.rowType === 'groupNode') {
        return (
            <span
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    paddingLeft: row.indentLevel * INDENT_PX,
                }}
            >
                <i
                    className={`fa fa-folder${row.isExpanded ? '-open' : ''}-o`}
                    style={{ width: 14, color: '#aaa', marginRight: 2 }}
                />
                <i
                    className={`fa ${
                        row.isExpanded ? 'fa-caret-down' : 'fa-caret-right'
                    }`}
                    style={{ width: 10, color: '#bbb' }}
                />
                <span style={{ color: '#444' }}>{row.groupPath}</span>
            </span>
        );
    }

    if (row.rowType === 'itemNode') {
        const { row: tsv } = row;
        return (
            <span style={{ paddingLeft: row.indentLevel * INDENT_PX }}>
                {tsv.url && fileIcon(tsv.url)}
                <span style={{ color: '#333' }}>{tsv.displayName}</span>
            </span>
        );
    }

    return null;
};

const UrlCellRenderer: React.FC<ICellRendererParams> = ({ data }) => {
    const row = data as GridRow;
    if (row.rowType !== 'itemNode') return null;
    const { url } = row.row;
    if (!url) return null;
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12 }}
        >
            <i
                className="fa fa-external-link fa-sm"
                style={{ marginRight: 4, color: '#333' }}
            />
            Open
        </a>
    );
};

const TypeCellRenderer: React.FC<ICellRendererParams> = ({ data }) => {
    const row = data as GridRow;
    if (row.rowType !== 'itemNode') return null;
    return row.row.type ? (
        <span style={{ color: '#555', fontSize: 12 }}>{row.row.type}</span>
    ) : null;
};

const CountCellRenderer: React.FC<ICellRendererParams> = ({ data }) => {
    const row = data as GridRow;
    if (
        row.rowType === 'patient' ||
        row.rowType === 'sample' ||
        row.rowType === 'resourceDef' ||
        row.rowType === 'groupNode'
    ) {
        const n =
            row.rowType === 'patient' ? row.totalItemCount : row.itemCount;
        return (
            <span style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                {n} {n === 1 ? 'resource' : 'resources'}
            </span>
        );
    }
    return null;
};

function makeMetaCellRenderer(key: string): React.FC<ICellRendererParams> {
    const renderer: React.FC<ICellRendererParams> = ({ data }) => {
        const row = data as GridRow;
        if (row.rowType !== 'itemNode') return null;
        const val = row.row.metadata?.[key];
        if (val === undefined || val === null) return null;
        return (
            <span style={{ fontSize: 12, color: '#555' }}>{String(val)}</span>
        );
    };
    renderer.displayName = `Meta_${key}`;
    return renderer;
}

const MetaScannerIdCellRenderer = makeMetaCellRenderer('scanner_id');
const MetaBrandCellRenderer = makeMetaCellRenderer('brand');
const MetaModelCellRenderer = makeMetaCellRenderer('model');
const MetaMagnificationCellRenderer = makeMetaCellRenderer('magnification');
const MetaPartTypeCellRenderer = makeMetaCellRenderer('part_type');
const MetaPartInstCellRenderer = makeMetaCellRenderer('part_inst');
const MetaImageIdCellRenderer = makeMetaCellRenderer('image_id');

// ─── Column definitions ───────────────────────────────────────────────────────

export const META_COLUMN_DEFS: Array<ColDef & { label: string }> = [
    {
        headerName: 'Scanner ID',
        label: 'Scanner ID',
        colId: 'meta_scanner_id',
        field: 'meta_scanner_id',
        width: 130,
        cellRenderer: 'metaScannerIdCellRenderer',
        sortable: false,
        resizable: true,
        hide: true,
    },
    {
        headerName: 'Brand',
        label: 'Brand',
        colId: 'meta_brand',
        field: 'meta_brand',
        width: 100,
        cellRenderer: 'metaBrandCellRenderer',
        sortable: false,
        resizable: true,
        hide: true,
    },
    {
        headerName: 'Model',
        label: 'Model',
        colId: 'meta_model',
        field: 'meta_model',
        width: 90,
        cellRenderer: 'metaModelCellRenderer',
        sortable: false,
        resizable: true,
        hide: true,
    },
    {
        headerName: 'Magnification',
        label: 'Magnification',
        colId: 'meta_magnification',
        field: 'meta_magnification',
        width: 120,
        cellRenderer: 'metaMagnificationCellRenderer',
        sortable: false,
        resizable: true,
        hide: true,
    },
    {
        headerName: 'Part Type',
        label: 'Part Type',
        colId: 'meta_part_type',
        field: 'meta_part_type',
        flex: 2,
        cellRenderer: 'metaPartTypeCellRenderer',
        sortable: false,
        resizable: true,
        hide: true,
    },
    {
        headerName: 'Part #',
        label: 'Part #',
        colId: 'meta_part_inst',
        field: 'meta_part_inst',
        width: 80,
        cellRenderer: 'metaPartInstCellRenderer',
        sortable: false,
        resizable: true,
        hide: true,
    },
    {
        headerName: 'Image ID',
        label: 'Image ID',
        colId: 'meta_image_id',
        field: 'meta_image_id',
        width: 110,
        cellRenderer: 'metaImageIdCellRenderer',
        sortable: false,
        resizable: true,
        hide: true,
    },
];

const BASE_COLUMN_DEFS: ColDef[] = [
    {
        headerName: 'Patient / Sample / Resource / Group / Item',
        field: 'id',
        flex: 3,
        cellRenderer: 'entityCellRenderer',
        sortable: false,
        resizable: true,
    },
    {
        headerName: 'Type',
        colId: 'type',
        field: 'type',
        width: 120,
        cellRenderer: 'typeCellRenderer',
        sortable: false,
        resizable: true,
    },
    {
        headerName: 'Resource URL',
        colId: 'url',
        field: 'url',
        flex: 2,
        cellRenderer: 'urlCellRenderer',
        sortable: false,
        resizable: true,
    },
    {
        headerName: 'Count',
        colId: 'count',
        field: 'count',
        width: 160,
        cellRenderer: 'countCellRenderer',
        sortable: false,
        resizable: false,
    },
];

const FRAMEWORK_COMPONENTS = {
    entityCellRenderer: EntityCellRenderer,
    typeCellRenderer: TypeCellRenderer,
    urlCellRenderer: UrlCellRenderer,
    countCellRenderer: CountCellRenderer,
    metaScannerIdCellRenderer: MetaScannerIdCellRenderer,
    metaBrandCellRenderer: MetaBrandCellRenderer,
    metaModelCellRenderer: MetaModelCellRenderer,
    metaMagnificationCellRenderer: MetaMagnificationCellRenderer,
    metaPartTypeCellRenderer: MetaPartTypeCellRenderer,
    metaPartInstCellRenderer: MetaPartInstCellRenderer,
    metaImageIdCellRenderer: MetaImageIdCellRenderer,
};

// ─── Table component ──────────────────────────────────────────────────────────

@observer
export class HierarchicalResourcesTable extends React.Component<
    IHierarchicalResourcesTableProps,
    {}
> {
    @observable private expandedPatients: Set<string> = new Set();
    @observable private expandedSamples: Set<string> = new Set();
    @observable private expandedResourceDefs: Set<string> = new Set();
    @observable private expandedGroups: Set<string> = new Set();
    @observable private shownMetaCols: Set<string> = new Set();

    constructor(props: IHierarchicalResourcesTableProps) {
        super(props);
        makeObservable(this);
    }

    private get activeTerm(): string {
        return (this.props.searchTerm ?? '').trim();
    }

    private get isFiltering(): boolean {
        return this.activeTerm.length > 0;
    }

    @action.bound
    private toggleMetaCol(colId: string) {
        if (this.shownMetaCols.has(colId)) {
            this.shownMetaCols.delete(colId);
        } else {
            this.shownMetaCols.add(colId);
        }
    }

    @computed get columnDefs(): ColDef[] {
        return [
            ...BASE_COLUMN_DEFS,
            ...META_COLUMN_DEFS.map(col => ({
                ...col,
                hide: !this.shownMetaCols.has(col.colId as string),
            })),
        ];
    }

    @action.bound
    private togglePatient(patientId: string) {
        if (this.expandedPatients.has(patientId)) {
            this.expandedPatients.delete(patientId);
            for (const key of Array.from(this.expandedSamples)) {
                if (key.startsWith(`${patientId}::`))
                    this.expandedSamples.delete(key);
            }
            for (const key of Array.from(this.expandedResourceDefs)) {
                if (key.startsWith(`${patientId}::`))
                    this.expandedResourceDefs.delete(key);
            }
            for (const key of Array.from(this.expandedGroups)) {
                if (key.startsWith(`${patientId}::`))
                    this.expandedGroups.delete(key);
            }
        } else {
            this.expandedPatients.add(patientId);
        }
    }

    @action.bound
    private toggleSample(sampleKey: string) {
        if (this.expandedSamples.has(sampleKey)) {
            this.expandedSamples.delete(sampleKey);
            for (const key of Array.from(this.expandedResourceDefs)) {
                if (key.startsWith(`${sampleKey}::`))
                    this.expandedResourceDefs.delete(key);
            }
            for (const key of Array.from(this.expandedGroups)) {
                if (key.startsWith(`${sampleKey}::`))
                    this.expandedGroups.delete(key);
            }
        } else {
            this.expandedSamples.add(sampleKey);
        }
    }

    @action.bound
    private toggleResourceDef(defKey: string) {
        if (this.expandedResourceDefs.has(defKey)) {
            this.expandedResourceDefs.delete(defKey);
            for (const key of Array.from(this.expandedGroups)) {
                if (key.startsWith(`${defKey}::`))
                    this.expandedGroups.delete(key);
            }
        } else {
            this.expandedResourceDefs.add(defKey);
        }
    }

    @action.bound
    private toggleGroup(groupKey: string) {
        if (this.expandedGroups.has(groupKey)) {
            this.expandedGroups.delete(groupKey);
        } else {
            this.expandedGroups.add(groupKey);
        }
    }

    // ─── Search filter ────────────────────────────────────────────────────────

    private itemVisible(row: ResourceNodeRow): boolean {
        const term = this.activeTerm;
        if (!term) return true;
        const lower = term.toLowerCase();
        return (
            row.patientId.toLowerCase().includes(lower) ||
            row.sampleId.toLowerCase().includes(lower) ||
            row.resourceId.toLowerCase().includes(lower) ||
            (row.groupPath?.toLowerCase().includes(lower) ?? false) ||
            row.displayName.toLowerCase().includes(lower) ||
            (row.url?.toLowerCase().includes(lower) ?? false) ||
            (row.type?.toLowerCase().includes(lower) ?? false) ||
            Object.values(row.metadata ?? {}).some(v =>
                String(v)
                    .toLowerCase()
                    .includes(lower)
            )
        );
    }

    // ─── rowData builder ──────────────────────────────────────────────────────

    @computed get rowData(): GridRow[] {
        const rows: GridRow[] = [];
        const isFiltering = this.isFiltering;
        const studyId = this.props.studyId ?? '';

        // Build nested map: patientId → sampleId → resourceId → groupPath → rows
        const patientMap = new Map<
            string,
            Map<string, Map<string, Map<string, ResourceNodeRow[]>>>
        >();

        for (const row of this.props.data) {
            if (!patientMap.has(row.patientId))
                patientMap.set(row.patientId, new Map());
            const sampleMap = patientMap.get(row.patientId)!;

            if (!sampleMap.has(row.sampleId))
                sampleMap.set(row.sampleId, new Map());
            const resourceMap = sampleMap.get(row.sampleId)!;

            if (!resourceMap.has(row.resourceId))
                resourceMap.set(row.resourceId, new Map());
            const groupMap = resourceMap.get(row.resourceId)!;

            const gk = row.groupPath || '';
            if (!groupMap.has(gk)) groupMap.set(gk, []);
            groupMap.get(gk)!.push(row);
        }

        for (const [patientId, sampleMap] of patientMap) {
            const totalItemCount = countVisibleItems(
                sampleMap,
                isFiltering,
                this
            );

            if (isFiltering && totalItemCount === 0) continue;

            const patientExpanded =
                isFiltering || this.expandedPatients.has(patientId);
            rows.push({
                rowType: 'patient',
                id: patientId,
                patientId,
                studyId,
                isExpanded: patientExpanded,
                totalItemCount,
            } as PatientGridRow);

            if (!patientExpanded) continue;

            for (const [sampleId, resourceMap] of sampleMap) {
                const sampleKey = `${patientId}::${sampleId}`;
                const sampleItemCount = countVisibleResourceItems(
                    resourceMap,
                    isFiltering,
                    this
                );

                if (isFiltering && sampleItemCount === 0) continue;

                const sampleExpanded =
                    isFiltering || this.expandedSamples.has(sampleKey);
                rows.push({
                    rowType: 'sample',
                    id: sampleKey,
                    patientId,
                    studyId,
                    sampleId,
                    isExpanded: sampleExpanded,
                    itemCount: sampleItemCount,
                } as SampleGridRow);

                if (!sampleExpanded) continue;

                for (const [resourceId, groupMap] of resourceMap) {
                    const defKey = `${sampleKey}::${resourceId}`;
                    const defItemCount = countVisibleGroupItems(
                        groupMap,
                        isFiltering,
                        this
                    );

                    if (isFiltering && defItemCount === 0) continue;

                    const defExpanded =
                        isFiltering || this.expandedResourceDefs.has(defKey);
                    rows.push({
                        rowType: 'resourceDef',
                        id: defKey,
                        patientId,
                        sampleId,
                        resourceId,
                        isExpanded: defExpanded,
                        itemCount: defItemCount,
                    } as ResourceDefGridRow);

                    if (!defExpanded) continue;

                    for (const [groupPath, items] of groupMap) {
                        if (groupPath === '') {
                            for (const item of items) {
                                if (!this.itemVisible(item)) continue;
                                rows.push({
                                    rowType: 'itemNode',
                                    id:
                                        item.url ||
                                        `${defKey}::${item.displayName}`,
                                    patientId,
                                    sampleId,
                                    row: item,
                                    indentLevel: 3,
                                } as ItemNodeGridRow);
                            }
                        } else {
                            const groupKey = `${defKey}::${groupPath}`;
                            const visibleItems = items.filter(i =>
                                this.itemVisible(i)
                            );
                            const groupItemCount = isFiltering
                                ? visibleItems.length
                                : items.length;

                            if (isFiltering && groupItemCount === 0) continue;

                            const groupExpanded =
                                isFiltering ||
                                this.expandedGroups.has(groupKey);
                            rows.push({
                                rowType: 'groupNode',
                                id: groupKey,
                                patientId,
                                sampleId,
                                groupPath,
                                indentLevel: 3,
                                isExpanded: groupExpanded,
                                itemCount: groupItemCount,
                            } as GroupNodeGridRow);

                            if (!groupExpanded) continue;

                            for (const item of isFiltering
                                ? visibleItems
                                : items) {
                                rows.push({
                                    rowType: 'itemNode',
                                    id:
                                        item.url ||
                                        `${groupKey}::${item.displayName}`,
                                    patientId,
                                    sampleId,
                                    row: item,
                                    indentLevel: 4,
                                } as ItemNodeGridRow);
                            }
                        }
                    }
                }
            }
        }

        return rows;
    }

    private readonly handleRowClicked = (event: RowClickedEvent) => {
        const target = event.event?.target as HTMLElement | null;
        if (target && target.closest('a')) return;
        if (this.isFiltering) return;

        const row = event.data as GridRow;
        if (row.rowType === 'patient') {
            this.togglePatient(row.patientId);
        } else if (row.rowType === 'sample') {
            this.toggleSample(row.id);
        } else if (row.rowType === 'resourceDef') {
            this.toggleResourceDef(row.id);
        } else if (row.rowType === 'groupNode') {
            this.toggleGroup(row.id);
        }
    };

    private readonly getRowStyle = (params: {
        data: GridRow;
    }): React.CSSProperties => {
        const row = params.data;
        if (row.rowType === 'patient')
            return {
                background: '#dde8f0',
                fontWeight: 600,
                cursor: 'pointer',
            };
        if (row.rowType === 'sample')
            return { background: '#eef4f8', cursor: 'pointer' };
        if (row.rowType === 'resourceDef')
            return { background: '#f5f8fb', cursor: 'pointer' };
        if (row.rowType === 'groupNode')
            return { background: '#f9fbfd', cursor: 'pointer' };
        return { background: '#fafcfd' };
    };

    render() {
        if (this.props.data.length === 0) {
            return <p>No resources found.</p>;
        }
        return (
            <div>
                {/* Metadata column toggles */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginBottom: 8,
                        flexWrap: 'wrap',
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            color: '#666',
                            marginRight: 6,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Metadata columns:
                    </span>
                    {META_COLUMN_DEFS.map(col => {
                        const colId = col.colId as string;
                        const visible = this.shownMetaCols.has(colId);
                        return (
                            <label
                                key={colId}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    padding: '2px 8px',
                                    borderRadius: 3,
                                    border: '1px solid #ccc',
                                    background: visible ? '#e8f0fe' : '#f5f5f5',
                                    color: visible ? '#1a73e8' : '#555',
                                    userSelect: 'none',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={visible}
                                    onChange={() => this.toggleMetaCol(colId)}
                                    style={{ margin: 0 }}
                                />
                                {col.label}
                            </label>
                        );
                    })}
                </div>

                <div
                    className="ag-theme-alpine"
                    style={{ width: '100%', minHeight: 300 }}
                >
                    <AgGridReact
                        rowData={this.rowData}
                        columnDefs={this.columnDefs}
                        frameworkComponents={FRAMEWORK_COMPONENTS}
                        getRowId={params => params.data.id}
                        onRowClicked={this.handleRowClicked}
                        getRowStyle={this.getRowStyle as any}
                        domLayout="autoHeight"
                        suppressCellFocus={true}
                        suppressRowHoverHighlight={false}
                        headerHeight={36}
                        rowHeight={32}
                    />
                </div>
            </div>
        );
    }
}

// ─── Count helpers ────────────────────────────────────────────────────────────

function countVisibleGroupItems(
    groupMap: Map<string, ResourceNodeRow[]>,
    isFiltering: boolean,
    table: HierarchicalResourcesTable
): number {
    let n = 0;
    for (const items of groupMap.values()) {
        n += isFiltering
            ? items.filter(i => table['itemVisible'](i)).length
            : items.length;
    }
    return n;
}

function countVisibleResourceItems(
    resourceMap: Map<string, Map<string, ResourceNodeRow[]>>,
    isFiltering: boolean,
    table: HierarchicalResourcesTable
): number {
    let n = 0;
    for (const groupMap of resourceMap.values()) {
        n += countVisibleGroupItems(groupMap, isFiltering, table);
    }
    return n;
}

function countVisibleItems(
    sampleMap: Map<string, Map<string, Map<string, ResourceNodeRow[]>>>,
    isFiltering: boolean,
    table: HierarchicalResourcesTable
): number {
    let n = 0;
    for (const resourceMap of sampleMap.values()) {
        n += countVisibleResourceItems(resourceMap, isFiltering, table);
    }
    return n;
}

export default HierarchicalResourcesTable;
