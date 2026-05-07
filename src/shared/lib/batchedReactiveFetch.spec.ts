import { assert } from 'chai';
import sinon from 'sinon';
import { autorun } from 'mobx';
import { createBatchedReactiveFetch } from './batchedReactiveFetch';

type Query = { id: number };
type Datum = { id: number; value: string };

const queryToKey = (q: Query) => `${q.id}`;
const dataToKey = (d: Datum) => `${d.id}`;

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('batchedReactiveFetch', () => {
    it('collapses N .get() calls in one tick into a single fetch', async () => {
        const fetch = sinon.spy(async (queries: Query[]): Promise<Datum[]> =>
            queries.map(q => ({ id: q.id, value: `v${q.id}` }))
        );
        const cache = createBatchedReactiveFetch({
            fetch,
            queryToKey,
            dataToKey,
        });
        for (let i = 0; i < 100; i++) cache.get({ id: i });
        await tick();
        assert.equal(fetch.callCount, 1);
        assert.equal(fetch.args[0][0].length, 100);
    });

    it('first .get() returns null, subsequent reads after fetch return data', async () => {
        const fetch = async (queries: Query[]) =>
            queries.map(q => ({ id: q.id, value: `v${q.id}` }));
        const cache = createBatchedReactiveFetch({
            fetch,
            queryToKey,
            dataToKey,
        });
        assert.isNull(cache.get({ id: 1 }));
        await tick();
        assert.deepEqual(cache.get({ id: 1 }), {
            status: 'complete',
            data: { id: 1, value: 'v1' },
        });
    });

    it('missing entries (queried but not returned) are marked complete with data:null', async () => {
        const fetch = async (queries: Query[]) =>
            queries
                .filter(q => q.id !== 99)
                .map(q => ({ id: q.id, value: 'x' }));
        const cache = createBatchedReactiveFetch({
            fetch,
            queryToKey,
            dataToKey,
        });
        cache.get({ id: 1 });
        cache.get({ id: 99 });
        await tick();
        assert.deepEqual(cache.get({ id: 99 }), {
            status: 'complete',
            data: null,
        });
    });

    it('errors mark entries as error and do not retry', async () => {
        const fetch = sinon.spy(async () => {
            throw new Error('boom');
        });
        const cache = createBatchedReactiveFetch({
            fetch,
            queryToKey,
            dataToKey,
        });
        cache.get({ id: 1 });
        await tick();
        assert.deepEqual(cache.get({ id: 1 }), {
            status: 'error',
            data: null,
        });
        assert.equal(fetch.callCount, 1);
        // Subsequent .get() of the errored key should not re-trigger fetch.
        cache.get({ id: 1 });
        await tick();
        assert.equal(fetch.callCount, 1);
    });

    it('triggers a mobx reaction when fetch completes', async () => {
        const fetch = async (queries: Query[]) =>
            queries.map(q => ({ id: q.id, value: 'ok' }));
        const cache = createBatchedReactiveFetch({
            fetch,
            queryToKey,
            dataToKey,
        });
        const observed: (ReturnType<typeof cache.get> | null)[] = [];
        const dispose = autorun(() => observed.push(cache.get({ id: 1 })));
        assert.equal(observed.length, 1);
        assert.isNull(observed[0]);
        await tick();
        assert.equal(observed.length, 2);
        assert.deepEqual(observed[1], {
            status: 'complete',
            data: { id: 1, value: 'ok' },
        });
        dispose();
    });

    it('separate ticks → separate fetch calls', async () => {
        const fetch = sinon.spy(async (queries: Query[]) =>
            queries.map(q => ({ id: q.id, value: 'x' }))
        );
        const cache = createBatchedReactiveFetch({
            fetch,
            queryToKey,
            dataToKey,
        });
        cache.get({ id: 1 });
        cache.get({ id: 2 });
        await tick();
        cache.get({ id: 3 });
        cache.get({ id: 4 });
        await tick();
        assert.equal(fetch.callCount, 2);
        assert.deepEqual(
            fetch.args[0][0].map((q: Query) => q.id),
            [1, 2]
        );
        assert.deepEqual(
            fetch.args[1][0].map((q: Query) => q.id),
            [3, 4]
        );
    });

    it('does not redundantly request keys already inflight', async () => {
        let resolveFetch: (data: Datum[]) => void = () => {};
        const fetch = sinon.spy(
            (queries: Query[]) =>
                new Promise<Datum[]>(resolve => {
                    resolveFetch = resolve;
                })
        );
        const cache = createBatchedReactiveFetch({
            fetch,
            queryToKey,
            dataToKey,
        });
        cache.get({ id: 1 });
        await tick(); // fires first fetch, still pending
        cache.get({ id: 1 }); // should NOT enqueue again
        cache.get({ id: 2 }); // new key, can enqueue
        await tick();
        assert.equal(
            fetch.callCount,
            2,
            'second fetch only contains new key 2'
        );
        assert.deepEqual(
            fetch.args[1][0].map((q: Query) => q.id),
            [2]
        );
        resolveFetch([{ id: 1, value: 'v1' }, { id: 2, value: 'v2' }]);
    });
});
