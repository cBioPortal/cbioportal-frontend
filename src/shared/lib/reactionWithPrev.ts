import {IReactionDisposer, IReactionOptions, reaction} from "mobx";

export default function reactionWithPrev<D>(
        dataFn:()=>D,
        effectFn:(data:D, prevData?:D)=>void,
        opts?:IReactionOptions
    ) {
    let prevData:D|undefined = undefined;
    let currData:D|undefined = undefined;
    return reaction(
        ()=>{
            prevData = currData;
            currData = dataFn();
            return currData;
        },
        (data:D)=>{
            effectFn(data, prevData);
        },
        opts
    );
}