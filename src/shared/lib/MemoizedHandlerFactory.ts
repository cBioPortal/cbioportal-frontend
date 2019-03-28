import LazyMemo from "./LazyMemo";

function shallowAlphabeticalStringify(obj:any) {
    return JSON.stringify(obj, Object.keys(obj).sort());
}

export default function MemoizedHandlerFactory<Params>(
    handler:(params:Params)=>void,
    key:(params:Params)=>string = shallowAlphabeticalStringify
) {
    const memo = new LazyMemo<Params, ()=>void>(
        key,
        (params:Params)=>{
            return ()=>handler(params);
        }
    );

    return (params:Params)=>memo.get(params);
}