/**
 * Pure aggregation helpers for the Fusion Cohort Builder.
 *
 * All functions are stateless and unit-testable without MobX or React.
 */
import {
    FusionEvent,
    FusionCohortFilter,
    FusionPairSummary,
    FrameStatus,
    SampleFusionRow,
} from './types';

// ---------------------------------------------------------------------------
// Frame classification
// ---------------------------------------------------------------------------

/**
 * Normalize a raw frameCallMethod string (from site2EffectOnFrame) into a
 * canonical 3-state FrameStatus.
 *
 * Known patterns observed in TARGET/cBioPortal data:
 *   in_frame, In_frame, IN_FRAME, inframe, in-frame  → 'inFrame'
 *   frameshift, frame_shift, out_of_frame, outofframe → 'outOfFrame'
 *   anything else (empty, NA, unknown, -)             → 'unknown'
 */
export function classifyFrame(frameCallMethod: string): FrameStatus {
    if (!frameCallMethod) return 'unknown';

    const normalized = frameCallMethod
        .trim()
        .toLowerCase()
        .replace(/[-_\s]/g, '');

    // Check out-of-frame first so the "inframe" substring inside a value like
    // "outofframe" can't false-match the in-frame rule.
    if (
        normalized.startsWith('frameshift') ||
        normalized.startsWith('outofframe')
    )
        return 'outOfFrame';
    if (normalized.startsWith('inframe')) return 'inFrame';

    return 'unknown';
}

// ---------------------------------------------------------------------------
// Pair key canonicalization
// ---------------------------------------------------------------------------

/**
 * Build a deterministic pair key from two gene symbols.
 *
 * v1 uses symbol-sort (alphabetically smaller symbol first) as a lightweight
 * canonicalization. This avoids false duplicates from A::B vs B::A without
 * requiring transcript data to be fetched.
 *
 * For intragenic / single-gene events (gene3 is null or empty), the key is
 * "GENE::-".
 */
export function buildPairKey(gene5: string, gene3: string | null): string {
    if (!gene3) return `${gene5}::-`;

    // Deterministic: lexicographically smaller symbol is always first
    const [a, b] = [gene5, gene3].sort();
    return `${a}::${b}`;
}

/**
 * Build the pair key directly from a FusionEvent (uses gene symbols).
 */
export function pairKeyFromEvent(event: FusionEvent): string {
    const gene5 = event.gene1.symbol;
    const gene3 = event.gene2?.symbol ?? null;
    return buildPairKey(gene5, gene3);
}

// ---------------------------------------------------------------------------
// Breakpoint region matching
// ---------------------------------------------------------------------------

/**
 * Return true if either breakpoint of the event falls within the given
 * genomic window (inclusive), matching on chromosome as well.
 */
export function eventInBreakpointRegion(
    event: FusionEvent,
    region: FusionCohortFilter['breakpointRegion']
): boolean {
    if (!region) return true;

    const { chromosome, start, end } = region;

    const site1Match =
        event.gene1.chromosome === chromosome &&
        event.gene1.position >= start &&
        event.gene1.position <= end;

    if (site1Match) return true;

    if (event.gene2) {
        const site2Match =
            event.gene2.chromosome === chromosome &&
            event.gene2.position >= start &&
            event.gene2.position <= end;
        if (site2Match) return true;
    }

    return false;
}

// ---------------------------------------------------------------------------
// Per-event filter predicate
// ---------------------------------------------------------------------------

/**
 * Return true if a FusionEvent passes all active facets in the filter.
 *
 * Logic:
 *   - genePartners: OR — event matches if either partner symbol is in the list.
 *   - fusionPairKeys: OR — event's canonical key must be in the list.
 *   - svTypes: OR — event's callMethod must be in the list.
 *   - inFrame: event's frame status must match exactly (or 'any').
 *   - breakpointRegion: either site must fall in the window.
 *
 * Across facets the filter is AND: all active facets must match.
 */
export function eventMatchesFilter(
    event: FusionEvent,
    filter: FusionCohortFilter
): boolean {
    // Gene partner facet
    if (filter.genePartners.length > 0) {
        const gene5 = event.gene1.symbol;
        const gene3 = event.gene2?.symbol ?? '';
        const matchPartner =
            filter.genePartners.includes(gene5) ||
            (gene3 !== '' && filter.genePartners.includes(gene3));
        if (!matchPartner) return false;
    }

    // Fusion pair facet
    if (filter.fusionPairKeys.length > 0) {
        const key = pairKeyFromEvent(event);
        if (!filter.fusionPairKeys.includes(key)) return false;
    }

    // SV type facet
    if (filter.svTypes.length > 0) {
        if (!filter.svTypes.includes(event.callMethod)) return false;
    }

    // In-frame facet
    if (filter.inFrame !== 'any') {
        const status = classifyFrame(event.frameCallMethod);
        if (status !== filter.inFrame) return false;
    }

    // Breakpoint region facet
    if (filter.breakpointRegion) {
        if (!eventInBreakpointRegion(event, filter.breakpointRegion))
            return false;
    }

    return true;
}

// ---------------------------------------------------------------------------
// Aggregation: events → pair summaries
// ---------------------------------------------------------------------------

/**
 * Aggregate a flat array of FusionEvents into per-pair recurrence summaries,
 * sorted by sampleCount descending (then eventCount descending as tiebreak).
 *
 * O(n) grouping via a single pass over events.
 */
export function buildPairSummaries(events: FusionEvent[]): FusionPairSummary[] {
    // Map from pair key → accumulator
    const map = new Map<
        string,
        {
            gene5: string;
            gene3: string | null;
            sampleIdSet: Set<string>;
            eventCount: number;
            anyInFrame: boolean;
            eventIds: string[];
        }
    >();

    for (const event of events) {
        const key = pairKeyFromEvent(event);
        let acc = map.get(key);
        if (!acc) {
            // Preserve display orientation: use the order seen in the first event
            acc = {
                gene5: event.gene1.symbol,
                gene3: event.gene2?.symbol ?? null,
                sampleIdSet: new Set(),
                eventCount: 0,
                anyInFrame: false,
                eventIds: [],
            };
            map.set(key, acc);
        }

        acc.sampleIdSet.add(event.tumorId);
        acc.eventCount += 1;
        acc.eventIds.push(event.id);

        if (classifyFrame(event.frameCallMethod) === 'inFrame') {
            acc.anyInFrame = true;
        }
    }

    const summaries: FusionPairSummary[] = [];
    for (const [key, acc] of map.entries()) {
        summaries.push({
            key,
            gene5: acc.gene5,
            gene3: acc.gene3,
            sampleCount: acc.sampleIdSet.size,
            eventCount: acc.eventCount,
            anyInFrame: acc.anyInFrame,
            sampleIds: Array.from(acc.sampleIdSet),
            eventIds: acc.eventIds,
        });
    }

    // Sort: sampleCount desc, then eventCount desc
    summaries.sort(
        (a, b) => b.sampleCount - a.sampleCount || b.eventCount - a.eventCount
    );

    return summaries;
}

// ---------------------------------------------------------------------------
// Aggregation: events → per-sample matrix rows
// ---------------------------------------------------------------------------

/**
 * Determine the best frame status for a sample-pair combination.
 * Priority: inFrame > outOfFrame > unknown.
 */
function bestFrameStatus(a: FrameStatus, b: FrameStatus): FrameStatus {
    const rank: Record<FrameStatus, number> = {
        inFrame: 2,
        outOfFrame: 1,
        unknown: 0,
    };
    return rank[a] >= rank[b] ? a : b;
}

/**
 * Build one SampleFusionRow per distinct sample in the event list.
 * Each row records the best frame status per pair key for that sample.
 *
 * When `allowedPairKeys` is provided (e.g. the top-N recurrent pairs the matrix
 * caps to), only those pair columns are recorded and samples with no event in
 * any allowed pair are dropped — so the matrix can't blow up to one column per
 * pair across a large cohort. Omit it to record every pair (unbounded).
 */
export function buildSampleRows(
    events: FusionEvent[],
    allowedPairKeys?: Iterable<string>
): SampleFusionRow[] {
    const allow = allowedPairKeys ? new Set(allowedPairKeys) : null;
    const map = new Map<string, Record<string, FrameStatus>>();

    for (const event of events) {
        const key = pairKeyFromEvent(event);
        if (allow && !allow.has(key)) continue;

        const sampleId = event.tumorId;
        const status = classifyFrame(event.frameCallMethod);

        let row = map.get(sampleId);
        if (!row) {
            row = {};
            map.set(sampleId, row);
        }

        row[key] = key in row ? bestFrameStatus(row[key], status) : status;
    }

    return Array.from(map.entries()).map(([sampleId, pairFrameStatus]) => ({
        sampleId,
        pairFrameStatus,
    }));
}

// ---------------------------------------------------------------------------
// Facet option extraction
// ---------------------------------------------------------------------------

/** Distinct gene partner symbols across all events. */
export function extractGenePartnerOptions(events: FusionEvent[]): string[] {
    const set = new Set<string>();
    for (const ev of events) {
        set.add(ev.gene1.symbol);
        if (ev.gene2) set.add(ev.gene2.symbol);
    }
    return Array.from(set).sort();
}

/** Distinct callMethod values across all events. */
export function extractSvTypeOptions(events: FusionEvent[]): string[] {
    const set = new Set<string>();
    for (const ev of events) {
        if (ev.callMethod) set.add(ev.callMethod);
    }
    return Array.from(set).sort();
}

/** Distinct canonical pair keys across all events. */
export function extractPairKeyOptions(events: FusionEvent[]): string[] {
    return buildPairSummaries(events).map(s => s.key);
}

// ---------------------------------------------------------------------------
// Default filter factory
// ---------------------------------------------------------------------------

export function defaultCohortFilter(): FusionCohortFilter {
    return {
        genePartners: [],
        fusionPairKeys: [],
        svTypes: [],
        inFrame: 'any',
        breakpointRegion: undefined,
    };
}
