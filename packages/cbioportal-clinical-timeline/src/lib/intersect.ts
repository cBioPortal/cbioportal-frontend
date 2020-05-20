import * as _ from 'lodash';

export function intersect(
    start1: number,
    end1: number,
    start2: number,
    end2: number
) {
    // find out which is longer one or two
    let shorter, longer;
    if (end1 - start1 > end2 - start2) {
        shorter = { start: start2, end: end2 };
        longer = { start: start1, end: end1 };
    } else {
        shorter = { start: start1, end: end1 };
        longer = { start: start2, end: end2 };
    }

    return (
        between(shorter.start, longer.start, longer.end) ||
        between(shorter.end, longer.start, longer.end)
    );
}

function between(num: number, bound1: number, bound2: number) {
    return num >= bound1 && num <= bound2;
}

export default intersect;
