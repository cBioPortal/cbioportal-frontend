import {
    createPromiseCache,
    deleteExpiredEntries,
    withAbort,
} from './wsiCacheUtils';

describe('wsiCacheUtils', () => {
    it('deletes only expired entries', () => {
        const cache = new Map<string, { expiresAt?: number }>([
            ['expired', { expiresAt: 100 }],
            ['boundary', { expiresAt: 200 }],
            ['live', { expiresAt: 300 }],
            ['no-expiry', {}],
        ]);

        deleteExpiredEntries(cache, 200);

        expect([...cache.keys()]).toEqual(['live', 'no-expiry']);
    });

    it('rejects one caller on abort while the shared promise settles', async () => {
        let resolveShared!: (value: string) => void;
        const shared = new Promise<string>(resolve => {
            resolveShared = resolve;
        });
        const controller = new AbortController();

        const aborted = withAbort(shared, controller.signal);
        const other = withAbort(shared);
        controller.abort();
        resolveShared('done');

        await expect(aborted).rejects.toMatchObject({ name: 'AbortError' });
        await expect(other).resolves.toBe('done');
    });

    it('rejects immediately for an already-aborted signal', async () => {
        const controller = new AbortController();
        controller.abort();

        await expect(
            withAbort(Promise.resolve('x'), controller.signal)
        ).rejects.toMatchObject({ name: 'AbortError' });
    });
});

describe('createPromiseCache', () => {
    afterEach(() => jest.useRealTimers());

    it('shares a pending load and reuses the value until it expires', async () => {
        jest.useFakeTimers();
        const cache = createPromiseCache<number>(() => Date.now() + 1000);
        const load = jest.fn(() => Promise.resolve(1));

        const first = cache.get('a', load);
        expect(cache.get('a', load)).toBe(first);
        await first;
        expect(cache.get('a', load)).toBe(first);
        expect(load).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1001);
        await cache.get('a', load);
        expect(load).toHaveBeenCalledTimes(2);
    });

    it('forgets a rejected load so the next call retries it', async () => {
        const cache = createPromiseCache<string>();
        const load = jest
            .fn()
            .mockRejectedValueOnce(new Error('down'))
            .mockResolvedValueOnce('ok');

        await expect(cache.get('a', load)).rejects.toThrow('down');
        await expect(cache.get('a', load)).resolves.toBe('ok');
        expect(load).toHaveBeenCalledTimes(2);
    });

    it('refreshes a settled entry but joins a pending one', async () => {
        const cache = createPromiseCache<number>();
        let resolveFirst!: (value: number) => void;
        const load = jest
            .fn()
            .mockImplementationOnce(
                () => new Promise<number>(resolve => (resolveFirst = resolve))
            )
            .mockResolvedValueOnce(2);

        const pending = cache.get('a', load);
        expect(cache.get('a', load, true)).toBe(pending);
        resolveFirst(1);
        await pending;

        await expect(cache.get('a', load, true)).resolves.toBe(2);
        expect(load).toHaveBeenCalledTimes(2);
    });

    it('clears matching keys, and does not keep a load that settles after a clear', async () => {
        const cache = createPromiseCache<string>();
        let resolveA!: (value: string) => void;
        cache.get('a', () => new Promise(resolve => (resolveA = resolve)));
        await cache.get('b', () => Promise.resolve('b'));

        cache.clear(key => key === 'a');
        resolveA('stale');
        await Promise.resolve();

        const load = jest.fn(() => Promise.resolve('fresh'));
        await expect(cache.get('a', load)).resolves.toBe('fresh');
        await expect(cache.get('b', load)).resolves.toBe('b');
        expect(load).toHaveBeenCalledTimes(1);
    });
});
