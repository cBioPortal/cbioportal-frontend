import * as React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
    TranscriptData,
    GenePartner,
    COLOR_5PRIME,
    COLOR_3PRIME,
} from '../data/types';
import {
    PRODUCT_HEIGHT,
    computeFusionExonLayout,
    retainedExonsInOrder,
} from './fusionProductHelpers';
import { splitExonByFivePrimeUtr } from './GeneTrack';
export { computeJunctionX } from './fusionProductHelpers';

const LABEL_BELOW = 14;
const PADDING_TOP = 6;
const PADDING_BOTTOM = 30; // room for labels + note text
const NOTE_LINE_HEIGHT = 12;
const TWEEN_DURATION = 0.35;
const TWEEN_EASE = 'power2.out';

export function getFusionProductHeight(): number {
    return PADDING_TOP + PRODUCT_HEIGHT + PADDING_BOTTOM + NOTE_LINE_HEIGHT;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface FusionProductProps {
    gene1: GenePartner;
    gene2: GenePartner | null;
    forteTranscript5p: TranscriptData;
    forteTranscript3p?: TranscriptData;
    note: string;
    x: number;
    y: number;
    width: number;
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
    width: number
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
        gene1.position,
        true
    );
    const retained3p = retainedExonsInOrder(
        forteTranscript3p,
        gene2.position,
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
// Component
// ---------------------------------------------------------------------------
export const FusionProduct: React.FC<FusionProductProps> = ({
    gene1,
    gene2,
    forteTranscript5p,
    forteTranscript3p,
    note,
    x,
    y,
    width,
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
        width
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

    const { topY, startX, trailingX } = layout;
    const noteText =
        note && note !== 'NA'
            ? note.replace(/^Note:\s*/i, '').substring(0, 120)
            : '';

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

            {noteText && (
                <text
                    x={x + width / 2}
                    y={topY + PRODUCT_HEIGHT + PADDING_BOTTOM + 2}
                    textAnchor="middle"
                    fontSize={9}
                    fill="#888"
                    fontStyle="italic"
                >
                    {noteText.length >= 120 ? noteText + '...' : noteText}
                </text>
            )}
        </g>
    );
};
