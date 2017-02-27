import {assert} from "chai";
import sinon from 'sinon';
import {
    MobxPromiseUnionType, MobxPromiseInputParamsWithDefault, default as MobxPromise,
    MobxPromiseUnionTypeWithDefault
} from "./MobxPromise";
import * as mobx from "mobx";

function spy<T extends Function>(func:T)
{
    return sinon.spy(func) as T & sinon.SinonSpy;
}

async function observeOnce<T>(expression:() => T)
{
    let n = 0;
    let value:T;
    return new Promise(resolve => {
        mobx.when(
            () => {
                value = expression();
                return n++ > 0;
            },
            () => resolve(value)
        );
    });
}

describe('MobxPromise', () => {
    const INITIAL = 'initial';
    const DEFAULT = 'default';
    let reactionDisposer:mobx.IReactionDisposer;

    before(() => {
    });

    after(() => {
    });

    beforeEach(() => {
    });

    afterEach(() => {
        reactionDisposer();
    });

    it('triggers mobx as expected', async () => {
        let value = mobx.observable(INITIAL);
        let params = {
            invoke: spy(async () => value.get()),
            default: DEFAULT,
            reaction: spy((result:string) => {})
        };
        let mp = new MobxPromise(params);
        let reaction = spy(() => {
            let {status, result, error, isPending, isError, isComplete} = mp;
            return {status, result, error, isPending, isError, isComplete} as typeof mp;
        });

        assert.isTrue(params.invoke.notCalled, 'invoke is not called until we attempt to access properties');

        // we have to set up a reaction or @computed properties won't be cached.
        reactionDisposer = mobx.autorun(reaction);

        assert.equal(mp.status, 'pending', 'status is pending immediately after creation');
        assert.isTrue(params.invoke.calledOnce, 'invoke called once when status is checked');
        assert.equal(mp.result, DEFAULT, 'result is set to default value');
        assert.equal(await observeOnce(() => mp.result), INITIAL, 'observed initial result');
        assert.equal(mp.status, 'complete', 'status is complete when result updates');

        value.set('this result should be skipped');
        assert.equal(mp.status, 'pending', 'status pending after updating dependency');
        assert.equal(mp.result, INITIAL, 'result is still initial value');
        value.set('updated result');
        assert.equal(await observeOnce(() => mp.status), 'complete', 'status updated to complete');
        assert.equal(mp.result, value.get(), 'result updated to latest value');

        assert.isTrue(params.reaction.calledTwice, 'params.reaction() called only twice');
        assert.isTrue(params.reaction.firstCall.calledWith(INITIAL), 'params.reaction() called first time with initial value');
        assert.isTrue(params.reaction.lastCall.calledWith(value.get()), 'params.reaction() called second time with final value');

        return true;
    });
});
