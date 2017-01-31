import * as seamlessImmutable from 'seamless-immutable';
import {computed, observable} from "../../../node_modules/mobx/lib/mobx";

type MobxPromiseInputParams<R> = {await: MobxPromise<any>[], invoke: () => (PromiseLike<R> | R)};
type MobxPromiseInput<R> = PromiseLike<R> | (() => PromiseLike<R>) | MobxPromiseInputParams<R>;

function isPromiseLike(value?:Partial<PromiseLike<any>>)
{
    return !!value && typeof value.then === 'function';
}

export default class MobxPromise<R>
{
    constructor(input:MobxPromiseInput<R>, immutable:boolean = true)
    {
        if (typeof input === 'function')
        {
            this.await = [];
            this.invoke = input;
        }
        else if (isPromiseLike(input))
        {
            this.await = [];
            this.invoke = () => input as PromiseLike<R>;
        }
        else
        {
            input = input as MobxPromiseInputParams<R>;
            this.await = input.await;
            this.invoke = input.invoke;
        }

        this.immutable = immutable;
    }

    private immutable:boolean;
    private await:MobxPromise<any>[];
    private invoke:() => (PromiseLike<R> | R);
    private invokeId:number = 0;

    @observable private internalStatus:'pending'|'complete'|'error' = 'pending';
    @observable.ref private internalResult?:R = undefined;
    @observable.ref private internalError?:Error = undefined;

    @computed get status():'pending'|'complete'|'error'
    {
        for (let mobxPromise of this.await)
            if (!mobxPromise.isComplete)
                return mobxPromise.status;

        this.lazyInvoke;
        return this.internalStatus;
    }

    @computed get isPending() { return this.status == 'pending'; }
    @computed get isComplete() { return this.status == 'complete'; }
    @computed get isError() { return this.status == 'error'; }

    @computed get result():R|undefined
    {
        this.lazyInvoke;
        return this.internalResult;
    }

    @computed get error():Error|undefined
    {
        for (let mobxPromise of this.await)
            if (mobxPromise.isError)
                return mobxPromise.error;

        this.lazyInvoke;
        return this.internalError;
    }

    /**
     * This lets mobx determine when to call this.invoke(),
     * taking advantage of caching based on observable property access tracking.
     */
    @computed get lazyInvoke()
    {
        let result = this.invoke();

        let invokeId = ++this.invokeId;
        let promise:PromiseLike<R>;
        if (isPromiseLike(result))
            promise = result as PromiseLike<R>;
        else
            promise = Promise.resolve(result);
        promise.then(
            result => {
                if (invokeId === this.invokeId)
                {
                    if (this.immutable)
                        this.internalResult = seamlessImmutable.from(result);
                    else
                        this.internalResult = result;
                    this.internalStatus = 'complete';
                }
            },
            error => {
                if (invokeId === this.invokeId)
                {
                    this.internalError = error;
                    this.internalStatus = 'error';
                }
            }
        );
        return invokeId;
    }
}
