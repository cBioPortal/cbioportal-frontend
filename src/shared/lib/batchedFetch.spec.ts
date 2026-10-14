import { assert } from 'chai';
import sinon from 'sinon';
import { autorun } from 'mobx';
import { batchify, memoize, reactive } from './batchedFetch';

type Q = { id: number };
type V = { id: number; v: string };

const keyOf = (x: { id: number }) => `${x.id}`;
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('batchify', () => {
    it('coalesces calls in the same tick into one bulkFetch', async () => {
        const bulkFetch = sinon.spy(async (qs: Q[]): Promise<V[]> =>
            qs.map(q => ({ id: q.id, v: `r${q.id}` })),
        );
        const fn = batchify<Q, V>(bulkFetch, keyOf, keyOf);
        const promises = [1, 2, 3, 4].map(id => fn({ id }));
        const results = await Promise.all(promises);
        assert.equal(bulkFetch.callCount, 1);
        assert.deepEqual(
            results.map(r => r?.v),
            ['r1', 'r2', 'r3', 'r4'],
        );
    });

    it('different ticks → separate bulkFetch calls', async () => {
        const bulkFetch = sinon.spy(async (qs: Q[]): Promise<V[]> =>
            qs.map(q => ({ id: q.id, v: 'x' })),
        );
        const fn = batchify<Q, V>(bulkFetch, keyOf, keyOf);
        await fn({ id: 1 });
        await fn({ id: 2 });
        assert.equal(bulkFetch.callCount, 2);
    });

    it('resolves to null if the bulk response is missing the key', async () => {
        const bulkFetch = async (qs: Q[]): Promise<V[]> =>
            qs.filter(q => q.id !== 99).map(q => ({ id: q.id, v: 'x' }));
        const fn = batchify<Q, V>(bulkFetch, keyOf, keyOf);
        assert.isNull(await fn({ id: 99 }));
    });

    it('rejects every queued promise when bulkFetch throws', async () => {
        const fn = batchify<Q, V>(
            async () => {
                throw new Error('boom');
            },
            keyOf,
            keyOf,
        );
        const results = await Promise.allSettled([fn({ id: 1 }), fn({ id: 2 })]);
        assert.deepEqual(
            results.map(r => r.status),
            ['rejected', 'rejected'],
        );
    });
});

describe('memoize', () => {
    it('returns the same Promise for concurrent calls with the same key', async () => {
        const inner = sinon.spy(async (q: Q) => ({ id: q.id, v: 'x' }));
        const fn = memoize(inner, keyOf);
        const [a, b] = await Promise.all([fn({ id: 1 }), fn({ id: 1 })]);
        assert.equal(inner.callCount, 1);
        assert.strictEqual(a, b);
    });

    it('caches resolved values across ticks', async () => {
        const inner = sinon.spy(async (q: Q) => ({ id: q.id, v: 'x' }));
        const fn = memoize(inner, keyOf);
        await fn({ id: 1 });
        await fn({ id: 1 });
        assert.equal(inner.callCount, 1);
    });

    it('evicts on rejection so the next call retries', async () => {
        let shouldFail = true;
        const inner = sinon.spy(async (q: Q) => {
            if (shouldFail) throw new Error('fail');
            return { id: q.id, v: 'ok' };
        });
        const fn = memoize<Q, V>(inner, keyOf);
        await fn({ id: 1 }).catch(() => {});
        shouldFail = false;
        const result = await fn({ id: 1 });
        assert.equal(result.v, 'ok');
        assert.equal(inner.callCount, 2);
    });

    it('different keys are independent', async () => {
        const inner = sinon.spy(async (q: Q) => ({ id: q.id, v: 'x' }));
        const fn = memoize(inner, keyOf);
        await Promise.all([fn({ id: 1 }), fn({ id: 2 })]);
        assert.equal(inner.callCount, 2);
    });
});

describe('reactive', () => {
    it('returns null on first .get(), then the resolved entry', async () => {
        const fn = async (q: Q) => ({ id: q.id, v: 'x' });
        const cache = reactive(fn, keyOf);
        assert.isNull(cache.get({ id: 1 }));
        await tick();
        assert.deepEqual(cache.get({ id: 1 }), {
            status: 'complete',
            data: { id: 1, v: 'x' },
        });
    });

    it('flips an autorun observer when the fetch resolves', async () => {
        const fn = async (q: Q) => ({ id: q.id, v: 'x' });
        const cache = reactive(fn, keyOf);
        const observed: any[] = [];
        const dispose = autorun(() => observed.push(cache.get({ id: 1 })));
        assert.equal(observed.length, 1);
        assert.isNull(observed[0]);
        await tick();
        assert.equal(observed.length, 2);
        assert.equal(observed[1].status, 'complete');
        dispose();
    });

    it('errored entries are not retried', async () => {
        const fn = sinon.spy(async (_: Q) => {
            throw new Error('boom');
        });
        const cache = reactive(fn, keyOf);
        cache.get({ id: 1 });
        await tick();
        assert.deepEqual(cache.get({ id: 1 }), {
            status: 'error',
            data: null,
        });
        cache.get({ id: 1 });
        await tick();
        assert.equal(fn.callCount, 1);
    });

    it('does not call fn twice while the first call is in flight', async () => {
        let resolveInner: (v: V) => void = () => {};
        const fn = sinon.spy(
            (q: Q) =>
                new Promise<V>(resolve => {
                    resolveInner = () => resolve({ id: q.id, v: 'late' });
                }),
        );
        const cache = reactive(fn, keyOf);
        cache.get({ id: 1 });
        cache.get({ id: 1 });
        cache.get({ id: 1 });
        assert.equal(fn.callCount, 1);
        resolveInner({ id: 1, v: 'late' });
        await tick();
        assert.equal(cache.get({ id: 1 })?.status, 'complete');
    });
});

describe('composition: batchify + memoize + reactive', () => {
    // Stand-in for the migrated VariantCountCache pipeline.
    function buildCache(bulkFetch: (qs: Q[]) => Promise<V[]>) {
        return reactive<Q, V>(
            memoize<Q, V | null>(
                batchify<Q, V>(bulkFetch, keyOf, keyOf),
                keyOf,
            ),
            keyOf,
        );
    }

    it('500 .get() calls in one tick → 1 bulkFetch with 500 unique queries', async () => {
        const bulkFetch = sinon.spy(async (qs: Q[]) =>
            qs.map(q => ({ id: q.id, v: 'x' })),
        );
        const cache = buildCache(bulkFetch);
        for (let i = 0; i < 500; i++) cache.get({ id: i });
        await tick();
        assert.equal(bulkFetch.callCount, 1);
        assert.equal(bulkFetch.args[0][0].length, 500);
    });

    it('cache.get() across multiple frames re-uses memoized results', async () => {
        const bulkFetch = sinon.spy(async (qs: Q[]) =>
            qs.map(q => ({ id: q.id, v: 'x' })),
        );
        const cache = buildCache(bulkFetch);
        cache.get({ id: 1 });
        await tick();
        // Re-render later asks for the same key: no new fetch.
        cache.get({ id: 1 });
        await tick();
        assert.equal(bulkFetch.callCount, 1);
    });

    it('overlapping renders deduplicate keys but combine new ones', async () => {
        const bulkFetch = sinon.spy(async (qs: Q[]) =>
            qs.map(q => ({ id: q.id, v: 'x' })),
        );
        const cache = buildCache(bulkFetch);
        // First render: ids 1..3
        cache.get({ id: 1 });
        cache.get({ id: 2 });
        cache.get({ id: 3 });
        await tick();
        // Second render: ids 2..5 (some overlap)
        cache.get({ id: 2 });
        cache.get({ id: 3 });
        cache.get({ id: 4 });
        cache.get({ id: 5 });
        await tick();
        assert.equal(bulkFetch.callCount, 2);
        // Second batch only includes the new keys (4, 5).
        assert.deepEqual(
            bulkFetch.args[1][0].map((q: Q) => q.id),
            [4, 5],
        );
    });
});
