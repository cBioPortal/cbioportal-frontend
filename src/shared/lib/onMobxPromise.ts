import {MobxPromise} from "mobxpromise";
import {autorun, IReactionDisposer} from "mobx";

export function onMobxPromise<T>(promise:MobxPromise<T>|Array<MobxPromise<T>>,
                                         onComplete:(...results:T[])=>void,
                                        disposeOnUnmountTarget?:React.Component<any, any>,
                                         times:number = 1
                                ):IReactionDisposer {
    let disposer:IReactionDisposer;
    let count:number = 0;
    let promiseArray:Array<MobxPromise<T>>;
    if (promise instanceof Array) {
        promiseArray = promise;
    } else {
        promiseArray = [promise];
    }
    disposer = autorun((reaction)=>{
        if (promiseArray.reduce((acc, next)=>(acc && next.isComplete), true)) {
            // if all complete
            onComplete(...promiseArray.map(x=>(x.result as T)));
            count += 1;
        }
        if (count >= times) {
            reaction.dispose();
        }
    });

    if (disposeOnUnmountTarget) {
        const oldFn = disposeOnUnmountTarget.componentWillUnmount || (()=>{});
        disposeOnUnmountTarget.componentWillUnmount = function() {
            disposer();
            oldFn.apply(this, arguments);
        };
    }

    return disposer;
}

export default onMobxPromise;