import * as React from 'react';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
} from 'cbioportal-frontend-commons';
import { Civic, HotspotAnnotation, DEFAULT_PROTEIN_IMPACT_TYPE_COLORS } from 'react-mutation-mapper';
import { getSimplifiedMutationType } from 'shared/lib/oql/AccessorsForOqlFilter';
import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
} from './wsiViewerTypes';
import {
    AnnotationBadgeRow,
    AnnotationFooterLink,
    AnnotationIconSlot,
    AnnotationLinkIcon,
    AnnotationSummaryText,
    hasOncoKbAnnotationContent,
} from './wsiAnnotationUtils';
import {
    buildOncoKbUrl,
    cnaLabel,
    parseMutationToken,
    parseMutationTokens,
} from './wsiMolecularUtils';

const TABLE_COLORS = {
    border: '#ddd',
    muted: '#737373',
    text: '#333',
} as const;

const inlineIconStyle: React.CSSProperties = {
    verticalAlign: 'middle',
    display: 'inline-block',
};

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

function oncokbCircleColor(
    oncogenic?: string
): { stroke: string; rings: 3 | 1 } {
    const level = (oncogenic || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
    if (['oncogenic', 'likely-oncogenic', 'resistance'].includes(level)) {
        return { stroke: '#0968C3', rings: 3 };
    }
    if (['neutral', 'likely-neutral'].includes(level)) {
        return { stroke: '#696969', rings: 3 };
    }
    if (level === 'inconclusive') return { stroke: '#aaa', rings: 3 };
    if (level === 'vus') return { stroke: '#696969', rings: 1 };
    return { stroke: '#ccc', rings: 1 };
}

const OncoKbIcon = ({ oncogenic }: { oncogenic?: string }) => {
    const { stroke, rings } = oncokbCircleColor(oncogenic);
    return (
        <svg
            width="14"
            height="14"
            viewBox="-9 -9 18 18"
            style={inlineIconStyle}
        >
            <circle r="7" fill="none" strokeWidth="2" stroke={stroke} />
            {rings === 3 && (
                <>
                    <circle r="4" fill="none" strokeWidth="2" stroke={stroke} />
                    <circle r="2" fill={stroke} />
                </>
            )}
        </svg>
    );
};

function wsiOncoKbSortScore(detail?: MutationDetail): number {
    const oncogenic = (detail?.oncogenic || '').trim().toLowerCase();
    if (oncogenic === 'oncogenic') return 5;
    if (oncogenic === 'likely oncogenic' || oncogenic === 'resistance') {
        return 4;
    }
    if (oncogenic === 'predicted oncogenic') return 3;
    if (detail?.mutationEffect && detail.mutationEffect !== 'Unknown') return 2;
    if (oncogenic || detail?.mutationEffect) return 1;
    return 0;
}

function wsiMutationAnnotationSortScore(
    detail?: MutationDetail
): [number, number, number, number] {
    return [
        wsiOncoKbSortScore(detail),
        detail?.civicEntry ? 1 : 0,
        detail?.hotspot === true ||
        !!detail?.annotation?.toLowerCase().includes('hotspot')
            ? 1
            : 0,
        detail?.vaf ?? -1,
    ];
}

function compareMutationAnnotationRows(
    a: { mut: string; detail?: MutationDetail },
    b: { mut: string; detail?: MutationDetail }
): number {
    const aScore = wsiMutationAnnotationSortScore(a.detail);
    const bScore = wsiMutationAnnotationSortScore(b.detail);
    for (let i = 0; i < aScore.length; i++) {
        if (aScore[i] !== bScore[i]) return bScore[i] - aScore[i];
    }
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
}: {
    sample: Sample;
}): React.ReactElement | null {
    const muts = parseMutationTokens(sample.oncogenic_mutations);
    const details = sample.oncogenic_mutation_details;
    if (!muts.length || details === undefined) return null;

    const [tooltip, setTooltip] = React.useState<
        ({ idx: number } & FixedTooltipAnchor) | null
    >(null);
    const hideTooltip = () => setTooltip(null);

    const mutationRows = muts
        .map((mut, index) => ({ mut, index, detail: details?.[index] }))
        .sort(compareMutationAnnotationRows);

    return (
        <div style={{ position: 'relative' }}>
            <table style={compactTableStyle}>
                <colgroup>
                    <col style={{ width: '34%' }} />
                    <col style={{ width: '38%' }} />
                    <col style={{ width: '28%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene</th>
                        <th style={compactThStyle}>Variant ⓘ</th>
                        <th style={compactThStyle}>Annot</th>
                    </tr>
                </thead>
                <tbody>
                    {mutationRows.map(({ mut, index, detail }) => {
                        const { gene, variant } = parseMutationToken(mut);
                        const oncoKbUrl = buildOncoKbUrl(gene, variant);
                        const isHotspot =
                            detail?.hotspot === true ||
                            !!detail?.annotation?.toLowerCase().includes('hotspot');
                        const hasOncoKbData = hasOncoKbAnnotationContent(detail);
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
                                `Cohort: ${(detail.cohortFrequency * 100).toFixed(
                                    1
                                )}%`
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
                                        fontWeight: detail?.type ? 600 : undefined,
                                        cursor: variantTitle
                                            ? 'help'
                                            : undefined,
                                    }}
                                >
                                    {(variant.startsWith('p.')
                                        ? variant.slice(2)
                                        : variant) || '—'}
                                </td>
                                <td
                                    style={{
                                        ...compactTdBase,
                                        paddingRight: 2,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <AnnotationLinkIcon
                                        href={oncoKbUrl}
                                        icon={
                                            <OncoKbIcon oncogenic={detail?.oncogenic} />
                                        }
                                        marginRight={3}
                                        showTooltip={
                                            hasOncoKbData
                                                ? event => {
                                                      const rect = (
                                                          event.currentTarget as HTMLElement
                                                      ).getBoundingClientRect();
                                                      setTooltip({
                                                          idx: index,
                                                          ...makeFixedTooltipAnchor(
                                                              rect
                                                          ),
                                                      });
                                                  }
                                                : undefined
                                        }
                                        hideTooltip={hideTooltip}
                                    />
                                    <AnnotationIconSlot
                                        marginRight={isHotspot ? 3 : 0}
                                    >
                                        {detail?.civicEntry && (
                                            <Civic
                                                civicEntry={detail.civicEntry}
                                                civicStatus="complete"
                                                hasCivicVariants={
                                                    Object.keys(
                                                        detail.civicEntry.variants
                                                    ).length > 0
                                                }
                                            />
                                        )}
                                    </AnnotationIconSlot>
                                    {isHotspot && (
                                        <span
                                            style={inlineIconStyle}
                                            onClick={event => event.stopPropagation()}
                                        >
                                            <HotspotAnnotation
                                                status="complete"
                                                isHotspot={isHotspot}
                                                is3dHotspot={false}
                                            />
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {tooltip !== null &&
                (() => {
                    const detail = details?.[tooltip.idx];
                    if (!hasOncoKbAnnotationContent(detail)) return null;
                    const { gene, variant } = parseMutationToken(
                        muts[tooltip.idx] ?? ''
                    );
                    const oncoKbUrl = buildOncoKbUrl(
                        gene,
                        variant || undefined
                    );
                    return (
                        <FixedTooltipCard
                            anchor={tooltip}
                            onMouseEnter={() => setTooltip(current => current)}
                            onMouseLeave={hideTooltip}
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 12.5,
                                    marginBottom: 5,
                                }}
                            >
                                <span>{gene}</span>
                                {variant && (
                                    <span
                                        style={{
                                            fontFamily: 'monospace',
                                            marginLeft: 4,
                                        }}
                                    >
                                        {variant}
                                    </span>
                                )}
                            </div>
                            <AnnotationBadgeRow
                                oncogenic={detail?.oncogenic}
                                mutationEffect={detail?.mutationEffect}
                            />
                            <AnnotationSummaryText
                                geneSummary={detail?.geneSummary}
                                variantSummary={detail?.variantSummary}
                            />
                            <AnnotationFooterLink href={oncoKbUrl} />
                        </FixedTooltipCard>
                    );
                })()}
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

    const [tooltip, setTooltip] = React.useState<
        ({ idx: number } & FixedTooltipAnchor) | null
    >(null);
    const hideTooltip = () => setTooltip(null);

    return (
        <div style={{ position: 'relative' }}>
            <table style={compactTableStyle}>
                <colgroup>
                    <col style={{ width: '42%' }} />
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '18%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene</th>
                        <th style={compactThStyle}>CNA</th>
                        <th style={compactThStyle}>Annot</th>
                    </tr>
                </thead>
                <tbody>
                    {cnas.map((cna, index) => {
                        const href = buildOncoKbUrl(cna.gene);
                        const label = cnaLabel(cna.cnaValue);
                        const cnaTitle = cnaTooltip(cna);
                        const hasOncoKbData = hasOncoKbAnnotationContent(cna);
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
                                <td
                                    style={{
                                        ...compactTdBase,
                                        paddingRight: 2,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <AnnotationLinkIcon
                                        href={href}
                                        icon={<OncoKbIcon oncogenic={cna.oncogenic} />}
                                        marginRight={3}
                                        showTooltip={
                                            hasOncoKbData
                                                ? event => {
                                                      const rect = (
                                                          event.currentTarget as HTMLElement
                                                      ).getBoundingClientRect();
                                                      setTooltip({
                                                          idx: index,
                                                          ...makeFixedTooltipAnchor(
                                                              rect
                                                          ),
                                                      });
                                                  }
                                                : undefined
                                        }
                                        hideTooltip={hideTooltip}
                                    />
                                    <AnnotationIconSlot marginRight={3}>
                                        {cna.civicEntry && (
                                            <Civic
                                                civicEntry={cna.civicEntry}
                                                civicStatus="complete"
                                                hasCivicVariants={
                                                    cna.hasCivicVariants !== false
                                                }
                                            />
                                        )}
                                    </AnnotationIconSlot>
                                    <AnnotationIconSlot />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {tooltip !== null &&
                (() => {
                    const cna = cnas[tooltip.idx];
                    if (!hasOncoKbAnnotationContent(cna)) return null;
                    const label = cnaLabel(cna.cnaValue);
                    const oncoKbUrl = buildOncoKbUrl(cna.gene);
                    const cohortText = formatCnaCohort(cna);
                    return (
                        <FixedTooltipCard
                            anchor={tooltip}
                            onMouseEnter={() => setTooltip(current => current)}
                            onMouseLeave={hideTooltip}
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 12.5,
                                    marginBottom: 5,
                                }}
                            >
                                <span>{cna.gene}</span>
                                <span
                                    style={{
                                        fontFamily: 'monospace',
                                        marginLeft: 4,
                                    }}
                                >
                                    {label}
                                </span>
                            </div>
                            <AnnotationBadgeRow
                                oncogenic={cna.oncogenic}
                                mutationEffect={cna.mutationEffect}
                            />
                            {(cna.cytoband || cohortText) && (
                                <div
                                    style={{
                                        margin: '0 0 6px',
                                        color: '#444',
                                        fontSize: 11,
                                    }}
                                >
                                    {cna.cytoband && (
                                        <div>
                                            <strong>Cytoband:</strong> {cna.cytoband}
                                        </div>
                                    )}
                                    {cohortText && (
                                        <div>
                                            <strong>Cohort:</strong> {cohortText}
                                        </div>
                                    )}
                                </div>
                            )}
                            <AnnotationSummaryText
                                geneSummary={cna.geneSummary}
                                variantSummary={cna.variantSummary}
                            />
                            <AnnotationFooterLink href={oncoKbUrl} />
                        </FixedTooltipCard>
                    );
                })()}
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
        ({ idx: number; kind: 'class' | 'annotation' } & FixedTooltipAnchor) | null
    >(null);
    const hideTooltip = () => setTooltip(null);

    return (
        <div style={{ position: 'relative' }}>
            <table style={{ ...compactTableStyle, marginTop: 6 }}>
                <colgroup>
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '38%' }} />
                    <col style={{ width: '14%' }} />
                </colgroup>
                <thead>
                    <tr>
                        <th style={compactThStyle}>Gene 1</th>
                        <th style={compactThStyle}>Gene 2</th>
                        <th style={compactThStyle}>Variant Class</th>
                        <th style={compactThStyle}>Annot</th>
                    </tr>
                </thead>
                <tbody>
                    {structuralVariants.map((sv, index) => {
                        const tooltipText = structuralVariantTooltip(sv);
                        const hasAnnotationTooltip = !!(
                            (sv.annotation && sv.annotation.trim()) ||
                            hasOncoKbAnnotationContent(sv)
                        );
                        const oncoKbGene =
                            sv.gene1 !== '—' ? sv.gene1 : sv.gene2;
                        const oncoKbUrl = oncoKbGene
                            ? buildOncoKbUrl(oncoKbGene)
                            : undefined;
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
                                        cursor: tooltipText ? 'help' : undefined,
                                        fontWeight: 500,
                                    }}
                                    onMouseEnter={event => {
                                        if (!tooltipText) return;
                                        const rect = (
                                            event.currentTarget as HTMLElement
                                        ).getBoundingClientRect();
                                        setTooltip({
                                            idx: index,
                                            kind: 'class',
                                            ...makeFixedTooltipAnchor(rect),
                                        });
                                    }}
                                    onMouseLeave={hideTooltip}
                                >
                                    {sv.variantClass}
                                </td>
                                <td
                                    style={{
                                        ...compactTdBase,
                                        paddingRight: 2,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <AnnotationLinkIcon
                                        href={oncoKbUrl}
                                        showIcon={!!(hasAnnotationTooltip || oncoKbUrl)}
                                        icon={<OncoKbIcon oncogenic={sv.oncogenic} />}
                                        marginRight={3}
                                        showTooltip={
                                            hasAnnotationTooltip
                                                ? event => {
                                                      const rect = (
                                                          event.currentTarget as HTMLElement
                                                      ).getBoundingClientRect();
                                                      setTooltip({
                                                          idx: index,
                                                          kind: 'annotation',
                                                          ...makeFixedTooltipAnchor(
                                                              rect
                                                          ),
                                                      });
                                                  }
                                                : undefined
                                        }
                                        hideTooltip={hideTooltip}
                                    />
                                    <AnnotationIconSlot marginRight={3} />
                                    <AnnotationIconSlot />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {tooltip !== null &&
                (() => {
                    const sv = structuralVariants[tooltip.idx];
                    if (!sv) return null;
                    const annotationText = (sv.annotation ?? '').trim();
                    const content =
                        tooltip.kind === 'annotation'
                            ? annotationText
                            : structuralVariantTooltip(sv);
                    const hasOncoKbContent = hasOncoKbAnnotationContent(sv);
                    if (
                        tooltip.kind === 'class'
                            ? !content
                            : !content && !hasOncoKbContent
                    ) {
                        return null;
                    }
                    const oncoKbGene = sv.gene1 !== '—' ? sv.gene1 : sv.gene2;
                    const oncoKbUrl = oncoKbGene
                        ? buildOncoKbUrl(oncoKbGene)
                        : undefined;
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
                                {tooltip.kind === 'annotation'
                                    ? `${sv.gene1}${
                                          sv.gene2 && sv.gene2 !== '—'
                                              ? ` / ${sv.gene2}`
                                              : ''
                                      }`
                                    : sv.variantClass}
                            </div>
                            {tooltip.kind === 'annotation' && (
                                <>
                                    <AnnotationBadgeRow
                                        oncogenic={sv.oncogenic}
                                        mutationEffect={sv.mutationEffect}
                                    />
                                    <div
                                        style={{
                                            margin: '0 0 6px',
                                            color: '#444',
                                            fontSize: 11,
                                        }}
                                    >
                                        <div>
                                            <strong>Variant class:</strong> {sv.variantClass}
                                        </div>
                                        {sv.svStatus && (
                                            <div>
                                                <strong>Status:</strong> {sv.svStatus}
                                            </div>
                                        )}
                                        {sv.eventInfo && (
                                            <div>
                                                <strong>Event info:</strong> {sv.eventInfo}
                                            </div>
                                        )}
                                        {sv.connectionType && (
                                            <div>
                                                <strong>Connection type:</strong> {sv.connectionType}
                                            </div>
                                        )}
                                    </div>
                                    <AnnotationSummaryText
                                        geneSummary={sv.geneSummary}
                                        variantSummary={sv.variantSummary}
                                    />
                                </>
                            )}
                            {content && (
                                <div style={{ color: '#444', fontSize: 11 }}>
                                    {content}
                                </div>
                            )}
                            {tooltip.kind === 'annotation' && (
                                <AnnotationFooterLink href={oncoKbUrl} />
                            )}
                        </FixedTooltipCard>
                    );
                })()}
        </div>
    );
}
