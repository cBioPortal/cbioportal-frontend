import * as React from 'react';
import {
    ASCN_CHART_HORIZONTAL_MARGIN,
    AscnFrequencyMode,
    AscnGenomeLayout,
    FrequencyResult,
    FREQ_STACK_ORDER,
    FREQUENCY_CHART_TITLES,
} from './AscnDataUtils';

interface IAscnGenomeFrequencyChartProps {
    data: FrequencyResult;
    layout: AscnGenomeLayout;
    mode: AscnFrequencyMode;
    width?: number;
    height?: number;
}

const MARGIN = { top: 30, bottom: 30, ...ASCN_CHART_HORIZONTAL_MARGIN };

// legend order top-to-bottom, matching the reference SVGs
const LEGEND_ORDER: { [mode in AscnFrequencyMode]: string[] } = {
    gain: ['AMP', 'GAIN', 'HOMDEL', 'HETLOSS'],
    loh: ['RLOH', 'CNLOH', 'HOMDEL', 'HETLOSS'],
};

/**
 * Genome-wide, cohort-level copy-number frequency track: for each genomic
 * bin, the % of samples with a gain-direction call is drawn above the zero
 * line and the % with a loss-direction call is drawn below it (stacked by
 * call type). Translated from `build_mode_svg()` / the
 * `ascn_cohort_calls_frequency_*.svg` reference plots.
 */
export default class AscnGenomeFrequencyChart extends React.Component<
    IAscnGenomeFrequencyChartProps,
    {}
> {
    public static defaultProps = {
        width: 1400,
        height: 340,
    };

    render() {
        const { data, layout, mode, width, height } = this.props;
        const plotWidth = width! - MARGIN.left - MARGIN.right;
        const plotHeight = height! - MARGIN.top - MARGIN.bottom;

        const xScale = (genomePos: number) =>
            (genomePos / layout.totalGenome) * plotWidth;
        // y in [-1, 1] mapped to [plotHeight, 0]
        const yScale = (freqSigned: number) =>
            plotHeight / 2 - (freqSigned * plotHeight) / 2;

        const stackOrder = FREQ_STACK_ORDER[mode];
        const binWidthPx = Math.max(
            1,
            xScale(layout.totalGenome / data.bins.length)
        );

        const bars: JSX.Element[] = [];
        for (const bin of data.bins) {
            const valuesByCall: { [call: string]: number } = {};
            for (const v of bin.values) {
                valuesByCall[v.call] = v.freqSigned;
            }
            const x = xScale(bin.xmid) - binWidthPx / 2;

            let cumGain = 0;
            for (const call of stackOrder.gain) {
                const v = valuesByCall[call] || 0;
                if (v === 0) {
                    continue;
                }
                const y0 = yScale(cumGain);
                const y1 = yScale(cumGain + v);
                bars.push(
                    <rect
                        key={`${bin.bin}-${call}`}
                        x={x}
                        y={y1}
                        width={binWidthPx}
                        height={Math.max(0, y0 - y1)}
                        fill={data.freqColors[call]}
                    />
                );
                cumGain += v;
            }

            let cumLoss = 0;
            for (const call of stackOrder.loss) {
                const v = valuesByCall[call] || 0;
                if (v === 0) {
                    continue;
                }
                const y0 = yScale(cumLoss);
                const y1 = yScale(cumLoss + v);
                bars.push(
                    <rect
                        key={`${bin.bin}-${call}`}
                        x={x}
                        y={y0}
                        width={binWidthPx}
                        height={Math.max(0, y1 - y0)}
                        fill={data.freqColors[call]}
                    />
                );
                cumLoss += v;
            }
        }

        const chrLines = layout.chromosomes.map(chr => {
            const x = xScale(layout.chrOffsets[String(chr)]);
            return (
                <line
                    key={`chrline-${chr}`}
                    x1={x}
                    x2={x}
                    y1={0}
                    y2={plotHeight}
                    stroke="#999"
                    strokeWidth={0.5}
                />
            );
        });

        const chrLabels = layout.chromosomes.map(chr => {
            const x = xScale(layout.chrMids[String(chr)]);
            return (
                <text
                    key={`chrlabel-${chr}`}
                    x={x}
                    y={plotHeight + 16}
                    fontSize={9}
                    textAnchor="middle"
                >
                    {chr}
                </text>
            );
        });

        const yTicks = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
        const yAxis = yTicks.map(t => (
            <g key={`ytick-${t}`}>
                <line
                    x1={0}
                    x2={plotWidth}
                    y1={yScale(t)}
                    y2={yScale(t)}
                    stroke="#eee"
                    strokeWidth={0.5}
                />
                <text x={-8} y={yScale(t) + 3} fontSize={9} textAnchor="end">
                    {`${Math.round(Math.abs(t) * 100)}%`}
                </text>
            </g>
        ));

        return (
            <svg width={width} height={height}>
                <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
                    <text x={0} y={-10} fontSize={13} fontWeight={600}>
                        {`${FREQUENCY_CHART_TITLES[mode]} — ${data.nSamples} samples`}
                    </text>
                    {yAxis}
                    {chrLines}
                    {bars}
                    <line
                        x1={0}
                        x2={plotWidth}
                        y1={yScale(0)}
                        y2={yScale(0)}
                        stroke="black"
                        strokeWidth={1}
                    />
                    {chrLabels}
                    <text
                        x={plotWidth / 2}
                        y={plotHeight + 28}
                        textAnchor="middle"
                        fontSize={11}
                    >
                        Chromosome
                    </text>
                    <text
                        transform={`translate(-40, ${plotHeight /
                            2}) rotate(-90)`}
                        textAnchor="middle"
                        fontSize={11}
                    >
                        % samples
                    </text>
                </g>
                <g
                    transform={`translate(${MARGIN.left + plotWidth + 20}, ${
                        MARGIN.top
                    })`}
                >
                    <text x={0} y={0} fontSize={12} fontWeight={600}>
                        CN Call
                    </text>
                    {LEGEND_ORDER[mode].map((call, i) => (
                        <g
                            key={call}
                            transform={`translate(0, ${18 + i * 18})`}
                        >
                            <rect
                                x={0}
                                y={-9}
                                width={12}
                                height={12}
                                fill={data.freqColors[call]}
                                stroke="#999"
                                strokeWidth={0.5}
                            />
                            <text x={17} y={1} fontSize={10}>
                                {call}
                            </text>
                        </g>
                    ))}
                </g>
            </svg>
        );
    }
}
