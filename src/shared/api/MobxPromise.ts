import * as seamlessImmutable from 'seamless-immutable';
import {computed, observable} from "../../../node_modules/mobx/lib/mobx";

/**
 * This tagged union type describes the interoperability of MobxPromise properties.
 */
export type MobxPromiseUnionType<R> = (
    { status: 'pending', isPending: true, isError: false, isComplete: false, result: undefined, error: undefined } |
    { status: 'error', isPending: false, isError: true, isComplete: false, result: undefined, error: Error } |
    { status: 'complete', isPending: false, isError: false, isComplete: true, result: R, error: undefined }
);

export type MobxPromiseInput<R> = PromiseLike<R> | (() => PromiseLike<R>) | MobxPromiseInputParams<R>;

export type MobxPromiseInputParams<R> = {
    /**
     * A function that returns a list of MobxPromise objects which are dependencies of the invoke function.
     */
    await: () => Array<MobxPromise<any> | MobxPromiseUnionType<any>>,
    /**
     * A function that returns the async result or a promise for the async result.
     */
    invoke: () => (PromiseLike<R> | R)
};

function isPromiseLike(value?:Partial<PromiseLike<any>>)
{
    return !!value && typeof value.then === 'function';
}

class MobxPromise<R>
{
    /**
     * @param input Either an "invoke" function or a structure containing "await" and "invoke" functions.
     * @param immutable
     */
    constructor(input:MobxPromiseInput<R>, immutable:boolean = true)
    {
        if (typeof input === 'function')
        {
            this.await = () => [];
            this.invoke = input;
        }
        else if (isPromiseLike(input))
        {
            this.await = () => [];
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
    private await:MobxPromiseInputParams<R>['await'];
    private invoke:MobxPromiseInputParams<R>['invoke'];
    private invokeId:number = 0;

    @observable private internalStatus:'pending'|'complete'|'error' = 'pending';
    @observable.ref private internalResult?:R = undefined;
    @observable.ref private internalError?:Error = undefined;

    @computed get status():'pending'|'complete'|'error'
    {
        // wait until all MobxPromise dependencies are complete
        for (let mobxPromise of this.await())
            if (!mobxPromise.isComplete)
                return mobxPromise.status;

        let status = this.internalStatus; // force mobx to track changes to internalStatus
        if (this.invokeId != this.lazyInvokeId)
            status = 'pending'; // pending while invoking again
        return status;
    }

    @computed get isPending() { return this.status == 'pending'; }
    @computed get isComplete() { return this.status == 'complete'; }
    @computed get isError() { return this.status == 'error'; }

    @computed get result():R|undefined
    {
        let result = this.internalResult; // force mobx to track changes to internalResult
        // checking status may trigger invoke
        return this.isComplete ? result : undefined;
    }

    @computed get error():Error|undefined
    {
        // checking status may trigger invoke
        if (this.isError)
            for (let mobxPromise of this.await())
                if (mobxPromise.isError)
                    return mobxPromise.error;
        return this.internalError;
    }

    /**
     * This lets mobx determine when to call this.invoke(),
     * taking advantage of caching based on observable property access tracking.
     */
    @computed private get lazyInvokeId()
    {
        let invokeId = ++this.invokeId;
        let result = this.invoke();
        let promise = isPromiseLike(result) ? result as PromiseLike<R> : Promise.resolve(result as R);
        setTimeout(() => {
            if (invokeId !== this.invokeId)
                return;

            this.internalStatus = 'pending';
            this.internalResult = undefined;

            promise.then(
                result => {
                    if (invokeId !== this.invokeId)
                        return;

                    if (this.immutable)
                        this.internalResult = seamlessImmutable.from(result);
                    else
                        this.internalResult = result;
                    this.internalStatus = 'complete';
                },
                error => {
                    if (invokeId !== this.invokeId)
                        return;

                    this.internalError = error;
                    this.internalStatus = 'error';
                }
            );
        });
        return invokeId;
    }
}

// This type casting provides more information for TypeScript code flow analysis
const _MobxPromise = MobxPromise as new<R>(input:MobxPromiseInput<R>, immutable?:boolean) => MobxPromiseUnionType<R>;
export default _MobxPromise;
