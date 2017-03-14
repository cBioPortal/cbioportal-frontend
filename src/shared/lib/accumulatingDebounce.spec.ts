import { assert } from 'chai';
import accumulatingDebounce from "./accumulatingDebounce";
import sinon from 'sinon';
import {AccumulatingDebouncedFunction} from "./accumulatingDebounce";

/*(fn:(acc:AccumulatorType)=>void,
 addArgs:(acc:AccumulatorType, ...next:ArgsType[])=>AccumulatorType,
 init:AccumulatorType,
 wait:number):(...next:ArgsType[])=>void*/

describe('accumulatingDebounce', ()=>{

    before(()=>{

    });

    it("calls the add function once, followed by the final function, when the returned function is called once", (done)=>{
        let deb:AccumulatingDebouncedFunction<any>;
        const finalFn = ()=>{
            assert(addFn.calledOnce, "add function called exactly once, before the final function");
            assert(true, "final function called");
        };
        const addFn = sinon.spy(()=>{ return {}; });
        deb = accumulatingDebounce(finalFn, addFn, ()=>{return {};}, 0, ()=>{
            assert(!deb.isPending(), "final function wont be called again");
            done();
        });

        assert(!deb.isPending(), "before being called, no timeout is pending");
        deb();
    });

    it("calls the add function three times, followed by the final function once, when the returned function is called "+
            "three times in succession", (done)=>{
        let deb:AccumulatingDebouncedFunction<any>;
        const finalFn = ()=>{
            assert(addFn.callCount === 3, "add function called three times, before the final function called once");
            assert(true, "final function called");
        };
        const addFn = sinon.spy(()=>{ return {}; });
        const afterTimeoutExpire = sinon.spy(()=>{
            if (afterTimeoutExpire.callCount === 1) {
                assert(addFn.callCount === 3, "add function called three times before the first timeout expire");
                assert(deb.isPending(), "final function will be called again, because there has been an add call "+
                                        "(actually, 2) since the timeout was set");
            } else {
                assert(afterTimeoutExpire.callCount === 2, "timeout expired only twice");
                assert(addFn.callCount === 3, "no additional add calls triggered since last timeout expire");
                assert(!deb.isPending(), "final function will not be called again");
                done();
            }
        });
        deb = accumulatingDebounce(finalFn, addFn, ()=>{return {};}, 0, afterTimeoutExpire);
        deb();
        deb();
        deb();
    });

    it("accumulates arguments as specified, and only triggers the final function with them once per burst", (done)=>{
        let deb:AccumulatingDebouncedFunction<number>;

        let finalFnCalls = 0;
        let expiredTimeouts = 0;
        const finalFn = (arg:number[])=>{
            finalFnCalls++;
            if (finalFnCalls === 1) {
                assert.deepEqual(arg, [1,2,3,4,5], "first burst of arguments should be accumulated");
            } else if (finalFnCalls === 2) {
                assert.deepEqual(arg, [6], "second burst of arguments accumulated");
            } else if (finalFnCalls === 3) {
                assert.deepEqual(arg, [7,8], "third burst of arguments accumulated");
                done();
            }
        };
        const addFn = (acc:number[], arg:number)=>{
            acc.push(arg);
            return acc;
        };

        deb = accumulatingDebounce(finalFn, addFn, ()=>[], 0, ()=>{
            expiredTimeouts++;
            if (finalFnCalls === 1 && expiredTimeouts === 2) {
                assert(!deb.isPending(), "before we add more arguments, no timeout is set to happen");
                deb(6);
                assert(deb.isPending(), "after adding arguments, timeout is set to happen");
            } else if (finalFnCalls === 2 && expiredTimeouts === 3) {
                assert(!deb.isPending(), "before we add more arguments, no timeout is set to happen");
                deb(7);
                deb(8);
                assert(deb.isPending(), "after adding arguments, timeout is set to happen");
            }
        });
        deb(1);
        deb(2);
        deb(3);
        deb(4);
        deb(5);
    });
});