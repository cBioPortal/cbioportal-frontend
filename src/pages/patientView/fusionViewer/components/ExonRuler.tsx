import * as React from 'react';
import { TranscriptData } from '../data/types';
import {
    computeJunctionAlignedLayout,
    exonsInOrder,
    exonDisplayNumbers,
} from './fusionProductHelpers';

const RULER_HEIGHT = 16;
// Below this drawn block width the label would collide with its neighbour, so
// the exon goes unlabelled rather than unreadable.
const MIN_LABEL_W = 10;

export interface ExonRulerProps {
    transcript5p: TranscriptData;
    transcript3p?: TranscriptData;
    width: number;
    leftX: number;
    junctionX: number;
    rightX: number;
    pxPerBp5p: number;
    pxPerBp3p: number;
}

/**
 * Exon-number header for the full-ladder strip view. Runs the same layout the
 * strips do over the same reference transcripts, so a label sits exactly above
 * its column. Only meaningful in reference-ladder mode — per-row ladders are
 * ragged, so there is no shared ladder to number.
 *
 * Needs no CSS stickiness: the strip list scrolls inside its own fixed-height
 * container, so a sibling rendered above it never scrolls away.
 */
const ExonRuler: React.FC<ExonRulerProps> = ({
    transcript5p,
    transcript3p,
    width,
    leftX,
    junctionX,
    rightX,
    pxPerBp5p,
    pxPerBp3p,
}) => {
    const exons5p = exonsInOrder(transcript5p);
    const exons3p = transcript3p ? exonsInOrder(transcript3p) : [];
    let nums5p = exonDisplayNumbers(transcript5p);
    let nums3p = transcript3p ? exonDisplayNumbers(transcript3p) : undefined;

    // For minus strand, exonDisplayNumbers assigns numbers in reverse genomic
    // order, but exonsInOrder returns them in transcription order (high to low).
    // Invert the mapping so the first exon rendered gets the highest number.
    if (transcript5p.strand === '-' && nums5p.size > 0) {
        const max = Math.max(...nums5p.values());
        nums5p = new Map([...nums5p].map(([key, val]) => [key, max + 1 - val]));
    }
    if (
        transcript3p &&
        transcript3p.strand === '-' &&
        nums3p &&
        nums3p.size > 0
    ) {
        const max = Math.max(...nums3p.values());
        nums3p = new Map([...nums3p].map(([key, val]) => [key, max + 1 - val]));
    }

    const layout = computeJunctionAlignedLayout(
        exons5p,
        exons3p,
        leftX,
        junctionX,
        rightX,
        pxPerBp5p,
        pxPerBp3p
    );

    const label = (
        key: string,
        exon: { start: number; end: number; number: number },
        x: number,
        w: number,
        nums: Map<string, number> | undefined
    ): JSX.Element | null => {
        if (w < MIN_LABEL_W) return null;
        const n = nums?.get(`${exon.start}-${exon.end}`) ?? exon.number;
        return (
            <text
                key={key}
                data-testid="ruler-exon-label"
                x={x + w / 2}
                y={RULER_HEIGHT - 4}
                textAnchor="middle"
                fontSize={9}
                fill="#6c757d"
            >
                E{n}
            </text>
        );
    };

    return (
        <svg width={width} height={RULER_HEIGHT}>
            {exons5p.map((e, i) =>
                label(`5p-${i}`, e, layout.xs5p[i], layout.widths5p[i], nums5p)
            )}
            {exons3p.map((e, i) =>
                label(`3p-${i}`, e, layout.xs3p[i], layout.widths3p[i], nums3p)
            )}
        </svg>
    );
};

export default ExonRuler;
