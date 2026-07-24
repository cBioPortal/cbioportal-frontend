export function getBoundedMapCacheValue<K, V>(
    cache: Map<K, V>,
    key: K
): V | undefined {
    const cached = cache.get(key);
    if (cached === undefined) {
        return undefined;
    }

    cache.delete(key);
    cache.set(key, cached);
    return cached;
}

export function setBoundedMapCacheValue<K, V>(
    cache: Map<K, V>,
    key: K,
    value: V,
    maxEntries: number
): V {
    if (cache.has(key)) {
        cache.delete(key);
    }
    cache.set(key, value);

    if (cache.size > maxEntries) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) {
            cache.delete(oldestKey);
        }
    }

    return value;
}
