import {default as CohortVariantCountCache, EntrezToKeywordList, VariantCountCacheType} from './CohortVariantCountCache';
import { assert, default as chai } from 'chai';
import sinon from 'sinon';
import {VariantCount} from "../../../shared/api/CBioPortalAPIInternal";

chai.config.truncateThreshold = 0;


describe('CohortVariantCountCache', () => {

    let data:VariantCount[];

    let sampleIds:string[];

    let fetchPromise:Promise<VariantCount[]>;

    let initialCache:VariantCountCacheType = {
        numberOfSamples: null,
        mutationInGene: {},
        keyword: {}
    };

    class TestCache extends CohortVariantCountCache {
        public timesFetched = 0;
        public lastArg:EntrezToKeywordList;
        public geneticProfileFetched:string;
        public async populate(entrezToKeywordList:EntrezToKeywordList) {
            return super.populate(entrezToKeywordList);
        }
        protected fetch(entrezToKeywordList:EntrezToKeywordList, mutationGeneticProfileId:string) {
            this.timesFetched += 1;
            this.lastArg = entrezToKeywordList;
            this.geneticProfileFetched = mutationGeneticProfileId;
            return fetchPromise;
        }
    }

    class FailingCache extends CohortVariantCountCache {
        public async populate(entrezToKeywordList:EntrezToKeywordList) {
            return super.populate(entrezToKeywordList);
        }
        protected fetch(entrezToKeywordList:EntrezToKeywordList) {
            return Promise.reject("FAIL");
        }
    }

    before(()=>{

        data = [
            {
                entrezGeneId:0,
                geneticProfileId:"",
                keyword:"GENE0 KEYWORD0",
                numberOfSamples:10,
                numberOfSamplesWithKeyword:1,
                numberOfSamplesWithMutationInGene:5
            },
            {
                entrezGeneId:0,
                geneticProfileId:"",
                keyword:"GENE0 KEYWORD1",
                numberOfSamples:10,
                numberOfSamplesWithKeyword:4,
                numberOfSamplesWithMutationInGene:5
            },
            {
                entrezGeneId:1,
                geneticProfileId:"",
                keyword:"GENE1 KEYWORD0",
                numberOfSamples:10,
                numberOfSamplesWithKeyword:6,
                numberOfSamplesWithMutationInGene:8
            },
            {
                entrezGeneId:2,
                geneticProfileId:"",
                keyword:"",
                numberOfSamples:10,
                numberOfSamplesWithKeyword:-1,
                numberOfSamplesWithMutationInGene:9
            },
            {
                entrezGeneId:2,
                geneticProfileId:"",
                keyword:"GENE2 KEYWORD0",
                numberOfSamples:10,
                numberOfSamplesWithKeyword:3,
                numberOfSamplesWithMutationInGene:9
            }];


        fetchPromise = Promise.resolve(data);
    });

    describe("#constructor", () => {
        it("should initialize the cache properly", () => {
            const cache = new CohortVariantCountCache("HELLO");
            assert.deepEqual(cache.cache, initialCache);
        });
    });

    describe("#populate", ()=> {
        it("should query using the genetic profile id given to constructor", (done)=>{
            const cache = new TestCache("HELLO");
            cache.populate({}).then(()=>{
                assert(cache.geneticProfileFetched === "HELLO");
                assert(cache.timesFetched === 1);
                done();
            });
        });

        it("should try to fetch precisely the data it doesn't have, and add it correctly", async()=>{
            const cache = new TestCache("HELLO");
            assert.deepEqual(cache.cache, initialCache);

            await cache.populate({0:["GENE0 KEYWORD0", "GENE0 KEYWORD1"]});
            assert(cache.timesFetched === 1);
            assert.deepEqual(cache.lastArg, {0:["GENE0 KEYWORD0", "GENE0 KEYWORD1"]});
            assert.deepEqual(cache.cache, {
                numberOfSamples:10,
                mutationInGene:{
                    0: {status:"complete", data:5}
                },
                keyword:{
                    "GENE0 KEYWORD0": {status:"complete", data:1},
                    "GENE0 KEYWORD1": {status:"complete", data:4}
                }
            });

            await cache.populate({0:["GENE0 KEYWORD0", "GENE0 KEYWORD1"]});
            assert(cache.timesFetched === 2);
            assert.deepEqual(cache.lastArg, {});
            assert.deepEqual(cache.cache, {
                numberOfSamples:10,
                mutationInGene:{
                    0: {status:"complete", data:5}
                },
                keyword:{
                    "GENE0 KEYWORD0": {status:"complete", data:1},
                    "GENE0 KEYWORD1": {status:"complete", data:4}
                }
            });

            await cache.populate({1:["GENE1 KEYWORD0"], 2:[]});
            assert(cache.timesFetched === 3);
            assert.deepEqual(cache.lastArg, {1:["GENE1 KEYWORD0"], 2:[]});
            assert.deepEqual(cache.cache, {
                numberOfSamples:10,
                mutationInGene:{
                    0: {status:"complete", data:5},
                    1: {status:"complete", data:8},
                    2: {status:"complete", data:9}
                },
                keyword:{
                    "GENE0 KEYWORD0": {status:"complete", data:1},
                    "GENE0 KEYWORD1": {status:"complete", data:4},
                    "GENE1 KEYWORD0": {status:"complete", data:6}
                }
            });

            await cache.populate({1:["GENE1 KEYWORD0"], 2:["GENE2 KEYWORD0"]});
            assert(cache.timesFetched === 4);
            assert.deepEqual(cache.lastArg, {2:["GENE2 KEYWORD0"]});
            assert.deepEqual(cache.cache, {
                numberOfSamples:10,
                mutationInGene:{
                    0: {status:"complete", data:5},
                    1: {status:"complete", data:8},
                    2: {status:"complete", data:9}
                },
                keyword:{
                    "GENE0 KEYWORD0": {status:"complete", data:1},
                    "GENE0 KEYWORD1": {status:"complete", data:4},
                    "GENE1 KEYWORD0": {status:"complete", data:6},
                    "GENE2 KEYWORD0": {status:"complete", data:3}
                }
            });

            await cache.populate({3:[]});
            assert(cache.timesFetched === 5);
            assert.deepEqual(cache.lastArg, {3:[]});
            assert.deepEqual(cache.cache, {
                numberOfSamples:10,
                mutationInGene:{
                    0: {status:"complete", data:5},
                    1: {status:"complete", data:8},
                    2: {status:"complete", data:9},
                    3: {status:"complete", data:null}
                },
                keyword:{
                    "GENE0 KEYWORD0": {status:"complete", data:1},
                    "GENE0 KEYWORD1": {status:"complete", data:4},
                    "GENE1 KEYWORD0": {status:"complete", data:6},
                    "GENE2 KEYWORD0": {status:"complete", data:3}
                }
            });

            await cache.populate({3:["KW"]});
            assert(cache.timesFetched === 6);
            assert.deepEqual(cache.lastArg, {3:["KW"]});
            assert.deepEqual(cache.cache, {
                numberOfSamples:10,
                mutationInGene:{
                    0: {status:"complete", data:5},
                    1: {status:"complete", data:8},
                    2: {status:"complete", data:9},
                    3: {status:"complete", data:null}
                },
                keyword:{
                    "GENE0 KEYWORD0": {status:"complete", data:1},
                    "GENE0 KEYWORD1": {status:"complete", data:4},
                    "GENE1 KEYWORD0": {status:"complete", data:6},
                    "GENE2 KEYWORD0": {status:"complete", data:3},
                    "KW": {status:"complete", data:null}
                }
            });

            await cache.populate({3:["KW"]});
            assert(cache.timesFetched === 7);
            assert.deepEqual(cache.lastArg, {});
            assert.deepEqual(cache.cache, {
                numberOfSamples:10,
                mutationInGene:{
                    0: {status:"complete", data:5},
                    1: {status:"complete", data:8},
                    2: {status:"complete", data:9},
                    3: {status:"complete", data:null}
                },
                keyword:{
                    "GENE0 KEYWORD0": {status:"complete", data:1},
                    "GENE0 KEYWORD1": {status:"complete", data:4},
                    "GENE1 KEYWORD0": {status:"complete", data:6},
                    "GENE2 KEYWORD0": {status:"complete", data:3},
                    "KW": {status:"complete", data:null}
                }
            });

            await cache.populate({});
            assert(cache.timesFetched === 8);
            assert.deepEqual(cache.lastArg, {});
            assert.deepEqual(cache.cache, {
                numberOfSamples:10,
                mutationInGene:{
                    0: {status:"complete", data:5},
                    1: {status:"complete", data:8},
                    2: {status:"complete", data:9},
                    3: {status:"complete", data:null}
                },
                keyword:{
                    "GENE0 KEYWORD0": {status:"complete", data:1},
                    "GENE0 KEYWORD1": {status:"complete", data:4},
                    "GENE1 KEYWORD0": {status:"complete", data:6},
                    "GENE2 KEYWORD0": {status:"complete", data:3},
                    "KW": {status:"complete", data:null}
                }
            });
            return true;
        });

        it("should respond to any error by clearing all pending markers and not loading any data", async()=>{
            const cache = new FailingCache("HELLO");
            assert.deepEqual(cache.cache, initialCache);
            await cache.populate({0:["kwA1", "kwA2"], 1:[]});
            assert.deepEqual(cache.cache, initialCache);
            return true;
        });
    });

    after(()=>{

    });

});
