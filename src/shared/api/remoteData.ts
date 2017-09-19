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

export const remoteData:MobxPromiseFactory = function<R>(input:MobxPromiseInputUnion<R>, defaultResult?:R) {
    const normalizedInput = MobxPromiseImpl.normalizeInput(input, defaultResult);
    const {invoke, onError} = normalizedInput;
    const mobxPromise = new MobxPromise({
        ...input,
        invoke,
        default: normalizedInput.default,
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
