import * as React from 'react';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';

const HIT_COLOR = '#52c41a';
const MISS_COLOR = '#ff4d4f';

const tooltipStyles = {
    ...defaultStyles,
    fontSize: 12,
    padding: '6px 10px',
};

interface SessionData {
    label: string;
    entries: { cacheHit: boolean }[];
}

interface Props {
    sessions: SessionData[];
    width?: number;
    height?: number;
}

interface TooltipDatum {
    session: string;
    type: string;
    count: number;
}

interface DataRow {
    label: string;
    hits: number;
    misses: number;
}

export default function CacheEfficiencyChart({
    sessions,
    width = 500,
    height: heightProp,
}: Props) {
    const {
        showTooltip,
        hideTooltip,
        tooltipOpen,
        tooltipData,
        tooltipLeft,
        tooltipTop,
    } = useTooltip<TooltipDatum>();

    if (!sessions || sessions.length === 0) return null;

    const data: DataRow[] = sessions.map((s, i) => {
        const hits = s.entries.filter(e => e.cacheHit).length;
        const misses = s.entries.length - hits;
        return { label: s.label || `Session ${i + 1}`, hits, misses };
    });

    const MARGIN = { top: 10, right: 20, bottom: 40, left: 50 };
    const minGroupWidth = 60;
    const height = heightProp || 260;
    const xMax = Math.max(
        width - MARGIN.left - MARGIN.right,
        sessions.length * minGroupWidth
    );
    const yMax = height - MARGIN.top - MARGIN.bottom;

    const sessionScale = scaleBand({
        domain: data.map(d => d.label),
        range: [0, xMax],
        padding: 0.3,
    });

    const innerScale = scaleBand({
        domain: ['hits', 'misses'],
        range: [0, sessionScale.bandwidth()],
        padding: 0.1,
    });

    const maxCount = Math.max(...data.map(d => Math.max(d.hits, d.misses)), 1);

    const yScale = scaleLinear({
        domain: [0, maxCount],
        range: [yMax, 0],
        nice: true,
    });

    const handleHover = (
        e: React.MouseEvent<SVGRectElement>,
        d: DataRow,
        type: string
    ) => {
        const svg = e.currentTarget.ownerSVGElement!;
        const point = svg.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;
        const svgPoint = point.matrixTransform(svg.getScreenCTM()!.inverse());
        showTooltip({
            tooltipData: {
                session: d.label,
                type,
                count: type === 'hits' ? d.hits : d.misses,
            },
            tooltipLeft: svgPoint.x,
            tooltipTop: svgPoint.y - 10,
        });
    };

    return (
        <div style={{ position: 'relative' }}>
            <svg width={width} height={height}>
                <Group left={MARGIN.left} top={MARGIN.top}>
                    {data.map(d => {
                        const groupX = sessionScale(d.label) ?? 0;
                        return (
                            <g key={d.label}>
                                <rect
                                    x={groupX + (innerScale('hits') ?? 0)}
                                    y={yScale(d.hits)}
                                    width={innerScale.bandwidth()}
                                    height={Math.max(0, yMax - yScale(d.hits))}
                                    fill={HIT_COLOR}
                                    rx={2}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={e =>
                                        handleHover(e, d, 'hits')
                                    }
                                    onMouseLeave={hideTooltip}
                                />
                                <rect
                                    x={groupX + (innerScale('misses') ?? 0)}
                                    y={yScale(d.misses)}
                                    width={innerScale.bandwidth()}
                                    height={Math.max(
                                        0,
                                        yMax - yScale(d.misses)
                                    )}
                                    fill={MISS_COLOR}
                                    rx={2}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={e =>
                                        handleHover(e, d, 'misses')
                                    }
                                    onMouseLeave={hideTooltip}
                                />
                            </g>
                        );
                    })}
                    <AxisBottom
                        scale={sessionScale}
                        top={yMax}
                        tickLabelProps={() => ({
                            fontSize: 11,
                            textAnchor: 'end' as const,
                            dy: -4,
                            transform:
                                sessions.length > 4 ? 'rotate(-30)' : undefined,
                            fill: '#666',
                        })}
                    />
                    <AxisLeft
                        scale={yScale}
                        numTicks={5}
                        tickFormat={v => `${v}`}
                        tickLabelProps={() => ({
                            fontSize: 11,
                            textAnchor: 'end' as const,
                            fill: '#666',
                            dx: -4,
                        })}
                    />
                </Group>
            </svg>

            {/* Legend */}
            <div
                style={{
                    display: 'flex',
                    gap: 16,
                    padding: '4px 0 0',
                    fontSize: 11,
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: HIT_COLOR,
                            display: 'inline-block',
                        }}
                    />
                    Cache hits
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: MISS_COLOR,
                            display: 'inline-block',
                        }}
                    />
                    Cache misses
                </span>
            </div>

            {tooltipOpen && tooltipData && (
                <TooltipWithBounds
                    left={tooltipLeft}
                    top={tooltipTop}
                    style={tooltipStyles}
                >
                    <div>
                        <strong>{tooltipData.session}</strong>
                    </div>
                    <div>
                        {tooltipData.type === 'hits'
                            ? 'Cache hits'
                            : 'Cache misses'}
                        : {tooltipData.count}
                    </div>
                </TooltipWithBounds>
            )}
        </div>
    );
}
