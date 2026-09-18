import * as React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
    TranscriptData,
    GenePartner,
    COLOR_5PRIME,
    COLOR_3PRIME,
} from '../data/types';
import { FrameStatus, FrameStatusDisplay } from '../data/frameStatus';
import {
    PRODUCT_HEIGHT,
    computeFusionExonLayout,
    retainedExonsInOrder,
} from './fusionProductHelpers';
import { splitExonByFivePrimeUtr } from './GeneTrack';
export { computeJunctionX } from './fusionProductHelpers';

const LABEL_BELOW = 14;
const PADDING_TOP = 6;
const PADDING_BOTTOM = 30; // room for exon labels below the product
const TWEEN_DURATION = 0.35;
const TWEEN_EASE = 'power2.out';

export function getFusionProductHeight(): number {
    return PADDING_TOP + PRODUCT_HEIGHT + PADDING_BOTTOM;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface FusionProductProps {
    gene1: GenePartner;
    gene2: GenePartner | null;
    forteTranscript5p: TranscriptData;
    forteTranscript3p?: TranscriptData;
    x: number;
    y: number;
    width: number;
    /**
     * Resolved frame status for the fusion junction glyph.
     * When omitted or Unknown the neutral colour is used.
     */
    frameStatus?: FrameStatusDisplay;
    /**
     * Genomic breakpoints used to select retained exons. Default to the gene
     * partner positions; the caller overrides them for intragenic duplications
     * (swapped so the duplicated segment renders twice). See FusionDiagramSVG.
     */
    breakpoint5p?: number;
    breakpoint3p?: number;
}

interface ExonSlot {
    key: string; // stable per side + index, e.g. "5p-0"
    side: '5p' | '3p';
    x: number;
    width: number;
    labelText: string;
    fill: string;
    /** True when the retained exon is entirely 5′UTR (non-coding) — drawn
     *  half-height so it reads as transcribed-but-not-translated. */
    isUtr: boolean;
}

interface ProductLayout {
    slots: ExonSlot[];
    junctionX: number;
    junctionY: number;
    startX: number;
    trailingX: number;
    topY: number;
}

function computeLayout(
    gene1: GenePartner,
    gene2: GenePartner | null,
    forteTranscript5p: TranscriptData,
    forteTranscript3p: TranscriptData | undefined,
    x: number,
    y: number,
    width: number,
    breakpoint5p?: number,
    breakpoint3p?: number
): ProductLayout | null {
    if (!gene2 || !forteTranscript3p) return null;

    const buildDisplayMap = (
        exons: typeof forteTranscript5p.exons,
        strand: '+' | '-'
    ) => {
        const sortedByStart = [...exons].sort((a, b) => a.start - b.start);
        const total = sortedByStart.length;
        const map = new Map<string, number>();
        sortedByStart.forEach((e, idx) => {
            map.set(
                `${e.start}-${e.end}`,
                strand === '-' ? total - idx : idx + 1
            );
        });
        return map;
    };

    const displayNum5p = buildDisplayMap(
        forteTranscript5p.exons,
        forteTranscript5p.strand
    );
    const displayNum3p = buildDisplayMap(
        forteTranscript3p.exons,
        forteTranscript3p.strand
    );

    const retained5p = retainedExonsInOrder(
        forteTranscript5p,
        breakpoint5p ?? gene1.position,
        true
    );
    const retained3p = retainedExonsInOrder(
        forteTranscript3p,
        breakpoint3p ?? gene2.position,
        false
    );

    const total5p = retained5p.length;
    const total3p = retained3p.length;
    const totalExons = total5p + total3p;
    if (totalExons === 0) return null;

    const {
        widths5p,
        widths3p,
        xs5p,
        xs3p,
        startX,
        junctionX,
    } = computeFusionExonLayout(retained5p, retained3p, x, width);
    const topY = y + PADDING_TOP;
    const junctionY = topY + PRODUCT_HEIGHT / 2;

    const slots: ExonSlot[] = [];
    // An exon is "UTR" in the product when its retained span is entirely
    // 5′UTR (no coding) — same rule as the gene track's half-height UTRs.
    const exonIsAllUtr = (
        exon: { start: number; end: number },
        utrs: TranscriptData['utrs']
    ): boolean => {
        const segs = splitExonByFivePrimeUtr(exon, utrs || []);
        return segs.length > 0 && segs.every(s => s.isUtr);
    };

    retained5p.forEach((exon, i) => {
        const displayN =
            displayNum5p.get(`${exon.start}-${exon.end}`) ?? exon.number;
        slots.push({
            key: `5p-${i}`,
            side: '5p',
            x: xs5p[i],
            width: widths5p[i],
            labelText: `E${displayN}`,
            fill: COLOR_5PRIME,
            isUtr: exonIsAllUtr(exon, forteTranscript5p.utrs),
        });
    });

    retained3p.forEach((exon, i) => {
        const displayN =
            displayNum3p.get(`${exon.start}-${exon.end}`) ?? exon.number;
        slots.push({
            key: `3p-${i}`,
            side: '3p',
            x: xs3p[i],
            width: widths3p[i],
            labelText: `E${displayN}`,
            fill: COLOR_3PRIME,
            isUtr: exonIsAllUtr(exon, forteTranscript3p.utrs),
        });
    });

    // Right edge of the last drawn block (3′ if present, else 5′).
    const lastRight = (xs: number[], widths: number[]): number =>
        xs.length > 0 ? xs[xs.length - 1] + widths[widths.length - 1] : startX;
    const trailingX =
        xs3p.length > 0 ? lastRight(xs3p, widths3p) : lastRight(xs5p, widths5p);

    return {
        slots,
        junctionX,
        junctionY,
        startX,
        trailingX,
        topY,
    };
}

// ---------------------------------------------------------------------------
// Junction glyph
// ---------------------------------------------------------------------------

/** Half-size of the junction mark — must stay within the JUNCTION_GAP reserve. */
const GLYPH_R = 3;

/**
 * Render a small SVG mark at the fusion junction.
 *
 * - InFrame: filled green circle — the two reading frames merge cleanly.
 * - OutOfFrame: two short diagonal "break" strokes in out-of-frame red,
 *   plus a short vertical stop tick immediately to the 3′ side.
 * - Unknown / absent: neutral filled diamond (original appearance).
 *
 * All glyphs are sized within ±GLYPH_R px of junctionX so exon layout
 * math (computeLayout) is unaffected.
 */
function renderJunctionGlyph(
    junctionX: number,
    junctionY: number,
    frame: FrameStatusDisplay | undefined
): React.ReactElement {
    const status = frame?.status ?? FrameStatus.Unknown;

    if (status === FrameStatus.InFrame) {
        // Visual marker only. The frame-effect disclosure (and the caveat that
        // it is a caller annotation against the canonical transcript) lives on
        // the info-bar badge, which uses the cBioPortal DefaultTooltip.
        return (
            <circle
                cx={junctionX}
                cy={junctionY}
                r={GLYPH_R}
                fill={frame!.color}
            />
        );
    }

    if (status === FrameStatus.OutOfFrame) {
        const color = frame!.color;
        const r = GLYPH_R;
        // The composite mark is the two break strokes plus a stop tick on the
        // 3′ side, so its visual weight leans right of junctionX. Shift the
        // whole group ~2px toward the 5′ side so it sits centred in the wider
        // junction gap instead of crowding the first 3′ exon.
        const cx = junctionX - 2;
        // Two diagonal break strokes centred at cx.
        // Stroke 1: top-left to mid (/) ; Stroke 2: mid to bottom-right (/).
        const x1 = cx - r;
        const x2 = cx;
        const x3 = cx + r;
        const yTop = junctionY - r;
        const yMid = junctionY;
        const yBot = junctionY + r;
        // Stop tick: short vertical bar just to the 3′ side of the break.
        const tickX = cx + r + 2;
        // Visual marker only — see the InFrame branch note; the frame-effect
        // tooltip lives on the info-bar badge (DefaultTooltip), not here.
        return (
            <g>
                {/* Break mark: two parallel "/" strokes */}
                <line
                    x1={x1}
                    y1={yBot}
                    x2={x2}
                    y2={yTop}
                    stroke={color}
                    strokeWidth={1.5}
                />
                <line
                    x1={x2}
                    y1={yBot}
                    x2={x3}
                    y2={yTop}
                    stroke={color}
                    strokeWidth={1.5}
                />
                {/* Stop tick */}
                <line
                    x1={tickX}
                    y1={yMid - r}
                    x2={tickX}
                    y2={yMid + r}
                    stroke={color}
                    strokeWidth={2}
                />
            </g>
        );
    }

    // Unknown / absent frame: render no junction glyph. The breakpoint is
    // already conveyed by the exon gap and the breakpoint annotation, so a
    // neutral diamond here only adds noise.
    return <g />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const FusionProduct: React.FC<FusionProductProps> = ({
    gene1,
    gene2,
    forteTranscript5p,
    forteTranscript3p,
    x,
    y,
    width,
    frameStatus,
    breakpoint5p,
    breakpoint3p,
}) => {
    const rectRefs = useRef<Map<string, SVGRectElement>>(new Map());
    const labelRefs = useRef<Map<string, SVGTextElement>>(new Map());
    const prevSlotsRef = useRef<Map<string, ExonSlot>>(new Map());

    const layout = computeLayout(
        gene1,
        gene2,
        forteTranscript5p,
        forteTranscript3p,
        x,
        y,
        width,
        breakpoint5p,
        breakpoint3p
    );

    const slots = layout?.slots ?? [];

    const transitionKey = `${
        forteTranscript5p.transcriptId
    }|${forteTranscript3p?.transcriptId ?? ''}|${slots.length}|${width}`;

    useLayoutEffect(() => {
        if (!layout) {
            // Reset snapshot so next render starts fresh
            prevSlotsRef.current = new Map();
            return;
        }

        const prevSlots = prevSlotsRef.current;

        slots.forEach(slot => {
            const rect = rectRefs.current.get(slot.key);
            const label = labelRefs.current.get(slot.key);
            const prev = prevSlots.get(slot.key);
            if (!rect) return;

            // Always force opacity back to 1 first. GSAP mutates the DOM
            // directly and opacity is NOT a React-controlled prop here, so an
            // interrupted fade (rapid transcript switching) would otherwise
            // leave an exon stuck invisible. Healing it every run guarantees
            // every current exon is visible; only the position still tweens.
            gsap.killTweensOf(rect);
            gsap.set(rect, { opacity: 1 });
            if (label) {
                gsap.killTweensOf(label);
                gsap.set(label, { opacity: 1 });
            }

            if (prev) {
                gsap.fromTo(
                    rect,
                    { attr: { x: prev.x, width: prev.width } },
                    {
                        attr: { x: slot.x, width: slot.width },
                        duration: TWEEN_DURATION,
                        ease: TWEEN_EASE,
                    }
                );
                if (label) {
                    gsap.fromTo(
                        label,
                        { attr: { x: prev.x + prev.width / 2 } },
                        {
                            attr: { x: slot.x + slot.width / 2 },
                            duration: TWEEN_DURATION,
                            ease: TWEEN_EASE,
                        }
                    );
                }
            }
        });

        const nextPrev = new Map<string, ExonSlot>();
        slots.forEach(s => nextPrev.set(s.key, s));
        prevSlotsRef.current = nextPrev;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transitionKey]);

    // ---- Edge cases ----
    if (!gene2 || !forteTranscript3p) {
        return (
            <g>
                <text
                    x={x + width / 2}
                    y={y + PADDING_TOP + PRODUCT_HEIGHT / 2 + 4}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#999"
                    fontStyle="italic"
                >
                    No fusion product (intergenic partner)
                </text>
            </g>
        );
    }
    if (!layout) {
        return (
            <g>
                <text
                    x={x + width / 2}
                    y={y + PADDING_TOP + PRODUCT_HEIGHT / 2 + 4}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#999"
                    fontStyle="italic"
                >
                    No retained exons
                </text>
            </g>
        );
    }

    const { topY, startX, trailingX, junctionX, junctionY } = layout;

    return (
        <g>
            {slots.map(slot => (
                <rect
                    key={slot.key}
                    ref={(el: SVGRectElement | null) => {
                        if (el) rectRefs.current.set(slot.key, el);
                        else rectRefs.current.delete(slot.key);
                    }}
                    x={slot.x}
                    y={slot.isUtr ? topY + PRODUCT_HEIGHT / 4 : topY}
                    width={slot.width}
                    height={slot.isUtr ? PRODUCT_HEIGHT / 2 : PRODUCT_HEIGHT}
                    fill={slot.fill}
                    rx={2}
                />
            ))}

            {slots.map(slot => (
                <text
                    key={`label-${slot.key}`}
                    ref={(el: SVGTextElement | null) => {
                        if (el) labelRefs.current.set(slot.key, el);
                        else labelRefs.current.delete(slot.key);
                    }}
                    x={slot.x + slot.width / 2}
                    y={topY + PRODUCT_HEIGHT + LABEL_BELOW}
                    textAnchor="middle"
                    fontSize={8}
                    fill={slot.fill}
                >
                    {slot.labelText}
                </text>
            ))}

            <text
                x={startX - 4}
                y={topY + PRODUCT_HEIGHT / 2 + 4}
                textAnchor="end"
                fontSize={10}
                fill="#666"
            >
                5&apos;
            </text>
            <text
                x={trailingX + 4}
                y={topY + PRODUCT_HEIGHT / 2 + 4}
                textAnchor="start"
                fontSize={10}
                fill="#666"
            >
                3&apos;
            </text>

            {renderJunctionGlyph(junctionX, junctionY, frameStatus)}
        </g>
    );
};
