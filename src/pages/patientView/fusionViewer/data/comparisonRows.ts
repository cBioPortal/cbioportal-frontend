import { FusionEvent, FrameStatus } from './types';
import { classifyFrame, buildPairKey } from './cohortAggregation';

export type AnchorMode = 'pair' | 'driver';

export interface ComparisonAnchor {
    mode: AnchorMode;
    key: string;
}

export interface ComparisonRow {
    event: FusionEvent;
    sampleId: string;
    fivePrimeSymbol: string;
    threePrimeSymbol: string | null;
    anchorBreakpoint: number;
    frame: FrameStatus;
}

export function buildComparisonRows(
    events: FusionEvent[],
    anchor: ComparisonAnchor
): ComparisonRow[] {
    const matches = (e: FusionEvent): boolean => {
        if (anchor.mode === 'pair') {
            return (
                buildPairKey(
                    e.gene1.symbol,
                    e.gene2 ? e.gene2.symbol : null
                ) === anchor.key
            );
        }
        return (
            e.gene1.symbol === anchor.key ||
            (!!e.gene2 && e.gene2.symbol === anchor.key)
        );
    };

    return events.filter(matches).map(e => ({
        event: e,
        sampleId: e.tumorId,
        fivePrimeSymbol: e.gene1.symbol,
        threePrimeSymbol: e.gene2 ? e.gene2.symbol : null,
        anchorBreakpoint: e.gene1.position,
        frame: classifyFrame(e.frameCallMethod),
    }));
}

export function sortComparisonRows(rows: ComparisonRow[]): ComparisonRow[] {
    return [...rows].sort((a, b) => a.anchorBreakpoint - b.anchorBreakpoint);
}
