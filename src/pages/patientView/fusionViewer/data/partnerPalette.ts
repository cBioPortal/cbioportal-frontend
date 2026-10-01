import { NO_PARTNER, INTRAGENIC } from './comparisonRows';

/** Categorical palette for the top partners (Tableau 10, minus greys). */
export const PARTNER_PALETTE = [
    '#4e79a7',
    '#f28e2b',
    '#59a14f',
    '#e15759',
    '#b07aa1',
    '#edc948',
    '#76b7b2',
    '#ff9da7',
];
export const OTHER_COLOR = '#bab0ac';
export const NO_PARTNER_COLOR = '#d9d9d9';
export const INTRAGENIC_COLOR = '#8c8c8c';

const SENTINELS = new Map<string, string>([
    [NO_PARTNER, NO_PARTNER_COLOR],
    [INTRAGENIC, INTRAGENIC_COLOR],
]);

/**
 * Colour map for categories already ranked by unique samples (desc). Shared
 * by the lollipop and the Gene-mode recurrence table so they always agree.
 */
export function rankedColorMap(
    rankedCategories: string[]
): Map<string, string> {
    const map = new Map<string, string>();
    let next = 0;
    rankedCategories.forEach(c => {
        if (SENTINELS.has(c)) {
            map.set(c, SENTINELS.get(c)!);
        } else if (next < PARTNER_PALETTE.length) {
            map.set(c, PARTNER_PALETTE[next]);
            next += 1;
        }
    });
    return map;
}

export function colorFor(map: Map<string, string>, category: string): string {
    return map.get(category) ?? OTHER_COLOR;
}
