import * as React from 'react';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData } from '../data/types';
import FusionProductStrip from './FusionProductStrip';
import { retainedExonsInOrder, JUNCTION_GAP } from './fusionProductHelpers';
import { computeComparisonFrame, sharedPxPerBp } from './comparisonFrame';

const OVERSCAN = 2;

const exonLen = (e: { start: number; end: number }) =>
    Math.max(1, e.end - e.start);

const sumBp = (exons: { start: number; end: number }[]) =>
    exons.reduce((s, e) => s + exonLen(e), 0);

export function visibleWindow(
    total: number,
    rowHeight: number,
    viewportHeight: number,
    scrollTop: number
): { start: number; end: number } {
    const first = Math.floor(scrollTop / rowHeight);
    const last = Math.ceil((scrollTop + viewportHeight) / rowHeight);
    const start = Math.max(0, first - OVERSCAN);
    const end = Math.min(total, last + OVERSCAN);
    return { start, end };
}

export interface FusionStripListProps {
    rows: ComparisonRow[];
    transcriptForGene: (gene: string) => TranscriptData | undefined;
    width: number;
    alignment: 'junction' | 'coordinate';
    rowHeight?: number;
    viewportHeight?: number;
    scrollTop?: number;
    onExpand?: (sampleId: string) => void;
}

const FusionStripList: React.FC<FusionStripListProps> = ({
    rows,
    transcriptForGene,
    width,
    rowHeight = 50,
    viewportHeight = 500,
    scrollTop: controlledScroll,
    onExpand,
}) => {
    const [scrollTop, setScrollTop] = React.useState(controlledScroll ?? 0);
    const effective = controlledScroll ?? scrollTop;
    const { start, end } = visibleWindow(
        rows.length,
        rowHeight,
        viewportHeight,
        effective
    );

    const { leftX, junctionX, rightX } = computeComparisonFrame(width);

    // A single bp→px scale per side (from the widest row across the whole
    // cohort) keeps retained lengths comparable and the seam pinned to
    // junctionX for every strip. Computed over ALL rows, not just visible.
    let maxBp5 = 0;
    let maxBp3 = 0;
    rows.forEach(row => {
        const t5 = transcriptForGene(row.fivePrimeSymbol);
        if (t5) {
            maxBp5 = Math.max(
                maxBp5,
                sumBp(retainedExonsInOrder(t5, row.anchorBreakpoint, true))
            );
        }
        const t3 = row.threePrimeSymbol
            ? transcriptForGene(row.threePrimeSymbol)
            : undefined;
        const bp3 = row.partnerBreakpoint ?? undefined;
        if (t3 && bp3 !== undefined) {
            maxBp3 = Math.max(
                maxBp3,
                sumBp(retainedExonsInOrder(t3, bp3, false))
            );
        }
    });
    const region5W = junctionX - JUNCTION_GAP / 2 - leftX;
    const region3W = rightX - (junctionX + JUNCTION_GAP / 2);
    const pxPerBp5p = sharedPxPerBp(maxBp5, region5W);
    const pxPerBp3p = sharedPxPerBp(maxBp3, region3W);

    return (
        <div
            data-testid="strip-scroll"
            style={{ height: viewportHeight, overflowY: 'auto' }}
            onScroll={e => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        >
            <svg width={width} height={rows.length * rowHeight}>
                {rows.slice(start, end).map((row, i) => {
                    const idx = start + i;
                    const t5 = transcriptForGene(row.fivePrimeSymbol);
                    const t3 = row.threePrimeSymbol
                        ? transcriptForGene(row.threePrimeSymbol)
                        : undefined;
                    if (!t5) return null;
                    return (
                        <FusionProductStrip
                            key={row.sampleId}
                            sampleId={row.sampleId}
                            label={row.sampleId}
                            transcript5p={t5}
                            transcript3p={t3}
                            breakpoint5p={row.anchorBreakpoint}
                            breakpoint3p={row.partnerBreakpoint ?? undefined}
                            frame={row.frame}
                            reads={row.event.totalReadSupport}
                            y={idx * rowHeight}
                            leftX={leftX}
                            junctionX={junctionX}
                            rightX={rightX}
                            pxPerBp5p={pxPerBp5p}
                            pxPerBp3p={pxPerBp3p}
                            onClick={() => onExpand && onExpand(row.sampleId)}
                        />
                    );
                })}
            </svg>
        </div>
    );
};

export default FusionStripList;
