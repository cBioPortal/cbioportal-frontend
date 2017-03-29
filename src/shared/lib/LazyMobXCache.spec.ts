import { assert } from 'chai';
import {default as sinon, SinonSpy} from 'sinon';
import lolex from "lolex";
import {Clock} from "lolex";
import LazyMobXCache from "./LazyMobXCache";
import mobx from "mobx";
import {whyRun} from "mobx";

// We have to use 'done' rather than fake clock because for some reason fake clock isn't working with async/await
//  in LazyMobXCache.populate
type Query = {numAsString:string, shouldFail?:boolean, shouldDelay?: boolean, shouldNotExist?:boolean};

function useFakeClock(callback:(clock:Clock)=>void) {
    let clock = lolex.install();
    callback(clock);
    clock.uninstall();
}
describe("LazyMobXCache", ()=>{
    let cache:LazyMobXCache<number, Query>;

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
                    return Promise.resolve(data);
                }
            } else {
                return Promise.reject("fail!");
            }
        });

        cache = new LazyMobXCache<number, Query>(
            q=>q.numAsString,
            (n:number)=>Math.round((n - 3)/25)+"",
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
                    });
                    assert.deepEqual(cache.peek({
                        numAsString: "10"
                    }), {
                        status: "complete",
                        data: 253
                    });
                    assert.deepEqual(cache.peek({
                        numAsString: "15"
                    }), {
                        status: "complete",
                        data: 378
                    });
                    assert.deepEqual(cache.peek({
                        numAsString: "20"
                    }), null);
                    done();
                }
            });
        });
    });

    describe.only("#get",()=>{
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
                    });
                    reaction();
                    done();
                }
            });
        });
        it("doesnt try to fetch already resolved data", ()=>{
            useFakeClock(clock=>{
                cache.addData([253, 128, 378]);
                assert.deepEqual(cache.get({numAsString:"5"}), { status:"complete", data:128}, "returns existing data");
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
                    assert.deepEqual(secondTry, {status:"complete", data:null}, "no data available for this query");
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
                    assert.deepEqual(secondTry, {status:"error", data:null}, "an error occurred during fetch");

                    cache.get({numAsString:"6"});
                    cache.get({numAsString:"7"});
                    cache.get({numAsString:"8"});
                } else if (timesRun === 3) {
                    assert.isTrue(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="7"), "7 should have been queried");
                    assert.isTrue(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="8"), "8 should have been queried");
                    assert.isFalse(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="6"), "6 should have been queried, it already failed");

                    assert.deepEqual(cache.peek({numAsString:"7"}), {status:"complete", data:178}, "data 1 fetched successfully");
                    assert.deepEqual(cache.peek({numAsString:"8"}), {status:"complete", data:203}, "data 2 fetched successfully");
                    assert.deepEqual(cache.peek({numAsString:"6"}), {status:"error", data:null}, "error data still marked as error");

                    cache.get({numAsString:"7"});
                    cache.get({numAsString:"9"});
                    cache.get({numAsString:"10"});
                    cache.get({numAsString:"11", shouldFail:true});
                } else if (timesRun === 4) {
                    assert.isFalse(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="7"), "7 should not have been queried, it already succeeded");
                    assert.isTrue(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="9"), "9 should have been queried");
                    assert.isTrue(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="10"), "10 should have been queried");
                    assert.isTrue(!!fetch.lastCall.args[0].find((x:Query)=>x.numAsString==="11"), "11 should have been queried");

                    assert.deepEqual(cache.peek({numAsString:"7"}), {status:"complete", data:178}, "7 still there successfully from before");
                    assert.deepEqual(cache.peek({numAsString:"9"}), {status:"error", data:null}, "there was an error during fetching 9");
                    assert.deepEqual(cache.peek({numAsString:"10"}), {status:"error", data:null}, "there was an error during fetching 10");
                    assert.deepEqual(cache.peek({numAsString:"11"}), {status:"error", data:null}, "there was an error during fetching 11");
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
});