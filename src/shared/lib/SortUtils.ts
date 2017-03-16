import * as _ from 'lodash';

export interface IComparableArray extends Array<number|IComparableArray> {}

export type maybeNumber = number|null|undefined;
export type maybeString = string|null|undefined;

export function compareNumberLists(a:number[], b:number[]) {
    if (a.length !== b.length) {
        throw "Input lists must be same length";
    }
    let ret = 0;
    for (let i=0; i<a.length; i++) {
        const A = a[i];
        const B = b[i];
        const typeofA = typeof A;
        const typeofB = typeof B;
        if (typeofA === "undefined" && typeofB !== "undefined") {
            ret = -1;
            break;
        } else if (typeofA !== "undefined" && typeofB === "undefined") {
            ret = 1;
            break;
        } else if (typeofA !== "undefined" && typeofB !== "undefined") {
            if (A > B) {
                ret = 1;
                break;
            } else if (A < B) {
                ret = -1;
                break;
            }
        }
    }
    return ret;
}

export function compareNestedNumberLists(a:IComparableArray, b:IComparableArray):number
{
    if (a.length !== b.length) {
        throw "Input lists must be same length";
    }

    let diff = 0;

    // compare a[0] with b[0], if equal compare a[1] with b[1], and so on...
    for (let i = 0; i < a.length; i++)
    {
        if (_.isArray(a[i]) && _.isArray(b[i])) {
            // recursive comparison of nested arrays
            diff = compareNestedNumberLists(a[i] as IComparableArray, b[i] as IComparableArray);
        }
        else if (_.isNumber(a[i]) && _.isNumber(b[i])) {
            diff = (a[i] as number) - (b[i] as number);
        }
        else {
            throw "Input elements either must be both numbers or both IComparableArrays";
        }

        // once the tie is broken, we are done
        if (diff !== 0) {
            break;
        }
    }

    return diff;
}

export function isFiniteNumber(val:number|null|undefined) {
    return !(typeof val === "undefined" || val === null || !isFinite(val));
}

export function isString(val:string|null|undefined) {
    return !(typeof val === "undefined" || val === null);
}

export function listSort<T>(sortValue1:T[], sortValue2:T[], ascending:boolean, cmp:(a:T,b:T, ascending:boolean)=>number):number {
    if (sortValue1.length === sortValue2.length) {
        let ret = 0;
        for (let i=0; i<sortValue1.length; i++) {
            ret = cmp(sortValue1[i], sortValue2[i], ascending);
            if (ret !== 0) {
                break;
            }
        }
        return ret;
    } else if (sortValue1.length < sortValue2.length) {
        return (ascending ? 1 : -1);
    } else {
        return (ascending ? -1 : 1);
    }
}

export function numberListSort(sortValue1:maybeNumber[], sortValue2:maybeNumber[], ascending:boolean):number {
    return listSort<maybeNumber>(sortValue1, sortValue2, ascending, numberSort);
}

export function stringListSort(sortValue1:maybeString[], sortValue2:maybeString[], ascending:boolean):number {
    return listSort<maybeString>(sortValue1, sortValue2, ascending, stringSort);
}

export function numberSort(sortValue1:number|null|undefined, sortValue2:number|null|undefined, ascending:boolean):number {
    if (isFiniteNumber(sortValue1) && isFiniteNumber(sortValue2)) {
        sortValue1 = sortValue1 as number;
        sortValue2 = sortValue2 as number;
        if (sortValue1 === sortValue2) {
            return 0;
        } else if (sortValue1 < sortValue2) {
            return ascending ? -1 : 1;
        } else {
            return ascending ? 1 : -1;
        }
    } else if (!isFiniteNumber(sortValue1)) {
        return 1;
    } else if (!isFiniteNumber(sortValue2)) {
        return -1;
    } else {
        return 0;
    }
}

export function stringSort(sortValue1:string|null|undefined, sortValue2:string|null|undefined, ascending:boolean):number {
    if (isString(sortValue1) && isString(sortValue2)) {
        sortValue1 = sortValue1 as string;
        sortValue2 = sortValue2 as string;
        return (ascending ? 1 : -1)*sortValue1.localeCompare(sortValue2);
    } else if (!isString(sortValue1)) {
        return 1;
    } else if (!isString(sortValue2)) {
        return -1;
    } else {
        return 0;
    }
}