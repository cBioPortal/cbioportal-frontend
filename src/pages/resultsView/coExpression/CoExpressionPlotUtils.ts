import _ from "lodash";

export function getUniquePrecision(value:number, allValues:number[], maxPrecision:number=3) {
    if (!allValues.length)
        return 0;

    let precision = 0;
    while (_.countBy(allValues, val=>val.toFixed(precision))[value.toFixed(precision)] > 1) {
        precision++;

        if (precision >= maxPrecision) {
            break;
        }
    }
    return precision;
}

export function axisLabel(geneticEntity:{geneticEntityName:string}, logScale:boolean, profileName:string) {
    return `${profileName}: ${geneticEntity.geneticEntityName} ${logScale ? "(log2) " : ""}`;
}

export function isNotProfiled(d:{profiledX:boolean, profiledY:boolean}) {
    return !d.profiledX && !d.profiledY;
}