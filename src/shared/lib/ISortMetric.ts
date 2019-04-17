export type SortMetric<T> =
    | ((d: T) => number | null)
    | ((d: T) => (number | null)[])
    | ((d: T) => string | null)
    | ((d: T) => (string | null)[]);
