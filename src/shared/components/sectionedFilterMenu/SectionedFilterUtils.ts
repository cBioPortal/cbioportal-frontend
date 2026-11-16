/**
 * Filter over options grouped in sections (e.g. annotation sources). Option
 * ids are "<section>:<value>". Selected options of the same section match
 * any of them; sections match either any or all of the sections with
 * selections.
 */
export type SectionedFilterValue = {
    // option ids, e.g. "level:LEVEL_1"
    selections: string[];
    // true: match every section with selections, false: match any of them
    matchAll: boolean;
};

export function optionId(section: string, value: string) {
    return `${section}:${value}`;
}

export function getOptionSection(id: string): string {
    return id.split(':')[0];
}

export function matchesSectionedFilter(
    optionIds: string[],
    filter: SectionedFilterValue
): boolean {
    if (filter.selections.length === 0) {
        return true;
    }
    const ids = new Set(optionIds);
    const selectionsBySection: { [section: string]: string[] } = {};
    for (const selection of filter.selections) {
        const section = getOptionSection(selection);
        (selectionsBySection[section] =
            selectionsBySection[section] || []).push(selection);
    }
    const sectionMatches = Object.values(selectionsBySection).map(selections =>
        selections.some(selection => ids.has(selection))
    );
    return filter.matchAll
        ? sectionMatches.every(match => match)
        : sectionMatches.some(match => match);
}

// number of items per option id, given the option ids of each item
export function countOptionIds(optionIdsPerItem: string[][]) {
    const counts = new Map<string, number>();
    for (const optionIds of optionIdsPerItem) {
        for (const id of optionIds) {
            counts.set(id, (counts.get(id) || 0) + 1);
        }
    }
    return counts;
}
