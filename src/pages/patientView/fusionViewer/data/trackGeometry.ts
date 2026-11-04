import { TranscriptData } from './types';
import {
    genomicToSvgX,
    computeGeneTrackRange,
    applyUpstreamExtension,
} from '../components/GeneTrack';

// Shared vertical layout of the anchor track.
export const TRACK_Y = 124;
export const EXON_H = 12;
export const HIST_BASELINE = TRACK_Y - 8;
export const HIST_MAX_H = 96;
export const BIN_PX = 6;

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
    const plus = strand === '+';
    const promoter: Feature = {
        kind: 'promoter',
        label: 'P',
        count: 0,
        members: [],
        gStart: plus ? fivePrimeEnd - slop : fivePrimeEnd,
        gEnd: plus ? fivePrimeEnd : fivePrimeEnd + slop,
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
        }
    });

    // Downstream: within-slop region 3′ of the transcript's 3′ end.
    const downstream: Feature = {
        kind: 'downstream',
        label: '▸',
        count: 0,
        members: [],
        gStart: plus ? threePrimeEnd : threePrimeEnd - slop,
        gEnd: plus ? threePrimeEnd + slop : threePrimeEnd,
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

export const featureSlotKey = (f: Feature): string => `${f.kind}:${f.label}`;

export interface TrackSlot {
    key: string;
    /** Slot centre (px). */
    x: number;
    width: number;
    span?: { gStart: number; gEnd: number };
}

export interface TrackLayout {
    slots: TrackSlot[];
    /** Slot per breakpoint (index-aligned); undefined when off-track. */
    assign(breakpoints: (number | null)[]): (TrackSlot | undefined)[];
}

/** Genomic → x for the legacy genomic-scale track (was inline in GenomicBody). */
export function genomicProjection(
    transcript: TranscriptData,
    drawX: number,
    drawW: number
): (g: number) => number {
    const { strand, exons } = transcript;
    const refPos =
        (transcript.txStart + transcript.txEnd) / 2 ||
        (exons.length ? exons[0].start : transcript.txStart);
    const base = computeGeneTrackRange(exons, refPos);
    const { gMin, gMax } = applyUpstreamExtension(
        base.gMin,
        base.gMax,
        strand,
        exons
    );
    return (g: number) => genomicToSvgX(g, gMin, gMax, drawX, drawW, strand);
}

/** Even slots per feature (promoter, exons, introns, downstream). */
export function featureSlotLayout(
    transcript: TranscriptData,
    drawX: number,
    drawW: number
): TrackLayout {
    const { features } = assignBreakpointsToFeatures(transcript, []);
    const slotW = features.length ? drawW / features.length : drawW;
    const slots = features.map((f, i) => ({
        key: featureSlotKey(f),
        x: drawX + i * slotW + slotW / 2,
        width: slotW,
        span: { gStart: f.gStart, gEnd: f.gEnd },
    }));
    return {
        slots,
        assign: breakpoints => {
            const out = breakpoints.map<TrackSlot | undefined>(() => undefined);
            const { features: hit } = assignBreakpointsToFeatures(
                transcript,
                breakpoints.map(b => (b === null ? NaN : b))
            );
            hit.forEach((f, i) =>
                f.members.forEach(m => {
                    out[m] = slots[i];
                })
            );
            return out;
        },
    };
}

/** Fixed-pixel bins at genomic scale (same binning as binBreakpointsByPixel). */
export function pixelBinLayout(
    transcript: TranscriptData,
    drawX: number,
    drawW: number,
    binPx: number = BIN_PX
): TrackLayout {
    const toX = genomicProjection(transcript, drawX, drawW);
    const lastBin = Math.max(0, Math.floor(drawW / binPx));
    const slots = Array.from({ length: lastBin + 1 }, (_, i) => ({
        key: `bin:${i}`,
        x: drawX + i * binPx + binPx / 2,
        width: binPx,
    }));
    return {
        slots,
        assign: breakpoints =>
            breakpoints.map(bp => {
                if (bp === null || Number.isNaN(bp)) return undefined;
                const x = toX(bp);
                if (x < drawX || x > drawX + drawW) return undefined;
                return slots[
                    Math.min(lastBin, Math.floor((x - drawX) / binPx))
                ];
            }),
    };
}
