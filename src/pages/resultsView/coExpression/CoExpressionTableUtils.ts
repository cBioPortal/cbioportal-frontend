import {CoExpression} from "../../../shared/api/generated/CBioPortalAPIInternal";
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

export function cytobandFilter(d:CoExpression, filterString:string) {
    if (!filterString.length) {
        return true;
    } else {
        let match = false;
        let reject = false;
        if (filterString[0] === "-") {
            filterString = filterString.substring(1);
            reject = true;
        }
        match = !!(d.cytoband && d.cytoband.indexOf(filterString) > -1);
        return reject ? !match : match;
    }
}