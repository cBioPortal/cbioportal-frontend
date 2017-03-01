/**
 * @author adufilie http://github.com/adufilie
 */

let UNDEFINED = {} as any;

type AnyFunction = (...args:any[])=>any;

function isPrimitive(value:any):boolean
{
	return value === null || typeof value !== 'object';
}

/**
 * Provides Map-like interface that uses Map for primitive keys and WeakMap for non-primitive keys.
 */
class Cache<K,V>
{
	private map = new Map<any, V>();
	private weakMap = new WeakMap<any, V>();

	has(key:K):boolean
	{
		return isPrimitive(key) ? this.map.has(key) : this.weakMap.has(key);
	}
	get(key:K):V|undefined
	{
		return isPrimitive(key) ? this.map.get(key) : this.weakMap.get(key);
	}
	set(key:K, value:V):this
	{
		if (isPrimitive(key))
			this.map.set(key, value);
		else
			this.weakMap.set(key, value);
		return this;
	}
}

/**
 * Provides a multi-dimensional Map-like interface
 */
class HyperMap<T>
{
	has(args:any[]):boolean
	{
		let cache:Cache<any, any>|undefined = this.getCache(args.length);
		if (args.length > 1)
			cache = this.traverse(cache, args.slice(0, args.length - 1)) as any;
		return cache !== undefined && cache.has(args[args.length - 1]);
	}

	get(args:any[]):T | undefined
	{
		return this.traverse(this.getCache(args.length), args);
	}

	set(args:any[], value:T):void
	{
		this.traverse(this.getCache(args.length), args, value);
	}

	// gets the Cache designated for a specific key length
	private getCache(numArgs:number)
	{
		let cache = this.map_numArgs_cache.get(numArgs);
		if (!cache)
			this.map_numArgs_cache.set(numArgs, cache = new Cache());
		return cache;
	}

	// used to avoiding the varying-key-length limitation of the traverse() function below
	private map_numArgs_cache = new Map<number, Cache<any, any>>();

	// dual-purpose setter/getter
	// note: does not work if subsequent calls vary the length of the keys array for the same cache param
	private traverse(cache:Cache<any, any>, keys:any[], value?:T):T|undefined
	{
		if (keys.length == 0)
			return undefined;
		if (keys.length == 1)
		{
			if (value === undefined)
				return cache.get(keys[0]);
			return void cache.set(keys[0], value);
		}

		let nextCache = cache.get(keys[0]);
		if (nextCache === undefined)
			cache.set(keys[0], nextCache = new Cache());
		return this.traverse(nextCache, keys.slice(1), value);
	}
}

class Memoizer<Result, Transform extends (...args:any[])=>Result>
{
	private transform:Transform;
	private cache = new HyperMap<Result>();

	constructor(transform:Transform, getAdditionalArgs?:()=>any[], fixedArgsLength?:number)
	{
		this.transform = transform;
		let cache = this.cache;
		this.get = function(...args:any[]) {
			if (fixedArgsLength !== undefined)
				args.length = fixedArgsLength;
			let thisArgs = [this];
			if (getAdditionalArgs)
				thisArgs = thisArgs.concat(getAdditionalArgs.call(this), args);
			else
				thisArgs = thisArgs.concat(args);
			let result = cache.get(thisArgs);
			if (result === undefined && !cache.has(thisArgs))
			{
				cache.set(thisArgs, UNDEFINED);
				result = transform.apply(this, args);
				if (result !== undefined)
					cache.set(thisArgs, result);
			}
			return result === UNDEFINED ? undefined : result;
		} as Transform;
	}

	get:Transform;
}

export type MemoizeParams<F extends AnyFunction> = {
	function: F,
	getAdditionalArgs?: ()=>any[],
	fixedArgsLength?: number,
};

/**
 * Creates a memoized version of a function.
 */
export default function memoize<F extends AnyFunction>(params:MemoizeParams<F>):F;

/**
 * A method decorator that creates a memoized version of a method.
 */
export default function memoize<T extends AnyFunction>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>):TypedPropertyDescriptor<T> | void;

export default function memoize<T extends AnyFunction>():TypedPropertyDescriptor<T> | void
{
	// called as decorator, target is prototype; return modified descriptor
	if (arguments.length == 3)
	{
		let [target, propertyKey, descriptor] = Array.from(arguments) as [Object, string|symbol, TypedPropertyDescriptor<T>];
		return decorate(descriptor);
	}

	// called as function
	let params = arguments[0] as MemoizeParams<T>;
	if (typeof params === 'function')
		params = {function: params};
	if (arguments.length == 1 && params && typeof params.function === 'function')
	{
		return new Memoizer(params.function, params.getAdditionalArgs, params.fixedArgsLength).get;
	}
	else
	{
		throw new Error("Usage: memoize(params:{ function:Function, getAdditionalArgs?:()=>any[], fixedArgsLength?:number })");
	}
}

type DecorateMemoizeParams<T extends AnyFunction> = Partial<Pick<MemoizeParams<T>, 'getAdditionalArgs' | 'fixedArgsLength'>>;

function decorate<T extends AnyFunction>(descriptor:TypedPropertyDescriptor<T>, params?:DecorateMemoizeParams<T>)
{
	if (descriptor && typeof descriptor.value === 'function')
		descriptor.value = new Memoizer(descriptor.value, params && params.getAdditionalArgs, params && params.fixedArgsLength).get;
	else if (descriptor && (descriptor.set || descriptor.get))
		throw new Error('memoize cannot be used as a decorator for a setter or getter');
	return descriptor;
}

// /**
//  * Generates a method decorator that creates a memoized version of a function with additional args to control memoization
//  * @param getAdditionalMemoizeArgs A function that returns additional arguments for controlling memoization.
//  *                                 If this is an inline function, it must be defined like
//  *                                     <code>function() { return [this.a, this.b]; }</code>
//  *                                 rather than
//  *                                     <code>() => [this.a, this.b]</code>
//  *                                 because when decorators are evaluated the 'this' context is undefined.
//  */
// export function memoizeWith<T, TARGET>(getAdditionalMemoizeArgs:(this:TARGET, self:TARGET)=>any[])
// 	:<T>(
// 		target: TARGET,
// 		propertyKey: string | symbol,
// 		descriptor: TypedPropertyDescriptor<T>
// 	) => TypedPropertyDescriptor<T> | void
// {
// 	return (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>):TypedPropertyDescriptor<T> => {
// 		return decorate(descriptor, getAdditionalMemoizeArgs);
// 	};
// }

/**
 * Generates a method decorator that creates a memoized version of a function with additional args to control memoization
 * @param getMemoizeParams_propName The name of another class method that returns additional arguments for controlling memoization.
 */
export function memoizeWith
	<T extends AnyFunction, P extends string, TARGET extends {[X in P]: (this:TARGET)=>any[]}>
	(getMemoizeParams_propName:P):<T>(
		target: TARGET,
		propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<T>
	) => TypedPropertyDescriptor<T> | void
{
	return (target: TARGET, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>):TypedPropertyDescriptor<T> => {
		return decorate(
			descriptor,
			{
				getAdditionalArgs(this:TARGET) {
					let fn = this[getMemoizeParams_propName] as any as () => any[];
					return fn.call(this);
				}
			}
		);
	};
}
