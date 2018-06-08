import {CoExpression} from "../../../shared/api/generated/CBioPortalAPIInternal";
import {logicalAnd, logicalOr} from "../../../shared/lib/LogicUtils";
export const CORR_POS_COLOR = "rgb(41, 87, 41)";
export const CORR_NEG_COLOR = "rgb(180, 4, 4)";

export function correlationColor(correlation:number) {
    if (correlation > 0) {
        return CORR_POS_COLOR;
    } else {
        return CORR_NEG_COLOR;
    }
}

export function correlationSortBy(correlation:number) {
    return [Math.abs(correlation), (correlation > 0 ? 1 : 0)];
}

function cytobandFilterSingle(d:CoExpression, filterString:string) {
    if (!filterString.length) {
        return true;
    } else {
        let match = false;
        let reject = false;
        if (filterString[0] === "-") {
            filterString = filterString.substring(1);
            reject = true;
        }
        if (!filterString.length) {
            return true;
        }
        match = !!(d.cytoband && d.cytoband.indexOf(filterString) === 0); // only match at beginning, this makes most sense for cytoband
        return reject ? !match : match;
    }
}

export function cytobandFilter(d:CoExpression, filterString:string) {
    filterString = filterString.trim();
    if (!filterString.length) {
        return true;
    } else {
        const queryElts = filterString.split(/\s+/g);
        const positiveQueries = [];
        const negativeQueries = [];
        for (const q of queryElts) {
            if (q[0] === "-") {
                negativeQueries.push(q);
            } else {
                positiveQueries.push(q);
            }
        }
        const positiveResult = positiveQueries.length ? logicalOr(positiveQueries.map(q=>cytobandFilterSingle(d, q))) : true;
        const negativeResult = negativeQueries.length ? logicalAnd(negativeQueries.map(q=>cytobandFilterSingle(d, q))) : true;
        return positiveResult && negativeResult;
    }
}