import * as _ from 'lodash';

export interface IComparableArray extends Array<number|IComparableArray> {}

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