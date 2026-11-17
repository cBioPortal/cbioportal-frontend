/*
 * Copyright (c) 2016 Memorial Sloan-Kettering Cancer Center.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

export default function haselementsininterval<T>(
    sorted_list: T[],
    valueFn: (t: T) => number,
    lower_inc_val: number,
    upper_exc_val: number
): boolean {
    // in: sorted_list, a list sorted in increasing order of valueFn
    //     valueFn, a function that takes an element of sorted_list and returns a number
    //     lower_inc and upper_ex: define a half-open interval [lower_inc, upper_exc)
    // out: boolean, true iff there are any elements whose image under valueFn is in [lower_inc, upper_exc)

    let test_lower_inc = 0;
    let test_upper_exc = sorted_list.length;
    let middle, middle_val;
    let ret = false;
    while (true) {
        if (test_lower_inc >= test_upper_exc) {
            break;
        }
        middle = Math.floor((test_lower_inc + test_upper_exc) / 2);
        middle_val = valueFn(sorted_list[middle]);
        if (middle_val >= upper_exc_val) {
            test_upper_exc = middle;
        } else if (middle_val < lower_inc_val) {
            test_lower_inc = middle + 1;
        } else {
            // otherwise, the middle value is inside the interval,
            // so there's at least one value inside the interval
            ret = true;
            break;
        }
    }
    return ret;
}
