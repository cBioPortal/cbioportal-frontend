import * as React from 'react';
import {
    computeJunctionAlignedLayout,
    retainedExonsInOrder,
    junctionExonNumbers,
} from './fusionProductHelpers';
import { frameStatusStyle } from './frameStatusStyle';
import {
    TranscriptData,
    COLOR_5PRIME,
    COLOR_3PRIME,
    COLOR_BREAKPOINT,
    COLOR_ACTIVE_OUTLINE,
    FrameStatus,
    JunctionLabelMode,
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
    // Junction exon label placement (feature 2). Defaults to 'inline-tooltip'.
    junctionLabelMode?: JunctionLabelMode;
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
    junctionLabelMode = 'inline-tooltip',
}) => {
    const [hovered, setHovered] = React.useState(false);
    const retained5p = retainedExonsInOrder(transcript5p, breakpoint5p, true);
    const retained3p =
        transcript3p && breakpoint3p !== undefined
            ? retainedExonsInOrder(transcript3p, breakpoint3p, false)
            : [];
    const layout = computeJunctionAlignedLayout(
        retained5p,
        retained3p,
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
    const junction = junctionExonNumbers(retained5p, retained3p);
    const junctionText =
        junction.fivePrime !== undefined && junction.threePrime !== undefined
            ? `E${junction.fivePrime}|E${junction.threePrime}`
            : junction.fivePrime !== undefined
            ? `E${junction.fivePrime}`
            : junction.threePrime !== undefined
            ? `E${junction.threePrime}`
            : '';
    const junctionArrow =
        junction.fivePrime !== undefined && junction.threePrime !== undefined
            ? `E${junction.fivePrime}→E${junction.threePrime}`
            : junctionText;
    // Inline seam label shows in sample/collapsed always; in dense only when the
    // user picked 'inline-both' (dense 'inline-tooltip' uses the hover <title>).
    const showInlineJunction =
        junctionLabelMode !== 'gutter' &&
        !!junctionText &&
        (!compact || junctionLabelMode === 'inline-both');

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
                    {label}
                    {junctionLabelMode === 'inline-tooltip' && junctionArrow
                        ? ` · ${junctionArrow}`
                        : ''}{' '}
                    · {style.label} · {reads}r
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
            {retained5p.map((exon, i) => {
                const isAllUtr = stripExonIsAllUtr(exon, transcript5p.utrs);
                const h = isAllUtr ? ph / 2 : ph;
                const yRect = isAllUtr ? yEx + ph / 4 : yEx;
                return (
                    <rect
                        key={`5p-${i}`}
                        data-testid="strip-exon"
                        x={layout.xs5p[i]}
                        y={yRect}
                        width={layout.widths5p[i]}
                        height={h}
                        rx={2}
                        fill={COLOR_5PRIME}
                    />
                );
            })}
            {/* Half-height UTR treatment is intentionally 5′-only; 3′ retained exons start after the breakpoint and are not purely 5′UTR. */}
            {retained3p.map((_, i) => (
                <rect
                    key={`3p-${i}`}
                    data-testid="strip-exon"
                    x={layout.xs3p[i]}
                    y={yEx}
                    width={layout.widths3p[i]}
                    height={ph}
                    rx={2}
                    fill={COLOR_3PRIME}
                />
            ))}
            {retained5p.length > 0 && retained3p.length > 0 && (
                <line
                    x1={layout.junctionX}
                    y1={yEx - 3}
                    x2={layout.junctionX}
                    y2={yEx + ph + 3}
                    stroke={COLOR_BREAKPOINT}
                    strokeWidth={1.5}
                />
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
            {junctionLabelMode === 'gutter' && junctionText && (
                <text
                    data-testid="junction-gutter"
                    x={rightX + 8}
                    y={compact ? centerY + 2 : textBaseline + 9}
                    fontSize={compact ? 6 : 9}
                    fontWeight={600}
                    fill={COLOR_BREAKPOINT}
                >
                    {junctionText}
                </text>
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
