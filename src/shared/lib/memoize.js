/**
 * @author adufilie http://github.com/adufilie
 */
"use strict";
var UNDEFINED = {};
function isPrimitive(value) {
    return value === null || typeof value !== 'object';
}
/**
 * Provides Map-like interface that uses Map for primitive keys and WeakMap for non-primitive keys.
 */
var Cache = (function () {
    function Cache() {
        this.map = new Map();
        this.weakMap = new WeakMap();
    }
    Cache.prototype.has = function (key) {
        return isPrimitive(key) ? this.map.has(key) : this.weakMap.has(key);
    };
    Cache.prototype.get = function (key) {
        return isPrimitive(key) ? this.map.get(key) : this.weakMap.get(key);
    };
    Cache.prototype.set = function (key, value) {
        if (isPrimitive(key))
            this.map.set(key, value);
        else
            this.weakMap.set(key, value);
        return this;
    };
    return Cache;
}());
/**
 * Provides a multi-dimensional Map-like interface
 */
var HyperMap = (function () {
    function HyperMap() {
        // used to avoiding the varying-key-length limitation of the traverse() function below
        this.map_numArgs_cache = new Map();
    }
    HyperMap.prototype.has = function (args) {
        var cache = this.getCache(args.length);
        if (args.length > 1)
            cache = this.traverse(cache, args.slice(0, args.length - 1));
        return cache !== undefined && cache.has(args[args.length - 1]);
    };
    HyperMap.prototype.get = function (args) {
        return this.traverse(this.getCache(args.length), args);
    };
    HyperMap.prototype.set = function (args, value) {
        this.traverse(this.getCache(args.length), args, value);
    };
    // gets the Cache designated for a specific key length
    HyperMap.prototype.getCache = function (numArgs) {
        var cache = this.map_numArgs_cache.get(numArgs);
        if (!cache)
            this.map_numArgs_cache.set(numArgs, cache = new Cache());
        return cache;
    };
    // dual-purpose setter/getter
    // note: does not work if subsequent calls vary the length of the keys array for the same cache param
    HyperMap.prototype.traverse = function (cache, keys, value) {
        if (keys.length == 0)
            return undefined;
        if (keys.length == 1) {
            if (value === undefined)
                return cache.get(keys[0]);
            return void cache.set(keys[0], value);
        }
        var nextCache = cache.get(keys[0]);
        if (nextCache === undefined)
            cache.set(keys[0], nextCache = new Cache());
        return this.traverse(nextCache, keys.slice(1), value);
    };
    return HyperMap;
}());
var Memoizer = (function () {
    function Memoizer(transform, getAdditionalArgs, fixedArgsLength) {
        this.cache = new HyperMap();
        this.transform = transform;
        var cache = this.cache;
        this.get = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (fixedArgsLength !== undefined)
                args.length = fixedArgsLength;
            var thisArgs = [this];
            if (getAdditionalArgs)
                thisArgs = thisArgs.concat(getAdditionalArgs.call(this), args);
            else
                thisArgs = thisArgs.concat(args);
            var result = cache.get(thisArgs);
            if (result === undefined && !cache.has(thisArgs)) {
                cache.set(thisArgs, UNDEFINED);
                result = transform.apply(this, args);
                if (result !== undefined)
                    cache.set(thisArgs, result);
            }
            return result === UNDEFINED ? undefined : result;
        };
    }
    return Memoizer;
}());
function memoize() {
    // called as decorator, target is prototype; return modified descriptor
    if (arguments.length == 3) {
        var _a = Array.from(arguments), target = _a[0], propertyKey = _a[1], descriptor = _a[2];
        return decorate(descriptor);
    }
    // called as function
    var params = arguments[0];
    if (typeof params === 'function')
        params = { function: params };
    if (arguments.length == 1 && params && typeof params.function === 'function') {
        return new Memoizer(params.function, params.getAdditionalArgs, params.fixedArgsLength).get;
    }
    else {
        throw new Error("Usage: memoize(params:{ function:Function, getAdditionalArgs?:()=>any[], fixedArgsLength?:number })");
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = memoize;
function decorate(descriptor, params) {
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
function memoizeWith(getMemoizeParams_propName) {
    return function (target, propertyKey, descriptor) {
        return decorate(descriptor, {
            getAdditionalArgs: function () {
                var fn = this[getMemoizeParams_propName];
                return fn.call(this);
            }
        });
    };
}
exports.memoizeWith = memoizeWith;
