import {
    action,
    computed,
    observable,
    runInAction,
    makeObservable,
} from 'mobx';

type PromisePlusStatus = 'complete' | 'pending' | 'error';

export default class PromisePlus<T> {
    @observable private _status: PromisePlusStatus;
    @observable private _result: T | undefined;
    @observable private _error: any;

    @computed public get status(): PromisePlusStatus {
        return this._status;
    }

    @computed public get result(): T | undefined {
        return this._result;
    }

    @computed public get error(): any {
        return this._error;
    }

    @computed public get promise(): Promise<T> {
        return this._promise;
    }

    constructor(private _promise: Promise<T>) {
        makeObservable<PromisePlus<T>, '_status' | '_result' | '_error'>(this);
        runInAction(() => {
            this._status = 'pending';

            _promise.then(
                action((result: T) => {
                    this._status = 'complete';
                    this._result = result;
                }),
                action((reason: any) => {
                    this._status = 'error';
                    this._error = reason;
                })
            );
        });
    }
}
