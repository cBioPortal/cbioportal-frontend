import * as React from 'react';
import {
    genomicToSvgX,
    computeGeneTrackRange,
    applyUpstreamExtension,
} from './GeneTrack';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData, COLOR_5PRIME } from '../data/types';

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

// ---------------------------------------------------------------------------
// Feature-binned model (STEP 1)
// ---------------------------------------------------------------------------

export type FeatureKind = 'promoter' | 'exon' | 'intron' | 'downstream';

export interface Feature {
    kind: FeatureKind;
    /** Short display label, e.g. 'E13', 'P', or an intron label. */
    label: string;
    /** Exon number, present only on exon features. */
    number?: number;
    /** Number of breakpoints assigned to this feature. */
    count: number;
    /** Indices (into the input breakpoints array) assigned to this feature. */
    members: number[];
    /** Genomic span (inclusive lower/upper coords, regardless of strand). */
    gStart: number;
    gEnd: number;
}

export interface FeatureAssignment {
    /** Features in transcription (5′→3′) order. */
    features: Feature[];
    /** Breakpoints farther than `slop` outside the transcript span. */
    offTranscript: number;
}

/**
 * Build the reference transcript's biological features (promoter, each exon,
 * each intron, a 3′ downstream bucket) in transcription (5′→3′) order and
 * assign each genomic breakpoint to the feature it falls in.
 *
 * Binning GENOMIC breakpoint coordinates into one reference's feature intervals
 * is deliberate: per-sample isoform differences are irrelevant, because every
 * breakpoint is measured against the same MSK/forte-selected transcript.
 *
 * Strand handling: for the '+' strand 5′ is the lower coordinate; for '-' it is
 * the higher coordinate. Features are emitted in transcription order, which for
 * '-' strand is descending genomic coordinate.
 *
 * A breakpoint p is assigned to:
 *  - the exon whose [start,end] contains p;
 *  - the intron strictly between two consecutive exons;
 *  - the promoter if it is 5′-of the first exon but within `slop`;
 *  - downstream if it is 3′-of the last exon but within `slop`;
 *  - otherwise counted in `offTranscript` (not placed) if farther than `slop`
 *    outside [txStart-slop, txEnd+slop] — preserving the build-mismatch signal.
 *
 * NOTE: for the 3′ partner gene the 'promoter' bucket is biologically weaker
 * (a 3′ partner does not contribute its own promoter to the fusion), but the
 * geometry is generic: it is simply the within-slop region 5′ of the first
 * exon. Callers may relabel or ignore it; here it stays uniform across tracks.
 */
export function assignBreakpointsToFeatures(
    transcript: TranscriptData,
    breakpoints: number[],
    slop = 20000
): FeatureAssignment {
    const { strand, exons, txStart, txEnd } = transcript;

    // Exons in transcription order (same strand logic as retainedExonsInOrder).
    const ordered = [...exons].sort((a, b) =>
        strand === '-' ? b.start - a.start : a.start - b.start
    );

    const features: Feature[] = [];

    // Genomic 5′/3′ ends of the transcript span.
    const fivePrimeEnd = strand === '+' ? txStart : txEnd;
    const threePrimeEnd = strand === '+' ? txEnd : txStart;

    // Promoter: within-slop region 5′ of the transcript's 5′ end.
    const promoter: Feature =
        strand === '+'
            ? {
                  kind: 'promoter',
                  label: 'P',
                  count: 0,
                  members: [],
                  gStart: fivePrimeEnd - slop,
                  gEnd: fivePrimeEnd,
              }
            : {
                  kind: 'promoter',
                  label: 'P',
                  count: 0,
                  members: [],
                  gStart: fivePrimeEnd,
                  gEnd: fivePrimeEnd + slop,
              };
    features.push(promoter);

    // Exons interleaved with introns, in transcription order.
    const exonFeatures: Feature[] = [];
    ordered.forEach((e, i) => {
        const exonFeature: Feature = {
            kind: 'exon',
            label: `E${e.number}`,
            number: e.number,
            count: 0,
            members: [],
            gStart: Math.min(e.start, e.end),
            gEnd: Math.max(e.start, e.end),
        };
        exonFeatures.push(exonFeature);
        features.push(exonFeature);

        // Intron between this exon and the next (genomic gap), if any.
        if (i < ordered.length - 1) {
            const next = ordered[i + 1];
            const lo = Math.min(e.start, e.end, next.start, next.end);
            const hi = Math.max(e.start, e.end, next.start, next.end);
            // The intron gap sits strictly between the two exon bodies.
            const gapLo = Math.max(
                Math.min(e.start, e.end),
                Math.min(next.start, next.end)
            );
            const gapHi = Math.min(
                Math.max(e.start, e.end),
                Math.max(next.start, next.end)
            );
            features.push({
                kind: 'intron',
                label: `${e.number}-${next.number}`,
                count: 0,
                members: [],
                gStart: Math.min(gapLo, gapHi),
                gEnd: Math.max(gapLo, gapHi),
            });
            // lo/hi retained for readability; not used further.
            void lo;
            void hi;
        }
    });

    // Downstream: within-slop region 3′ of the transcript's 3′ end.
    const downstream: Feature =
        strand === '+'
            ? {
                  kind: 'downstream',
                  label: '▸',
                  count: 0,
                  members: [],
                  gStart: threePrimeEnd,
                  gEnd: threePrimeEnd + slop,
              }
            : {
                  kind: 'downstream',
                  label: '▸',
                  count: 0,
                  members: [],
                  gStart: threePrimeEnd - slop,
                  gEnd: threePrimeEnd,
              };
    features.push(downstream);

    const spanLo = Math.min(txStart, txEnd);
    const spanHi = Math.max(txStart, txEnd);

    let offTranscript = 0;
    // Record breakpoint index `i` as a member of `feature` (for click→sample
    // mapping) and bump its count.
    const hit = (feature: Feature, i: number) => {
        feature.count += 1;
        feature.members.push(i);
    };
    breakpoints.forEach((p, i) => {
        if (p === null || p === undefined || Number.isNaN(p)) return;

        // Far outside the transcript span (with slop) → build-mismatch signal.
        if (p < spanLo - slop || p > spanHi + slop) {
            offTranscript += 1;
            return;
        }

        // Inside an exon?
        const hitExon = exonFeatures.find(f => p >= f.gStart && p <= f.gEnd);
        if (hitExon) {
            hit(hitExon, i);
            return;
        }

        // Inside the transcript body (between exons) → the containing intron.
        const hitIntron = features.find(
            f => f.kind === 'intron' && p >= f.gStart && p <= f.gEnd
        );
        if (hitIntron) {
            hit(hitIntron, i);
            return;
        }

        // 5′-of the first exon but within slop → promoter.
        // 3′-of the last exon but within slop → downstream.
        if (p >= promoter.gStart && p <= promoter.gEnd) {
            hit(promoter, i);
            return;
        }
        if (p >= downstream.gStart && p <= downstream.gEnd) {
            hit(downstream, i);
            return;
        }

        // Within the span+slop but not inside any feature interval (e.g. a gap
        // between txStart/txEnd and the first/last exon that is not covered by
        // promoter/downstream because it lies inside the span). Attribute to the
        // nearest flanking bucket rather than dropping it.
        const distToFivePrime = Math.abs(p - fivePrimeEnd);
        const distToThreePrime = Math.abs(p - threePrimeEnd);
        if (distToFivePrime <= distToThreePrime) {
            hit(promoter, i);
        } else {
            hit(downstream, i);
        }
    });

    return { features, offTranscript };
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

const EXON_H = 12;
const TRACK_Y = 124;
const HIST_BASELINE = TRACK_Y - 8;
const HIST_MAX_H = 96;
const BIN_PX = 6;
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
    const refPos =
        (transcript.txStart + transcript.txEnd) / 2 ||
        (exons.length ? exons[0].start : transcript.txStart);
    const base = computeGeneTrackRange(exons, refPos);

    const offTranscript = breakpoints.filter(
        p =>
            p < transcript.txStart - OFF_TRANSCRIPT_SLOP ||
            p > transcript.txEnd + OFF_TRANSCRIPT_SLOP
    ).length;
    const { gMin, gMax } = applyUpstreamExtension(
        base.gMin,
        base.gMax,
        strand,
        exons
    );
    const toX = (g: number) =>
        genomicToSvgX(g, gMin, gMax, drawX, drawW, strand);

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
