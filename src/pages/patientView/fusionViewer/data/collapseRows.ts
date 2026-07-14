import { ComparisonRow } from './comparisonRows';
import { FrameStatus, TranscriptData } from './types';
import { retainedExonsInOrder } from '../components/fusionProductHelpers';

/**
 * How structurally-identical fusion products are grouped in the collapsed strip
 * view. The choice is data-type-aware by default (see FusionComparisonView) but
 * user-overridable:
 *  - 'exonStructure'    → same retained 5′ exon set + 3′ exon set (drawn product).
 *  - 'breakpointFeature' → same anchor-breakpoint feature bucket (exon/intron/…).
 */
export type CollapseKind = 'exonStructure' | 'breakpointFeature';

export interface CollapsedGroup {
    /** The key all members share. */
    key: string;
    /** A representative row (the first encountered) used to draw the product. */
    representative: ComparisonRow;
    /** Number of member rows. */
    count: number;
    /** Member sample ids (in encounter order). */
    sampleIds: string[];
    /** Frame tally across the members (a group can mix frame calls). */
    frames: Record<FrameStatus, number>;
}

/**
 * Structural key for the drawn fusion product: the retained 5′ exon numbers and
 * 3′ exon numbers. Two rows with the same key draw the same product. Pure — the
 * caller resolves each side's transcript (caller isoform, canonical fallback).
 * When a transcript is missing the corresponding side contributes an empty list;
 * callers that need per-row uniqueness before transcripts load should supply
 * their own fallback key instead of relying on this.
 */
export function exonStructureKey(
    t5: TranscriptData | undefined,
    bp5: number,
    t3?: TranscriptData,
    bp3?: number | null
): string {
    const e5 = t5 ? retainedExonsInOrder(t5, bp5, true).map(e => e.number) : [];
    const e3 =
        t3 && bp3 !== undefined && bp3 !== null
            ? retainedExonsInOrder(t3, bp3, false).map(e => e.number)
            : [];
    return `5p:${e5.join(',')}|3p:${e3.join(',')}`;
}

/**
 * Group rows by an injected key function, tally counts + frames, and sort by
 * count descending (ties keep first-encounter order via a stable sort). Pure and
 * React-free so the transcript lookups stay in the component.
 */
export function groupRows(
    rows: ComparisonRow[],
    keyFn: (row: ComparisonRow, index: number) => string
): CollapsedGroup[] {
    const map = new Map<string, CollapsedGroup>();
    rows.forEach((row, index) => {
        const key = keyFn(row, index);
        let g = map.get(key);
        if (!g) {
            g = {
                key,
                representative: row,
                count: 0,
                sampleIds: [],
                frames: { inFrame: 0, outOfFrame: 0, unknown: 0 },
            };
            map.set(key, g);
        }
        g.count += 1;
        g.sampleIds.push(row.sampleId);
        g.frames[row.frame] += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
