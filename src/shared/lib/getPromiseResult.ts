const promiseResultCache = new WeakMap<Promise<any>, any>();
export default function getPromiseResult<T>(promise:Promise<T>):T|undefined
{
	if (!promiseResultCache.has(promise))
	{
		promiseResultCache.set(promise, undefined);
		promise.then(result => promiseResultCache.set(promise, result));
	}
	return promiseResultCache.get(promise);
}
