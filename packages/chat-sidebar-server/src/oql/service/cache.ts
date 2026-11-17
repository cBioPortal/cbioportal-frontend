type Entry<T> = { at: number; value: Promise<T> };

/** Memoizes async lookups for `ttlMs`; failed lookups are not cached. */
export function cached<T>(ttlMs: number, max = 5000) {
    const store = new Map<string, Entry<T>>();
    return (key: string, load: () => Promise<T>): Promise<T> => {
        const hit = store.get(key);
        if (hit && Date.now() - hit.at < ttlMs) return hit.value;
        const value = load();
        store.set(key, { at: Date.now(), value });
        value.catch(() => store.delete(key));
        if (store.size > max) store.delete(store.keys().next().value!);
        return value;
    };
}
