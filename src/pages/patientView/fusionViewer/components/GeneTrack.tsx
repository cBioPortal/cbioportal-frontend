import * as React from 'react';
import { Exon, TranscriptData, COLOR_BREAKPOINT } from '../data/types';
import { ExonTooltip, BreakpointTooltip } from './ExonTooltip';

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function genomicToSvgX(
    genomicPos: number,
    genomeMin: number,
    genomeMax: number,
    svgX: number,
    svgWidth: number
): number {
    if (genomeMax === genomeMin) return svgX + svgWidth / 2;
    return (
        svgX + ((genomicPos - genomeMin) / (genomeMax - genomeMin)) * svgWidth
    );
}

/**
 * Compute the x position and width of the retained-exon shade rect.
 *
 * The retained side depends on both strand and whether this is the 5′ or 3′ gene:
 *   5′ gene + strand → shade LEFT  (start <= bp)
 *   5′ gene − strand → shade RIGHT (end   >= bp)
 *   3′ gene + strand → shade RIGHT (end   >= bp)
 *   3′ gene − strand → shade LEFT  (start <= bp)
 */
export function computeRetainedShadeX(
    strand: '+' | '-',
    is5Prime: boolean,
    bpX: number,
    drawX: number,
    drawWidth: number
): { x: number; width: number } {
    const trackEnd = drawX + drawWidth;
    const shadeLeft = is5Prime ? strand === '+' : strand === '-';
    if (shadeLeft) {
        return {
            x: drawX,
            width: Math.min(drawWidth, Math.max(0, bpX - drawX)),
        };
    } else {
        const clampedBpX = Math.max(drawX, bpX);
        return {
            x: clampedBpX,
            width: Math.max(0, trackEnd - clampedBpX),
        };
    }
}

const FORTE_TRACK_HEIGHT = 40;
const USER_TRACK_HEIGHT = 30;
const LABEL_HEIGHT = 30;
const BREAKPOINT_EXTRA = 20;

export function getGeneTrackHeight(
    hasUserTranscript: boolean,
    userTranscriptCount: number = 1
): number {
    const userCount = hasUserTranscript ? Math.max(1, userTranscriptCount) : 0;
    return (
        LABEL_HEIGHT +
        FORTE_TRACK_HEIGHT +
        userCount * USER_TRACK_HEIGHT +
        BREAKPOINT_EXTRA
    );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface GeneTrackProps {
    symbol: string;
    chromosome: string;
    position: number;
    strand: '+' | '-';
    siteDescription: string;
    forteTranscript: TranscriptData;
    /** Multiple user-selected transcripts (optional) */
    userTranscripts?: TranscriptData[];
    /** Backward compat: single user transcript */
    userTranscript?: TranscriptData;
    color: string;
    x: number;
    y: number;
    width: number;
    is5Prime: boolean;
    /** Overall track height (max of both genes) so breakpoint line spans full height */
    trackHeight?: number;
    /** Exon numbers (by `exon.number`) that are retained in the fusion product.
     *  When undefined, all exons render as normal (no highlighting). */
    retainedExonNumbers?: Set<number>;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------
const EXON_HEIGHT = 12;
const INTRON_Y_OFFSET = EXON_HEIGHT / 2;
const LABEL_FONT_SIZE = 13;
const COORD_FONT_SIZE = 9;
const TRACK_PADDING = 10;
const EXON_LABEL_OFFSET = 9; // px gap between exon bottom and E-number label

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const GeneTrack: React.FC<GeneTrackProps> = ({
    symbol,
    chromosome,
    position,
    strand,
    siteDescription,
    forteTranscript,
    userTranscripts: userTranscriptsProp,
    userTranscript: singleUserTranscript,
    color,
    x,
    y,
    width,
    is5Prime,
    trackHeight,
    retainedExonNumbers,
}) => {
    // Resolve: prefer array prop, fall back to single
    const userTranscripts: TranscriptData[] = userTranscriptsProp
        ? userTranscriptsProp
        : singleUserTranscript
        ? [singleUserTranscript]
        : [];

    // ---- Determine genomic range across all shown transcripts ----
    const allExons = [
        ...forteTranscript.exons,
        ...userTranscripts.flatMap(t => t.exons),
    ];
    const allStarts = allExons.map(e => e.start);
    const allEnds = allExons.map(e => e.end);
    const genomeMin = Math.min(...allStarts, position);
    const genomeMax = Math.max(...allEnds, position);

    const padBp = Math.max(1, Math.round((genomeMax - genomeMin) * 0.03));
    const gMin = genomeMin - padBp;
    const gMax = genomeMax + padBp;

    const drawX = x + TRACK_PADDING;
    const drawWidth = width - TRACK_PADDING * 2;

    const toSvg = (gPos: number) =>
        genomicToSvgX(gPos, gMin, gMax, drawX, drawWidth);

    const sortedForte = [...forteTranscript.exons].sort(
        (a, b) => a.start - b.start
    );

    // ---- Layout y positions ----
    const labelY = y;
    const forteY = y + LABEL_HEIGHT;

    const strandArrow = strand === '+' ? ' \u25B6' : ' \u25C0';
    const bpX = toSvg(position);

    // ---- Render a transcript row ----
    const renderTranscript = (
        exons: Exon[],
        transcript: TranscriptData,
        yPos: number,
        opacity: number,
        strokeWidth: number,
        labelText?: string
    ) => {
        const intronY = yPos + INTRON_Y_OFFSET;
        const elements: React.ReactNode[] = [];

        for (let i = 0; i < exons.length - 1; i++) {
            const x1 = toSvg(exons[i].end);
            const x2 = toSvg(exons[i + 1].start);
            elements.push(
                <line
                    key={`intron-${transcript.transcriptId}-${i}`}
                    x1={x1}
                    y1={intronY}
                    x2={x2}
                    y2={intronY}
                    stroke={color}
                    strokeWidth={1}
                    opacity={opacity}
                />
            );
        }

        exons.forEach(exon => {
            const ex = toSvg(exon.start);
            const ew = Math.max(2, toSvg(exon.end) - ex);
            // Use genomic position to determine retention — exon.number is not
            // consistent across alternative transcripts, so we match the same
            // logic used in select5PrimeExons / select3PrimeExons.
            const isRetained =
                retainedExonNumbers === undefined
                    ? true
                    : is5Prime
                    ? strand === '+'
                        ? exon.start <= position
                        : exon.end >= position
                    : strand === '+'
                    ? exon.end >= position
                    : exon.start <= position;

            // Base exon rect
            elements.push(
                <ExonTooltip
                    key={`exon-${transcript.transcriptId}-${exon.number}`}
                    gene={symbol}
                    exon={exon}
                >
                    <rect
                        x={ex}
                        y={yPos}
                        width={ew}
                        height={EXON_HEIGHT}
                        fill={isRetained ? color : '#ddd'}
                        stroke={isRetained ? color : '#ddd'}
                        strokeWidth={strokeWidth}
                        opacity={isRetained ? opacity : 1}
                        rx={1}
                    />
                </ExonTooltip>
            );

            // Hatch overlay for discarded exons
            if (!isRetained) {
                elements.push(
                    <rect
                        key={`hatch-${transcript.transcriptId}-${exon.number}`}
                        x={ex}
                        y={yPos}
                        width={ew}
                        height={EXON_HEIGHT}
                        fill={`url(#${hatchId})`}
                        rx={1}
                        style={{ pointerEvents: 'none' }}
                    />
                );
            }

            // Exon number label below the exon block — only when highlighting is active
            if (retainedExonNumbers !== undefined) {
                elements.push(
                    <text
                        key={`exon-label-${transcript.transcriptId}-${exon.number}`}
                        x={ex + ew / 2}
                        y={yPos + EXON_HEIGHT + EXON_LABEL_OFFSET}
                        textAnchor="middle"
                        fontSize={7}
                        fill={isRetained ? color : '#aaa'}
                        opacity={isRetained ? opacity : 0.7}
                    >
                        E{exon.number}
                    </text>
                );
            }
        });

        if (labelText) {
            elements.push(
                <text
                    key={`label-${transcript.transcriptId}`}
                    x={drawX}
                    y={yPos - 3}
                    fontSize={8}
                    fill="#999"
                    opacity={opacity}
                >
                    {labelText}
                </text>
            );
        }

        return elements;
    };

    // ---- Breakpoint line ----
    const totalUserHeight = userTranscripts.length * USER_TRACK_HEIGHT;
    const bpLineTop = forteY - 4;
    const bpLineBottom = trackHeight
        ? y + trackHeight - BREAKPOINT_EXTRA + 4
        : forteY + FORTE_TRACK_HEIGHT + totalUserHeight + 4;

    // ---- Shade rect bounds (strand-aware) ----
    const { x: shadeX, width: shadeW } = computeRetainedShadeX(
        strand,
        is5Prime,
        bpX,
        drawX,
        drawWidth
    );
    // Add EXON_LABEL_OFFSET as a buffer so the shade comfortably covers
    // the E-number labels below the last transcript row's exon blocks.
    const shadeHeight =
        FORTE_TRACK_HEIGHT +
        userTranscripts.length * USER_TRACK_HEIGHT +
        EXON_LABEL_OFFSET;

    const hatchId = `hatch-${symbol}-${is5Prime ? '5p' : '3p'}`;

    return (
        <g>
            {/* Hatch pattern for discarded exons — only defined when highlighting is active */}
            {retainedExonNumbers && (
                <defs>
                    <pattern
                        id={hatchId}
                        patternUnits="userSpaceOnUse"
                        width={5}
                        height={5}
                    >
                        <path
                            d="M-1,1 l2,-2 M0,5 l5,-5 M4,6 l2,-2"
                            stroke="#aaa"
                            strokeWidth={1.2}
                        />
                    </pattern>
                </defs>
            )}

            {/* Gene label */}
            <text
                x={drawX}
                y={labelY + LABEL_FONT_SIZE}
                fontSize={LABEL_FONT_SIZE}
                fontWeight="bold"
                fill="#333"
            >
                {symbol}
                <tspan fontSize={11} fill="#888">
                    {strandArrow}
                </tspan>
            </text>

            {/* Transcript ID label */}
            <text
                x={drawX}
                y={labelY + LABEL_FONT_SIZE + 13}
                fontSize={9}
                fill="#999"
            >
                {forteTranscript.displayName}
            </text>

            {/* Retained region shade (behind exon blocks) */}
            {retainedExonNumbers && shadeW > 0 && (
                <rect
                    x={shadeX}
                    y={forteY}
                    width={shadeW}
                    height={shadeHeight}
                    fill={color}
                    opacity={0.08}
                    rx={3}
                    style={{ pointerEvents: 'none' }}
                />
            )}

            {/* FORTE transcript */}
            {renderTranscript(sortedForte, forteTranscript, forteY, 1.0, 2)}

            {/* User transcripts (stacked below FORTE) */}
            {userTranscripts.map((ut, index) => {
                const utY =
                    forteY + FORTE_TRACK_HEIGHT + index * USER_TRACK_HEIGHT;
                const opacity = Math.max(0.35, 0.7 - index * 0.1);
                const sortedExons = [...ut.exons].sort(
                    (a, b) => a.start - b.start
                );
                return (
                    <React.Fragment key={ut.transcriptId}>
                        {renderTranscript(
                            sortedExons,
                            ut,
                            utY,
                            opacity,
                            1,
                            ut.displayName
                        )}
                    </React.Fragment>
                );
            })}

            {/* Breakpoint dashed line */}
            <BreakpointTooltip
                chromosome={chromosome}
                position={position}
                siteDescription={siteDescription}
            >
                <line
                    x1={bpX}
                    y1={bpLineTop}
                    x2={bpX}
                    y2={bpLineBottom}
                    stroke={COLOR_BREAKPOINT}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                />
            </BreakpointTooltip>

            {/* Breakpoint coordinate label — clamp anchor to avoid clipping */}
            <text
                x={bpX}
                y={bpLineBottom + 10}
                textAnchor={
                    bpX - x < width * 0.15
                        ? 'start'
                        : x + width - bpX < width * 0.15
                        ? 'end'
                        : 'middle'
                }
                fontSize={COORD_FONT_SIZE}
                fill={COLOR_BREAKPOINT}
            >
                chr{chromosome}:{position.toLocaleString()}
            </text>
        </g>
    );
};
