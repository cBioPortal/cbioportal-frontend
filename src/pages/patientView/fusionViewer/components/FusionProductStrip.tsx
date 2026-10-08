import * as React from 'react';
import {
    computeJunctionAlignedLayout,
    retainedExonsInOrder,
    exonsInOrder,
    exonRetentionFlags,
    exonDisplayNumbers,
    genomicToExonX,
    junctionExonNumbers,
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
    /** Row opacity (linked-hover dimming); defaults to 1. */
    opacity?: number;
    /** Fired on mouse enter/leave of the whole strip. */
    onHoverChange?: (hovered: boolean) => void;
    sampleId: string;
    label: string;
    transcript5p?: TranscriptData;
    /** Text drawn just left of the junction (e.g. "no partner"). */
    leftNote?: string;
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
    // Gene mode Partner column: drawn right of the frame/reads text. In
    // compact mode only the hover <title> carries it.
    partnerLabel?: PartnerLabel;
}

export interface PartnerLabel {
    text: string;
    color: string;
    title?: string;
}

export const PARTNER_X_OFFSET = 112; // from rightX; clears "Out-of-frame · 1234r"
/** Partner label text x (from rightX); the column header aligns to it. */
export const PARTNER_TEXT_OFFSET = PARTNER_X_OFFSET + 12;
const PARTNER_MAX_CHARS = 24; // fits "38 partners (top: TMPRSS2)"
const truncate = (s: string) =>
    s.length > PARTNER_MAX_CHARS ? `${s.slice(0, PARTNER_MAX_CHARS - 1)}…` : s;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PH = 14; // product exon height
const PH_COMPACT = 6; // dense-mode exon height
// Oncoprint-style frame cell (collapsed and dense modes).
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
    opacity,
    onHoverChange,
    label,
    transcript5p,
    leftNote,
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
    partnerLabel,
}) => {
    const [hovered, setHovered] = React.useState(false);
    const full = exonMode === 'full';
    const has3p = !!transcript3p && breakpoint3p !== undefined;
    const has5p = !!transcript5p;
    const exons5p = !has5p
        ? []
        : full
        ? exonsInOrder(transcript5p!)
        : retainedExonsInOrder(transcript5p!, breakpoint5p, true);
    const exons3p = has3p
        ? full
            ? exonsInOrder(transcript3p!)
            : retainedExonsInOrder(transcript3p!, breakpoint3p!, false)
        : [];
    const flags5p =
        has5p && full
            ? exonRetentionFlags(transcript5p!, breakpoint5p, true)
            : exons5p.map(() => true);
    const flags3p =
        has3p && full
            ? exonRetentionFlags(transcript3p!, breakpoint3p!, false)
            : exons3p.map(() => true);
    const nums5p = has5p
        ? exonDisplayNumbers(transcript5p!)
        : new Map<string, number>();
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
    // Precomputed once, both for the tick <line>s and to detect an exon the
    // breakpoint falls strictly inside of (see splitAt below) — a single
    // source of truth so the split boundary can never drift from the tick.
    const tick5X =
        full && exons5p.length > 0
            ? genomicToExonX(
                  breakpoint5p,
                  exons5p,
                  layout.xs5p,
                  layout.widths5p,
                  transcript5p!.strand
              )
            : undefined;
    const tick3X =
        full && has3p && exons3p.length > 0
            ? genomicToExonX(
                  breakpoint3p!,
                  exons3p,
                  layout.xs3p,
                  layout.widths3p,
                  transcript3p!.strand
              )
            : undefined;
    // Non-null only when a breakpoint falls strictly inside exon i (not at an
    // intron-clamped edge) — that exon is entirely marked "retained" by
    // exonRetentionFlags even though only the sequence up to the breakpoint is
    // actually part of the fusion. Returns the in-rect x to split the fill at.
    const splitAt = (
        tickX: number | undefined,
        x: number,
        w: number
    ): number | undefined =>
        tickX !== undefined && tickX > x && tickX < x + w ? tickX : undefined;
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
    // Junction labels describe the fusion seam, independent of exonMode — even
    // in full-ladder mode the label is about the retained/retained boundary,
    // not the complete transcript.
    const retained5p = has5p
        ? retainedExonsInOrder(transcript5p!, breakpoint5p, true)
        : [];
    const retained3p = has3p
        ? retainedExonsInOrder(transcript3p!, breakpoint3p!, false)
        : [];
    const junction = junctionExonNumbers(retained5p, retained3p);
    const junctionText =
        junction.fivePrime !== undefined && junction.threePrime !== undefined
            ? `E${junction.fivePrime}|E${junction.threePrime}`
            : junction.fivePrime !== undefined
            ? `E${junction.fivePrime}`
            : junction.threePrime !== undefined
            ? `E${junction.threePrime}`
            : '';
    // Junction exon label always sits inline at the seam (dense floats it above).
    const showInlineJunction = !!junctionText;

    return (
        <g
            data-testid="product-strip"
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
            opacity={opacity ?? 1}
            onMouseEnter={() => {
                setHovered(true);
                onHoverChange && onHoverChange(true);
            }}
            onMouseLeave={() => {
                setHovered(false);
                onHoverChange && onHoverChange(false);
            }}
        >
            {compact && (
                <title>
                    {label} · {style.label} · {reads}r
                    {partnerLabel
                        ? ` · ${partnerLabel.title ?? partnerLabel.text}`
                        : ''}
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
            {leftNote && !compact && (
                <text
                    data-testid="strip-left-note"
                    x={junctionX - 10}
                    y={textBaseline}
                    textAnchor="end"
                    fontSize={10}
                    fontStyle="italic"
                    fill="#999"
                >
                    {leftNote}
                </text>
            )}
            {exons5p.map((exon, i) => {
                const isAllUtr = stripExonIsAllUtr(exon, transcript5p!.utrs);
                const h = isAllUtr ? ph / 2 : ph;
                const yRect = isAllUtr ? yEx + ph / 4 : yEx;
                const retained = flags5p[i];
                const n =
                    nums5p.get(`${exon.start}-${exon.end}`) ?? exon.number;
                const x = layout.xs5p[i];
                const w = layout.widths5p[i];
                const split = splitAt(tick5X, x, w);
                if (split !== undefined) {
                    // Breakpoint lands inside this exon: everything up to it
                    // is transcribed and retained, everything after is not —
                    // colour the two halves accordingly instead of the whole
                    // exon as one solid block.
                    const retainedW = split - x;
                    return (
                        <React.Fragment key={`5p-${i}`}>
                            <rect
                                data-testid="strip-exon"
                                x={x}
                                y={yRect}
                                width={retainedW}
                                height={h}
                                rx={2}
                                fill={COLOR_5PRIME}
                                {...hoverProps(
                                    transcript5p!.gene,
                                    exon,
                                    n,
                                    retained
                                )}
                            />
                            <rect
                                data-testid="strip-exon"
                                data-lost="true"
                                x={split}
                                y={yRect}
                                width={w - retainedW}
                                height={h}
                                rx={2}
                                fill={COLOR_EXON_LOST}
                                {...hoverProps(
                                    transcript5p!.gene,
                                    exon,
                                    n,
                                    retained
                                )}
                            />
                        </React.Fragment>
                    );
                }
                return (
                    <rect
                        key={`5p-${i}`}
                        data-testid="strip-exon"
                        data-lost={retained ? undefined : 'true'}
                        x={x}
                        y={yRect}
                        width={w}
                        height={h}
                        rx={2}
                        fill={retained ? COLOR_5PRIME : COLOR_EXON_LOST}
                        {...hoverProps(transcript5p!.gene, exon, n, retained)}
                    />
                );
            })}
            {/* Half-height UTR treatment is 5′-side-only; in full mode a 3′ exon that is entirely 5′UTR (the partner's exon 1) is still drawn full height. */}
            {exons3p.map((exon, i) => {
                const retained = flags3p[i];
                const n =
                    nums3p?.get(`${exon.start}-${exon.end}`) ?? exon.number;
                const x = layout.xs3p[i];
                const w = layout.widths3p[i];
                const split = splitAt(tick3X, x, w);
                if (split !== undefined) {
                    // Mirror of the 5′ split: the breakpoint lands inside
                    // this exon, so only the sequence from it onward is
                    // actually retained — the part before it is not.
                    const lostW = split - x;
                    return (
                        <React.Fragment key={`3p-${i}`}>
                            <rect
                                data-testid="strip-exon"
                                data-lost="true"
                                x={x}
                                y={yEx}
                                width={lostW}
                                height={ph}
                                rx={2}
                                fill={COLOR_EXON_LOST}
                                {...hoverProps(
                                    transcript3p!.gene,
                                    exon,
                                    n,
                                    retained
                                )}
                            />
                            <rect
                                data-testid="strip-exon"
                                x={split}
                                y={yEx}
                                width={w - lostW}
                                height={ph}
                                rx={2}
                                fill={COLOR_3PRIME}
                                {...hoverProps(
                                    transcript3p!.gene,
                                    exon,
                                    n,
                                    retained
                                )}
                            />
                        </React.Fragment>
                    );
                }
                return (
                    <rect
                        key={`3p-${i}`}
                        data-testid="strip-exon"
                        data-lost={retained ? undefined : 'true'}
                        x={x}
                        y={yEx}
                        width={w}
                        height={ph}
                        rx={2}
                        fill={retained ? COLOR_3PRIME : COLOR_EXON_LOST}
                        {...hoverProps(transcript3p!.gene, exon, n, retained)}
                    />
                );
            })}
            {full ? (
                <>
                    {tick5X !== undefined && (
                        <line
                            data-testid="strip-breakpoint-tick"
                            x1={tick5X}
                            y1={yEx - 3}
                            x2={tick5X}
                            y2={yEx + ph + 3}
                            stroke={COLOR_BREAKPOINT}
                            strokeWidth={1.5}
                        />
                    )}
                    {tick3X !== undefined && (
                        <line
                            data-testid="strip-breakpoint-tick"
                            x1={tick3X}
                            y1={yEx - 3}
                            x2={tick3X}
                            y2={yEx + ph + 3}
                            stroke={COLOR_BREAKPOINT}
                            strokeWidth={1.5}
                        />
                    )}
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
            {showInlineJunction && (
                <text
                    data-testid="junction-label"
                    x={layout.junctionX}
                    y={yEx - (compact ? 1.5 : 5)}
                    textAnchor="middle"
                    fontSize={compact ? 5 : 9}
                    fontWeight={600}
                    fill={COLOR_BREAKPOINT}
                >
                    {junctionText}
                </text>
            )}
            {/* Right gutter: oncoprint-style frame cell (collapsed, mixed frame
                calls), a one-colour frame cell per row (dense; stacked rows
                read as an oncoprint track, reads stay in the hover <title>),
                or the per-sample "In-frame · 12r" text. */}
            {frameSummary ? (
                renderFrameCell(frameSummary, rightX + 8, centerY)
            ) : compact ? (
                <rect
                    data-testid="frame-cell-dense"
                    x={rightX + 8}
                    y={yEx}
                    width={FRAME_CELL_W}
                    height={ph}
                    fill={FRAME_COLORS[frame]}
                />
            ) : (
                <text
                    x={rightX + 8}
                    y={textBaseline - 2}
                    fontSize={9.5}
                    fill="#666"
                >
                    {style.label} · {reads}r
                </text>
            )}
            {partnerLabel && !compact && (
                <g>
                    <title>{partnerLabel.title ?? partnerLabel.text}</title>
                    <circle
                        data-testid="partner-dot"
                        cx={rightX + PARTNER_X_OFFSET + 4}
                        cy={textBaseline - 5}
                        r={4}
                        fill={partnerLabel.color}
                    />
                    <text
                        data-testid="partner-label"
                        x={rightX + PARTNER_TEXT_OFFSET}
                        y={textBaseline - 2}
                        fontSize={9.5}
                        fill="#495057"
                    >
                        {truncate(partnerLabel.text)}
                    </text>
                </g>
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
