import * as React from 'react';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData } from '../data/types';
import FusionProductStrip from './FusionProductStrip';

const OVERSCAN = 2;

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

const RIGHT_GUTTER = 110;

export interface FusionStripListProps {
    rows: ComparisonRow[];
    transcriptForGene: (gene: string) => TranscriptData | undefined;
    width: number;
    labelMargin?: number;
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
    labelMargin = 150,
    alignment,
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
    const stripWidth = width - labelMargin - RIGHT_GUTTER;
    const junctionX = labelMargin + stripWidth * 0.46;

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
                            breakpoint3p={row.event.gene2?.position}
                            frame={row.frame}
                            reads={row.event.totalReadSupport}
                            x={labelMargin}
                            y={idx * rowHeight}
                            width={stripWidth}
                            alignment={alignment}
                            junctionX={junctionX}
                            onClick={() => onExpand && onExpand(row.sampleId)}
                        />
                    );
                })}
            </svg>
        </div>
    );
};

export default FusionStripList;
