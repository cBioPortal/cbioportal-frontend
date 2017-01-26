import * as seamlessImmutable from 'seamless-immutable';
import {computed, observable} from "../../../node_modules/mobx/lib/mobx";

type ObservablePromiseInput<R> = Promise<R> | (()=>Promise<R>);

export default class ObservablePromise<R>
{
    constructor(input:ObservablePromiseInput<R>, immutable:boolean = true)
    {
        if (typeof input === 'function')
            this.promise = input();
        else
            this.promise = input;

        this.promise.then(
            result => {
                this.result = immutable ? seamlessImmutable.from(result) : result;
                this.status = 'complete';
            },
            error => {
                this.error = error;
                this.status = 'error'
            }
        );
    }

    promise:Promise<R>;

    @observable status:'pending'|'complete'|'error' = 'pending';
    @observable.ref result?:R = undefined;
    @observable.ref error?:Error = undefined;

    @computed get isPending() { return this.status == 'pending'; }
    @computed get isComplete() { return this.status == 'complete'; }
    @computed get isError() { return this.status == 'error'; }
}
