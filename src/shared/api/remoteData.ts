import * as seamlessImmutable from 'seamless-immutable';
import {MobxPromiseImpl, MobxPromise, MobxPromiseFactory, MobxPromiseInputUnion, hasObservers} from 'mobxpromise';

type errorHandler = (error:Error)=>void;

let errorHandlers: errorHandler[] = [];

export function addErrorHandler(handler: errorHandler) {

    errorHandlers.push(handler);

}

(MobxPromise as any).prototype.toJSON = function(){
    return JSON.stringify(this.result);
};

/**
 * Constructs a MobxPromise which will call seamlessImmutable.from() on the result and the default value.
 */

export const remoteData:MobxPromiseFactory = function<R>(input:MobxPromiseInputUnion<R>, defaultResult?:R, notImmutableResult?:boolean) {
    const normalizedInput = MobxPromiseImpl.normalizeInput(input, defaultResult);
    const {invoke, onError} = normalizedInput;
    const invokeParam = ()=>{
        if (!notImmutableResult) {
            return invoke().then(seamlessImmutable.from);
        } else {
            return invoke();
        }
    };
    let defaultParam = normalizedInput.default;
    if (!notImmutableResult) {
        defaultParam = seamlessImmutable.from(defaultParam);
    }
    const mobxPromise = new MobxPromise({
        ...input,
        invoke: invokeParam,
        default: defaultParam,
        onError: error => {
            if (onError)
            {
                onError(error);
            }
            else if (!hasObservers(mobxPromise, 'error'))
            {
                errorHandlers.forEach(handler=>{
                    handler(error);
                })
            }
        },
    });
    return mobxPromise;
};
