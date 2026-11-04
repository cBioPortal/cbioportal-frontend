import { FusionEvent } from './types';
import { AnchorSide, ComparisonRow, partnerCategory } from './comparisonRows';

export interface GeneSummary {
    gene: string;
    /** Unique samples with ≥1 event mentioning the gene on either site. */
    sampleCount: number;
}

export interface PartnerSummary {
    /** Partner symbol, or NO_PARTNER / INTRAGENIC. */
    category: string;
    sampleCount: number;
    eventCount: number;
    anyInFrame: boolean;
}

const bySamplesThenName = <T>(name: (t: T) => string) => (
    a: T & { sampleCount: number },
    b: T & { sampleCount: number }
) => b.sampleCount - a.sampleCount || name(a).localeCompare(name(b));

/** Every gene in the cohort with its unique-sample count (gene dropdown). */
export function buildGeneSummaries(events: FusionEvent[]): GeneSummary[] {
    const samples = new Map<string, Set<string>>();
    const add = (gene: string, sample: string) => {
        if (!gene) return;
        const set = samples.get(gene) ?? new Set<string>();
        set.add(sample);
        samples.set(gene, set);
    };
    events.forEach(e => {
        add(e.gene1.symbol, e.tumorId);
        if (e.gene2) add(e.gene2.symbol, e.tumorId);
    });
    return Array.from(samples.entries())
        .map(([gene, set]) => ({ gene, sampleCount: set.size }))
        .sort(bySamplesThenName<GeneSummary>(g => g.gene));
}

/** One row per partner category for the Gene-mode recurrence table. */
export function buildPartnerSummaries(
    rows: ComparisonRow[],
    gene: string,
    side: AnchorSide
): PartnerSummary[] {
    const acc = new Map<
        string,
        { samples: Set<string>; events: number; anyInFrame: boolean }
    >();
    rows.forEach(row => {
        const category = partnerCategory(row, gene, side);
        const a = acc.get(category) ?? {
            samples: new Set<string>(),
            events: 0,
            anyInFrame: false,
        };
        a.samples.add(row.sampleId);
        a.events += 1;
        if (row.frame === 'inFrame') a.anyInFrame = true;
        acc.set(category, a);
    });
    return Array.from(acc.entries())
        .map(([category, a]) => ({
            category,
            sampleCount: a.samples.size,
            eventCount: a.events,
            anyInFrame: a.anyInFrame,
        }))
        .sort(bySamplesThenName<PartnerSummary>(p => p.category));
}

/**
 * Partner-column label for a collapsed group: the shared category, or
 * "<most common> +<other distinct count>" when members disagree.
 */
function rankPartners(categories: string[]): [string, number][] {
    const counts = new Map<string, number>();
    categories.forEach(c => counts.set(c, (counts.get(c) ?? 0) + 1));
    return Array.from(counts.entries()).sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );
}

/** The most common partner category of a group ('' when empty). */
export function topPartner(categories: string[]): string {
    const ranked = rankPartners(categories);
    return ranked.length > 0 ? ranked[0][0] : '';
}

export function groupPartnerLabel(categories: string[]): string {
    const ranked = rankPartners(categories);
    if (ranked.length <= 1) return ranked[0]?.[0] ?? '';
    return `${ranked.length} partners (top: ${ranked[0][0]})`;
}

const BREAKDOWN_MAX = 10;

/** Hover text for a group: every partner with its event count. */
export function groupPartnerBreakdown(categories: string[]): string {
    const ranked = rankPartners(categories);
    if (ranked.length <= 1) return ranked[0]?.[0] ?? '';
    const shown = ranked
        .slice(0, BREAKDOWN_MAX)
        .map(([c, n]) => `${c} ×${n}`)
        .join(', ');
    const more =
        ranked.length > BREAKDOWN_MAX
            ? `, +${ranked.length - BREAKDOWN_MAX} more`
            : '';
    return `${ranked.length} partners: ${shown}${more}`;
}
