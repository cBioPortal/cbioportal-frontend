export function getDeterministicRandomNumber(seed:number, range?:[number, number]) {
    // source: https://stackoverflow.com/a/23304189
    seed = Math.sin(seed)*10000;
    let r = seed - Math.floor(seed); // between 0 and 1
    if (range) {
        r = r*(range[1] - range[0]) + range[0];
    }
    return r;
}

function getSeedFromUniqueKey(uniqueKey:string) {
    let hash = 0, i, chr;
    if (uniqueKey.length === 0) return hash;
    for (i = 0; i < uniqueKey.length; i++) {
        chr   = uniqueKey.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export function getJitterForCase(uniqueKey:string) {
    const seed = getSeedFromUniqueKey(uniqueKey);
    return getDeterministicRandomNumber(seed, [-1,1]);
}

export function scatterPlotSize<D>(
    highlight?:(d:D)=>boolean,
    size?:(d:D, active:Boolean, isHighlighted?:boolean)=>number
) {
    // need to regenerate this function whenever highlight changes in order to trigger immediate Victory rerender
    if (size) {
        if (highlight) {
            return (d:D, active:boolean)=>size(d, active, highlight(d));
        } else {
            return size;
        }
    } else {
        return (d:D, active:boolean)=>{
            return (active || !!(highlight && highlight(d)) ? 6 : 3);
        };
    }
}