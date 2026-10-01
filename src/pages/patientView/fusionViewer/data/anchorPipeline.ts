import { FusionEvent, FusionPairSummary } from './types';
import { GeneSummary } from './anchorSummaries';
import {
    AnchorSide,
    ComparisonAnchor,
    ComparisonRow,
    buildComparisonRows,
    majoritySide,
} from './comparisonRows';

/**
 * Step 1 of the store pipeline (spec 3.1): which pair/gene is shown. Decided
 * from UNRESOLVED event presence only, so nothing here depends on transcripts
 * or on rows built for this anchor -- that is what keeps the graph acyclic.
 */
export function resolveAnchorIdentity(args: {
    selection: ComparisonAnchor | undefined;
    events: FusionEvent[];
    pairSummaries: FusionPairSummary[];
    geneSummaries: GeneSummary[];
    seedPending: boolean;
}): ComparisonAnchor | undefined {
    const { selection, events, pairSummaries, geneSummaries } = args;
    if (!selection) return undefined;
    if (args.seedPending && events.length === 0) return undefined;
    if (selection.mode === 'pair') {
        if (buildComparisonRows(events, selection).length > 0) return selection;
        const survivor = pairSummaries[0];
        return survivor ? { mode: 'pair', key: survivor.key } : undefined;
    }
    const mentioned = events.some(
        e =>
            e.gene1.symbol === selection.gene ||
            (!!e.gene2 && e.gene2.symbol === selection.gene)
    );
    if (mentioned) return selection;
    const top = geneSummaries[0];
    return top ? { mode: 'gene', gene: top.gene, side: 'auto' } : undefined;
}

/** Step 4: concrete side for a gene anchor; undefined for pair anchors. */
export function resolveEffectiveSide(
    identity: ComparisonAnchor | undefined,
    resolvedRows: ComparisonRow[],
    unresolvedRows: ComparisonRow[],
    transcriptsReady: boolean
): AnchorSide | undefined {
    if (!identity || identity.mode !== 'gene') return undefined;
    if (identity.side !== 'auto') return identity.side;
    return majoritySide(
        transcriptsReady ? resolvedRows : unresolvedRows,
        identity.gene
    );
}
