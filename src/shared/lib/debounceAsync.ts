/**
 * A function created with debounceAsync() returns a new Promise
 * every time, but only the last promise created before invoking the
 * original function will be resolved after a specified delay.
 *
 * @author adufilie http://github.com/adufilie
 */

export default function debounceAsync<R, F extends (...args:any[]) => PromiseLike<R>>(invoke:F, delay = 0):F
{
	function invokeLater(
		context:any,
		args:any[],
		resolve:(result:PromiseLike<R>)=>void,
		reject:(error:Error)=>void
	) {
		try
		{
			resolve(invoke.apply(context, args));
		}
		catch (e)
		{
			reject(e);
		}
	}

	let timeout = 0;
	return function(...args:any[]):PromiseLike<R> {
		return new Promise<R>(
			function(resolve, reject) {
				window.clearTimeout(timeout);
				timeout = window.setTimeout(invokeLater, delay, this, args, resolve, reject);
			}
		);
	} as F;
}
