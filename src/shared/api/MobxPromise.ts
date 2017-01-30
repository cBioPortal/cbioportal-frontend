import * as seamlessImmutable from 'seamless-immutable';
import {computed, observable} from "../../../node_modules/mobx/lib/mobx";

type MobxPromiseInputParams<R> = {await: MobxPromise<any>[], invoke: () => (Promise<R> | R)};
type MobxPromiseInput<R> = Promise<R> | (() => Promise<R>) | MobxPromiseInputParams<R>;

export default class MobxPromise<R>
{
    constructor(input:MobxPromiseInput<R>, immutable:boolean = true)
    {
        if (typeof input === 'function')
        {
            this.await = [];
            this.invoke = input;
        }
        else if (input instanceof Promise)
        {
            this.await = [];
            this.invoke = () => input;
        }
        else
        {
            this.await = input.await;
            this.invoke = input.invoke;
        }

        this.immutable = immutable;

        // if not awaiting, invoke now to make sure observable property accesses are tracked
        if (!this.await.length)
            this.lazyInvoke();
    }

    private immutable:boolean;
    private await:MobxPromise<any>[];
    private invoke?:() => (Promise<R> | R);
    @observable private internalStatus:'pending'|'complete'|'error' = 'pending';
    @observable.ref private internalResult?:R = undefined;
    @observable.ref private internalError?:Error = undefined;

    @computed get status():'pending'|'complete'|'error'
    {
        for (let mobxPromise of this.await)
            if (!mobxPromise.isComplete)
                return mobxPromise.status;

        this.lazyInvoke();
        return this.internalStatus;
    }

    @computed get isPending() { return this.status == 'pending'; }
    @computed get isComplete() { return this.status == 'complete'; }
    @computed get isError() { return this.status == 'error'; }

    @computed get result():R|undefined
    {
        this.lazyInvoke();
        return this.internalResult;
    }

    @computed get error():Error|undefined
    {
        for (let mobxPromise of this.await)
            if (mobxPromise.isError)
                return mobxPromise.error;

        this.lazyInvoke();
        return this.internalError;
    }

    private lazyInvoke()
    {
        if (!this.invoke)
            return;

        let result = this.invoke();
        this.invoke = undefined;

        let promise;
        if (result instanceof Promise)
            promise = result;
        else
            promise = Promise.resolve(result);
        promise.then(
            result => {
                if (this.immutable)
                    this.internalResult = seamlessImmutable.from(result);
                else
                    this.internalResult = result;
                this.internalStatus = 'complete';
            },
            error => {
                this.internalError = error;
                this.internalStatus = 'error';
            }
        );
    }
}
