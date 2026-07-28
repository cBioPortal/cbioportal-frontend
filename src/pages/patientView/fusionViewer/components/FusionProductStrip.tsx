import * as React from 'react';
import {
    computeJunctionAlignedLayout,
    retainedExonsInOrder,
    exonsInOrder,
    exonRetentionFlags,
    exonDisplayNumbers,
    genomicToExonX,
} from './fusionProductHelpers';
import { frameStatusStyle } from './frameStatusStyle';
import {
    TranscriptData,
    COLOR_5PRIME,
    COLOR_3PRIME,
    COLOR_BREAKPOINT,
    COLOR_ACTIVE_OUTLINE,
    COLOR_EXON_LOST,
    FrameStatus,
} from '../data/types';
import { splitExonByFivePrimeUtr } from './GeneTrack';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when the given exon is entirely covered by 5′UTR regions —
 * i.e. all segments produced by splitExonByFivePrimeUtr are UTR, meaning no
 * coding content is retained from this exon. Used to render the exon at half
 * height (PH/2, y offset +PH/4) to match FusionProduct.tsx's treatment.
 */
export function stripExonIsAllUtr(
    exon: { start: number; end: number },
    utrs: { start: number; end: number; type: 'five_prime' | 'three_prime' }[]
): boolean {
    const segs = splitExonByFivePrimeUtr(exon, utrs);
    return segs.length > 0 && segs.every(s => s.isUtr);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Payload for the shared exon hover overlay owned by FusionStripList. */
export interface ExonHoverInfo {
    gene: string;
    exonNumber: number;
    retained: boolean;
    sizeBp: number;
    clientX: number;
    clientY: number;
}

export interface FusionProductStripProps {
    sampleId: string;
    label: string;
    transcript5p: TranscriptData;
    transcript3p?: TranscriptData;
    breakpoint5p: number;
    breakpoint3p?: number;
    frame: FrameStatus;
    reads: number;
    y: number;
    // Shared frame (see comparisonFrame.ts): the seam is pinned to junctionX.
    leftX: number;
    junctionX: number;
    rightX: number;
    pxPerBp5p: number;
    pxPerBp3p: number;
    onClick?: () => void;
    // Row height used to vertically center the product; also drives the
    // dense-mode geometry. Defaults to the per-sample row height.
    rowHeight?: number;
    // Dense-wall mode: hide the sample label + reads text and shrink the exons,
    // surfacing sample · frame · reads only as a hover <title>.
    compact?: boolean;
    // Collapsed mode: show this in the left gutter instead of the sample id
    // (e.g. "×412").
    countLabel?: string;
    // Collapsed mode: render an oncoprint-style frame cell in the right gutter
    // (green in-frame / red out-of-frame / grey unknown) instead of the
    // per-sample "In-frame · 12r" text.
    frameSummary?: Record<FrameStatus, number>;
    // Exon rendering mode. 'retained' (default) draws only the exons kept by
    // the fusion; 'full' draws the complete transcript ladder with the excluded
    // exons greyed and a breakpoint tick per side.
    exonMode?: 'retained' | 'full';
    // Per-exon hover readout. Omitted in dense mode, where the row-level
    // <title> owns the hover instead.
    onExonHover?: (info: ExonHoverInfo | null) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PH = 14; // product exon height
const PH_COMPACT = 6; // dense-mode exon height
// Oncoprint-style frame cell (collapsed mode).
const FRAME_CELL_W = 44;
const FRAME_COLORS: Record<FrameStatus, string> = {
    inFrame: '#2f9e44',
    outOfFrame: '#e03131',
    unknown: '#ced4da',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FusionProductStrip: React.FC<FusionProductStripProps> = ({
    label,
    transcript5p,
    transcript3p,
    breakpoint5p,
    breakpoint3p,
    frame,
    reads,
    y,
    leftX,
    junctionX,
    rightX,
    pxPerBp5p,
    pxPerBp3p,
    onClick,
    rowHeight = 50,
    compact = false,
    countLabel,
    frameSummary,
    exonMode = 'retained',
    onExonHover,
}) => {
    const [hovered, setHovered] = React.useState(false);
    const full = exonMode === 'full';
    const has3p = !!transcript3p && breakpoint3p !== undefined;
    const exons5p = full
        ? exonsInOrder(transcript5p)
        : retainedExonsInOrder(transcript5p, breakpoint5p, true);
    const exons3p = has3p
        ? full
            ? exonsInOrder(transcript3p!)
            : retainedExonsInOrder(transcript3p!, breakpoint3p!, false)
        : [];
    const flags5p = full
        ? exonRetentionFlags(transcript5p, breakpoint5p, true)
        : exons5p.map(() => true);
    const flags3p =
        has3p && full
            ? exonRetentionFlags(transcript3p!, breakpoint3p!, false)
            : exons3p.map(() => true);
    const nums5p = exonDisplayNumbers(transcript5p);
    const nums3p = transcript3p ? exonDisplayNumbers(transcript3p) : undefined;
    const layout = computeJunctionAlignedLayout(
        exons5p,
        exons3p,
        leftX,
        junctionX,
        rightX,
        pxPerBp5p,
        pxPerBp3p
    );
    const ph = compact ? PH_COMPACT : PH;
    const centerY = y + rowHeight / 2;
    const yEx = centerY - ph / 2;
    const textBaseline = centerY + 4;
    const style = frameStatusStyle(frame);
    // One handler per rect, but no tooltip component per rect — the overlay is
    // owned by FusionStripList. See the perf note in the design spec.
    const hoverProps = (
        gene: string,
        exon: { start: number; end: number },
        exonNumber: number,
        retained: boolean
    ) =>
        onExonHover
            ? {
                  onMouseEnter: (e: React.MouseEvent) =>
                      onExonHover({
                          gene,
                          exonNumber,
                          retained,
                          sizeBp: Math.abs(exon.end - exon.start) + 1,
                          clientX: e.clientX,
                          clientY: e.clientY,
                      }),
                  onMouseLeave: () => onExonHover(null),
              }
            : {};

    return (
        <g
            data-testid="product-strip"
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {compact && (
                <title>
                    {label} · {style.label} · {reads}r
                </title>
            )}
            <rect
                data-testid="strip-active-outline"
                className="strip-active-outline"
                x={leftX - 6}
                y={yEx - (compact ? 2 : 9)}
                width={rightX - leftX + 12}
                height={ph + (compact ? 4 : 18)}
                fill="none"
                stroke={COLOR_ACTIVE_OUTLINE}
                strokeWidth={2}
                strokeDasharray="5 3"
                rx={3}
                opacity={hovered ? 1 : 0}
            />
            {/* Left gutter: sample id (per-sample), ×N count (collapsed), or
                nothing (dense). Right-aligned to the frame edge so it never
                collides with the exon rects. */}
            {!compact && (
                <text
                    x={leftX - 10}
                    y={textBaseline}
                    textAnchor="end"
                    fontSize={11.5}
                    fontWeight={600}
                    fill="#333"
                >
                    {countLabel ?? label}
                </text>
            )}
            {exons5p.map((exon, i) => {
                const isAllUtr = stripExonIsAllUtr(exon, transcript5p.utrs);
                const h = isAllUtr ? ph / 2 : ph;
                const yRect = isAllUtr ? yEx + ph / 4 : yEx;
                const retained = flags5p[i];
                const n =
                    nums5p.get(`${exon.start}-${exon.end}`) ?? exon.number;
                return (
                    <rect
                        key={`5p-${i}`}
                        data-testid="strip-exon"
                        data-lost={retained ? undefined : 'true'}
                        x={layout.xs5p[i]}
                        y={yRect}
                        width={layout.widths5p[i]}
                        height={h}
                        rx={2}
                        fill={retained ? COLOR_5PRIME : COLOR_EXON_LOST}
                        {...hoverProps(transcript5p.gene, exon, n, retained)}
                    />
                );
            })}
            {/* Half-height UTR treatment is 5′-side-only; in full mode a 3′ exon that is entirely 5′UTR (the partner's exon 1) is still drawn full height. */}
            {exons3p.map((exon, i) => {
                const retained = flags3p[i];
                const n =
                    nums3p?.get(`${exon.start}-${exon.end}`) ?? exon.number;
                return (
                    <rect
                        key={`3p-${i}`}
                        data-testid="strip-exon"
                        data-lost={retained ? undefined : 'true'}
                        x={layout.xs3p[i]}
                        y={yEx}
                        width={layout.widths3p[i]}
                        height={ph}
                        rx={2}
                        fill={retained ? COLOR_3PRIME : COLOR_EXON_LOST}
                        {...hoverProps(transcript3p!.gene, exon, n, retained)}
                    />
                );
            })}
            {full ? (
                <>
                    {exons5p.length > 0 &&
                        (() => {
                            const tick5X = genomicToExonX(
                                breakpoint5p,
                                exons5p,
                                layout.xs5p,
                                layout.widths5p,
                                transcript5p.strand
                            );
                            return (
                                <line
                                    data-testid="strip-breakpoint-tick"
                                    x1={tick5X}
                                    y1={yEx - 3}
                                    x2={tick5X}
                                    y2={yEx + ph + 3}
                                    stroke={COLOR_BREAKPOINT}
                                    strokeWidth={1.5}
                                />
                            );
                        })()}
                    {has3p &&
                        exons3p.length > 0 &&
                        (() => {
                            const tick3X = genomicToExonX(
                                breakpoint3p!,
                                exons3p,
                                layout.xs3p,
                                layout.widths3p,
                                transcript3p!.strand
                            );
                            return (
                                <line
                                    data-testid="strip-breakpoint-tick"
                                    x1={tick3X}
                                    y1={yEx - 3}
                                    x2={tick3X}
                                    y2={yEx + ph + 3}
                                    stroke={COLOR_BREAKPOINT}
                                    strokeWidth={1.5}
                                />
                            );
                        })()}
                </>
            ) : (
                exons5p.length > 0 &&
                exons3p.length > 0 && (
                    <line
                        x1={layout.junctionX}
                        y1={yEx - 3}
                        x2={layout.junctionX}
                        y2={yEx + ph + 3}
                        stroke={COLOR_BREAKPOINT}
                        strokeWidth={1.5}
                    />
                )
            )}
            {/* Right gutter: oncoprint-style frame cell (collapsed, mixed frame
                calls) or the per-sample "In-frame · 12r" text. Suppressed in
                dense mode (surfaced via the hover <title>). */}
            {frameSummary
                ? renderFrameCell(frameSummary, rightX + 8, centerY)
                : !compact && (
                      <text
                          x={rightX + 8}
                          y={textBaseline - 2}
                          fontSize={9.5}
                          fill="#666"
                      >
                          {style.label} · {reads}r
                      </text>
                  )}
        </g>
    );
};

/**
 * Oncoprint-style frame cell: a fixed-width horizontal bar split into
 * green (in-frame) / red (out-of-frame) / grey (unknown) segments proportional
 * to the group's frame tally. Communicates the dominant frame at a glance while
 * still showing a mixed group.
 */
function renderFrameCell(
    frames: Record<FrameStatus, number>,
    x: number,
    centerY: number
): JSX.Element {
    const total = frames.inFrame + frames.outOfFrame + frames.unknown || 1;
    const h = PH;
    const yTop = centerY - h / 2;
    const order: FrameStatus[] = ['inFrame', 'outOfFrame', 'unknown'];
    let cursor = x;
    const segs: JSX.Element[] = [];
    order.forEach(k => {
        const w = (frames[k] / total) * FRAME_CELL_W;
        if (w <= 0) return;
        segs.push(
            <rect
                key={k}
                data-testid={`frame-cell-${k}`}
                x={cursor}
                y={yTop}
                width={w}
                height={h}
                fill={FRAME_COLORS[k]}
            />
        );
        cursor += w;
    });
    return (
        <g data-testid="frame-cell">
            <title>
                {frames.inFrame} in-frame · {frames.outOfFrame} out-of-frame ·{' '}
                {frames.unknown} unknown
            </title>
            {segs}
        </g>
    );
}

export default FusionProductStrip;
