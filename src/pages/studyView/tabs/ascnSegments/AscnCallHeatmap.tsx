import * as React from 'react';
import {
    ASCN_CHART_HORIZONTAL_MARGIN,
    AUTOSOME_KEYS,
    CALL_COLORS,
    CALL_HEATMAP_TITLES,
    CALL_LEGEND_ORDER,
    AscnFrequencyMode,
    AscnGenomeLayout,
    AscnSegment,
    reclassifySegments,
} from './AscnDataUtils';

interface IAscnCallHeatmapProps {
    segments: AscnSegment[];
    layout: AscnGenomeLayout;
    sampleLabels: string[];
    mode: AscnFrequencyMode;
    cfThreshold: number;
    width?: number;
    rowHeight?: number;
}

const MARGIN = { top: 26, bottom: 30, ...ASCN_CHART_HORIZONTAL_MARGIN };

/**
 * Per-sample, per-segment CN call track laid out across a concatenated,
 * genome-wide x-axis: one row per sample, one rect per ASCN segment,
 * colored by the (mode- and cf-threshold-aware) discrete CN call rather
 * than the raw copy-number integer. Translated/extended from `p_tcn` in the
 * R script, recolored to match the call-based ASCN cohort view.
 */
export default class AscnCallHeatmap extends React.Component<
    IAscnCallHeatmapProps,
    {}
> {
    public static defaultProps = {
        width: 1400,
        rowHeight: 9,
    };

    render() {
        const {
            segments,
            layout,
            sampleLabels,
            mode,
            cfThreshold,
            width,
            rowHeight,
        } = this.props;
        const plotWidth = width! - MARGIN.left - MARGIN.right;
        const plotHeight = sampleLabels.length * rowHeight!;

        const xScale = (genomePos: number) =>
            (genomePos / layout.totalGenome) * plotWidth;

        const sampleIndex: { [tumorSampleId: string]: number } = {};
        sampleLabels.forEach((label, i) => (sampleIndex[label] = i));

        const reclassified = reclassifySegments(
            segments.filter(
                seg =>
                    AUTOSOME_KEYS.has(seg.chromosome) &&
                    sampleIndex[seg.tumorSampleId] !== undefined
            ),
            mode,
            cfThreshold
        );

        const rects = reclassified.map((seg, i) => {
            const offset = layout.chrOffsets[seg.chromosome];
            const x = xScale(offset + seg.start);
            const xEnd = xScale(offset + seg.end);
            const y = sampleIndex[seg.tumorSampleId] * rowHeight!;
            return (
                <rect
                    key={i}
                    x={x}
                    y={y}
                    width={Math.max(0.5, xEnd - x)}
                    height={rowHeight}
                    fill={CALL_COLORS[seg.call || 'NA']}
                />
            );
        });

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

        const sampleRowLabels = sampleLabels.map((label, i) => (
            <text
                key={label}
                x={-6}
                y={i * rowHeight! + rowHeight! - 1.5}
                fontSize={5.5}
                textAnchor="end"
            >
                {label}
            </text>
        ));

        const legendItems = CALL_LEGEND_ORDER[mode];

        return (
            <svg width={width} height={plotHeight + MARGIN.top + MARGIN.bottom}>
                <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
                    <text x={0} y={-12} fontSize={13} fontWeight={600}>
                        {CALL_HEATMAP_TITLES[mode]}
                    </text>
                    {rects}
                    {chrLines}
                    {sampleRowLabels}
                    <rect
                        x={0}
                        y={0}
                        width={plotWidth}
                        height={plotHeight}
                        fill="none"
                        stroke="#666"
                        strokeWidth={0.5}
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
                </g>
                <g
                    transform={`translate(${MARGIN.left + plotWidth + 20}, ${
                        MARGIN.top
                    })`}
                >
                    <text x={0} y={0} fontSize={12} fontWeight={600}>
                        CN Call
                    </text>
                    {legendItems.map((call, i) => (
                        <g
                            key={call}
                            transform={`translate(0, ${18 + i * 18})`}
                        >
                            <rect
                                x={0}
                                y={-9}
                                width={12}
                                height={12}
                                fill={CALL_COLORS[call]}
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
