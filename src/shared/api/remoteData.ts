import * as seamlessImmutable from 'seamless-immutable';
import {
    MobxPromiseInputParamsWithDefault,
    MobxPromiseUnionTypeWithDefault,
    MobxPromiseInputUnion,
    MobxPromiseUnionType,
    MobxPromiseImpl,
    MobxPromise
} from "mobxpromise";

/**
 * Constructs a MobxPromise which will call seamlessImmutable.from() on the result and the default value.
 */
export function remoteData<R>(input:MobxPromiseInputParamsWithDefault<R>):MobxPromiseUnionTypeWithDefault<R>;
export function remoteData<R>(input:MobxPromiseInputUnion<R>, defaultResult: R):MobxPromiseUnionTypeWithDefault<R>;
export function remoteData<R>(input:MobxPromiseInputUnion<R>):MobxPromiseUnionType<R>;
export function remoteData<R>(input:MobxPromiseInputUnion<R>, defaultResult?: R)
{
    input = MobxPromiseImpl.normalizeInput(input, defaultResult);
    const invoke = input.invoke;
    input.invoke = () => invoke().then(result => seamlessImmutable.from(result));
    input.default = seamlessImmutable.from(input.default);
    return new MobxPromise(input);
}
