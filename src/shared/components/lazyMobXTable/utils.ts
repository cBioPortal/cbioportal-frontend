import {SHOW_ALL_PAGE_SIZE} from "../paginationControls/PaginationControls";
import {SortMetric} from "../../lib/ISortMetric";
export function maxPage(displayDataLength:number, itemsPerPage:number) {
    if (itemsPerPage === SHOW_ALL_PAGE_SIZE) {
        return 0;
    } else {
        return Math.floor(Math.max(displayDataLength-1,0) / itemsPerPage);
    }
}

function compareValues<U extends number|string>(a:U|null, b:U|null, asc:boolean):number {
    let ret:number = 0;
    if (a !== b) {
        if (a === null) {
            // a sorted to end
            ret = 1;
        } else if (b === null) {
            // b sorted to end
            ret = -1;
        } else {
            // neither are null
            if (typeof a === "number") {
                // sort numbers
                if (a < b) {
                    ret = (asc ? -1 : 1);
                } else {
                    // we know a !== b here so this case is a > b
                    ret = (asc ? 1 : -1);
                }
            } else if (typeof a === "string") {
                // sort strings
                ret = (asc ? 1 : -1)*((a as string).localeCompare(b as string));
            }
        }
    }
    return ret;
}

function compareLists<U extends number|string>(a:(U|null)[], b:(U|null)[], asc:boolean):number {
    let ret = 0;
    const loopLength = Math.min(a.length, b.length);
    for (let i=0; i<loopLength; i++) {
        ret = compareValues(a[i], b[i], asc);
        if (ret !== 0) {
            break;
        }
    }
    if (ret === 0) {
        if (a.length < b.length) {
            ret = (asc ? -1 : 1);
        } else if (a.length > b.length) {
            ret = (asc ? 1 : -1);
        }
    }
    return ret;
}

export function lazyMobXTableSort<T>(data:T[], metric:SortMetric<T>, ascending:boolean = true):T[] {
    // Separating this for testing, so that classes can test their comparators
    //  against how the table will sort.
    const dataAndValue:{data:T, initialPosition:number, sortBy:any[]}[] = [];

    for (let i=0; i<data.length; i++) {
        // Have to do this loop instead of using data.map because we need dataAndValue to be mutable,
        //  and Immutable.js makes .map return another immutable structure;
        const d = data[i];
        dataAndValue.push({
            data:d,
            initialPosition: i, // for stable sorting
            sortBy:([] as any[]).concat(metric(d)) // ensure it's wrapped in an array, even if metric is number or string
        });
    };
    let cmp:number, initialPositionA:number, initialPositionB:number;
    dataAndValue.sort((a,b)=>{
        cmp = compareLists(a.sortBy, b.sortBy, ascending);
        if (cmp === 0) {
            // stable sort
            initialPositionA = a.initialPosition;
            initialPositionB = b.initialPosition;
            if (initialPositionA < initialPositionB) {
                cmp = -1;
            } else {
                cmp = 1;
            }
        }
        return cmp;
    });
    return dataAndValue.map(x=>x.data);
}