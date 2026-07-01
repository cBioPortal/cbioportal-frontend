import * as React from 'react';
import {
    genomicToSvgX,
    computeGeneTrackRange,
    applyUpstreamExtension,
} from './GeneTrack';
import { frameStatusStyle } from './frameStatusStyle';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData, COLOR_5PRIME, COLOR_BREAKPOINT } from '../data/types';

export interface AnchorGeneTrackRulerProps {
    anchorTranscript: TranscriptData;
    anchorSymbol: string;
    rows: ComparisonRow[];
    width: number;
    labelMargin?: number;
    onSelectRow?: (sampleId: string) => void;
}

export function stackLollipops(
    rows: ComparisonRow[]
): { row: ComparisonRow; binIndex: number }[] {
    const seen = new Map<number, number>();
    return rows.map(row => {
        const n = seen.get(row.anchorBreakpoint) ?? 0;
        seen.set(row.anchorBreakpoint, n + 1);
        return { row, binIndex: n };
    });
}

const MAX_STACK = 6;
const BAND_TOP = 8;
const ROW_H = 16;
const EXON_H = 12;
const PADDING = 10;
// Gene body sits below the lollipop band: band_top + max_stack*row_h + gap
const TRACK_Y = BAND_TOP + MAX_STACK * ROW_H + 20;

export function getAnchorTrackHeight(_rows: ComparisonRow[]): number {
    // Height is driven by fixed constants (bounded MAX_STACK band).
    // _rows is accepted for future-proofing but not needed today.
    return TRACK_Y + EXON_H + 30;
}

const AnchorGeneTrackRuler: React.FC<AnchorGeneTrackRulerProps> = ({
    anchorTranscript,
    anchorSymbol,
    rows,
    width,
    labelMargin = 150,
    onSelectRow,
}) => {
    const { strand, exons } = anchorTranscript;
    const breakpoints = rows.map(r => r.anchorBreakpoint);
    const refPos = breakpoints.length ? breakpoints[0] : exons[0].start;
    const base = computeGeneTrackRange(exons, refPos);
    const { gMin, gMax } = applyUpstreamExtension(
        base.gMin,
        base.gMax,
        strand,
        exons
    );
    const drawX = labelMargin;
    const drawW = width - labelMargin - PADDING;
    const toX = (g: number) =>
        genomicToSvgX(g, gMin, gMax, drawX, drawW, strand);

    const stacked = stackLollipops(rows);

    // Count overflowing lollipops per breakpoint bin
    const binCounts = new Map<number, number>();
    stacked.forEach(({ row }) => {
        binCounts.set(
            row.anchorBreakpoint,
            (binCounts.get(row.anchorBreakpoint) ?? 0) + 1
        );
    });

    return (
        <g data-testid="anchor-track">
            {/* gene body: exons */}
            {exons.map((e, i) => {
                const x = Math.min(toX(e.start), toX(e.end));
                const w = Math.max(2, Math.abs(toX(e.end) - toX(e.start)));
                return (
                    <rect
                        key={i}
                        x={x}
                        y={TRACK_Y}
                        width={w}
                        height={EXON_H}
                        rx={1}
                        fill={COLOR_5PRIME}
                    />
                );
            })}
            <text
                x={drawX}
                y={TRACK_Y + EXON_H / 2 + 4}
                fontSize={13}
                fontWeight="bold"
                fill="#333"
            >
                {anchorSymbol} ({strand})
            </text>
            {/* lollipops — stacked downward from BAND_TOP, capped at MAX_STACK */}
            {stacked.map(({ row, binIndex }) => {
                if (binIndex >= MAX_STACK) return null;
                const x = toX(row.anchorBreakpoint);
                // Stack downward: row 0 is at BAND_TOP, each subsequent row is 16px lower
                const cy = BAND_TOP + binIndex * ROW_H;
                const style = frameStatusStyle(row.frame);
                const total = binCounts.get(row.anchorBreakpoint) ?? 0;
                const isLastVisible =
                    binIndex === MAX_STACK - 1 && total > MAX_STACK;
                return (
                    <g key={row.sampleId}>
                        <line
                            x1={x}
                            y1={TRACK_Y - 6}
                            x2={x}
                            y2={cy + 7}
                            stroke={COLOR_BREAKPOINT}
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                        />
                        {isLastVisible ? (
                            <text
                                x={x}
                                y={cy + 4}
                                textAnchor="middle"
                                fontSize={10}
                                fill={COLOR_BREAKPOINT}
                            >
                                +{total - MAX_STACK + 1}
                            </text>
                        ) : (
                            <circle
                                data-testid="lollipop"
                                cx={x}
                                cy={cy}
                                r={6.5}
                                fill={style.hollow ? '#fff' : style.fill}
                                stroke={style.hollow ? '#b9c0cc' : style.fill}
                                strokeWidth={1.5}
                                style={{
                                    cursor: onSelectRow ? 'pointer' : 'default',
                                }}
                                onClick={() =>
                                    onSelectRow && onSelectRow(row.sampleId)
                                }
                            >
                                <title>
                                    {row.sampleId} — {style.label}
                                </title>
                            </circle>
                        )}
                    </g>
                );
            })}
        </g>
    );
};

export default AnchorGeneTrackRuler;
