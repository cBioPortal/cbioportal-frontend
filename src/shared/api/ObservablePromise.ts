import * as seamlessImmutable from 'seamless-immutable';
import {computed, observable, reaction, IReactionDisposer} from "../../../node_modules/mobx/lib/mobx";

type ObservablePromiseInput<R> = Promise<R> | (()=>Promise<R>);

export default class ObservablePromise<R>
{
	constructor(input:ObservablePromiseInput<R>, immutable:boolean = true)
	{
		let inputPromise:Promise<R>;
		if (typeof input === 'function')
			inputPromise = input();
		else
			inputPromise = input;

		this.promise = new Promise<R>((resolve, reject) => {
			inputPromise.then(
				result => {
					if (!this.promiseReaction.$mobx!.isDisposed)
						resolve(result);
				},
				error => {
					if (!this.promiseReaction.$mobx!.isDisposed)
						reject(error);
				}
			);
		}).then(
			result => {
				this.result = immutable ? seamlessImmutable.from(result) : result;
				this.status = 'complete';
				return result;
			},
			error => {
				this.error = error;
				this.status = 'error'
				throw error;
			}
		);
		this.promiseReaction = reaction(() => this.promise, () => {});
	}

	promise:Promise<R>;
	promiseReaction:IReactionDisposer;

	@observable status:'pending'|'complete'|'error' = 'pending';
	@observable.ref result?:R = undefined;
	@observable.ref error?:Error = undefined;

	@computed get isPending() { return this.status == 'pending'; }
	@computed get isComplete() { return this.status == 'complete'; }
	@computed get isError() { return this.status == 'error'; }
}
