import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { LollipopStick, slotLabel } from '../data/linkAggregation';
import { HIST_BASELINE, HIST_MAX_H } from '../data/trackGeometry';

export interface AnchorLollipopTrackProps {
    sticks: LollipopStick[];
    colorOf: (category: string) => string;
    onSelect?: (stick: LollipopStick) => void;
    /** Display text for a category in the tooltip (default: the raw value). */
    categoryLabel?: (category: string) => string;
    /** Anchor chromosome, prefixed to the tooltip's genomic span. */
    chromosome?: string;
    /** Anchor gene, shown in the tooltip header. */
    gene?: string;
}

const TIP_MAX_ROWS = 8;

export interface LollipopTooltipContentProps {
    stick: LollipopStick;
    colorOf: (category: string) => string;
    categoryLabel?: (category: string) => string;
    chromosome?: string;
    gene?: string;
    /** Clicking the stick filters the cohort; show the hint. */
    selectable?: boolean;
}

/** Hover card for one stick: slot, span, total, then partners by count. */
export const LollipopTooltipContent: React.FC<LollipopTooltipContentProps> = ({
    stick,
    colorOf,
    categoryLabel = c => c,
    chromosome,
    gene,
    selectable,
}) => {
    const cats = [...stick.byCategory].sort(
        (a, b) =>
            b.sampleCount - a.sampleCount ||
            a.category.localeCompare(b.category)
    );
    const shown = cats.slice(0, TIP_MAX_ROWS);
    const max = cats.length > 0 ? cats[0].sampleCount : 1;
    const n = stick.sampleCount;
    return (
        <div style={{ padding: 4, minWidth: 180, maxWidth: 280, fontSize: 12 }}>
            <strong>
                {gene ? `${gene} · ` : ''}
                {slotLabel(stick.key)}
            </strong>
            {stick.span && (
                <div style={{ fontSize: 11, color: '#666' }}>
                    {chromosome ? `chr${chromosome.replace(/^chr/i, '')}:` : ''}
                    {stick.span.gStart.toLocaleString()}–
                    {stick.span.gEnd.toLocaleString()}
                </div>
            )}
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                {n} sample{n === 1 ? '' : 's'}
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                    {shown.map(c => (
                        <tr key={c.category} data-testid="lollipop-tip-row">
                            <td style={{ padding: '1px 6px 1px 0' }}>
                                <span
                                    data-testid="lollipop-tip-swatch"
                                    style={{
                                        display: 'inline-block',
                                        width: 9,
                                        height: 9,
                                        borderRadius: 2,
                                        marginRight: 5,
                                        background: colorOf(c.category),
                                    }}
                                />
                                {categoryLabel(c.category)}
                            </td>
                            <td
                                style={{
                                    padding: '1px 6px',
                                    textAlign: 'right',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {c.sampleCount}
                            </td>
                            <td style={{ width: 60, padding: '1px 0' }}>
                                <div
                                    style={{
                                        height: 6,
                                        borderRadius: 3,
                                        width: `${(c.sampleCount / max) *
                                            100}%`,
                                        background: colorOf(c.category),
                                        opacity: 0.6,
                                    }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {cats.length > TIP_MAX_ROWS && (
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    +{cats.length - TIP_MAX_ROWS} more
                </div>
            )}
            {selectable && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    Click to filter to these {n} sample{n === 1 ? '' : 's'}
                </div>
            )}
        </div>
    );
};

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
    categoryLabel = c => c,
    chromosome,
    gene,
}) => {
    const max = sticks.reduce((m, s) => Math.max(m, s.sampleCount), 1);
    return (
        <g data-testid="lollipop-track">
            {sticks.map(s => {
                const stem =
                    MIN_STEM +
                    (s.sampleCount / max) * (HIST_MAX_H - MIN_STEM - MAX_R);
                const top = HIST_BASELINE - stem;
                const r = Math.max(
                    3,
                    Math.min(
                        MAX_R,
                        3 + 1.6 * Math.sqrt(s.sampleCount),
                        s.width * 0.6
                    )
                );
                const total = s.byCategory.reduce(
                    (t, c) => t + c.sampleCount,
                    0
                );
                let a0 = -Math.PI / 2;
                return (
                    <DefaultTooltip
                        key={s.key}
                        placement="top"
                        mouseEnterDelay={0}
                        overlay={
                            <LollipopTooltipContent
                                stick={s}
                                colorOf={colorOf}
                                categoryLabel={categoryLabel}
                                chromosome={chromosome}
                                gene={gene}
                                selectable={!!onSelect}
                            />
                        }
                    >
                        <g
                            data-testid="lollipop-stick"
                            data-key={s.key}
                            style={onSelect ? { cursor: 'pointer' } : undefined}
                            onClick={onSelect ? () => onSelect(s) : undefined}
                        >
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
                                    stroke="#999"
                                    strokeWidth={0.5}
                                />
                            ) : (
                                s.byCategory.map(c => {
                                    const a1 =
                                        a0 +
                                        (c.sampleCount / total) * 2 * Math.PI;
                                    const d = slicePath(s.x, top, r, a0, a1);
                                    a0 = a1;
                                    return (
                                        <path
                                            key={c.category}
                                            data-testid="lollipop-slice"
                                            d={d}
                                            fill={colorOf(c.category)}
                                            stroke="#999"
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
                    </DefaultTooltip>
                );
            })}
        </g>
    );
};

export default AnchorLollipopTrack;
