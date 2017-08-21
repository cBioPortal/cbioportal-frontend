export function toSet<T>(arr:T[], key:(t:T)=>string) {
    return arr.reduce((map:{[s:string]:T}, next:T)=>{
        map[key(next)] = next;
        return map;
    }, {});
}

export function setDifference<T>(from:{[s:string]:T}, by:{[s:string]:any}) {
    return Object.keys(from).reduce((difference:{[s:string]:T}, nextKey:string)=>{
        if (!by[nextKey]) {
            difference[nextKey] = from[nextKey];
        }
        return difference;
    }, {});
}

export function setValues<T>(set:{[s:string]:T}) {
    return Object.keys(set).map(key=>set[key]);
}