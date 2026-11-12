import * as React from 'react';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
} from 'cbioportal-frontend-commons';
import { DEFAULT_PROTEIN_IMPACT_TYPE_COLORS } from 'react-mutation-mapper';
import { getSimplifiedMutationType } from './wsiMolecularServices';
import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
    WsiMutationDataStatus,
} from './wsiViewerTypes';
import {
    cnaLabel,
    parseMutationToken,
    parseMutationTokens,
} from './wsiMolecularUtils';

const TABLE_COLORS = {
    border: '#ddd',
    muted: '#737373',
    text: '#333',
} as const;

const ellipsisStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const compactThStyle: React.CSSProperties = {
    fontSize: 10,
    color: TABLE_COLORS.muted,
    fontWeight: 600,
    textAlign: 'left',
    paddingBottom: 4,
    userSelect: 'none',
};

const compactTdBase: React.CSSProperties = {
    fontSize: 11,
    paddingTop: 3,
    paddingBottom: 3,
    verticalAlign: 'middle',
};

const compactTableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 8,
    tableLayout: 'fixed',
};

const emptyStateStyle: React.CSSProperties = {
    color: TABLE_COLORS.muted,
    fontSize: 11,
};

const FIXED_TOOLTIP_MARGIN = 8;
const FIXED_TOOLTIP_WIDTH = 340;
const FIXED_TOOLTIP_MIN_HEIGHT = 120;
const FIXED_TOOLTIP_ESTIMATED_HEIGHT = 260;

type FixedTooltipAnchor = {
    x: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
};

function makeFixedTooltipAnchor(
    rect: Pick<DOMRect, 'left' | 'top' | 'bottom'>,
    estimatedHeight = FIXED_TOOLTIP_ESTIMATED_HEIGHT
): FixedTooltipAnchor {
    const viewportHeight = window.innerHeight || 0;
    const canFitBelow =
        rect.bottom + estimatedHeight + FIXED_TOOLTIP_MARGIN <= viewportHeight;
    const shouldPlaceAbove =
        !canFitBelow &&
        (rect.top > viewportHeight / 2 ||
            rect.top - estimatedHeight > FIXED_TOOLTIP_MARGIN);

    if (shouldPlaceAbove) {
        return {
            x: rect.left,
            bottom: Math.max(
                FIXED_TOOLTIP_MARGIN,
                viewportHeight - rect.top + 4
            ),
            maxHeight: Math.max(
                FIXED_TOOLTIP_MIN_HEIGHT,
                rect.top - FIXED_TOOLTIP_MARGIN * 2
            ),
        };
    }

    return {
        x: rect.left,
        top: rect.bottom + 4,
        maxHeight: Math.max(
            FIXED_TOOLTIP_MIN_HEIGHT,
            viewportHeight - rect.bottom - FIXED_TOOLTIP_MARGIN * 2
        ),
    };
}

function fixedTooltipViewportStyle(
    anchor: FixedTooltipAnchor
): React.CSSProperties {
    const maxLeft = Math.max(
        FIXED_TOOLTIP_MARGIN,
        window.innerWidth - FIXED_TOOLTIP_WIDTH - FIXED_TOOLTIP_MARGIN
    );
    return {
        position: 'fixed',
        left: Math.max(FIXED_TOOLTIP_MARGIN, Math.min(anchor.x, maxLeft)),
        top: anchor.top,
        bottom: anchor.bottom,
        maxHeight: anchor.maxHeight,
        overflowY: 'auto',
        boxSizing: 'border-box',
    };
}

function FixedTooltipCard({
    anchor,
    onMouseEnter,
    onMouseLeave,
    whiteSpace,
    children,
}: {
    anchor: FixedTooltipAnchor;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    whiteSpace?: React.CSSProperties['whiteSpace'];
    children: React.ReactNode;
}) {
    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                ...fixedTooltipViewportStyle(anchor),
                zIndex: 9999,
                background: '#fff',
                border: '1px solid #d4d4d4',
                borderRadius: 4,
                boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                padding: '10px 14px',
                maxWidth: 320,
                fontSize: 11.5,
                fontFamily: 'Arial, sans-serif',
                lineHeight: 1.45,
                color: '#333',
                pointerEvents: 'auto',
                whiteSpace,
            }}
        >
            {children}
        </div>
    );
}

function mutationTypeColor(type: string | undefined): string | undefined {
    if (!type) return undefined;
    const simplified = getSimplifiedMutationType(type);
    switch (simplified) {
        case 'missense':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.missenseColor;
        case 'frameshift':
        case 'nonsense':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.truncatingColor;
        case 'inframe':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.inframeColor;
        case 'splice':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.spliceColor;
        case 'fusion':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.fusionColor;
        case 'nonstart':
        case 'nonstop':
        case 'other':
            return DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.otherColor;
        default:
            return undefined;
    }
}

/** Highest VAF first, then by gene and variant. */
function compareMutationRows(
    a: { mut: string; detail?: MutationDetail },
    b: { mut: string; detail?: MutationDetail }
): number {
    const aVaf = a.detail?.vaf ?? -1;
    const bVaf = b.detail?.vaf ?? -1;
    if (aVaf !== bVaf) return bVaf - aVaf;
    return a.mut.localeCompare(b.mut);
}

function formatCnaCohort(cna: CNADetail): string | null {
    if (cna.cohortAlteredCount == null || !cna.cohortProfiledCount) {
        return null;
    }
    const frequency =
        cna.cohortFrequency != null
            ? cna.cohortFrequency
            : cna.cohortAlteredCount / cna.cohortProfiledCount;
    return `${cna.cohortAlteredCount}/${cna.cohortProfiledCount} (${(
        frequency * 100
    ).toFixed(1)}%)`;
}

function cnaTooltip(cna: CNADetail): string | undefined {
    const parts: string[] = [];
    if (cna.cytoband) {
        parts.push(`Cytoband: ${cna.cytoband}`);
    }
    const cohort = formatCnaCohort(cna);
    if (cohort) {
        parts.push(`Cohort: ${cohort}`);
    }
    return parts.length ? parts.join(' | ') : undefined;
}

function pushSvTooltipPart(parts: string[], label: string, value: unknown) {
    if (value == null || value === '' || value === 'NA' || value === -1) return;
    parts.push(`${label}: ${value}`);
}

function structuralVariantTooltip(
    sv: StructuralVariantDetail
): string | undefined {
    const parts: string[] = [];
    pushSvTooltipPart(parts, 'Status', sv.svStatus);
    pushSvTooltipPart(parts, 'Event info', sv.eventInfo);
    pushSvTooltipPart(parts, 'Connection type', sv.connectionType);
    return parts.length ? parts.join('\n') : undefined;
}

export function MutationTable({
    sample,
    mutationDataStatus = 'ready',
}: {
    sample: Sample;
    mutationDataStatus?: WsiMutationDataStatus;
}): React.ReactElement | null {
    const muts = parseMutationTokens(sample.oncogenic_mutations);
    const details = sample.oncogenic_mutation_details;

    if (!muts.length || details === undefined) {
        if (mutationDataStatus === 'loading') {
            return (
                <div
                    data-testid="wsi-mutation-table-loading"
                    style={{ ...emptyStateStyle, marginTop: 8 }}
                    role="status"
                >
                    Loading variants…
                </div>
            );
        }
        if (mutationDataStatus === 'error') {
            return (
                <div
                    data-testid="wsi-mutation-table-error"
                    style={{ ...emptyStateStyle, marginTop: 8 }}
                    role="status"
                >
                    Variant data unavailable.
                </div>
            );
        }
        return null;
    }

    const mutationRows = muts
        .map((mut, index) => ({ mut, index, detail: details?.[index] }))
        .sort(compareMutationRows);

    return (
        <div style={{ position: 'relative' }}>
            <table style={compactTableStyle}>
                <colgroup>
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '60%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene</th>
                        <th style={compactThStyle}>Variant ⓘ</th>
                    </tr>
                </thead>
                <tbody>
                    {mutationRows.map(({ mut, detail }) => {
                        const { gene, variant } = parseMutationToken(mut);
                        const cnaForGene = sample.cna_alterations?.find(
                            cna => cna.gene === gene
                        );
                        const variantTitleParts: string[] = [];
                        if (detail?.type) {
                            variantTitleParts.push(`Type: ${detail.type}`);
                        }
                        if (detail?.vaf != null) {
                            variantTitleParts.push(`VAF: ${detail.vaf}%`);
                        }
                        if (cnaForGene) {
                            variantTitleParts.push(
                                `Copy #: ${cnaLabel(cnaForGene.cnaValue)}`
                            );
                        }
                        if (detail?.cohortFrequency != null) {
                            variantTitleParts.push(
                                `Cohort: ${(
                                    detail.cohortFrequency * 100
                                ).toFixed(1)}%`
                            );
                        }
                        const variantTitle =
                            variantTitleParts.join(' | ') || undefined;

                        return (
                            <tr
                                key={mut}
                                style={{
                                    borderTop: `1px solid ${TABLE_COLORS.border}`,
                                }}
                            >
                                <td
                                    style={{
                                        ...compactTdBase,
                                        paddingRight: 4,
                                        ...ellipsisStyle,
                                        fontWeight: 600,
                                        color: TABLE_COLORS.text,
                                    }}
                                >
                                    {gene}
                                </td>
                                <td
                                    title={variantTitle}
                                    style={{
                                        ...compactTdBase,
                                        paddingRight: 4,
                                        ...ellipsisStyle,
                                        fontFamily: 'monospace',
                                        fontSize: 10.5,
                                        color: mutationTypeColor(detail?.type),
                                        fontWeight: detail?.type
                                            ? 600
                                            : undefined,
                                        cursor: variantTitle
                                            ? 'help'
                                            : undefined,
                                    }}
                                >
                                    {(variant.startsWith('p.')
                                        ? variant.slice(2)
                                        : variant) || '—'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {mutationDataStatus === 'error' && (
                <div
                    data-testid="wsi-mutation-table-error"
                    style={{ ...emptyStateStyle, marginTop: 8 }}
                    role="status"
                >
                    Variant data unavailable.
                </div>
            )}
        </div>
    );
}

export function CnaTable({
    sample,
}: {
    sample: Sample;
}): React.ReactElement | null {
    const cnas = sample.cna_alterations;
    if (!cnas?.length) return null;

    return (
        <div style={{ position: 'relative' }}>
            <table style={compactTableStyle}>
                <colgroup>
                    <col style={{ width: '50%' }} />
                    <col style={{ width: '50%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene</th>
                        <th style={compactThStyle}>CNA</th>
                    </tr>
                </thead>
                <tbody>
                    {cnas.map(cna => {
                        const label = cnaLabel(cna.cnaValue);
                        const cnaTitle = cnaTooltip(cna);
                        const color =
                            cna.cnaValue <= -2
                                ? CNA_COLOR_HOMDEL
                                : cna.cnaValue === -1
                                ? CNA_COLOR_HETLOSS
                                : cna.cnaValue >= 2
                                ? CNA_COLOR_AMP
                                : cna.cnaValue === 1
                                ? CNA_COLOR_GAIN
                                : TABLE_COLORS.muted;
                        return (
                            <tr
                                key={`${cna.gene}:${cna.cnaValue}`}
                                style={{
                                    borderTop: `1px solid ${TABLE_COLORS.border}`,
                                }}
                            >
                                <td
                                    style={{
                                        ...compactTdBase,
                                        paddingRight: 4,
                                        ...ellipsisStyle,
                                        color: TABLE_COLORS.text,
                                        fontWeight: 600,
                                    }}
                                >
                                    {cna.gene}
                                </td>
                                <td
                                    title={cnaTitle}
                                    style={{
                                        ...compactTdBase,
                                        color,
                                        cursor: cnaTitle ? 'help' : undefined,
                                        fontWeight: 500,
                                    }}
                                >
                                    {label}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function StructuralVariantTable({
    sample,
}: {
    sample: Sample;
}): React.ReactElement | null {
    const structuralVariants = sample.structural_variants;
    if (!structuralVariants?.length) return null;

    const [tooltip, setTooltip] = React.useState<
        ({ idx: number } & FixedTooltipAnchor) | null
    >(null);
    const hideTooltip = () => setTooltip(null);

    return (
        <div style={{ position: 'relative' }}>
            <table style={{ ...compactTableStyle, marginTop: 6 }}>
                <colgroup>
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '44%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene 1</th>
                        <th style={compactThStyle}>Gene 2</th>
                        <th style={compactThStyle}>Variant Class</th>
                    </tr>
                </thead>
                <tbody>
                    {structuralVariants.map((sv, index) => {
                        const tooltipText = structuralVariantTooltip(sv);
                        return (
                            <tr
                                key={`${sv.gene1}:${sv.gene2}:${sv.variantClass}:${index}`}
                                style={{
                                    borderTop: `1px solid ${TABLE_COLORS.border}`,
                                }}
                            >
                                <td
                                    style={{
                                        ...compactTdBase,
                                        paddingRight: 4,
                                        ...ellipsisStyle,
                                        color: TABLE_COLORS.text,
                                        fontWeight: 600,
                                    }}
                                >
                                    {sv.gene1}
                                </td>
                                <td
                                    style={{
                                        ...compactTdBase,
                                        paddingRight: 4,
                                        ...ellipsisStyle,
                                        color: TABLE_COLORS.text,
                                        fontWeight: 600,
                                    }}
                                >
                                    {sv.gene2}
                                </td>
                                <td
                                    style={{
                                        ...compactTdBase,
                                        paddingRight: 4,
                                        ...ellipsisStyle,
                                        color: '#6a2ca0',
                                        cursor: tooltipText
                                            ? 'help'
                                            : undefined,
                                        fontWeight: 500,
                                    }}
                                    onMouseEnter={event => {
                                        if (!tooltipText) return;
                                        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                                        setTooltip({
                                            idx: index,
                                            ...makeFixedTooltipAnchor(rect),
                                        });
                                    }}
                                    onMouseLeave={hideTooltip}
                                >
                                    {sv.variantClass}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {tooltip !== null &&
                (() => {
                    const sv = structuralVariants[tooltip.idx];
                    const content = sv && structuralVariantTooltip(sv);
                    if (!content) return null;
                    return (
                        <FixedTooltipCard
                            anchor={tooltip}
                            onMouseEnter={() => setTooltip(current => current)}
                            onMouseLeave={hideTooltip}
                            whiteSpace="pre-line"
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 12.5,
                                    marginBottom: 5,
                                }}
                            >
                                {sv.variantClass}
                            </div>
                            <div style={{ color: '#444', fontSize: 11 }}>
                                {content}
                            </div>
                        </FixedTooltipCard>
                    );
                })()}
        </div>
    );
}
