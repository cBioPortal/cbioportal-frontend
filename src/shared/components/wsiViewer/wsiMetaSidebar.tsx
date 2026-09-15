import * as React from 'react';
import { Sample } from './wsiViewerTypes';
import {
    CnaTable,
    MutationTable,
    StructuralVariantTable,
} from './wsiMolecularTables';

const SIDEBAR_COLORS = {
    blue: '#2986e2',
    border: '#ddd',
    muted: '#737373',
    text: '#333',
    sidebarBg: '#f5f5f5',
} as const;

const sectionTitleStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: SIDEBAR_COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: '.8px',
};

const emptyStateStyle: React.CSSProperties = {
    color: '#bbb',
    fontSize: 11,
};

const linkedValueStyle: React.CSSProperties = {
    color: SIDEBAR_COLORS.blue,
    textDecoration: 'none',
};

export interface MetaRow {
    label: string;
    labelTip?: string;
    value: React.ReactNode;
    href?: string;
    valueTip?: string;
}

function SbSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                padding: '10px 12px',
                borderBottom: `1px solid ${SIDEBAR_COLORS.border}`,
            }}
        >
            <div style={sectionTitleStyle}>{title}</div>
            {children}
        </div>
    );
}

function EmptyState({ children = '—' }: { children?: React.ReactNode }) {
    return <span style={emptyStateStyle}>{children}</span>;
}

function renderMetaValue(row: MetaRow) {
    if (!row.href) {
        return row.value || '—';
    }

    return (
        <a
            href={row.href}
            target="_blank"
            rel="noopener noreferrer"
            style={linkedValueStyle}
            onMouseEnter={event => {
                (event.currentTarget as HTMLAnchorElement).style.textDecoration =
                    'underline';
            }}
            onMouseLeave={event => {
                (event.currentTarget as HTMLAnchorElement).style.textDecoration =
                    'none';
            }}
        >
            {row.value || '—'}
        </a>
    );
}

function hasMskImpactContent(sample: Sample | null, seqRows: MetaRow[]) {
    return (
        seqRows.length > 0 ||
        !!(
            sample?.oncogenic_mutations &&
            sample.oncogenic_mutation_details !== undefined
        ) ||
        !!sample?.cna_alterations?.length ||
        !!sample?.structural_variants?.length
    );
}

function MetaTable({ rows }: { rows: MetaRow[] }) {
    return (
        <table
            style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}
        >
            <tbody>
                {rows.map(row => (
                    <tr key={row.label}>
                        <td
                            title={row.labelTip}
                            style={{
                                fontSize: 11,
                                color: SIDEBAR_COLORS.muted,
                                width: '50%',
                                paddingRight: 5,
                                paddingTop: 2,
                                paddingBottom: 2,
                                verticalAlign: 'top',
                                lineHeight: 1.5,
                                cursor: row.labelTip ? 'help' : undefined,
                                borderBottom: row.labelTip
                                    ? `1px dotted ${SIDEBAR_COLORS.border}`
                                    : undefined,
                            }}
                        >
                            {row.label}
                        </td>
                        <td
                            title={row.valueTip}
                            style={{
                                fontSize: 11,
                                color: SIDEBAR_COLORS.text,
                                fontWeight: 500,
                                wordBreak: 'break-word',
                                verticalAlign: 'top',
                                lineHeight: 1.5,
                                cursor: row.valueTip ? 'help' : undefined,
                            }}
                        >
                            {renderMetaValue(row)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function WsiMetaSidebarComponent({
    width,
    showImageProperties,
    wsiRows,
    showPathology,
    pathRows,
    seqRows,
    sample,
    annotationLayersPanel,
    annotationPanel,
    annotationPanelTitle,
    agentPanel,
    agentPanelTitle,
}: {
    width: number;
    showImageProperties: boolean;
    wsiRows: MetaRow[];
    showPathology: boolean;
    pathRows: MetaRow[];
    seqRows: MetaRow[];
    sample: Sample | null;
    annotationLayersPanel?: React.ReactNode;
    annotationPanel?: React.ReactNode;
    annotationPanelTitle?: string;
    agentPanel?: React.ReactNode;
    agentPanelTitle?: string;
}) {
    const showMskImpact = hasMskImpactContent(sample, seqRows);

    return (
        <div
            data-testid="wsi-metadata-sidebar"
            style={{
                width,
                minWidth: width,
                background: SIDEBAR_COLORS.sidebarBg,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                flexShrink: 0,
            }}
        >
            <SbSection title="Image Properties">
                {showImageProperties ? (
                    <MetaTable rows={wsiRows} />
                ) : (
                    <EmptyState />
                )}
            </SbSection>

            <SbSection title="Pathology">
                {showPathology ? <MetaTable rows={pathRows} /> : <EmptyState />}
            </SbSection>

            {showMskImpact && (
                <SbSection title="MSK-IMPACT">
                    {seqRows.length > 0 && <MetaTable rows={seqRows} />}
                    {sample && <MutationTable sample={sample} />}
                    {sample?.cna_alterations?.length ? (
                        <CnaTable sample={sample} />
                    ) : null}
                    {sample?.structural_variants?.length ? (
                        <StructuralVariantTable sample={sample} />
                    ) : null}
                </SbSection>
            )}
            {agentPanel && (
                <SbSection title={agentPanelTitle || 'Research assistant'}>
                    {agentPanel}
                </SbSection>
            )}
            {annotationLayersPanel && (
                <SbSection title="Layers">{annotationLayersPanel}</SbSection>
            )}
            {annotationPanel && (
                <SbSection title={annotationPanelTitle || 'Annotations'}>
                    {annotationPanel}
                </SbSection>
            )}
        </div>
    );
}

export const WsiMetaSidebar = React.memo(WsiMetaSidebarComponent);
