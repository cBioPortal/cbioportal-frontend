import * as React from 'react';
import {
    genomicToSvgX,
    computeGeneTrackRange,
    applyUpstreamExtension,
} from './GeneTrack';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData, COLOR_5PRIME } from '../data/types';

export interface AnchorGeneTrackRulerProps {
    anchorTranscript: TranscriptData;
    anchorSymbol: string;
    rows: ComparisonRow[];
    // Shared frame (see comparisonFrame.ts): the gene body is drawn into
    // [leftX, junctionX] so it ends at the same seam the strips align to. The
    // breakpoint density histogram sits in the band directly above the gene.
    leftX: number;
    junctionX: number;
}

export interface BreakpointBin {
    /** Left-edge x (px) of the bin. */
    x: number;
    /** Number of samples whose breakpoint falls in the bin. */
    count: number;
}

/**
 * Bin breakpoint x-positions (already mapped to pixel space) into fixed-width
 * columns across [drawX, drawX+drawW]. One bar per occupied column, so ~800
 * samples read as a density profile instead of 800 overlapping lollipops.
 * Positions outside the drawable range are dropped (callers snap breakpoints
 * onto the gene first, so this only guards against stragglers).
 */
export function binBreakpointsByPixel(
    xs: number[],
    drawX: number,
    drawW: number,
    binPx: number
): BreakpointBin[] {
    const lastBin = Math.max(0, Math.floor(drawW / binPx));
    const counts = new Map<number, number>();
    xs.forEach(x => {
        if (x < drawX || x > drawX + drawW) return;
        const idx = Math.min(lastBin, Math.floor((x - drawX) / binPx));
        counts.set(idx, (counts.get(idx) ?? 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([idx, count]) => ({ x: drawX + idx * binPx, count }))
        .sort((a, b) => a.x - b.x);
}

const EXON_H = 12;
const TRACK_Y = 124;
const HIST_BASELINE = TRACK_Y - 8;
const HIST_MAX_H = 96;
const BIN_PX = 6;

export function getAnchorTrackHeight(_rows: ComparisonRow[]): number {
    return TRACK_Y + EXON_H + 30;
}

const AnchorGeneTrackRuler: React.FC<AnchorGeneTrackRulerProps> = ({
    anchorTranscript,
    anchorSymbol,
    rows,
    leftX,
    junctionX,
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
    // Gene body occupies [leftX, junctionX] so it ends at the shared seam.
    const drawX = leftX;
    const drawW = junctionX - leftX;
    const toX = (g: number) =>
        genomicToSvgX(g, gMin, gMax, drawX, drawW, strand);

    const bins = binBreakpointsByPixel(
        breakpoints.map(toX),
        drawX,
        drawW,
        BIN_PX
    );
    const maxCount = bins.reduce((m, b) => Math.max(m, b.count), 1);

    return (
        <g data-testid="anchor-track">
            {/* breakpoint density histogram — bars grow up from the gene body */}
            {bins.map(bin => {
                const h = (bin.count / maxCount) * HIST_MAX_H;
                return (
                    <rect
                        key={bin.x}
                        data-testid="breakpoint-bin"
                        x={bin.x}
                        y={HIST_BASELINE - h}
                        width={BIN_PX - 1}
                        height={h}
                        fill={COLOR_5PRIME}
                        opacity={0.85}
                    >
                        <title>{bin.count} samples break here</title>
                    </rect>
                );
            })}
            {/* histogram max-count tick */}
            <text
                x={drawX - 10}
                y={HIST_BASELINE - HIST_MAX_H + 8}
                textAnchor="end"
                fontSize={10}
                fill="#999"
            >
                {maxCount}
            </text>
            <line
                x1={drawX}
                y1={HIST_BASELINE}
                x2={junctionX}
                y2={HIST_BASELINE}
                stroke="#e0e0e0"
                strokeWidth={1}
            />
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
                x={drawX - 10}
                y={TRACK_Y + EXON_H / 2 + 4}
                textAnchor="end"
                fontSize={13}
                fontWeight="bold"
                fill="#333"
            >
                {anchorSymbol} ({strand})
            </text>
        </g>
    );
};

export default AnchorGeneTrackRuler;
