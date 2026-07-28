import * as React from 'react';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData } from '../data/types';
import { CollapsedGroup } from '../data/collapseRows';
import FusionProductStrip, { ExonHoverInfo } from './FusionProductStrip';
import { computeComparisonFrame } from './comparisonFrame';

const OVERSCAN = 2;
// Thin row height for the dense-wall view.
export const DENSE_ROW_HEIGHT = 7;

export function visibleWindow(
    total: number,
    rowHeight: number,
    viewportHeight: number,
    scrollTop: number
): { start: number; end: number } {
    const first = Math.floor(scrollTop / rowHeight);
    const last = Math.ceil((scrollTop + viewportHeight) / rowHeight);
    const start = Math.max(0, first - OVERSCAN);
    const end = Math.min(total, last + OVERSCAN);
    return { start, end };
}

/**
 * Which transcript supplies a side's exon ladder. In reference mode every row
 * shares the canonical isoform so exon columns align across the whole list —
 * except when the row's gene differs from the reference (driver-anchor rows
 * with an off-reference partner), where the row's own transcript wins. Drawing
 * one gene's breakpoint against another gene's ladder would be wrong.
 */
export function ladderTranscript(
    rowTranscript: TranscriptData | undefined,
    referenceTranscript: TranscriptData | undefined,
    useReference: boolean
): TranscriptData | undefined {
    if (!useReference || !referenceTranscript) return rowTranscript;
    if (rowTranscript && rowTranscript.gene !== referenceTranscript.gene) {
        return rowTranscript;
    }
    return referenceTranscript;
}

export interface FusionStripListProps {
    rows: ComparisonRow[];
    // Per-row, per-side transcript (caller-selected isoform, canonical
    // fallback). is5p=true → 5′ partner, false → 3′ partner.
    transcriptForRow: (
        row: ComparisonRow,
        is5p: boolean
    ) => TranscriptData | undefined;
    width: number;
    // Shared bp→px scale per side, computed once in the parent (@computed) over
    // all rows so it is not recomputed on scroll.
    pxPerBp5p: number;
    pxPerBp3p: number;
    alignment: 'junction' | 'coordinate';
    // Row-display mode. 'sample' (default) = one labeled row per sample; 'dense'
    // = thin unlabeled rows; 'collapsed' = one row per structural group.
    mode?: 'sample' | 'dense' | 'collapsed';
    // Collapsed groups, required when mode === 'collapsed'. A group's
    // representative row draws the product; the frame tally drives the cell.
    groups?: CollapsedGroup[];
    // Clicking a collapsed group filters the cohort to its samples.
    onSelectGroup?: (group: CollapsedGroup) => void;
    rowHeight?: number;
    viewportHeight?: number;
    scrollTop?: number;
    onExpand?: (sampleId: string) => void;
    // Exon rendering mode, orthogonal to `mode`. 'full' draws every exon with
    // the excluded ones greyed.
    exonMode?: 'retained' | 'full';
    // Which transcript supplies each side's ladder in full mode. 'reference'
    // shares the canonical isoform so columns align; 'perRow' is faithful to
    // each sample's caller-selected isoform but ragged.
    ladderMode?: 'reference' | 'perRow';
    referenceTranscript5p?: TranscriptData;
    referenceTranscript3p?: TranscriptData;
}

const FusionStripList: React.FC<FusionStripListProps> = ({
    rows,
    transcriptForRow,
    width,
    pxPerBp5p,
    pxPerBp3p,
    mode = 'sample',
    groups = [],
    onSelectGroup,
    rowHeight: rowHeightProp,
    viewportHeight = 500,
    scrollTop: controlledScroll,
    onExpand,
    exonMode = 'retained',
    ladderMode = 'reference',
    referenceTranscript5p,
    referenceTranscript3p,
}) => {
    const rowHeight =
        rowHeightProp ?? (mode === 'dense' ? DENSE_ROW_HEIGHT : 50);
    // In collapsed mode we iterate groups (representative row each); otherwise
    // the raw rows. Both paths stay virtualized.
    const items: Array<{ row: ComparisonRow; group?: CollapsedGroup }> =
        mode === 'collapsed'
            ? groups.map(g => ({ row: g.representative, group: g }))
            : rows.map(row => ({ row }));
    const [scrollTop, setScrollTop] = React.useState(controlledScroll ?? 0);
    const [hoveredExon, setHoveredExon] = React.useState<ExonHoverInfo | null>(
        null
    );
    const effective = controlledScroll ?? scrollTop;
    const { start, end } = visibleWindow(
        items.length,
        rowHeight,
        viewportHeight,
        effective
    );

    // Frame is width-dependent, so it stays here. The bp→px scale
    // (pxPerBp5p/pxPerBp3p) is computed once in the parent @computed and passed
    // in, so scrolling no longer re-runs the O(rows) retained-length loop.
    const { leftX, junctionX, rightX } = computeComparisonFrame(width);

    return (
        <>
            <div
                data-testid="strip-scroll"
                style={{ height: viewportHeight, overflowY: 'auto' }}
                onScroll={e =>
                    setScrollTop((e.target as HTMLDivElement).scrollTop)
                }
            >
                <svg width={width} height={items.length * rowHeight}>
                    {items.slice(start, end).map(({ row, group }, i) => {
                        const idx = start + i;
                        const useReference =
                            exonMode === 'full' && ladderMode === 'reference';
                        const t5 = ladderTranscript(
                            transcriptForRow(row, true),
                            referenceTranscript5p,
                            useReference
                        );
                        const t3 = ladderTranscript(
                            transcriptForRow(row, false),
                            referenceTranscript3p,
                            useReference
                        );
                        if (!t5) return null;
                        return (
                            <FusionProductStrip
                                key={group ? group.key : row.sampleId}
                                sampleId={row.sampleId}
                                label={row.sampleId}
                                transcript5p={t5}
                                transcript3p={t3}
                                breakpoint5p={row.anchorBreakpoint}
                                breakpoint3p={
                                    row.partnerBreakpoint ?? undefined
                                }
                                frame={row.frame}
                                reads={row.event.totalReadSupport}
                                y={idx * rowHeight}
                                rowHeight={rowHeight}
                                compact={mode === 'dense'}
                                countLabel={
                                    group ? `×${group.count}` : undefined
                                }
                                frameSummary={group ? group.frames : undefined}
                                leftX={leftX}
                                junctionX={junctionX}
                                rightX={rightX}
                                pxPerBp5p={pxPerBp5p}
                                pxPerBp3p={pxPerBp3p}
                                exonMode={exonMode}
                                onExonHover={
                                    exonMode === 'full' && mode !== 'dense'
                                        ? setHoveredExon
                                        : undefined
                                }
                                onClick={() => {
                                    if (group) {
                                        onSelectGroup && onSelectGroup(group);
                                    } else {
                                        // dense + sample rows both expand the
                                        // clicked sample's full diagram.
                                        onExpand && onExpand(row.sampleId);
                                    }
                                }}
                            />
                        );
                    })}
                </svg>
            </div>
            {hoveredExon && (
                <div
                    data-testid="exon-hover-readout"
                    style={{
                        position: 'fixed',
                        left: hoveredExon.clientX + 12,
                        top: hoveredExon.clientY + 12,
                        zIndex: 1000,
                        pointerEvents: 'none',
                        background: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: 3,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        padding: '3px 6px',
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                    }}
                >
                    <strong>{hoveredExon.gene}</strong> Exon{' '}
                    {hoveredExon.exonNumber}
                    <br />
                    <span style={{ color: '#666' }}>
                        {hoveredExon.retained ? 'retained' : 'lost'} ·{' '}
                        {hoveredExon.sizeBp.toLocaleString()} bp
                    </span>
                </div>
            )}
        </>
    );
};

export default FusionStripList;
