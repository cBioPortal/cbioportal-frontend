// Three independent primitives for composing fetch behavior.
// Compose them when a caller needs more than one (see VariantCountCache).
//
// Why three pieces instead of one fused helper:
// each addresses a distinct concern, and most callers in this codebase
// only need one or two of them. Mixing them at use-site (rather than
// pre-bundling) means cache classes don't have to inherit from anything.
//
//   batchify : turn a bulk endpoint into a single-item function that
//              auto-coalesces concurrent calls within one microtask tick.
//              No caching, no MobX. (DataLoader pattern.)
//
//   memoize  : promise-level dedup. Same key in flight or resolved →
//              same Promise. Rejections evict so retries are possible.
//
//   reactive : wrap a Promise-returning fn so callers can read it
//              synchronously during MobX render (returns null while
//              fetching, observable.box flips when it resolves).

import { observable, runInAction } from 'mobx';

export function batchify<Q, V>(
    bulkFetch: (queries: Q[]) => Promise<V[]>,
    queryKey: (q: Q) => string,
    resultKey: (v: V) => string,
): (q: Q) => Promise<V | null> {
    type Pending = {
        query: Q;
        resolve: (v: V | null) => void;
        reject: (err: unknown) => void;
    };
    let queue: Pending[] = [];
    let scheduled = false;

    const flush = async () => {
        scheduled = false;
        const batch = queue;
        queue = [];
        try {
            const results = await bulkFetch(batch.map(p => p.query));
            const byKey = new Map(results.map(r => [resultKey(r), r]));
            for (const p of batch) {
                const v = byKey.get(queryKey(p.query));
                p.resolve(v !== undefined ? v : null);
            }
        } catch (err) {
            for (const p of batch) p.reject(err);
        }
    };

    return query =>
        new Promise<V | null>((resolve, reject) => {
            queue.push({ query, resolve, reject });
            if (!scheduled) {
                scheduled = true;
                Promise.resolve().then(flush);
            }
        });
}

export function memoize<Q, V>(
    fn: (q: Q) => Promise<V>,
    keyOf: (q: Q) => string,
): (q: Q) => Promise<V> {
    const cache = new Map<string, Promise<V>>();
    return query => {
        const key = keyOf(query);
        let p = cache.get(key);
        if (!p) {
            p = fn(query).catch(err => {
                cache.delete(key); // evict failures so callers can retry
                throw err;
            });
            cache.set(key, p);
        }
        return p;
    };
}

export type ReactiveEntry<V> =
    | { status: 'complete'; data: V | null }
    | { status: 'error'; data: null };

export interface ReactiveCache<Q, V> {
    get(query: Q): ReactiveEntry<V> | null;
}

export function reactive<Q, V>(
    fn: (q: Q) => Promise<V | null>,
    keyOf: (q: Q) => string,
): ReactiveCache<Q, V> {
    const state = observable.box<{ [key: string]: ReactiveEntry<V> }>(
        {},
        { deep: false },
    );
    const inflight = new Set<string>();

    const settle = (key: string, entry: ReactiveEntry<V>) =>
        runInAction(() => {
            state.set({ ...state.get(), [key]: entry });
            inflight.delete(key);
        });

    return {
        get(query) {
            const key = keyOf(query);
            const existing = state.get()[key];
            if (existing) return existing;
            if (!inflight.has(key)) {
                inflight.add(key);
                fn(query).then(
                    data => settle(key, { status: 'complete', data }),
                    () => settle(key, { status: 'error', data: null }),
                );
            }
            return null;
        },
    };
}
