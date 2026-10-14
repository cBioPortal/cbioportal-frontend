import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

import { WSI_THEME } from './wsiTheme';
import { useWsiPanelFlag, WsiPanelHeader } from './wsiPanelChrome';

const SIDEBAR_COLORS = WSI_THEME;

const emptyStateStyle: React.CSSProperties = {
    color: SIDEBAR_COLORS.muted,
    fontSize: 13,
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
    /** Shown only after "Show more". */
    more?: boolean;
}

/** Browser-stored "Show more" state of a sidebar section. */
export function wsiSidebarSectionExpandedKey(sectionId: string): string {
    return `wsi.viewer.sidebarSection.${sectionId}.expanded`;
}

/** Browser-stored collapsed state of a sidebar section. */
export function wsiSidebarSectionCollapsedKey(sectionId: string): string {
    return `wsi.viewer.sidebarSection.${sectionId}.collapsed`;
}

/** Sections sit under the Details header, so their titles are a step quieter. */
const sectionToggleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: SIDEBAR_COLORS.text,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
};

/** A sidebar section whose header collapses and expands its content. */
function SbSection({
    id,
    title,
    action,
    children,
}: {
    id: string;
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useWsiPanelFlag(
        wsiSidebarSectionCollapsedKey(id)
    );
    const toggle = () => setCollapsed(!collapsed);
    const contentId = `wsi-sidebar-section-${id}`;

    return (
        <div
            data-testid={`wsi-sidebar-section-${id}`}
            style={{
                padding: '10px 12px',
                borderBottom: `1px solid ${SIDEBAR_COLORS.border}`,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <button
                    type="button"
                    aria-expanded={!collapsed}
                    aria-controls={contentId}
                    data-testid={`wsi-sidebar-section-${id}-toggle`}
                    onClick={toggle}
                    style={sectionToggleStyle}
                >
                    <i
                        className={`fa fa-caret-${
                            collapsed ? 'right' : 'down'
                        }`}
                        aria-hidden="true"
                        style={{ width: 8, color: SIDEBAR_COLORS.muted }}
                    />
                    {title}
                </button>
                {action}
            </div>
            {/* Collapsed content stays mounted so panels keep their state. */}
            <div id={contentId} hidden={collapsed}>
                {children}
            </div>
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

/** A cell's text with the portal tooltip when it has a tip. */
function WithTip({
    tip,
    children,
}: {
    tip?: string;
    children: React.ReactNode;
}) {
    if (!tip) {
        return <>{children}</>;
    }
    return (
        <DefaultTooltip
            trigger={['hover']}
            placement="left"
            overlay={<span>{tip}</span>}
        >
            <span style={{ cursor: 'help' }}>{children}</span>
        </DefaultTooltip>
    );
}

/** Key-value rows, striped like the portal's clinical attribute tables. */
function MetaTable({ rows }: { rows: ReadonlyArray<MetaRow> }) {
    return (
        <table
            style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: 6,
                fontSize: 13,
                lineHeight: 1.4,
            }}
        >
            <tbody>
                {rows.map((row, index) => (
                    <tr
                        key={row.label}
                        style={{
                            background: index % 2 === 0 ? '#fff' : '#f9f9f9',
                        }}
                    >
                        <td
                            style={{
                                color: SIDEBAR_COLORS.text,
                                width: '45%',
                                padding: '3px 6px',
                                verticalAlign: 'top',
                            }}
                        >
                            <WithTip tip={row.labelTip}>{row.label}</WithTip>
                        </td>
                        <td
                            style={{
                                color: SIDEBAR_COLORS.text,
                                padding: '3px 6px',
                                wordBreak: 'break-word',
                                verticalAlign: 'top',
                            }}
                        >
                            <WithTip tip={row.valueTip}>
                                {renderMetaValue(row)}
                            </WithTip>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

const showMoreStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    padding: 0,
    marginTop: 4,
    fontSize: 13,
    color: SIDEBAR_COLORS.blue,
    cursor: 'pointer',
};

/** Rows marked `more` stay behind a "Show N more" toggle. */
function ExpandableMetaTable({
    id,
    rows,
}: {
    id: string;
    rows: ReadonlyArray<MetaRow>;
}) {
    const [expanded, setExpanded] = useWsiPanelFlag(
        wsiSidebarSectionExpandedKey(id)
    );
    const toggle = () => setExpanded(!expanded);
    const moreCount = rows.filter(row => row.more).length;
    const visibleRows = expanded ? rows : rows.filter(row => !row.more);

    return (
        <>
            {visibleRows.length > 0 ? (
                <MetaTable rows={visibleRows} />
            ) : (
                <div style={{ marginTop: 6 }}>
                    <EmptyState />
                </div>
            )}
            {moreCount > 0 && (
                <button
                    type="button"
                    aria-expanded={expanded}
                    data-testid={`wsi-sidebar-section-${id}-more`}
                    onClick={toggle}
                    style={showMoreStyle}
                >
                    <i
                        className={`fa fa-angle-${expanded ? 'up' : 'down'}`}
                        aria-hidden="true"
                        style={{ marginRight: 4 }}
                    />
                    {expanded ? 'Show less' : `Show ${moreCount} more`}
                </button>
            )}
        </>
    );
}

function WsiMetaSidebarComponent({
    width,
    showImageProperties,
    wsiRows,
    showPathology,
    pathRows,
    clinicalRows,
    onHide,
}: {
    width: number;
    showImageProperties: boolean;
    wsiRows: MetaRow[];
    showPathology: boolean;
    pathRows: MetaRow[];
    /** Patient clinical rows; unset (e.g. still loading) hides the section. */
    clinicalRows?: ReadonlyArray<MetaRow>;
    /** Shows a header button that hides the sidebar. */
    onHide?: () => void;
}) {
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
            <WsiPanelHeader
                title="Details"
                side="right"
                hideLabel="Hide details (.)"
                onHide={onHide}
                hideTestId="wsi-metadata-hide"
            />
            <SbSection id="imageProperties" title="Image properties">
                {showImageProperties ? (
                    <MetaTable rows={wsiRows} />
                ) : (
                    <EmptyState />
                )}
            </SbSection>

            <SbSection id="pathology" title="Pathology">
                {showPathology ? <MetaTable rows={pathRows} /> : <EmptyState />}
            </SbSection>

            {clinicalRows && (
                <SbSection id="clinical" title="Clinical">
                    {clinicalRows.length > 0 ? (
                        <ExpandableMetaTable
                            id="clinical"
                            rows={clinicalRows}
                        />
                    ) : (
                        <EmptyState />
                    )}
                </SbSection>
            )}
        </div>
    );
}

export const WsiMetaSidebar = React.memo(WsiMetaSidebarComponent);
