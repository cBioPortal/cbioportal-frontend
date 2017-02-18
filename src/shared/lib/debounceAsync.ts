/**
 * @author adufilie http://github.com/adufilie
 */

import * as _ from 'lodash';

export default function debounceAsync<R, F extends (...args:any[]) => PromiseLike<R>>(invoke:F, delay = 0):F
{
	let debounceInvoke = _.debounce(
		function (
			args:any[],
			resolve:(result:PromiseLike<R>)=>void,
			reject:(error:Error)=>void
		) {
			try
			{
				resolve(invoke.apply(this, args));
			}
			catch (e)
			{
				reject(e);
			}
		},
		delay
	);

	return function(...args:any[]):PromiseLike<R> {
		return new Promise<R>(
			function(resolve, reject) {
				debounceInvoke.call(this, args, resolve, reject);
			}
		);
	} as F;
}
