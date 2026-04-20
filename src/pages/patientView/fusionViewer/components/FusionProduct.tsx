import * as React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
    TranscriptData,
    GenePartner,
    COLOR_5PRIME,
    COLOR_3PRIME,
    COLOR_BREAKPOINT,
} from '../data/types';
import {
    PRODUCT_HEIGHT,
    EXON_GAP,
    DIAMOND_SIZE,
    select5PrimeExons,
    select3PrimeExons,
} from './fusionProductHelpers';
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
}

interface JunctionLayout {
    x: number;
    y: number;
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

    const txSort = (strand: '+' | '-') => (
        a: { start: number },
        b: { start: number }
    ) => (strand === '-' ? b.start - a.start : a.start - b.start);

    const sorted5p = [...forteTranscript5p.exons].sort(
        txSort(forteTranscript5p.strand)
    );
    const sorted3p = [...forteTranscript3p.exons].sort(
        txSort(forteTranscript3p.strand)
    );

    const retained5p = select5PrimeExons(
        sorted5p,
        gene1.position,
        forteTranscript5p.strand
    );
    const retained3p = select3PrimeExons(
        sorted3p,
        gene2.position,
        forteTranscript3p.strand
    );

    const total5p = retained5p.length;
    const total3p = retained3p.length;
    const totalExons = total5p + total3p;
    if (totalExons === 0) return null;

    const diamondWidth = DIAMOND_SIZE * 2 + 4;
    const availableWidth =
        width - diamondWidth - EXON_GAP * (totalExons - 1) - 20;
    const exonWidth = Math.max(8, availableWidth / totalExons);
    const startX = x + 10;
    const topY = y + PADDING_TOP;

    const slots: ExonSlot[] = [];
    let cursor = startX;

    retained5p.forEach((exon, i) => {
        const displayN =
            displayNum5p.get(`${exon.start}-${exon.end}`) ?? exon.number;
        slots.push({
            key: `5p-${i}`,
            side: '5p',
            x: cursor,
            width: exonWidth,
            labelText: `E${displayN}`,
            fill: COLOR_5PRIME,
        });
        cursor += exonWidth + EXON_GAP;
    });

    const junctionX = cursor + diamondWidth / 2;
    const junctionY = topY + PRODUCT_HEIGHT / 2;
    cursor += diamondWidth;

    retained3p.forEach((exon, i) => {
        const displayN =
            displayNum3p.get(`${exon.start}-${exon.end}`) ?? exon.number;
        slots.push({
            key: `3p-${i}`,
            side: '3p',
            x: cursor,
            width: exonWidth,
            labelText: `E${displayN}`,
            fill: COLOR_3PRIME,
        });
        cursor += exonWidth + EXON_GAP;
    });

    return {
        slots,
        junctionX,
        junctionY,
        startX,
        trailingX: cursor,
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
    const junctionRef = useRef<SVGPolygonElement | null>(null);
    const prevSlotsRef = useRef<Map<string, ExonSlot>>(new Map());
    const prevJunctionRef = useRef<JunctionLayout | null>(null);

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
    const junctionX = layout?.junctionX ?? 0;
    const junctionY = layout?.junctionY ?? 0;

    const transitionKey = `${
        forteTranscript5p.transcriptId
    }|${forteTranscript3p?.transcriptId ?? ''}|${slots.length}|${width}`;

    useLayoutEffect(() => {
        if (!layout) {
            // Reset snapshot so next render starts fresh
            prevSlotsRef.current = new Map();
            prevJunctionRef.current = null;
            return;
        }

        const prevSlots = prevSlotsRef.current;

        slots.forEach(slot => {
            const rect = rectRefs.current.get(slot.key);
            const label = labelRefs.current.get(slot.key);
            const prev = prevSlots.get(slot.key);
            if (!rect) return;

            if (prev) {
                gsap.killTweensOf(rect);
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
                    gsap.killTweensOf(label);
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
            } else {
                gsap.fromTo(
                    rect,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.25 }
                );
                if (label) {
                    gsap.fromTo(
                        label,
                        { opacity: 0 },
                        { opacity: 1, duration: 0.25 }
                    );
                }
            }
        });

        const junction = junctionRef.current;
        if (junction) {
            const prev = prevJunctionRef.current;
            if (prev) {
                gsap.killTweensOf(junction);
                gsap.fromTo(
                    junction,
                    { x: prev.x - junctionX, y: prev.y - junctionY },
                    {
                        x: 0,
                        y: 0,
                        duration: TWEEN_DURATION,
                        ease: TWEEN_EASE,
                    }
                );
            }
        }

        const nextPrev = new Map<string, ExonSlot>();
        slots.forEach(s => nextPrev.set(s.key, s));
        prevSlotsRef.current = nextPrev;
        prevJunctionRef.current = { x: junctionX, y: junctionY };
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
    const d = DIAMOND_SIZE;
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
                    y={topY}
                    width={slot.width}
                    height={PRODUCT_HEIGHT}
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

            <polygon
                ref={junctionRef}
                points={`${junctionX},${junctionY - d} ${junctionX +
                    d},${junctionY} ${junctionX},${junctionY + d} ${junctionX -
                    d},${junctionY}`}
                fill={COLOR_BREAKPOINT}
                opacity={0.9}
            />

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
