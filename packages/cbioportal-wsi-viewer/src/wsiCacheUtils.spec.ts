import { deleteExpiredEntries, withAbort } from './wsiCacheUtils';

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
