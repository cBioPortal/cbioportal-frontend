export function defaultSortMethod (a: any, b: any)  {
    // force null and undefined to the bottom
    a = a === null || a === undefined ? -Infinity : a;
    b = b === null || b === undefined ? -Infinity : b;

    // force any string values to lowercase
    a = typeof a === 'string' ? a.toLowerCase() : a;
    b = typeof b === 'string' ? b.toLowerCase() : b;

    // Return either 1 or -1 to indicate a sort priority
    if (a > b) {
        return 1
    }
    if (a < b) {
        return -1
    }

    // returning 0 or undefined will use any subsequent column sorting methods or the row index as a tiebreaker
    return 0
}

export function defaultStringArraySortMethod(a: string[], b: string[]) {
    return defaultSortMethod(a.join(), b.join());
}
