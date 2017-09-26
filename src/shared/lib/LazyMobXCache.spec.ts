import { assert } from 'chai';
import {default as sinon, SinonSpy} from 'sinon';
import lolex from "lolex";
import {Clock} from "lolex";
import {default as LazyMobXCache, CacheData} from "./LazyMobXCache";
import mobx, {autorun, IReactionDisposer, observable, reaction} from "mobx";
import {whyRun} from "mobx";
import {remoteData} from "../api/remoteData";

// We have to use 'done' rather than fake clock because for some reason fake clock isn't working with async/await
//  in LazyMobXCache.populate
type Query = {numAsString:string, shouldFail?:boolean, shouldDelay?: boolean, shouldNotExist?:boolean, meta?:string};

function useFakeClock(callback:(clock:Clock)=>void) {
    let clock = lolex.install();
    callback(clock);
    clock.uninstall();
}
describe("LazyMobXCache", ()=>{
    let cache:LazyMobXCache<number, Query, string>;

    let fetch:SinonSpy;
    beforeEach(()=>{
        fetch = sinon.spy((queries:Query[],
                           multiplier:number, translator:number)=>{
            let data:number[] | null = [];
            for (let i=0; i<queries.length; i++) {
                if (queries[i].shouldFail) {
                    data = null;
                    break;
                } else if (!queries[i].shouldNotExist) {
                    data.push((parseInt(queries[i].numAsString, 10)*multiplier) + translator);
                }
            }
            if (data) {
                if (queries.find((query:Query)=>!!query.shouldDelay)) {
                    return new Promise((resolve, reject)=>{
                        setTimeout(()=>{
                            resolve(data as number[]);
                        }, 1000);
                    });
                } else {
                    let meta:string | undefined = (queries.find(q=>!!q.meta) || {meta:undefined}).meta;
                    if (meta) {
                        return Promise.resolve([{data, meta}]);
                    } else {
                        return Promise.resolve(data);
                    }
                }
            } else {
                return Promise.reject("fail!");
            }
        });

        cache = new LazyMobXCache<number, Query, string>(
            q=>q.numAsString+(q.meta || ""),
            (n:number, m?:string)=>{
                return Math.round((n - 3)/25)+(m || "");
            },
            fetch,
            25, 3
        );
    });
    describe("#addData", ()=>{
        it("adds data properly, and returns data using #peek if it exists in the cache", (done)=>{
            let timesRun = 0;
            let reaction = mobx.autorun(()=>{
                timesRun += 1;
                if (timesRun === 1) {
                    // Initially, no data
                    assert.deepEqual(cache.peek({
                        numAsString: "5"
                    }), null);
                    assert.deepEqual(cache.peek({
                        numAsString: "10"
                    }), null);
                    assert.deepEqual(cache.peek({
                        numAsString: "15"
                    }), null);

                    setTimeout(()=>cache.addData([253, 128, 378]), 0); // gotta schedule it so itll trigger another autorun
                } else if (timesRun === 2) {
                    assert.isFalse(fetch.called, "fetch should never have been called");
                    assert.deepEqual(cache.peek({
                        numAsString: "5"
                    }), {
                        status: "complete",
                        data: 128
                    } as CacheData<number, string>);
                    assert.deepEqual(cache.peek({
                        numAsString: "10"
                    }), {
                        status: "complete",
                        data: 253
                    } as CacheData<number, string>);
                    assert.deepEqual(cache.peek({
                        numAsString: "15"
                    }), {
                        status: "complete",
                        data: 378
                    } as CacheData<number, string>);
                    assert.deepEqual(cache.peek({
                        numAsString: "20"
                    }), null);
                    done();
                }
            });
        });
    });

    describe("#get",()=>{
        it("passes static dependencies into fetch correctly", ()=>{
            useFakeClock(clock=>{
                cache.get({
                    numAsString:"5"
                });
                clock.tick(100);
                assert.equal(fetch.getCall(0).args[1], 25, "first static dependency passed in correctly");
                assert.equal(fetch.getCall(0).args[2], 3, "second static dependency passed in correctly");
            });
        });
        it("returns data if it exists", (done)=>{
            let timesRun = 0;
            let reaction = mobx.autorun(()=>{
                timesRun += 1;
                let datum = cache.get({
                    numAsString:"5"
                });
                if (timesRun === 1) {
                    assert.isNull(datum, "no data when first checking for it");
                } else if (timesRun === 2) {
                    assert.isTrue(fetch.calledOnce, "fetch has been called once");
                    assert.deepEqual(datum, {
                        status: "complete",
                        data: 128
                    } as CacheData<number, string>);
                    reaction();
                    done();
                }
            });
        });
        it("doesnt try to fetch already resolved data", ()=>{
            useFakeClock(clock=>{
                cache.addData([253, 128, 378]);
                assert.deepEqual(cache.get({numAsString:"5"}), { status:"complete", data:128} as CacheData<number, string>, "returns existing data");
                clock.tick(100);
                assert.isFalse(fetch.called, "fetch shouldnt be called at all for existing queries");
                cache.get({numAsString:"15"});
                cache.get({numAsString:"10"});
                cache.get({numAsString:"20"});
                clock.tick(100);
                assert.isTrue(fetch.calledOnce, "fetch should only have been called once");
                assert.deepEqual(fetch.getCall(0).args[0], [{numAsString:"20"}],
                    "should only have fetched the missing data");
            });
        });
        it("doesnt try to double-fetch data that has already been requested and is pending", ()=>{
            useFakeClock(clock=>{
                cache.get({numAsString:"5", shouldDelay:true});
                clock.tick(500);
                assert.isTrue(fetch.calledOnce, "fetch was called once");
                assert.isNull(cache.peek({numAsString:"5"}), "this data is still pending, not resolved");
                cache.get({numAsString:"5"});
                clock.tick(4000);
                assert.isTrue(fetch.calledOnce, "fetch should not have been called again because the only data requested was already pending");
            });
        });
        it("returns no data if no data exists", (done)=>{
            let timesRun = 0;
            let reaction = mobx.autorun(()=>{
                timesRun += 1;
                if (timesRun === 1) {
                    let firstTry = cache.get({numAsString:"6", shouldNotExist:true});
                    assert.isNull(firstTry, "returns null if data pending");
                } else if (timesRun === 2) {
                    let secondTry = cache.get({numAsString:"6"});
                    assert.deepEqual(secondTry, {status:"complete", data:null} as CacheData<number, string>, "no data available for this query");
                    reaction();
                    done();
                }
            });
        });
        it("returns an error if fetching failed, and doesnt try to fetch data that has errored", (done)=>{
            let timesRun = 0;
            let reaction = mobx.autorun(()=>{
                timesRun += 1;
                if (timesRun === 1) {
                    let firstTry = cache.get({numAsString:"6", shouldFail:true});
                    assert.isNull(firstTry, "returns null if data pending");
                } else if (timesRun === 2) {
                    let secondTry = cache.get({numAsString:"6"});
                    assert.deepEqual(secondTry, {status:"error", data:null} as CacheData<number, string>, "an error occurred during fetch");

                    cache.get({numAsString:"6"});
                    cache.get({numAsString:"7"});
                    cache.get({numAsString:"8"});
                } else if (timesRun === 3) {
                    assert.isTrue(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="7"), "7 should have been queried");
                    assert.isTrue(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="8"), "8 should have been queried");
                    assert.isFalse(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="6"), "6 should have been queried, it already failed");

                    assert.deepEqual(cache.peek({numAsString:"7"}), {status:"complete", data:178} as CacheData<number, string>, "data 1 fetched successfully");
                    assert.deepEqual(cache.peek({numAsString:"8"}), {status:"complete", data:203} as CacheData<number, string>, "data 2 fetched successfully");
                    assert.deepEqual(cache.peek({numAsString:"6"}), {status:"error", data:null} as CacheData<number, string>, "error data still marked as error");

                    cache.get({numAsString:"7"});
                    cache.get({numAsString:"9"});
                    cache.get({numAsString:"10"});
                    cache.get({numAsString:"11", shouldFail:true});
                } else if (timesRun === 4) {
                    assert.isFalse(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="7"), "7 should not have been queried, it already succeeded");
                    assert.isTrue(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="9"), "9 should have been queried");
                    assert.isTrue(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="10"), "10 should have been queried");
                    assert.isTrue(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="11"), "11 should have been queried");

                    assert.deepEqual(cache.peek({numAsString:"7"}), {status:"complete", data:178} as CacheData<number, string>, "7 still there successfully from before");
                    assert.deepEqual(cache.peek({numAsString:"9"}), {status:"error", data:null} as CacheData<number, string>, "there was an error during fetching 9");
                    assert.deepEqual(cache.peek({numAsString:"10"}), {status:"error", data:null} as CacheData<number, string>, "there was an error during fetching 10");
                    assert.deepEqual(cache.peek({numAsString:"11"}), {status:"error", data:null} as CacheData<number, string>, "there was an error during fetching 11");
                    reaction();
                    done();
                }
            });
        });
        it("adds data using metadata given by fetch", (done)=>{
            let timesRun = 0;
            let reaction = mobx.autorun(()=>{
                timesRun += 1;
                let datum = cache.get({
                    numAsString:"5",
                    meta:"Q"
                });
                if (timesRun === 1) {
                    assert.isNull(datum, "no data when first checking for it");
                } else if (timesRun === 2) {
                    assert.isTrue(fetch.calledOnce, "fetch has been called once");
                    assert.deepEqual(datum, {
                        status: "complete",
                        data: 128,
                        meta: "Q"
                    } as CacheData<number, string>, "data found using key with metadata");
                    assert.equal(cache.peek({ numAsString: "5"}), null, "no data found when querying without metadata");
                    reaction();
                    done();
                }
            });
        });

        it("returns null if fetch pending", ()=>{
            assert.isNull(cache.get({numAsString:"6"}));
        });
        it("debounces calls to get", ()=>{
            useFakeClock(clock=>{
                cache.get({numAsString:"1"});
                clock.tick(1000);
                assert.equal(fetch.callCount, 1);
                cache.get({numAsString:"2"});
                cache.get({numAsString:"3"});
                cache.get({numAsString:"4"});
                clock.tick(1000);
                assert.equal(fetch.callCount, 2);
                cache.get({numAsString:"5"});
                cache.get({numAsString:"6"});
                cache.get({numAsString:"7"});
                cache.get({numAsString:"8"});
                cache.get({numAsString:"9"});
                cache.get({numAsString:"10"});
                cache.get({numAsString:"11"});
                cache.get({numAsString:"12"});
                cache.get({numAsString:"13"});
                clock.tick(1000);
                assert.equal(fetch.callCount, 3);
                cache.get({numAsString:"14"});
                clock.tick(1000);
                assert.equal(fetch.callCount, 4);
                clock.tick(1000);
                assert.equal(fetch.callCount, 4);
            });
        });
        it("triggers any mobx reaction that touches the cache when its updated", (done)=>{
                let peekFn = sinon.spy(()=>{
                    cache.peek({numAsString:"2"});
                    if (peekFn.callCount === 2 && cacheFn.callCount === 2 && getFn.callCount === 2) {
                        peekReaction();
                        cacheReaction();
                        getReaction();
                        done();
                    }
                });
                let cacheFn = sinon.spy(()=>{
                    cache.cache;
                    if (peekFn.callCount === 2 && cacheFn.callCount === 2 && getFn.callCount === 2) {
                        peekReaction();
                        cacheReaction();
                        getReaction();
                        done();
                    }
                });
                let getFn = sinon.spy(()=>{
                    cache.get({numAsString:"2"});
                    if (peekFn.callCount === 2 && cacheFn.callCount === 2 && getFn.callCount === 2) {
                        peekReaction();
                        cacheReaction();
                        getReaction();
                        done();
                    }
                });
                assert.equal(peekFn.callCount, 0);
                assert.equal(cacheFn.callCount, 0);
                assert.equal(getFn.callCount, 0);
                let peekReaction = mobx.autorun(peekFn);
                let cacheReaction = mobx.autorun(cacheFn);
                let getReaction = mobx.autorun(getFn);
                assert.equal(peekFn.callCount, 1);
                assert.equal(cacheFn.callCount, 1);
                assert.equal(getFn.callCount, 1);
        });
    });
    describe.only("#await", ()=>{
        it("does not cause observation of the cache, aka only responds to what its awaiting", (done)=>{
            let disposer:IReactionDisposer;
            let shouldFail = true;
            let rd = remoteData({
                await:()=>[cache.await([{numAsString:"3"}])],
                invoke:()=>{
                    if (shouldFail) {
                        assert(false);
                    } else {
                        disposer();
                        done();
                    }
                    return Promise.resolve({});
                }
            });
            disposer = autorun(()=>{
                rd.status; // set up reaction to trigger this
            });
            cache.addData([1]); // mobx is synchronous, so this would get to the false assertion
            shouldFail = false;
            cache.addData([3]);
        });
        it("resolves immediately if the selected query is already there: empty", (done)=>{
            let rd = cache.await([]);
            let assertionReached = false;
            let disposer = autorun(()=>{
                if (rd.isComplete) {
                    disposer();
                    assert.isTrue(assertionReached);
                    done();
                }
                assert.equal(cache.pendingPromisesCount, 0);
                assertionReached = true;
            });
        });
        it.only("resolves if the selected query is already there: one", (done)=>{
            cache.addData([1]);
            let rd = cache.await([{numAsString:"1"}]);
            let assertionReached = false;
            let disposer = autorun(()=>{
                console.log("HELLOOOO");
                if (rd.isComplete) {
                    disposer();
                    assert.isTrue(assertionReached);
                    done();
                }
                assert.equal(cache.pendingPromisesCount, 0);
                assertionReached = true;
            });
        });
        it.only("resolves if the selected query is already there: several", (done)=>{
            cache.addData([1,2,3]);
            let rd = cache.await([{numAsString:"1"},{numAsString:"2"},{numAsString:"3"}]);
            let assertionReached = false;
            let disposer = autorun(()=>{
                console.log("GOODBYEEEEE");
                if (rd.isComplete) {
                    disposer();
                    assert.isTrue(assertionReached);
                    done();
                }
                assert.equal(cache.pendingPromisesCount, 0);
                assertionReached = true;
            });
        });
        it("resolves when the selected queries become available", (done)=>{
            let disposer:IReactionDisposer;
            let rd = remoteData({
                await: ()=>[cache.await([{numAsString:"1"}, {numAsString:"4"}])],
                invoke:()=>{
                    assert.deepEqual(
                        cache.await([{numAsString:"1"}, {numAsString:"4"}]).result!.map(x=>x.data), [28, 103]
                    );
                    disposer();
                    done();
                    return Promise.resolve();
                }
            });
            disposer = autorun(()=>{
                rd.status; // set up reaction to trigger
            });
        });
        it("errors if there is an error", (done)=>{
            let disposer:IReactionDisposer;
            let rd = cache.await([{numAsString:"1"}, {numAsString:"4", shouldFail:true}]);
            disposer = autorun(()=>{
                if (rd.isError) {
                    disposer();
                    done();
                } else if (rd.isComplete) {
                    assert(false); // shouldnt get here
                }
            });
        });
        it("can handle multiple pending listeners", (done)=>{
            assert.equal(cache.pendingPromisesCount, 0);
            let rd1 = cache.await([{numAsString:"1"}]);
            rd1.status; // trigger
            assert.equal(cache.pendingPromisesCount, 1);
            let rd2 = cache.await([{numAsString:"2"}]);
            rd2.status; // trigger
            assert.equal(cache.pendingPromisesCount, 2);
            let rd3 = cache.await([{numAsString:"2"}, {numAsString:"3"}, {numAsString:"4"}]);
            rd3.status; // trigger
            assert.equal(cache.pendingPromisesCount, 3);

            let disposer:IReactionDisposer;
            disposer = autorun(()=>{
                if (!rd1.isComplete) {
                    assert.equal(cache.pendingPromisesCount, 3);
                    cache.addData([1]);
                } else if (!rd2.isComplete) {
                    assert.equal(cache.pendingPromisesCount, 2);
                    cache.addData([2]);
                } else if (!rd3.isComplete) {
                    assert.equal(cache.pendingPromisesCount, 1);
                    cache.addData([3,4]);
                } else if (rd1.isComplete && rd2.isComplete && rd3.isComplete) {
                    assert.equal(cache.pendingPromisesCount, 0);
                    disposer();
                    done();
                }
            });
        });
        it("unregisters a listener once it has been resolved", (done)=>{
            assert.equal(cache.pendingPromisesCount, 0);
            let rd = cache.await([{numAsString:"1"}]);
            let gottenToEnd = false;
            let disposer = autorun(()=>{
                if (rd.isComplete) {
                    assert.isTrue(gottenToEnd);
                    assert.equal(cache.pendingPromisesCount, 0);
                    disposer();
                    done();
                }
            });
            assert.equal(cache.pendingPromisesCount, 1);
            gottenToEnd = true;
            cache.addData([1]);
        });
        it("unregisters a listener once it has errored", (done)=>{
            assert.equal(cache.pendingPromisesCount, 0);
            let rd = cache.await([{numAsString:"1", shouldFail: true}]);
            let gottenToEnd = false;
            let disposer = autorun(()=>{
                if (rd.isError) {
                    assert.isTrue(gottenToEnd);
                    assert.equal(cache.pendingPromisesCount, 0);
                    disposer();
                    done();
                }
            });
            assert.equal(cache.pendingPromisesCount, 1);
            gottenToEnd = true;
            cache.addData([1]);
        });
    });
});
