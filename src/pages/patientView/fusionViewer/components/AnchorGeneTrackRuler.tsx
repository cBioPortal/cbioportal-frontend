import * as React from 'react';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData, COLOR_5PRIME } from '../data/types';
import {
    assignBreakpointsToFeatures,
    Feature,
    genomicProjection,
    TRACK_Y,
    EXON_H,
    HIST_BASELINE,
    HIST_MAX_H,
    BIN_PX,
} from '../data/trackGeometry';

export {
    assignBreakpointsToFeatures,
    Feature,
    FeatureKind,
    FeatureAssignment,
} from '../data/trackGeometry';

export interface AnchorGeneTrackRulerProps {
    transcript: TranscriptData;
    symbol: string;
    /** Genomic breakpoint positions to bin into the density histogram. */
    breakpoints: number[];
    /** Left edge and width of the drawable region for this gene. */
    drawX: number;
    drawW: number;
    /** Where the gene-symbol label + max-count tick sit, and their anchoring. */
    labelX: number;
    labelAnchor: 'start' | 'end';
    /** Exon fill (defaults to the 5′ colour). */
    fill?: string;
    /**
     * 'feature' (default) bins breakpoints into the reference transcript's
     * biological features (promoter/exons/introns/downstream) laid out in even
     * slots. 'genomic' keeps the legacy fixed-pixel binning at genomic scale.
     */
    mode?: 'feature' | 'genomic';
    /** Optional chromosome, used only to prefix genomic spans in tooltips. */
    chromosome?: string;
    /**
     * Invoked when a histogram bar is clicked. `members` are indices into the
     * `breakpoints` array (i.e. into the caller's row list) that fall in the
     * clicked bar; `label` is the bar's display label. When set, bars render
     * with a pointer cursor and hover highlight.
     */
    onSelectBar?: (selection: { members: number[]; label: string }) => void;
}

export interface BreakpointBin {
    /** Left-edge x (px) of the bin. */
    x: number;
    /** Number of samples whose breakpoint falls in the bin. */
    count: number;
    /** Indices (into the input `xs`/breakpoints array) contributing to the bin. */
    members: number[];
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
    const members = new Map<number, number[]>();
    xs.forEach((x, i) => {
        if (x < drawX || x > drawX + drawW) return;
        const idx = Math.min(lastBin, Math.floor((x - drawX) / binPx));
        const list = members.get(idx) ?? [];
        list.push(i);
        members.set(idx, list);
    });
    return Array.from(members.entries())
        .map(([idx, list]) => ({
            x: drawX + idx * binPx,
            count: list.length,
            members: list,
        }))
        .sort((a, b) => a.x - b.x);
}

// Exon-number labels are drawn just below the gene body. At genomic scale most
// exons are only 1–2px wide, so we label by horizontal SPACING between exon
// centers (skipping crowded ones) rather than by exon width.
const EXON_LABEL_Y = TRACK_Y + EXON_H + 11;
const EXON_LABEL_GAP = 14;
// Breakpoints farther than this outside [txStart, txEnd] are flagged as
// off-transcript — a whole track off-range usually means a genome-build
// mismatch upstream.
const OFF_TRANSCRIPT_SLOP = 20000;

export function getAnchorTrackHeight(_rows: ComparisonRow[]): number {
    return TRACK_Y + EXON_H + 30;
}

// Y-axis for a breakpoint histogram: an axis line with 0 and max ticks plus a
// rotated "breakpoints" title, drawn on the label (outer) side. Each gene's
// histogram is scaled to its own max, so heights aren't comparable across genes.
const HistogramYAxis: React.FC<{
    maxCount: number;
    symbol: string;
    drawX: number;
    drawW: number;
    labelX: number;
    labelAnchor: 'start' | 'end';
}> = ({ maxCount, symbol, drawX, drawW, labelX, labelAnchor }) => {
    const top = HIST_BASELINE - HIST_MAX_H;
    // Axis sits on the outer (label) edge of the histogram region.
    const axisX = labelAnchor === 'end' ? drawX : drawX + drawW;
    const titleX = labelAnchor === 'end' ? labelX - 12 : labelX + 12;
    const titleY = (HIST_BASELINE + top) / 2;
    return (
        <g>
            <line
                x1={axisX}
                y1={top}
                x2={axisX}
                y2={HIST_BASELINE}
                stroke="#ddd"
                strokeWidth={1}
            />
            <text
                data-testid="histogram-max"
                x={labelX}
                y={top + 8}
                textAnchor={labelAnchor}
                fontSize={10}
                fill="#999"
                style={{ cursor: 'help' }}
            >
                {maxCount}
                <title>
                    Tallest bar = {maxCount} breakpoints — the y-axis maximum
                    for {symbol}. Each gene&apos;s histogram is scaled to its
                    own max, so bar heights are not comparable between the two
                    genes.
                </title>
            </text>
            <text
                x={labelX}
                y={HIST_BASELINE + 1}
                textAnchor={labelAnchor}
                fontSize={9}
                fill="#bbb"
            >
                0
            </text>
            <text
                x={titleX}
                y={titleY}
                textAnchor="middle"
                transform={`rotate(-90 ${titleX} ${titleY})`}
                fontSize={9}
                fill="#999"
            >
                breakpoints
            </text>
        </g>
    );
};

/**
 * Gene-symbol label + the ⚠ off-transcript indicator, shared by both render
 * modes. `offTranscript` is supplied by the caller (feature mode gets it from
 * the helper; genomic mode computes it the legacy way).
 */
const GeneLabelAndWarning: React.FC<{
    symbol: string;
    strand: '+' | '-';
    transcriptId: string;
    labelX: number;
    labelAnchor: 'start' | 'end';
    offTranscript: number;
    totalBreakpoints: number;
}> = ({
    symbol,
    strand,
    transcriptId,
    labelX,
    labelAnchor,
    offTranscript,
    totalBreakpoints,
}) => (
    <>
        <text
            x={labelX}
            y={TRACK_Y + EXON_H / 2 + 4}
            textAnchor={labelAnchor}
            fontSize={13}
            fontWeight="bold"
            fill="#333"
        >
            {symbol} ({strand})
        </text>
        {offTranscript > 0 && (
            <text
                data-testid="off-transcript"
                x={labelX}
                y={TRACK_Y + EXON_H / 2 + 18}
                textAnchor={labelAnchor}
                fontSize={9}
                fill="#b06a00"
                style={{ cursor: 'help' }}
            >
                ⚠ {offTranscript} off-transcript
                <title>
                    {offTranscript} of {totalBreakpoints} breakpoints fall
                    outside {symbol}&apos;s displayed transcript ({transcriptId}
                    ), by more than {OFF_TRANSCRIPT_SLOP.toLocaleString()} bp.
                    Usually these break in a region not covered by this isoform
                    (a different intron/isoform); a genome-build mismatch
                    between the breakpoints and the transcript would put most or
                    all of them off-transcript. They are omitted from the
                    histogram.
                </title>
            </text>
        )}
    </>
);

/**
 * Legacy genomic-scale render: fixed-pixel bins + to-scale exon rects. Retained
 * intact behind `mode === 'genomic'` so a future UI toggle is trivial.
 */
const GenomicBody: React.FC<AnchorGeneTrackRulerProps> = ({
    transcript,
    symbol,
    breakpoints,
    drawX,
    drawW,
    labelX,
    labelAnchor,
    fill = COLOR_5PRIME,
    onSelectBar,
}) => {
    const { strand, exons } = transcript;
    const offTranscript = breakpoints.filter(
        p =>
            p < transcript.txStart - OFF_TRANSCRIPT_SLOP ||
            p > transcript.txEnd + OFF_TRANSCRIPT_SLOP
    ).length;
    const toX = genomicProjection(transcript, drawX, drawW);

    const bins = binBreakpointsByPixel(
        breakpoints.map(toX),
        drawX,
        drawW,
        BIN_PX
    );
    const maxCount = bins.reduce((m, b) => Math.max(m, b.count), 1);

    const exonGeo = exons.map((e, i) => {
        const x = Math.min(toX(e.start), toX(e.end));
        const w = Math.max(2, Math.abs(toX(e.end) - toX(e.start)));
        return { e, i, x, w, cx: x + w / 2 };
    });
    const labeledExons = new Set<number>();
    let lastLabelCx = -Infinity;
    [...exonGeo]
        .sort((a, b) => a.cx - b.cx)
        .forEach(g => {
            if (g.cx - lastLabelCx >= EXON_LABEL_GAP) {
                labeledExons.add(g.i);
                lastLabelCx = g.cx;
            }
        });

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
                        fill={fill}
                        opacity={0.85}
                        style={onSelectBar ? { cursor: 'pointer' } : undefined}
                        onClick={
                            onSelectBar
                                ? () =>
                                      onSelectBar({
                                          members: bin.members,
                                          label: `${bin.count} breakpoints`,
                                      })
                                : undefined
                        }
                        onMouseOver={
                            onSelectBar
                                ? e => (e.currentTarget.style.opacity = '1')
                                : undefined
                        }
                        onMouseOut={
                            onSelectBar
                                ? e => (e.currentTarget.style.opacity = '0.85')
                                : undefined
                        }
                    >
                        <title>
                            {bin.count} breakpoints here
                            {onSelectBar ? ' · click to filter cohort' : ''}
                        </title>
                    </rect>
                );
            })}
            {/* histogram y-axis */}
            <HistogramYAxis
                maxCount={maxCount}
                symbol={symbol}
                drawX={drawX}
                drawW={drawW}
                labelX={labelX}
                labelAnchor={labelAnchor}
            />
            <line
                x1={drawX}
                y1={HIST_BASELINE}
                x2={drawX + drawW}
                y2={HIST_BASELINE}
                stroke="#e0e0e0"
                strokeWidth={1}
            />
            {/* gene body: exons */}
            {exonGeo.map(({ e, i, x, w, cx }) => (
                <g key={i}>
                    <rect
                        x={x}
                        y={TRACK_Y}
                        width={w}
                        height={EXON_H}
                        rx={1}
                        fill={fill}
                    >
                        <title>Exon {e.number}</title>
                    </rect>
                    {labeledExons.has(i) && (
                        <text
                            data-testid="exon-number"
                            x={cx}
                            y={EXON_LABEL_Y}
                            textAnchor="middle"
                            fontSize={9}
                            fill="#888"
                        >
                            E{e.number}
                        </text>
                    )}
                </g>
            ))}
            <GeneLabelAndWarning
                symbol={symbol}
                strand={strand}
                transcriptId={transcript.transcriptId}
                labelX={labelX}
                labelAnchor={labelAnchor}
                offTranscript={offTranscript}
                totalBreakpoints={breakpoints.length}
            />
        </g>
    );
};

// Muted tone for intron connectors / weak markers in feature mode.
const INTRON_TONE = '#c9c9c9';

/**
 * Feature-binned render: one equal-width slot per biological feature of the
 * reference transcript (promoter, exons, introns, downstream) in 5′→3′ order.
 * Bars encode breakpoint counts per feature; a schematic gene body sits beneath.
 */
const FeatureBody: React.FC<AnchorGeneTrackRulerProps> = ({
    transcript,
    symbol,
    breakpoints,
    drawX,
    drawW,
    labelX,
    labelAnchor,
    fill = COLOR_5PRIME,
    chromosome,
    onSelectBar,
}) => {
    const { strand } = transcript;
    const { features, offTranscript } = assignBreakpointsToFeatures(
        transcript,
        breakpoints
    );

    const maxCount = features.reduce((m, f) => Math.max(m, f.count), 1);
    const slotW = features.length ? drawW / features.length : drawW;
    // Small inset so adjacent bars/boxes read as separate.
    const barPad = Math.min(2, slotW * 0.15);

    const spanLabel = (f: Feature) => {
        const chr = chromosome ? `${chromosome}:` : '';
        return `${chr}${f.gStart.toLocaleString()}–${f.gEnd.toLocaleString()}`;
    };

    return (
        <g data-testid="anchor-track">
            {/* histogram y-axis */}
            <HistogramYAxis
                maxCount={maxCount}
                symbol={symbol}
                drawX={drawX}
                drawW={drawW}
                labelX={labelX}
                labelAnchor={labelAnchor}
            />
            <line
                x1={drawX}
                y1={HIST_BASELINE}
                x2={drawX + drawW}
                y2={HIST_BASELINE}
                stroke="#e0e0e0"
                strokeWidth={1}
            />
            {features.map((f, i) => {
                const slotX = drawX + i * slotW;
                const h = (f.count / maxCount) * HIST_MAX_H;
                const barColor = f.kind === 'exon' ? fill : INTRON_TONE;
                return (
                    <g key={`${f.kind}-${f.label}-${i}`}>
                        {/* bar (only when this feature holds ≥1 breakpoint) */}
                        {f.count > 0 && (
                            <rect
                                data-testid="feature-bar"
                                x={slotX + barPad}
                                y={HIST_BASELINE - h}
                                width={Math.max(1, slotW - barPad * 2)}
                                height={h}
                                fill={barColor}
                                opacity={0.85}
                                style={
                                    onSelectBar
                                        ? { cursor: 'pointer' }
                                        : undefined
                                }
                                onClick={
                                    onSelectBar
                                        ? () =>
                                              onSelectBar({
                                                  members: f.members,
                                                  label: f.label,
                                              })
                                        : undefined
                                }
                                onMouseOver={
                                    onSelectBar
                                        ? e =>
                                              (e.currentTarget.style.opacity =
                                                  '1')
                                        : undefined
                                }
                                onMouseOut={
                                    onSelectBar
                                        ? e =>
                                              (e.currentTarget.style.opacity =
                                                  '0.85')
                                        : undefined
                                }
                            >
                                <title>
                                    {f.label} · {f.count} breakpoints ·{' '}
                                    {spanLabel(f)}
                                    {onSelectBar
                                        ? ' · click to filter cohort'
                                        : ''}
                                </title>
                            </rect>
                        )}
                    </g>
                );
            })}
            {/* schematic gene body: one glyph per feature slot */}
            {features.map((f, i) => {
                const slotX = drawX + i * slotW;
                const cx = slotX + slotW / 2;
                if (f.kind === 'exon') {
                    return (
                        <g key={`body-${i}`}>
                            <rect
                                data-testid="feature-exon"
                                x={slotX + barPad}
                                y={TRACK_Y}
                                width={Math.max(1, slotW - barPad * 2)}
                                height={EXON_H}
                                rx={1}
                                fill={fill}
                            >
                                <title>
                                    {f.label} · {spanLabel(f)}
                                </title>
                            </rect>
                            <text
                                data-testid="exon-number"
                                x={cx}
                                y={EXON_LABEL_Y}
                                textAnchor="middle"
                                fontSize={9}
                                fill="#888"
                            >
                                {f.label}
                            </text>
                        </g>
                    );
                }
                if (f.kind === 'intron') {
                    // Thin connector line centered in the slot.
                    return (
                        <line
                            key={`body-${i}`}
                            data-testid="feature-intron"
                            x1={slotX}
                            y1={TRACK_Y + EXON_H / 2}
                            x2={slotX + slotW}
                            y2={TRACK_Y + EXON_H / 2}
                            stroke={INTRON_TONE}
                            strokeWidth={2}
                        >
                            <title>
                                intron {f.label} · {spanLabel(f)}
                            </title>
                        </line>
                    );
                }
                // promoter (5′) / downstream (3′): small distinct marker + label.
                const isPromoter = f.kind === 'promoter';
                return (
                    <g key={`body-${i}`}>
                        <rect
                            data-testid={
                                isPromoter
                                    ? 'feature-promoter'
                                    : 'feature-downstream'
                            }
                            x={slotX + slotW * 0.3}
                            y={TRACK_Y + 2}
                            width={Math.max(2, slotW * 0.4)}
                            height={EXON_H - 4}
                            rx={1}
                            fill={INTRON_TONE}
                            opacity={isPromoter ? 0.9 : 0.6}
                        >
                            <title>
                                {isPromoter ? 'promoter' : 'downstream'} ·{' '}
                                {spanLabel(f)}
                            </title>
                        </rect>
                        {isPromoter && (
                            <text
                                x={cx}
                                y={EXON_LABEL_Y}
                                textAnchor="middle"
                                fontSize={9}
                                fill="#888"
                            >
                                P
                            </text>
                        )}
                    </g>
                );
            })}
            <GeneLabelAndWarning
                symbol={symbol}
                strand={strand}
                transcriptId={transcript.transcriptId}
                labelX={labelX}
                labelAnchor={labelAnchor}
                offTranscript={offTranscript}
                totalBreakpoints={breakpoints.length}
            />
        </g>
    );
};

const AnchorGeneTrackRuler: React.FC<AnchorGeneTrackRulerProps> = props => {
    const { mode = 'feature' } = props;
    return mode === 'genomic' ? (
        <GenomicBody {...props} />
    ) : (
        <FeatureBody {...props} />
    );
};

export default AnchorGeneTrackRuler;
