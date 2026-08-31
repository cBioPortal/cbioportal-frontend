import React from 'react';
import { observer } from 'mobx-react';

interface IVAFChartHeaderProps {
    ticks: { label: string; offset: number }[];
    legendHeight: number;
}

export function getVafChartHeaderTickKey(tick: {
    label: string;
    offset: number;
}): string {
    return `${tick.label}:${tick.offset}`;
}

const VAFChartHeader: React.FunctionComponent<IVAFChartHeaderProps> = observer(
    function({ ticks, legendHeight }) {
        const width = 50;
        let maxTickOffset = 0;
        for (let index = 0; index < ticks.length; index += 1) {
            if (ticks[index].offset > maxTickOffset) {
                maxTickOffset = ticks[index].offset;
            }
        }
        const tickRows = new Array<JSX.Element>(ticks.length);
        for (let index = 0; index < ticks.length; index += 1) {
            const tick = ticks[index];
            tickRows[index] = (
                <g
                    key={getVafChartHeaderTickKey(tick)}
                    transform={`translate(${width - 30},0)`}
                >
                    <text
                        y={tick.offset}
                        font-size="10px"
                        style={{ textAlign: 'right' }}
                    >
                        {tick.label}
                    </text>
                    <rect
                        width={5}
                        height={1}
                        fill="#aaa"
                        transform={`translate(20,${tick.offset - 4})`}
                    />
                </g>
            );
        }

        return (
            <div
                style={{
                    height: legendHeight,
                    width: width,
                }}
            >
                <svg
                    height={legendHeight}
                    width={width}
                    style={{
                        textTransform: 'none',
                        position: 'relative',
                    }}
                >
                    <text
                        style={{ textAlign: 'left' }}
                        text-anchor="middle"
                        transform={`translate(${width - 40},${maxTickOffset /
                            2}) rotate(-90)`}
                    >
                        Allele Frequency
                    </text>

                    <g transform={`translate(0,0)`}>{tickRows}</g>
                </svg>
            </div>
        );
    }
);

export { VAFChartHeader };
