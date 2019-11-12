import sinon from 'sinon';
import request from 'superagent';
import { assert } from 'chai';
import { get } from 'idb-keyval';
import { set } from 'idb-keyval';
import { keys } from 'idb-keyval';
import { clear } from 'idb-keyval';

import {
    PERSISTENT_CACHE_PREFIX,
    cacheMethods,
    clearPersistentCache,
} from './persistentApiClientCache';
import { sleep } from '../lib/TimeUtils';
import client from './cbioportalInternalClientInstance';
import { getHash } from 'cbioportal-frontend-commons';

class FakeAPIClass {}

function createFakeOkResponse() {
    return createFakeResponse(true);
}

function createFakeFailingResponse() {
    return createFakeResponse(false);
}

function createFakeResponse(ok: boolean): Promise<request.Response> {
    return new Promise<request.Response>(resolve => {
        resolve({ ok } as any);
    });
}

function createFakeRejectingResponse(): Promise<request.Response> {
    return new Promise<request.Response>((resolve, reject) => {
        reject({ ok: false } as any);
    });
}

async function waitForKeyCount(count: number) {
    let cached = await keys();
    while (cached.length != count) {
        await sleep(25);
        cached = await keys();
    }
}

describe('cacheGetMethods cache invalidation', () => {
    beforeEach('clear the cache', async () => {
        await clear();
    });

    afterEach(() => {
        (client.getAllTimestampsUsingGET as sinon.SinonStub).restore();
    });

    it('should invalidate an out of date cached endpoint', async () => {
        sinon
            .stub(client, 'getAllTimestampsUsingGET')
            .returns({ table: '9999-12-31 23:59:59' });
        const response = {
            ok: true,
            timestamp: new Date('2015-10-21 00:00:00'),
        } as any;
        const originalEndpoint = sinon.stub().returns(createFakeOkResponse());
        const api = FakeAPIClass as any;

        api.prototype.endpointGETWithHttpInfo = originalEndpoint;
        await set(
            PERSISTENT_CACHE_PREFIX + 'endpointGETWithHttpInfo?' + getHash({}),
            response
        );

        cacheMethods(api, [
            { tables: ['table'], endpoint: 'endpointGETWithHttpInfo' },
        ]);
        await api.prototype.endpointGETWithHttpInfo({});

        const actual: any = await get(
            PERSISTENT_CACHE_PREFIX + 'endpointGETWithHttpInfo?' + getHash({})
        );
        assert.isTrue(actual.timestamp > new Date('2015-10-21 00:00:00'));
        assert.deepEqual(originalEndpoint.args, [[{}]]);
    });

    it('should invalidate with one out of date table and one up to date table', async () => {
        sinon.stub(client, 'getAllTimestampsUsingGET').returns({
            upToDateTable: '1977-09-20 00:00:00',
            outOfDateTable: '9999-12-31 23:59:59',
        });
        const response = {
            ok: true,
            timestamp: new Date('2018-10-28'),
        } as any;
        const url = '/url/for/endpoint';
        const originalEndpoint = sinon.stub().returns(createFakeOkResponse());
        const api = FakeAPIClass as any;

        api.prototype.endpointGETWithHttpInfo = originalEndpoint;
        api.prototype.endpointGETURL = (_: any) => url;
        await set(PERSISTENT_CACHE_PREFIX + url, response);

        cacheMethods(api, [
            {
                tables: ['upToDateTable', 'outOfDateTable'],
                endpoint: 'endpointGETWithHttpInfo',
            },
        ]);
        await api.prototype.endpointGETWithHttpInfo({});

        const actual: any = await get(PERSISTENT_CACHE_PREFIX + url);
        assert.isTrue(actual.timestamp > new Date('2015-10-21 00:00:00'));
        assert.deepEqual(originalEndpoint.args, [[{}]]);
    });

    it('should not invalidate an not out of date cached endpoint', async () => {
        sinon
            .stub(client, 'getAllTimestampsUsingGET')
            .returns({ table: '1453-10-19 00:00:00' });
        const response = {
            ok: true,
            timestamp: new Date('2015-10-21 00:00:00'),
        } as any;
        const originalEndpoint = sinon.stub().returns(createFakeOkResponse());
        const api = FakeAPIClass as any;

        api.prototype.endpointGETWithHttpInfo = originalEndpoint;
        await set(
            PERSISTENT_CACHE_PREFIX + 'endpointGETWithHttpInfo?' + getHash({}),
            response
        );

        cacheMethods(api, [
            { tables: ['table'], endpoint: 'endpointGETWithHttpInfo' },
        ]);
        await api.prototype.endpointGETWithHttpInfo({});

        const actual: any = await get(
            PERSISTENT_CACHE_PREFIX + 'endpointGETWithHttpInfo?' + getHash({})
        );
        assert.deepEqual(actual.timestamp, new Date('2015-10-21 00:00:00'));
        assert.deepEqual(originalEndpoint.args, []);
    });
});

describe('cacheGetMethods', () => {
    beforeEach('clear the cache', async () => {
        sinon
            .stub(client, 'getAllTimestampsUsingGET')
            .returns({ table: '1993-04-06 00:00:00' });
        await clear();
    });

    afterEach(() => {
        (client.getAllTimestampsUsingGET as sinon.SinonStub).restore();
    });

    it('should create a cache enabled method for an endpoint listed', async () => {
        const originalEndpoint = sinon.stub().returns(createFakeOkResponse());
        const api = FakeAPIClass as any;
        api.prototype.endpointGETWithHttpInfo = originalEndpoint;

        cacheMethods(api, [
            { tables: ['table'], endpoint: 'endpointGETWithHttpInfo' },
        ]);
        await api.prototype.endpointGETWithHttpInfo('foo');
        // the method was replaced
        assert.notEqual(
            api.prototype.endpointGETWithHttpInfo,
            originalEndpoint
        );
    });

    it('should not create a cache enable method for an endpoint not listed', () => {
        const originalEndpoint = sinon.stub().returns(createFakeOkResponse());
        const api = FakeAPIClass as any;
        api.prototype.endpointGETWithHttpInfo = originalEndpoint;

        cacheMethods(api, []);
        api.prototype.endpointGETWithHttpInfo('foo');

        // the method was not replaced
        assert.equal(api.prototype.endpointGETWithHttpInfo, originalEndpoint);
    });

    it('should used the cached response when it exists', async () => {
        const originalEndpoint = sinon.stub().returns(createFakeOkResponse());
        const api = FakeAPIClass as any;
        api.prototype.endpointGETWithHttpInfo = originalEndpoint;

        cacheMethods(api, [
            { tables: ['table'], endpoint: 'endpointGETWithHttpInfo' },
        ]);
        await api.prototype.endpointGETWithHttpInfo({ foo: 'bar' });
        await waitForKeyCount(1);

        await api.prototype.endpointGETWithHttpInfo({ foo: 'bar' });

        assert.deepEqual(originalEndpoint.args, [[{ foo: 'bar' }]]);
    });

    it('should not cache a response if it is not ok', async () => {
        const originalEndpoint = sinon
            .stub()
            .returns(createFakeFailingResponse());
        const api = FakeAPIClass as any;
        api.prototype.endpointGETWithHttpInfo = originalEndpoint;

        cacheMethods(api, [
            { tables: ['table'], endpoint: 'endpointGETWithHttpInfo' },
        ]);
        await api.prototype.endpointGETWithHttpInfo({ foo: 'bar' });

        //wait for caching to happen
        await sleep(25);
        await api.prototype.endpointGETWithHttpInfo({ foo: 'bar' });

        // wait for caching to happen again
        await sleep(25);

        // we expect two calls to the original method because the non ok response
        // does not get cached
        assert.deepEqual(originalEndpoint.args, [
            [{ foo: 'bar' }],
            [{ foo: 'bar' }],
        ]);
        const cached = await keys();
        assert.deepEqual(cached, []);
    });

    it('should cache one response but not the other', async () => {
        const endpointToBeCached = sinon.stub().returns(createFakeOkResponse());
        const endpointToBeUncached = sinon
            .stub()
            .returns(createFakeOkResponse());

        const api = FakeAPIClass as any;
        api.prototype.cacheMeGETWithHttpInfo = endpointToBeCached;
        api.prototype.doNotCacheGETWithHttpInfo = endpointToBeUncached;

        cacheMethods(api, [
            { tables: ['table'], endpoint: 'cacheMeGETWithHttpInfo' },
        ]);
        await api.prototype.doNotCacheGETWithHttpInfo({ foo: 'bar' });
        await api.prototype.cacheMeGETWithHttpInfo({ foo: 'bar' });

        await sleep(25);

        await api.prototype.doNotCacheGETWithHttpInfo({ foo: 'bar' });
        await api.prototype.cacheMeGETWithHttpInfo({ foo: 'bar' });

        assert.deepEqual(endpointToBeCached.args, [[{ foo: 'bar' }]]);
        assert.deepEqual(endpointToBeUncached.args, [
            [{ foo: 'bar' }],
            [{ foo: 'bar' }],
        ]);
    });

    it('should complain if you tell it to cache a method of the wrong type', async () => {
        const log = sinon.stub();
        const api = FakeAPIClass as any;
        const endpointToBeCached = sinon.stub().returns(createFakeOkResponse());
        api.prototype.endpointGET = endpointToBeCached;

        cacheMethods(
            api,
            [{ tables: ['table'], endpoint: 'endpointGET' }],
            log
        );

        await api.prototype.endpointGET({ foo: 'bar' });

        await sleep(25);

        const cached = await keys();
        assert.deepEqual(cached, []);
        assert.deepEqual(endpointToBeCached.args, [[{ foo: 'bar' }]]);
        assert.deepEqual(log.args, [
            ["Attempt to cache method that does not end in 'WithHttpInfo'"],
            ['Method: endpointGET'],
            ['This method will not be cached.'],
        ]);
    });
});

async function callExpodingRequest(request: any, args: any): Promise<void> {
    try {
        await request(args);
        assert.isTrue(false);
    } catch (err) {
        assert.deepEqual(err, { ok: false });
    }
}

describe('error support', () => {
    beforeEach('clear the cache', async () => {
        sinon
            .stub(client, 'getAllTimestampsUsingGET')
            .returns({ table: '1993-04-06 00:00:00' });
        await clear();
    });

    afterEach(() => {
        (client.getAllTimestampsUsingGET as sinon.SinonStub).restore();
    });

    it('should let error handeling logic work', async () => {
        const originalEndpoint = sinon
            .stub()
            .returns(createFakeRejectingResponse());
        const api = FakeAPIClass as any;
        api.prototype.endpointGETWithHttpInfo = originalEndpoint;

        // first call to failing endpoint, then give chance for response to be cached
        cacheMethods(api, [
            { tables: ['table'], endpoint: 'endpointGETWithHttpInfo' },
        ]);
        callExpodingRequest(api.prototype.endpointGETWithHttpInfo, {
            foo: 'bar',
        });
        await sleep(25);

        // now that cache is warm, call again
        callExpodingRequest(api.prototype.endpointGETWithHttpInfo, {
            foo: 'bar',
        });

        // expect empty cache, as errors are not cached
        const cached = await keys();
        assert.deepEqual(cached, []);
        // expect two actual method calls, as the method was called twice and never cached
        assert.deepEqual(originalEndpoint.args, [
            [{ foo: 'bar' }],
            [{ foo: 'bar' }],
        ]);
    });
});

describe('clear', () => {
    beforeEach('clear the cache', async () => {
        sinon
            .stub(client, 'getAllTimestampsUsingGET')
            .returns({ table: '1993-04-06 00:00:00' });
        await clear();
    });

    afterEach(() => {
        (client.getAllTimestampsUsingGET as sinon.SinonStub).restore();
    });

    it('should clear the entire cache', async () => {
        const api = FakeAPIClass as any;
        const endpointGETWithHttpInfo = sinon
            .stub()
            .returns(createFakeOkResponse());
        const endpointBGETWithHttpInfo = sinon
            .stub()
            .returns(createFakeOkResponse());
        api.prototype.endpointGETWithHttpInfo = endpointGETWithHttpInfo;
        api.prototype.endpointBGETWithHttpInfo = endpointBGETWithHttpInfo;

        cacheMethods(api, [
            { tables: ['table'], endpoint: 'endpointGETWithHttpInfo' },
            { tables: ['table'], endpoint: 'endpointBGETWithHttpInfo' },
        ]);
        await api.prototype.endpointGETWithHttpInfo({ foo: 'bar' });
        await api.prototype.endpointBGETWithHttpInfo({ foo: 'bar' });
        waitForKeyCount(2);

        await clearPersistentCache();

        waitForKeyCount(0);
        const allKeys = await keys();
        assert.deepEqual(allKeys, []);
    });

    it('should clear just the specified domain of the cache', async () => {
        const api = FakeAPIClass as any;
        const endpointGETWithHttpInfo = sinon
            .stub()
            .returns(createFakeOkResponse());
        const endpointBGETWithHttpInfo = sinon
            .stub()
            .returns(createFakeOkResponse());
        api.prototype.endpointGETWithHttpInfo = endpointGETWithHttpInfo;
        api.prototype.endpointBGETWithHttpInfo = endpointBGETWithHttpInfo;

        cacheMethods(api, [
            { tables: ['table'], endpoint: 'endpointGETWithHttpInfo' },
            { tables: ['table'], endpoint: 'endpointBGETWithHttpInfo' },
        ]);
        await api.prototype.endpointGETWithHttpInfo({ foo: 'bar' });
        await api.prototype.endpointBGETWithHttpInfo({ foo: 'bar' });
        await waitForKeyCount(2);

        await clearPersistentCache('endpointB');

        waitForKeyCount(1);
        const allKeys = await keys();
        assert.deepEqual(allKeys, [
            'persistent-cache-endpointGETWithHttpInfo?' +
                getHash({ foo: 'bar' }),
        ]);
    });
});
