import * as React from 'react';
import {
    computeJunctionAlignedLayout,
    retainedExonsInOrder,
} from './fusionProductHelpers';
import { frameStatusStyle } from './frameStatusStyle';
import {
    TranscriptData,
    COLOR_5PRIME,
    COLOR_3PRIME,
    COLOR_BREAKPOINT,
    COLOR_ACTIVE_OUTLINE,
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
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PH = 14; // product exon height

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
    const yEx = y + 24 - PH / 2;
    const style = frameStatusStyle(frame);

    return (
        <g
            data-testid="product-strip"
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <rect
                data-testid="strip-active-outline"
                className="strip-active-outline"
                x={leftX - 6}
                y={yEx - 9}
                width={rightX - leftX + 12}
                height={PH + 18}
                fill="none"
                stroke={COLOR_ACTIVE_OUTLINE}
                strokeWidth={2}
                strokeDasharray="5 3"
                rx={3}
                opacity={hovered ? 1 : 0}
            />
            {/* sample-ID label lives in the left gutter, right-aligned to the
                frame edge so it never collides with the exon rects */}
            <text
                x={leftX - 10}
                y={y + 25}
                textAnchor="end"
                fontSize={11.5}
                fontWeight={600}
                fill="#333"
            >
                {label}
            </text>
            {retained5p.map((exon, i) => {
                const isAllUtr = stripExonIsAllUtr(exon, transcript5p.utrs);
                const h = isAllUtr ? PH / 2 : PH;
                const yRect = isAllUtr ? yEx + PH / 4 : yEx;
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
                    height={PH}
                    rx={2}
                    fill={COLOR_3PRIME}
                />
            ))}
            {retained5p.length > 0 && retained3p.length > 0 && (
                <line
                    x1={layout.junctionX}
                    y1={yEx - 3}
                    x2={layout.junctionX}
                    y2={yEx + PH + 3}
                    stroke={COLOR_BREAKPOINT}
                    strokeWidth={1.5}
                />
            )}
            <text x={rightX + 8} y={y + 27} fontSize={9.5} fill="#666">
                {style.label} · {reads}r
            </text>
        </g>
    );
};

export default FusionProductStrip;
