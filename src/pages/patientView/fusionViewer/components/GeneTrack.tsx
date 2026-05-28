import * as React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
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
 * Compute the padded genomic range used by a gene track.
 * Shared by GeneTrack (for positioning the breakpoint line) and by
 * FusionDiagramSVG (for positioning the arc origin) so the two stay aligned
 * regardless of which transcript drives the fusion.
 */
export function computeGeneTrackRange(
    exons: Exon[],
    breakpointPos: number
): { gMin: number; gMax: number } {
    const allStarts = exons.map(e => e.start);
    const allEnds = exons.map(e => e.end);
    const genomeMin = Math.min(...allStarts, breakpointPos);
    const genomeMax = Math.max(...allEnds, breakpointPos);
    const padBp = Math.max(1, Math.round((genomeMax - genomeMin) * 0.03));
    return { gMin: genomeMin - padBp, gMax: genomeMax + padBp };
}

/**
 * Extend the base gMin/gMax upstream by min(2 kb, 5% of gene span) to make
 * room for the promoter tint. Both GeneTrack and FusionDiagramSVG must use
 * this same helper so arc endpoints land on the same SVG x-coordinate as the
 * breakpoint dashed line.
 *
 * "Upstream" is strand-aware:
 *   + strand → extend gMin leftward (toward lower genomic coords)
 *   − strand → extend gMax rightward (toward higher genomic coords)
 */
export function applyUpstreamExtension(
    gMinBase: number,
    gMaxBase: number,
    strand: '+' | '-',
    exons: Exon[]
): { gMin: number; gMax: number; upstreamWindow: number } {
    const allStarts = exons.map(e => e.start);
    const allEnds = exons.map(e => e.end);
    const geneMin = Math.min(...allStarts);
    const geneMax = Math.max(...allEnds);
    const geneSpan = Math.max(1, geneMax - geneMin);
    const upstreamWindow = Math.min(2000, 0.05 * geneSpan);
    if (strand === '+') {
        return {
            gMin: Math.min(gMinBase, geneMin - upstreamWindow),
            gMax: gMaxBase,
            upstreamWindow,
        };
    }
    return {
        gMin: gMinBase,
        gMax: Math.max(gMaxBase, geneMax + upstreamWindow),
        upstreamWindow,
    };
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

const FORTE_TRACK_HEIGHT = 48;
const USER_TRACK_HEIGHT = 42;
// Header (gene symbol + transcript ID) height. Includes 6px of bottom gap
// so the FORTE row's active-outline doesn't clip the transcript ID text.
const LABEL_HEIGHT = 36;
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
    /** Transcript ID currently driving the fusion product (active). */
    activeTranscriptId?: string;
    /** Called with a transcript ID when the user clicks its row to activate it. */
    onActivateTranscript?: (transcriptId: string) => void;
    /** Whether to render the upstream promoter tint (5′ track only). Defaults true. */
    showPromoter?: boolean;
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

// Active-row outline + "DRIVING FUSION" badge styling
const ACTIVE_COLOR = '#e03131';
const ACTIVE_OUTLINE_DASH = '5 3';
const ACTIVE_OUTLINE_STROKE_WIDTH = 2;
const ACTIVE_OUTLINE_RX = 3;
const ACTIVE_OUTLINE_X_PAD = 3;
const ACTIVE_OUTLINE_Y_PAD = 4;
// Active outline extends this far below yPos — covers exons + exon-number
// labels plus a small margin. Deliberately smaller than rowHeight so the
// stacked row below (whose transcript-name label sits at yPos_next - 3)
// doesn't fall inside the active row's dashed box.
const ACTIVE_OUTLINE_CONTENT_BELOW = 22;
const BADGE_WIDTH = 74;
const BADGE_HEIGHT = 12;
const BADGE_Y_OFFSET = -14;
const BADGE_TEXT_Y_OFFSET = 9; // baseline offset within badge rect
const BADGE_LABEL = 'DRIVING FUSION';
// Transcript-name pill on the active row — mirrors the DRIVING FUSION badge
// on the right, replaces the default gray label/header transcript ID.
const NAME_PILL_WIDTH = 160;

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
    activeTranscriptId,
    onActivateTranscript,
    showPromoter = true,
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
    const { gMin: gMinBase, gMax: gMaxBase } = computeGeneTrackRange(
        allExons,
        position
    );

    // Extend the rendered region 5′-ward by min(2 kb, 5% of gene span) so there
    // is visual breathing room upstream of the TSS. Both tracks extend for
    // visual symmetry; the promoter tint is gated separately by is5Prime.
    // NOTE: FusionDiagramSVG.computeBreakpointX must apply the same extension
    // via applyUpstreamExtension so arc endpoints align with the breakpoint line.
    const { gMin, gMax, upstreamWindow } = applyUpstreamExtension(
        gMinBase,
        gMaxBase,
        strand,
        allExons
    );

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

    const pointsRight = strand === '+';
    const strandLabel = ` (${strand})`;
    const pillText = pointsRight ? 'TRANSCRIBED \u25B6' : '\u25C0 TRANSCRIBED';
    const bpX = toSvg(position);

    // ---- Outermost exon X-coords across all rendered transcripts ----
    // Used for the 5\u2032/3\u2032 end caps so they remain anchored to the overall
    // gene extent rather than re-anchoring per active transcript.
    const allRenderedExonStarts = allExons.map(e => toSvg(e.start));
    const allRenderedExonEnds = allExons.map(e => toSvg(e.end));
    const outerLeft = Math.min(...allRenderedExonStarts);
    const outerRight = Math.max(...allRenderedExonEnds);

    // ---- Active transcript row geometry (for GSAP-animated chrome) ----
    const rowList: { transcript: TranscriptData; yPos: number }[] = [
        { transcript: forteTranscript, yPos: forteY },
    ];
    userTranscripts.forEach((ut, i) => {
        rowList.push({
            transcript: ut,
            yPos: forteY + FORTE_TRACK_HEIGHT + i * USER_TRACK_HEIGHT,
        });
    });
    const activeRow = rowList.find(
        r => r.transcript.transcriptId === activeTranscriptId
    );
    const activeYPos = activeRow?.yPos;
    const activeTranscript = activeRow?.transcript;

    const activeGroupRef = useRef<SVGGElement | null>(null);
    const prevActiveYPos = useRef<number | null>(null);

    useLayoutEffect(() => {
        const el = activeGroupRef.current;
        if (!el || activeYPos === undefined) {
            prevActiveYPos.current = null;
            return;
        }
        if (prevActiveYPos.current === null) {
            // First render with an active row — snap into place, don't animate.
            gsap.set(el, { y: activeYPos });
        } else if (prevActiveYPos.current !== activeYPos) {
            gsap.killTweensOf(el);
            gsap.to(el, {
                y: activeYPos,
                duration: 0.35,
                ease: 'power2.out',
            });
        }
        prevActiveYPos.current = activeYPos;
    }, [activeYPos]);

    // ---- Render a transcript row ----
    const renderTranscript = (
        exons: Exon[],
        transcript: TranscriptData,
        yPos: number,
        opacity: number,
        strokeWidth: number,
        labelText?: string,
        rowHeight: number = USER_TRACK_HEIGHT
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

        // ---- Direction chevrons on the intron line (cue B) ----
        // IGV / UCSC convention: regular tick marks along the gene body that
        // point in the transcription direction. Spaced every 30 px; ticks
        // whose midpoint falls inside an exon (with 2 px padding) are skipped.
        const CHEVRON_SPACING = 30;
        const CHEVRON_WIDTH = 6;
        const CHEVRON_HALF_H = 2;
        const mid = intronY;
        const chevronStart = drawX + 15;
        const chevronEnd = drawX + drawWidth - 15;
        const exonRanges = exons.map(e => ({
            lo: toSvg(e.start) - 2,
            hi: toSvg(e.end) + 2,
        }));
        // Chevrons in the non-retained portion of the gene render gray to match
        // the gray non-retained exons — those nucleotides aren't transcribed in
        // the fusion product, so the direction cue shouldn't claim they are.
        const shadeLeft = is5Prime ? strand === '+' : strand === '-';
        for (let cx = chevronStart; cx <= chevronEnd; cx += CHEVRON_SPACING) {
            const tickMid = cx + CHEVRON_WIDTH / 2;
            const insideExon = exonRanges.some(
                r => tickMid >= r.lo && tickMid <= r.hi
            );
            if (insideExon) continue;
            const chevronRetained =
                retainedExonNumbers === undefined
                    ? true
                    : shadeLeft
                    ? tickMid <= bpX
                    : tickMid >= bpX;
            const points = pointsRight
                ? `${cx},${mid - CHEVRON_HALF_H} ${cx +
                      CHEVRON_WIDTH},${mid} ${cx},${mid + CHEVRON_HALF_H}`
                : `${cx + CHEVRON_WIDTH},${mid -
                      CHEVRON_HALF_H} ${cx},${mid} ${cx + CHEVRON_WIDTH},${mid +
                      CHEVRON_HALF_H}`;
            elements.push(
                <polyline
                    key={`chevron-${transcript.transcriptId}-${cx}`}
                    points={points}
                    stroke={chevronRetained ? color : '#ddd'}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity={chevronRetained ? opacity : 1}
                />
            );
        }

        // Display number follows the strand arrow: E1 at the transcript's 5'
        // end. On minus-strand tracks the exons are drawn right-to-left in
        // transcription order, so we invert the index for numbering.
        const totalExons = exons.length;
        exons.forEach((exon, idx) => {
            const ex = toSvg(exon.start);
            // Minimum visible width of 5px — small exons (e.g. 80-200 bp
            // against a ~40 kb gene span) would otherwise render as 1-2 px
            // ticks that read as missing data.
            const ew = Math.max(5, toSvg(exon.end) - ex);
            const displayNumber = strand === '-' ? totalExons - idx : idx + 1;
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
                    key={`exon-${transcript.transcriptId}-${displayNumber}`}
                    gene={symbol}
                    exon={{ ...exon, number: displayNumber }}
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

            // Exon number label below the exon block — only when highlighting is active
            if (retainedExonNumbers !== undefined) {
                elements.push(
                    <text
                        key={`exon-label-${transcript.transcriptId}-${displayNumber}`}
                        x={ex + ew / 2}
                        y={yPos + EXON_HEIGHT + EXON_LABEL_OFFSET}
                        textAnchor="middle"
                        fontSize={7}
                        fill={isRetained ? color : '#aaa'}
                        opacity={isRetained ? opacity : 0.7}
                    >
                        E{displayNumber}
                    </text>
                );
            }
        });

        const isActive = transcript.transcriptId === activeTranscriptId;

        // Inactive rows: the regular gray label above the exons.
        // Active rows show a red+white transcript-name pill instead (below).
        if (labelText && !isActive) {
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

        // Active chrome (outline, name pill, DRIVING FUSION badge) is rendered
        // once at the GeneTrack top level and animated with GSAP on change —
        // see the activeGroupRef block below. Individual rows only control
        // their own exon rendering and the gray inactive label.

        const hit = (
            <rect
                key={`hit-${transcript.transcriptId}`}
                x={drawX - ACTIVE_OUTLINE_X_PAD}
                y={yPos - ACTIVE_OUTLINE_Y_PAD}
                width={drawWidth + 2 * ACTIVE_OUTLINE_X_PAD}
                height={rowHeight}
                fill="transparent"
                style={{ pointerEvents: 'all' }}
            />
        );

        return (
            <g
                key={`row-${transcript.transcriptId}`}
                data-testid={`gene-track-row-${transcript.transcriptId}`}
                style={{
                    cursor: onActivateTranscript ? 'pointer' : 'default',
                }}
                onClick={() =>
                    onActivateTranscript &&
                    onActivateTranscript(transcript.transcriptId)
                }
            >
                {hit}
                {elements}
            </g>
        );
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

    return (
        <g>
            {/* Gene label */}
            <text
                x={drawX}
                y={labelY + LABEL_FONT_SIZE}
                fontSize={LABEL_FONT_SIZE}
                fontWeight="bold"
                fill="#333"
            >
                {symbol}
                <tspan fontSize={11} fontWeight={700} fill={color}>
                    {strandLabel}
                </tspan>
            </text>

            {/* "TRANSCRIBED" pill — direction cue D part 2.
                Sits in the existing LABEL_HEIGHT band, no layout growth.
                pillX = drawX + symbol width estimate + strand arrow width + gap. */}
            {(() => {
                const PILL_WIDTH = 92;
                const PILL_HEIGHT = 14;
                const SYMBOL_CHAR_WIDTH = 8.5; // bold 13px sans-serif estimate
                const STRAND_LABEL_WIDTH = 24;
                const PILL_GAP = 18;
                const pillX =
                    drawX +
                    symbol.length * SYMBOL_CHAR_WIDTH +
                    STRAND_LABEL_WIDTH +
                    PILL_GAP;
                return (
                    <g style={{ pointerEvents: 'none' }}>
                        <rect
                            x={pillX}
                            y={labelY + 2}
                            width={PILL_WIDTH}
                            height={PILL_HEIGHT}
                            rx={7}
                            fill={color + '1A'}
                            stroke={color}
                            strokeWidth={1}
                        />
                        <text
                            x={pillX + PILL_WIDTH / 2}
                            y={labelY + 2 + 10}
                            textAnchor="middle"
                            fontSize={9}
                            fontWeight={700}
                            fill={color}
                        >
                            {pillText}
                        </text>
                    </g>
                );
            })()}

            {/* Transcript ID label — hidden when FORTE is the active row;
                the red+white pill inside its active outline shows the name. */}
            {forteTranscript.transcriptId !== activeTranscriptId && (
                <text
                    x={drawX}
                    y={labelY + LABEL_FONT_SIZE + 13}
                    fontSize={9}
                    fill="#999"
                >
                    {forteTranscript.displayName}
                </text>
            )}

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

            {/* Upstream promoter tint — 5′ track only, gated by showPromoter */}
            {is5Prime &&
                showPromoter &&
                activeTranscript &&
                (() => {
                    const activeTSS =
                        activeTranscript.strand === '+'
                            ? activeTranscript.txStart
                            : activeTranscript.txEnd;
                    const tintGStart =
                        activeTranscript.strand === '+'
                            ? activeTSS - upstreamWindow
                            : activeTSS;
                    const tintGEnd =
                        activeTranscript.strand === '+'
                            ? activeTSS
                            : activeTSS + upstreamWindow;
                    const tintX = Math.min(toSvg(tintGStart), toSvg(tintGEnd));
                    const tintW = Math.abs(toSvg(tintGEnd) - toSvg(tintGStart));
                    if (tintW <= 0) return null;
                    const tintY = forteY + INTRON_Y_OFFSET - EXON_HEIGHT / 4;
                    return (
                        <g style={{ pointerEvents: 'none' }}>
                            <rect
                                x={tintX}
                                y={tintY}
                                width={tintW}
                                height={EXON_HEIGHT / 2}
                                fill={color}
                                fillOpacity={0.2}
                            />
                            <text
                                x={tintX + tintW / 2}
                                y={tintY + EXON_HEIGHT / 4}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize={10}
                                fontWeight={700}
                                fill={color}
                            >
                                P
                            </text>
                        </g>
                    );
                })()}

            {/* FORTE transcript */}
            {renderTranscript(
                sortedForte,
                forteTranscript,
                forteY,
                1.0,
                2,
                undefined,
                FORTE_TRACK_HEIGHT
            )}

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
                            ut.displayName,
                            USER_TRACK_HEIGHT
                        )}
                    </React.Fragment>
                );
            })}

            {/* Active-transcript chrome (dashed outline + name pill + DRIVING
                FUSION badge). Rendered once and re-positioned via GSAP when
                the active transcript changes, so the transition is smooth. */}
            {activeTranscript && activeYPos !== undefined && (
                <g ref={activeGroupRef} style={{ pointerEvents: 'none' }}>
                    <rect
                        data-testid={`gene-track-active-outline-${activeTranscript.transcriptId}`}
                        x={drawX - ACTIVE_OUTLINE_X_PAD}
                        y={-ACTIVE_OUTLINE_Y_PAD}
                        width={drawWidth + 2 * ACTIVE_OUTLINE_X_PAD}
                        height={
                            ACTIVE_OUTLINE_Y_PAD + ACTIVE_OUTLINE_CONTENT_BELOW
                        }
                        fill="none"
                        stroke={ACTIVE_COLOR}
                        strokeWidth={ACTIVE_OUTLINE_STROKE_WIDTH}
                        strokeDasharray={ACTIVE_OUTLINE_DASH}
                        rx={ACTIVE_OUTLINE_RX}
                    />
                    <g
                        data-testid={`gene-track-transcript-name-${activeTranscript.transcriptId}`}
                    >
                        <rect
                            x={drawX}
                            y={BADGE_Y_OFFSET}
                            width={NAME_PILL_WIDTH}
                            height={BADGE_HEIGHT}
                            rx={2}
                            fill={ACTIVE_COLOR}
                        />
                        <text
                            x={drawX + NAME_PILL_WIDTH / 2}
                            y={BADGE_Y_OFFSET + BADGE_TEXT_Y_OFFSET}
                            textAnchor="middle"
                            fontSize={8}
                            fontWeight={700}
                            fill="#fff"
                        >
                            {activeTranscript.displayName}
                        </text>
                    </g>
                    <g
                        data-testid={`gene-track-badge-${activeTranscript.transcriptId}`}
                    >
                        <rect
                            x={Math.max(drawX, drawX + drawWidth - BADGE_WIDTH)}
                            y={BADGE_Y_OFFSET}
                            width={BADGE_WIDTH}
                            height={BADGE_HEIGHT}
                            rx={2}
                            fill={ACTIVE_COLOR}
                        />
                        <text
                            x={
                                Math.max(
                                    drawX,
                                    drawX + drawWidth - BADGE_WIDTH
                                ) +
                                BADGE_WIDTH / 2
                            }
                            y={BADGE_Y_OFFSET + BADGE_TEXT_Y_OFFSET}
                            textAnchor="middle"
                            fontSize={8}
                            fontWeight={700}
                            fill="#fff"
                        >
                            {BADGE_LABEL}
                        </text>
                    </g>
                </g>
            )}

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

            {/* 5′ / 3′ end caps — direction cue C.
                Anchored to the outermost exon extents across all rendered
                transcripts so they don't reflow when the active transcript
                changes. Vertically centered on the FORTE row's intron line. */}
            <text
                x={outerLeft - 4}
                y={forteY + INTRON_Y_OFFSET + 3}
                textAnchor="end"
                fontSize={10}
                fontWeight={700}
                fill="#333"
            >
                {pointsRight ? '5′' : '3′'}
            </text>
            <text
                x={outerRight + 4}
                y={forteY + INTRON_Y_OFFSET + 3}
                textAnchor="start"
                fontSize={10}
                fontWeight={700}
                fill="#333"
            >
                {pointsRight ? '3′' : '5′'}
            </text>
        </g>
    );
};
