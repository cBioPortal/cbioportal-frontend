import * as seamlessImmutable from 'seamless-immutable';
import {MobxPromiseImpl, MobxPromise, MobxPromiseFactory, MobxPromiseInputUnion, hasObservers} from 'mobxpromise';

/**
 * Constructs a MobxPromise which will call seamlessImmutable.from() on the result and the default value.
 */
export const remoteData:MobxPromiseFactory = function<R>(input:MobxPromiseInputUnion<R>, defaultResult?:R) {
    const normalizedInput = MobxPromiseImpl.normalizeInput(input, defaultResult);
    const {invoke, onError} = normalizedInput;
    const mobxPromise = new MobxPromise({
        ...input,
        invoke: () => invoke().then(seamlessImmutable.from),
        default: seamlessImmutable.from(normalizedInput.default),
        onError: error => {
            if (onError)
            {
                onError(error);
            }
            else if (!hasObservers(mobxPromise, 'error'))
            {
                console.log(`Unhandled ${error}`);
            }
        },
    });
    return mobxPromise;
};
