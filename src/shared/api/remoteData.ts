import * as seamlessImmutable from 'seamless-immutable';
import {
    MobxPromiseInputParamsWithDefault,
    MobxPromiseUnionTypeWithDefault,
    MobxPromiseInputUnion,
    MobxPromiseUnionType,
    MobxPromiseClass,
    default as MobxPromise
} from "./MobxPromise";

/**
 * Constructs a MobxPromise which will call seamlessImmutable.from() on the result and the default value.
 */
export function remoteData<R>(input:MobxPromiseInputParamsWithDefault<R>):MobxPromiseUnionTypeWithDefault<R>;
export function remoteData<R>(input:MobxPromiseInputUnion<R>, defaultResult: R):MobxPromiseUnionTypeWithDefault<R>;
export function remoteData<R>(input:MobxPromiseInputUnion<R>):MobxPromiseUnionType<R>;
export function remoteData<R>(input:MobxPromiseInputUnion<R>, defaultResult?: R)
{
    input = MobxPromiseClass.normalizeInput(input);
    const invoke = input.invoke;
    input.invoke = () => invoke().then(result => seamlessImmutable.from(result));
    input.default = seamlessImmutable.from(input.default);
    defaultResult = seamlessImmutable.from(defaultResult);
    return new MobxPromise(input, defaultResult);
}
