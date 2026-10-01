import * as React from 'react';
import { LollipopStick } from '../data/linkAggregation';
import { HIST_BASELINE, HIST_MAX_H } from '../data/trackGeometry';

export interface AnchorLollipopTrackProps {
    sticks: LollipopStick[];
    colorOf: (category: string) => string;
    onSelect?: (stick: LollipopStick) => void;
}

const MIN_STEM = 14;
const MAX_R = 12;

function slicePath(cx: number, cy: number, r: number, a0: number, a1: number) {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return (
        `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} ` +
        `A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy +
            r * Math.sin(a1)} Z`
    );
}

/**
 * Gene-mode breakpoint lollipop (spec 3.8, D7/D8). Drawn in the anchor
 * track's <svg> above the ruler's gene body, on the feature-slot axis.
 */
const AnchorLollipopTrack: React.FC<AnchorLollipopTrackProps> = ({
    sticks,
    colorOf,
    onSelect,
}) => {
    const max = sticks.reduce((m, s) => Math.max(m, s.sampleCount), 1);
    return (
        <g data-testid="lollipop-track">
            {sticks.map(s => {
                const stem =
                    MIN_STEM +
                    (s.sampleCount / max) * (HIST_MAX_H - MIN_STEM - MAX_R);
                const top = HIST_BASELINE - stem;
                const r = Math.min(MAX_R, 3 + 1.6 * Math.sqrt(s.sampleCount));
                const total = s.byCategory.reduce(
                    (t, c) => t + c.sampleCount,
                    0
                );
                let a0 = -Math.PI / 2;
                return (
                    <g
                        key={s.key}
                        data-testid="lollipop-stick"
                        data-key={s.key}
                        style={onSelect ? { cursor: 'pointer' } : undefined}
                        onClick={onSelect ? () => onSelect(s) : undefined}
                    >
                        <title>
                            {s.key} · {s.sampleCount} sample
                            {s.sampleCount === 1 ? '' : 's'} ·{' '}
                            {s.byCategory
                                .map(c => `${c.category} ${c.sampleCount}`)
                                .join(', ')}
                        </title>
                        <line
                            x1={s.x}
                            x2={s.x}
                            y1={HIST_BASELINE}
                            y2={top}
                            stroke="#666"
                            strokeWidth={1}
                        />
                        {s.byCategory.length === 1 ? (
                            <circle
                                data-testid="lollipop-head"
                                cx={s.x}
                                cy={top}
                                r={r}
                                fill={colorOf(s.byCategory[0].category)}
                                stroke="#fff"
                            />
                        ) : (
                            s.byCategory.map(c => {
                                const a1 =
                                    a0 + (c.sampleCount / total) * 2 * Math.PI;
                                const d = slicePath(s.x, top, r, a0, a1);
                                a0 = a1;
                                return (
                                    <path
                                        key={c.category}
                                        data-testid="lollipop-slice"
                                        d={d}
                                        fill={colorOf(c.category)}
                                        stroke="#fff"
                                        strokeWidth={0.5}
                                    />
                                );
                            })
                        )}
                        <text
                            x={s.x}
                            y={top - r - 3}
                            textAnchor="middle"
                            fontSize={9}
                            fill="#333"
                        >
                            {s.sampleCount}
                        </text>
                    </g>
                );
            })}
        </g>
    );
};

export default AnchorLollipopTrack;
