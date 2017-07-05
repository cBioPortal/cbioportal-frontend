import {MobxPromise} from "mobxpromise";
import {autorun, IReactionDisposer} from "mobx";

export default function onMobxPromise<T>(promise:MobxPromise<T>,
                                         onComplete:(result:T)=>void,
                                         times:number = 1,
                                        onDispose?:()=>void) {
    let disposer:IReactionDisposer;
    let count:number = 0;
    disposer = autorun(()=>{
        if (promise.isComplete) {
            onComplete(promise.result as T);
            count += 1;
        }
        if (count >= times) {
            disposer();
            onDispose && onDispose();
        }
    });
    return disposer;
}