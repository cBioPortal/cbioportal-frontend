import Fuse, { IFuseOptions } from 'fuse.js';

/**
 * Performs a fuzzy search over a list of items using Fuse.js.
 *
 * @param pattern the search query
 * @param items the list of items to search
 * @param keys the keys to search on (for object arrays)
 * @returns the filtered and sorted list of matching items
 */
export function fuzzySearchItems<T>(
    pattern: string,
    items: T[],
    keys: string[]
): T[] {
    if (pattern.length === 0) {
        return items;
    }

    const options: IFuseOptions<T> = {
        keys,
        threshold: 0.4,
        ignoreLocation: true,
    };

    const fuse = new Fuse(items, options);
    return fuse.search(pattern).map(result => result.item);
}
