import { observable, runInAction } from 'mobx';

// Captures the one piece of LazyMobXCache that's actually load-bearing:
// per-render N→1 request collapsing for column formatters.
//
// The pattern: a column formatter calls `cache.get(query)` from inside each
// row render. Returns null on first call, reactively fills in once the
// debounced batched fetch resolves. All `.get(...)` calls within a single
// microtask tick collapse into a single fetch invocation.
//
// Compared to LazyMobXCache, this drops: subclass scaffolding, .peek/.getPromise/
// .addData/.cache surface, error retry tracking, MobxPromise integration,
// and the `meta`-augmented data shape. Add them back when a concrete caller
// needs them — most don't.

// `.get()` returns null while the fetch is still in flight; once resolved the
// entry is one of the two terminal shapes below.
export type ReactiveFetchEntry<V> =
    | { status: 'complete'; data: V | null }
    | { status: 'error'; data: null };

export interface ReactiveFetchCache<Q, V> {
    get(query: Q): ReactiveFetchEntry<V> | null;
}

export function createBatchedReactiveFetch<Q, V>(args: {
    fetch: (queries: Q[]) => Promise<V[]>;
    queryToKey: (q: Q) => string;
    dataToKey: (d: V) => string;
}): ReactiveFetchCache<Q, V> {
    const state = observable.box<{ [key: string]: ReactiveFetchEntry<V> }>(
        {},
        { deep: false }
    );
    const inflight = new Set<string>();
    let queue = new Map<string, Q>();
    let scheduled = false;

    const flush = async () => {
        scheduled = false;
        if (queue.size === 0) return;
        const batch = queue;
        queue = new Map<string, Q>();
        const keys = Array.from(batch.keys());
        keys.forEach(k => inflight.add(k));
        try {
            const results = await args.fetch(Array.from(batch.values()));
            const byKey = new Map(results.map(r => [args.dataToKey(r), r]));
            runInAction(() => {
                const next = { ...state.get() };
                for (const k of keys) {
                    const v = byKey.get(k);
                    next[k] = {
                        status: 'complete',
                        data: v !== undefined ? v : null,
                    };
                }
                state.set(next);
            });
        } catch {
            runInAction(() => {
                const next = { ...state.get() };
                for (const k of keys) {
                    next[k] = { status: 'error', data: null };
                }
                state.set(next);
            });
        } finally {
            keys.forEach(k => inflight.delete(k));
        }
    };

    return {
        get(query: Q): ReactiveFetchEntry<V> | null {
            const key = args.queryToKey(query);
            const entry = state.get()[key];
            if (entry) return entry;
            if (!inflight.has(key) && !queue.has(key)) {
                queue.set(key, query);
                if (!scheduled) {
                    scheduled = true;
                    Promise.resolve().then(flush);
                }
            }
            return null;
        },
    };
}
