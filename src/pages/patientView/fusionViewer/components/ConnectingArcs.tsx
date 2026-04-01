import * as React from 'react';
import { COLOR_5PRIME, COLOR_3PRIME, COLOR_BREAKPOINT } from '../data/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ConnectingArcsProps {
    /** X position of the breakpoint on the 5-prime gene track */
    breakpoint5pX: number;
    /** X position of the breakpoint on the 3-prime gene track */
    breakpoint3pX: number;
    /** Y position at the bottom of the gene tracks */
    geneTrackBottomY: number;
    /** Y position at the top of the fusion product */
    fusionProductTopY: number;
    /** X position of the junction point on the fusion product */
    fusionJunctionX: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const ConnectingArcs: React.FC<ConnectingArcsProps> = ({
    breakpoint5pX,
    breakpoint3pX,
    geneTrackBottomY,
    fusionProductTopY,
    fusionJunctionX,
}) => {
    // Vertical midpoint for the control points of the cubic bezier
    const midY = (geneTrackBottomY + fusionProductTopY) / 2;

    // 5-prime arc: from breakpoint on gene track down to junction
    const path5p = [
        `M ${breakpoint5pX} ${geneTrackBottomY}`,
        `C ${breakpoint5pX} ${midY},`,
        `  ${fusionJunctionX} ${midY},`,
        `  ${fusionJunctionX} ${fusionProductTopY}`,
    ].join(' ');

    // 3-prime arc: from breakpoint on gene track down to junction
    const path3p = [
        `M ${breakpoint3pX} ${geneTrackBottomY}`,
        `C ${breakpoint3pX} ${midY},`,
        `  ${fusionJunctionX} ${midY},`,
        `  ${fusionJunctionX} ${fusionProductTopY}`,
    ].join(' ');

    return (
        <g>
            {/* 5-prime arc */}
            <path
                d={path5p}
                fill="none"
                stroke={COLOR_5PRIME}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                opacity={0.5}
            />

            {/* 3-prime arc */}
            <path
                d={path3p}
                fill="none"
                stroke={COLOR_3PRIME}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                opacity={0.5}
            />

            {/* Junction point circle */}
            <circle
                cx={fusionJunctionX}
                cy={fusionProductTopY}
                r={4}
                fill={COLOR_BREAKPOINT}
                opacity={0.8}
            />
        </g>
    );
};
