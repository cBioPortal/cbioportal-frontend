import * as React from 'react';
import { FrameStatus } from '../data/types';
import { LinkGroup, LinkMatcher, slotLabel } from '../data/linkAggregation';

export const ARC_BAND_HEIGHT = 120;
export const FRAME_LINK_COLORS: Record<FrameStatus, string> = {
    inFrame: '#2c7fb8',
    outOfFrame: '#e6550d',
    unknown: '#999999',
};
const REST = 0.35;
const LIT = 0.9;
const DIM = 0.06;
const MAX_STROKE = 14;

export interface BreakpointLinkArcsProps {
    groups: LinkGroup[];
    width: number;
    height: number;
    matcher?: LinkMatcher;
    onHover: (g: LinkGroup | undefined) => void;
}

/**
 * Pair-mode link band (D9): one faded cubic arc per (5′ slot, 3′ slot, frame)
 * group, hanging below the gene bodies. Depth grows with horizontal span so
 * arcs nest; thickest drawn first so thin arcs stay visible on top.
 */
const BreakpointLinkArcs: React.FC<BreakpointLinkArcsProps> = ({
    groups,
    width,
    height,
    matcher,
    onHover,
}) => (
    <svg data-testid="link-arcs" width={width} height={height}>
        {[...groups]
            .sort((a, b) => b.sampleCount - a.sampleCount)
            .map(g => {
                const top = 4;
                const depth = Math.min(
                    height - 6,
                    18 + Math.abs(g.x3 - g.x5) * 0.16
                );
                const d = `M${g.x5},${top} C${g.x5},${depth} ${g.x3},${depth} ${g.x3},${top}`;
                const opacity = !matcher ? REST : matcher(g) ? LIT : DIM;
                return (
                    <path
                        key={g.id}
                        data-testid="link-arc"
                        data-link-id={g.id}
                        d={d}
                        fill="none"
                        stroke={FRAME_LINK_COLORS[g.frame]}
                        strokeOpacity={opacity}
                        strokeWidth={Math.min(
                            MAX_STROKE,
                            1.2 + g.sampleCount * 0.65
                        )}
                        strokeLinecap="round"
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => onHover(g)}
                        onMouseLeave={() => onHover(undefined)}
                    >
                        <title>
                            {slotLabel(g.key5)} → {slotLabel(g.key3)} ·{' '}
                            {g.sampleCount} sample
                            {g.sampleCount === 1 ? '' : 's'} · {g.frame}
                        </title>
                    </path>
                );
            })}
    </svg>
);

export default BreakpointLinkArcs;
