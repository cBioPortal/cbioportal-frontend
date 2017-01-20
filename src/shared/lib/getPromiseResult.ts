const promiseResultCache = new WeakMap<Promise<any>, any>();
export default function getPromiseResult<T>(promise:Promise<T>, hack?:Function):T|undefined
{
	if (!promiseResultCache.has(promise))
	{
		promiseResultCache.set(promise, undefined);
		promise.then(result => {
			promiseResultCache.set(promise, result)
			if (hack)
				hack();
		});
	}
	return promiseResultCache.get(promise);
}
