import { assert } from 'chai';
import {remoteData} from "../api/remoteData";
import onMobxPromise from "./onMobxPromise";
import {autorun, extras, IReactionDisposer, observable} from "mobx";
import {sleep, sleepUntil} from "./TimeUtils";
import * as React from "react";
import { mount } from 'enzyme';
import ReactDOM from 'react-dom';


class Test1 extends React.Component<any, any>{
    // doesnt have componentWillUnmount
    render() {
        return <span/>;
    }
}

class Test2 extends React.Component<{obj:{x:number}}, any>{
    componentWillUnmount() {
        this.props.obj.x += 1;
    }
    render() {
        return <span/>;
    }
}

describe('onMobxPromise', ()=>{
    it('executes the given callback with the result when the mobx promise completes', (done)=>{
        let promiseInvokeCount = 0;
        let promise = remoteData({
            invoke:async ()=>{
                promiseInvokeCount +=1;
                return 5;
            }
        });
        assert.equal(promiseInvokeCount, 0, "promise not invoked yet");
        onMobxPromise(promise, (result:number)=>{
            assert.equal(promiseInvokeCount, 1, "promise invoked once");
            assert.equal(result, 5, "promise invoked with right result");
            done();
        });
    });
    it('executes the given callback with the results when the mobx promises complete', (done)=>{
        let promiseInvokeCount = 0;
        let promise1 = remoteData({
            invoke:async ()=>{
                promiseInvokeCount +=1;
                return 5;
            }
        });
        let promise2 = remoteData({
            invoke:async ()=>{
                promiseInvokeCount +=1;
                return 6;
            }
        });
        let promise3 = remoteData({
            invoke:async ()=>{
                promiseInvokeCount +=1;
                return 7;
            }
        });
        assert.equal(promiseInvokeCount, 0, "promise not invoked yet");
        onMobxPromise([promise1, promise2, promise3], (result1:number, result2:number, result3:number)=>{
            assert.equal(promiseInvokeCount, 3, "promises each invoked once");
            assert.equal(result1, 5, "promise invoked with right result");
            assert.equal(result2, 6, "promise invoked with right result");
            assert.equal(result3, 7, "promise invoked with right result");
            done();
        });
    });
    it('executes the given callback the specified number of times', async()=>{
        let handlerInvokeCount = 0;
        let promiseResult = observable(0);
        let lastInvokedPromiseResult = 0;
        let promise = remoteData({
            invoke:async ()=>{
                lastInvokedPromiseResult = promiseResult.get();
                return lastInvokedPromiseResult;
            }
        });
        onMobxPromise(promise, (result:number)=>{
            assert.equal(result, lastInvokedPromiseResult, "promise invoked with result = lastInvokedPromiseResult");
            handlerInvokeCount += 1;
        }, undefined,5);
        for (let i=0; i<10; i++) {
            promiseResult.set(promiseResult.get() + 1);
            await sleep(0);
        }
        assert.equal(promiseResult.get(), 10);
        assert.equal(handlerInvokeCount, 5);
    });
    it('executes immediately if the promise is already resolved, does not execute again', async()=>{

        let handlerInvokeCount = 0;
        let promiseResult = observable(0);
        let lastInvokedPromiseResult = 0;
        let promise = remoteData({
            invoke:async ()=>{
                lastInvokedPromiseResult = promiseResult.get();
                return lastInvokedPromiseResult;
            }
        });

        autorun(()=>{ promise.result; }); // get promise to run

        await sleepUntil(()=>promise.isComplete); // wait until promise is resolved

        // so now we know promise is loaded
        onMobxPromise(promise, (result:number)=>{
            assert.equal(result, 0, "promise invoked with result = 0");
            handlerInvokeCount += 1;
        }, undefined, 1);
        await sleep(0);

        assert.equal(handlerInvokeCount, 1, "onMobxPromise immediately executed");

        for (let i=0; i<10; i++) {
            promiseResult.set(promiseResult.get() + 1);
            await sleep(0);
        }
        assert.equal(promiseResult.get(), 10);
        assert.equal(handlerInvokeCount, 1, "never executed again");
    });
    it("automatically disposes if the target component unmounts -- case 1: no componentWillUnmount in component", async()=>{
        let handlerInvokeCount = 0;
        let promiseResult = observable(0);
        let lastInvokedPromiseResult = 0;
        let promise = remoteData({
            invoke:async ()=>{
                lastInvokedPromiseResult = promiseResult.get();
                return lastInvokedPromiseResult;
            }
        });

        // mount component
        let mountElt = document.createElement("div");
        let targetComponent = ReactDOM.render(<Test1/>, mountElt);
        await sleep(0);
        // pass targetComponent into mobxpromise
        onMobxPromise(promise, (result:number)=>{
            assert.equal(result, lastInvokedPromiseResult, "promise invoked with result = lastInvokedPromiseResult");
            handlerInvokeCount += 1;
        },  targetComponent as any, 5);
        for (let i=0; i<3; i++) {
            promiseResult.set(promiseResult.get() + 1);
            await sleep(0);
        }
        // it should have responded each time
        assert.equal(promiseResult.get(), 3);
        assert.equal(handlerInvokeCount, 3);
        // unmount component
        ReactDOM.unmountComponentAtNode(mountElt);
        await sleep(0);
        // it should no longer react to promise changes
        for (let i=0; i<10; i++) {
            promiseResult.set(promiseResult.get() + 1);
            await sleep(0);
        }
        // it should not have reacted anymore
        assert.equal(promiseResult.get(), 13);
        assert.equal(handlerInvokeCount, 3);
    });
    it("automatically disposes if the target component unmounts -- case 2: componentWillUnmount in component", async()=>{
        let handlerInvokeCount = 0;
        let promiseResult = observable(0);
        let lastInvokedPromiseResult = 0;
        let promise = remoteData({
            invoke:async ()=>{
                lastInvokedPromiseResult = promiseResult.get();
                return lastInvokedPromiseResult;
            }
        });

        // mount component
        let mountElt = document.createElement("div");
        let obj = { x: 0 };
        let targetComponent = ReactDOM.render(<Test2 obj={obj}/>, mountElt);
        await sleep(0);
        // pass targetComponent into mobxpromise
        onMobxPromise(promise, (result:number)=>{
            assert.equal(result, lastInvokedPromiseResult, "promise invoked with result = lastInvokedPromiseResult");
            handlerInvokeCount += 1;
        }, targetComponent as any, 5);
        for (let i=0; i<3; i++) {
            promiseResult.set(promiseResult.get() + 1);
            await sleep(0);
        }
        // it should have responded each time
        assert.equal(promiseResult.get(), 3);
        assert.equal(handlerInvokeCount, 3);
        // unmount component
        ReactDOM.unmountComponentAtNode(mountElt);
        await sleep(0);
        // it should no longer react to promise changes
        for (let i=0; i<10; i++) {
            promiseResult.set(promiseResult.get() + 1);
            await sleep(0);
        }
        // it should not have reacted anymore
        assert.equal(promiseResult.get(), 13);
        assert.equal(handlerInvokeCount, 3);
        // it should have run the components componentWillUnmount
        assert.equal(obj.x, 1);
    });
});