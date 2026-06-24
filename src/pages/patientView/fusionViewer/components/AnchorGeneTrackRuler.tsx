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

const TRACK_Y = 120;
const EXON_H = 12;
const PADDING = 10;

const AnchorGeneTrackRuler: React.FC<AnchorGeneTrackRulerProps> = ({
    anchorTranscript,
    anchorSymbol,
    rows,
    width,
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
    const drawX = PADDING;
    const drawW = width - PADDING * 2;
    const toX = (g: number) =>
        genomicToSvgX(g, gMin, gMax, drawX, drawW, strand);

    const stacked = stackLollipops(rows);

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
                y={TRACK_Y - 20}
                fontSize={13}
                fontWeight="bold"
                fill="#333"
            >
                {anchorSymbol} ({strand})
            </text>
            {/* lollipops */}
            {stacked.map(({ row, binIndex }) => {
                const x = toX(row.anchorBreakpoint);
                const cy = 46 - binIndex * 16;
                const style = frameStatusStyle(row.frame);
                return (
                    <g key={row.sampleId}>
                        <line
                            x1={x}
                            y1={TRACK_Y - 6}
                            x2={x}
                            y2={cy}
                            stroke={COLOR_BREAKPOINT}
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                        />
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
                    </g>
                );
            })}
        </g>
    );
};

export default AnchorGeneTrackRuler;
