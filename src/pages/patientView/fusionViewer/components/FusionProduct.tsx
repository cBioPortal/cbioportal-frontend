import * as React from 'react';
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

export function getFusionProductHeight(): number {
    return PADDING_TOP + PRODUCT_HEIGHT + PADDING_BOTTOM + NOTE_LINE_HEIGHT;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface FusionProductProps {
    /** 5-prime gene partner */
    gene1: GenePartner;
    /** 3-prime gene partner (null for intergenic) */
    gene2: GenePartner | null;
    /** FORTE-selected transcript for the 5-prime gene */
    forteTranscript5p: TranscriptData;
    /** FORTE-selected transcript for the 3-prime gene */
    forteTranscript3p?: TranscriptData;
    /** FORTE annotation note (may contain fusion position) */
    note: string;
    /** SVG x origin */
    x: number;
    /** SVG y origin */
    y: number;
    /** Available width */
    width: number;
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
    // ---- Intergenic edge case ----
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

    // ---- Sort exons by exon number (biological order) ----
    const sorted5p = [...forteTranscript5p.exons].sort(
        (a, b) => a.number - b.number
    );
    const sorted3p = [...forteTranscript3p.exons].sort(
        (a, b) => a.number - b.number
    );

    // ---- Select retained exons ----
    const retained5p = select5PrimeExons(
        sorted5p,
        gene1.position,
        gene1.strand
    );
    const retained3p = select3PrimeExons(
        sorted3p,
        gene2.position,
        gene2.strand
    );

    const total5p = retained5p.length;
    const total3p = retained3p.length;
    const totalExons = total5p + total3p;

    if (totalExons === 0) {
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

    // ---- Calculate exon widths ----
    // Reserve space for the diamond junction marker
    const diamondWidth = DIAMOND_SIZE * 2 + 4;
    const availableWidth =
        width - diamondWidth - EXON_GAP * (totalExons - 1) - 20; // 20px side padding
    const exonWidth = Math.max(8, availableWidth / totalExons);
    const startX = x + 10;
    const topY = y + PADDING_TOP;

    const elements: React.ReactNode[] = [];
    let curX = startX;

    // ---- 5-prime exons ----
    retained5p.forEach((exon, i) => {
        elements.push(
            <rect
                key={`5p-exon-${exon.number}`}
                x={curX}
                y={topY}
                width={exonWidth}
                height={PRODUCT_HEIGHT}
                fill={COLOR_5PRIME}
                rx={2}
            />
        );
        // Exon number label below
        elements.push(
            <text
                key={`5p-label-${exon.number}`}
                x={curX + exonWidth / 2}
                y={topY + PRODUCT_HEIGHT + LABEL_BELOW}
                textAnchor="middle"
                fontSize={8}
                fill={COLOR_5PRIME}
            >
                E{exon.number}
            </text>
        );
        curX += exonWidth + EXON_GAP;
    });

    // ---- Junction diamond ----
    const junctionX = curX + diamondWidth / 2;
    const junctionY = topY + PRODUCT_HEIGHT / 2;
    const d = DIAMOND_SIZE;
    elements.push(
        <polygon
            key="junction-diamond"
            points={`${junctionX},${junctionY - d} ${junctionX +
                d},${junctionY} ${junctionX},${junctionY + d} ${junctionX -
                d},${junctionY}`}
            fill={COLOR_BREAKPOINT}
            opacity={0.9}
        />
    );
    curX += diamondWidth;

    // ---- 3-prime exons ----
    retained3p.forEach((exon, i) => {
        elements.push(
            <rect
                key={`3p-exon-${exon.number}`}
                x={curX}
                y={topY}
                width={exonWidth}
                height={PRODUCT_HEIGHT}
                fill={COLOR_3PRIME}
                rx={2}
            />
        );
        elements.push(
            <text
                key={`3p-label-${exon.number}`}
                x={curX + exonWidth / 2}
                y={topY + PRODUCT_HEIGHT + LABEL_BELOW}
                textAnchor="middle"
                fontSize={8}
                fill={COLOR_3PRIME}
            >
                E{exon.number}
            </text>
        );
        curX += exonWidth + EXON_GAP;
    });

    // ---- 5' / 3' direction labels ----
    elements.push(
        <text
            key="5p-arrow"
            x={startX - 4}
            y={topY + PRODUCT_HEIGHT / 2 + 4}
            textAnchor="end"
            fontSize={10}
            fill="#666"
        >
            5&apos;
        </text>
    );
    elements.push(
        <text
            key="3p-arrow"
            x={curX + 4}
            y={topY + PRODUCT_HEIGHT / 2 + 4}
            textAnchor="start"
            fontSize={10}
            fill="#666"
        >
            3&apos;
        </text>
    );

    // ---- Fusion position note ----
    const noteText =
        note && note !== 'NA'
            ? note.replace(/^Note:\s*/i, '').substring(0, 120)
            : '';
    if (noteText) {
        elements.push(
            <text
                key="fusion-note"
                x={x + width / 2}
                y={topY + PRODUCT_HEIGHT + PADDING_BOTTOM + 2}
                textAnchor="middle"
                fontSize={9}
                fill="#888"
                fontStyle="italic"
            >
                {noteText.length >= 120 ? noteText + '...' : noteText}
            </text>
        );
    }

    return <g>{elements}</g>;
};
