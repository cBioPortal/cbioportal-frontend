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

export function separateScatterDataByAppearance<D>(
    data:D[],
    fill:string | ((d:D)=>string),
    stroke:string | ((d:D)=>string),
    strokeWidth:number | ((d:D)=>number),
    strokeOpacity:number | ((d:D)=>number),
    fillOpacity:number | ((d:D)=>number)
):{
    data:D[],
    fill:string,
    stroke:string,
    strokeWidth:number,
    strokeOpacity:number,
    fillOpacity:number
}[] {
    const buckets:{
        data:D[],
        fill:string,
        stroke:string,
        strokeWidth:number,
        strokeOpacity:number,
        fillOpacity:number
    }[] = [];

    let d_fill:string, d_stroke:string, d_strokeWidth:number, d_strokeOpacity:number, d_fillOpacity:number,
        bucketFound:boolean;

    for (const datum of data) {
        // compute appearance for datum
        d_fill = (typeof fill === "function" ? fill(datum) : fill);
        d_stroke = (typeof stroke === "function" ? stroke(datum) : stroke);
        d_strokeWidth = (typeof strokeWidth === "function" ? strokeWidth(datum) : strokeWidth);
        d_strokeOpacity = (typeof strokeOpacity === "function" ? strokeOpacity(datum) : strokeOpacity);
        d_fillOpacity = (typeof fillOpacity === "function" ? fillOpacity(datum) : fillOpacity);

        // look for existing bucket to put datum
        bucketFound = false;
        for (const bucket of buckets) {
            if (bucket.fill === d_fill && bucket.stroke === d_stroke && bucket.strokeWidth === d_strokeWidth &&
                    bucket.strokeOpacity === d_strokeOpacity && bucket.fillOpacity === d_fillOpacity) {
                // if bucket with matching appearance exists, add to bucket
                bucket.data.push(datum);
                // mark bucket has been found so we dont need to add a bucket
                bucketFound = true;
                break;
            }
        }
        if (!bucketFound) {
            // if no bucket found, add bucket, and put datum in it
            buckets.push({
                data: [datum],
                fill: d_fill, stroke: d_stroke, strokeWidth: d_strokeWidth,
                strokeOpacity: d_strokeOpacity, fillOpacity: d_fillOpacity
            });
        }
    }

    return buckets;
}