import {default as SampleGeneCache, SampleToEntrezListOrNull, Cache} from './SampleGeneCache';
import { assert, default as chai } from 'chai';
import * as _ from 'lodash';
import sinon from 'sinon';

chai.config.truncateThreshold = 0;

type Data = {
    sampleId: string;
    entrezGeneId: number;
    data: string;
};

describe('SampleGeneCache', () => {

    let data:Data[];

    let sampleIds:string[];;

    let fetchPromise:Promise<Data[]>;

    let initialCache:Cache<Data> = {};

    class CallbackCache extends SampleGeneCache<Data> {
        public async populate(sampleToEntrezList:SampleToEntrezListOrNull) {
            return super.populate(sampleToEntrezList);
        }
        protected fetch(sampleToEntrezList:SampleToEntrezListOrNull, callback:(...args:any[])=>void) {
            callback(sampleToEntrezList);
            return fetchPromise;
        }
    }

    class NumberCallbackCache extends SampleGeneCache<Data> {
        public async populate(sampleToEntrezList:SampleToEntrezListOrNull) {
            return super.populate(sampleToEntrezList);
        }
        protected fetch(sampleToEntrezList:SampleToEntrezListOrNull, n:number, callback:(x:number)=>void) {
            callback(n);
            return Promise.resolve([]);
        }
    }

    class FailingCache extends SampleGeneCache<Data> {
        public async populate(sampleToEntrezList:SampleToEntrezListOrNull) {
            return super.populate(sampleToEntrezList);
        }
        protected fetch(sampleToEntrezList:SampleToEntrezListOrNull) {
            return Promise.reject("FAIL");
        }
    }

    before(()=>{
        data = [{sampleId:"sample1", entrezGeneId:0, data:"a"}, {sampleId:"sample1", entrezGeneId:1, data:"b"},
                {sampleId:"sample2", entrezGeneId:0, data:"c"},{sampleId:"sample2", entrezGeneId:2, data:"d"}];

        sampleIds = _.uniq(data.map(d=>d.sampleId));

        fetchPromise = Promise.resolve(data);

        for (const sampleId of sampleIds) {
            initialCache[sampleId] = {
                fetchedWithoutGeneArgument: false,
                geneData: {}
            };
        }
    });

    describe("#constructor", () => {
        it("should initialize the cache properly", () => {
            const cache = new SampleGeneCache<Data>(sampleIds);
            assert.deepEqual(cache.cache, initialCache);
            assert(Object.keys(cache).length === sampleIds.length);
        });
    });

    describe("#populate", ()=> {
        it("should handle constructor dependencies correctly", (done)=>{
            let numCalled:number|null = null;
            const testNum = 123456;
            const cache = new NumberCallbackCache(sampleIds, testNum, (x:number) => { numCalled = x; });
            cache.populate({}).then(()=>{
                assert(numCalled === testNum);
                done();
            });
        });

        it("should try to fetch precisely the data it doesn't have", ()=>{
            let numTimesCalled = 0;
            let mostRecentArg = null;
            const cache = new CallbackCache(sampleIds, (arg:any)=>{
                numTimesCalled++;
                mostRecentArg = arg;
            });
            // When nothing in cache, everything gets fetched
            cache.populate({sample1:[0,1], sample2:[0,2]});
            assert(numTimesCalled === 1);
            assert.deepEqual(mostRecentArg, {sample1:[0,1], sample2:[0,2]});

            // When fetch request already loaded, don't ask for anything
            cache.populate({sample1:[0,1], sample2:[0,2]});
            assert(numTimesCalled === 2);
            assert.deepEqual(mostRecentArg, {});

            // Only ask for what's not already in there
            cache.populate({sample1:[0,1,2], sample2:[0,2,3]});
            assert(numTimesCalled === 3);
            assert.deepEqual(mostRecentArg, {sample1: [2], sample2: [3]});

            // Even though there's no data for sample1, gene 2, it's been asked for
            //  so it should be recorded that there's no data for it and not asked
            //  for again. Same for sample2, gene 3
            cache.populate({sample1:[0], sample2:[0,2,3,4]});
            assert(numTimesCalled === 4);
            assert.deepEqual(mostRecentArg, {sample2: [4]});

            // If nothing requested, nothing should be fetched
            cache.populate({});
            assert(numTimesCalled === 5);
            assert.deepEqual(mostRecentArg, {});
        });

        it("should put the data in the cache correctly, including handling missing data, and only adding requested data",(done)=>{
            const cache = new CallbackCache(sampleIds, ()=>{});
            assert.deepEqual(cache.cache, initialCache);
            cache.populate({sample1:[1,3], sample2:[0,1,2]}).then(() => {
            assert.deepEqual(cache.cache, {
                    sample1: {
                        fetchedWithoutGeneArgument: false,
                        geneData: {
                            1: { status:"complete", data: {sampleId:"sample1", entrezGeneId:1, data:"b"}},
                            3: { status:"complete", data: null}
                        }
                    },
                    sample2: {
                        fetchedWithoutGeneArgument: false,
                        geneData: {
                            0: { status:"complete", data:{sampleId:"sample2", entrezGeneId:0, data:"c"}},
                            1: { status:"complete", data: null},
                            2: { status:"complete", data: {sampleId:"sample2", entrezGeneId:2, data:"d"}},
                        }
                    }
                });
                done();
            });
        });

        it("should respond to any error by clearing all pending markers and not loading any data", (done)=>{
            const cache = new FailingCache(sampleIds);
            assert.deepEqual(cache.cache, initialCache);
            cache.populate({}).then(()=>{
                assert.deepEqual(cache.cache, initialCache);
                done();
            });
        });
    });

    describe("#data", ()=>{
        it("should return the non-null data in the cache", (done)=>{
            const cache = new CallbackCache(sampleIds, ()=>{});
            assert.deepEqual(cache.data, []);
            cache.populate({sample1:[0,1], sample2:[0,2]}).then(()=>{
                assert.deepEqual(cache.data.sort((a:Data, b:Data) => {
                    if (a.sampleId.localeCompare(b.sampleId) !== 0) {
                        return a.sampleId.localeCompare(b.sampleId);
                    } else {
                        return a.entrezGeneId - b.entrezGeneId;
                    }
                }), data);
                done();
            });
        });
    });

    after(()=>{

    });

});
