import {MobxPromise} from "mobxpromise";
import {autorun, IReactionDisposer} from "mobx";

export default function onMobxPromise<T>(promise:MobxPromise<T>|Array<MobxPromise<T>>,
                                         onComplete:(...results:T[])=>void,
                                         times:number = 1,
                                        onDispose?:()=>void):IReactionDisposer {
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
            onDispose && onDispose();
        }
    });
    return disposer;
}