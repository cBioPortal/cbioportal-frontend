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

export function axisLabel(gene:{hugoGeneSymbol:string, cytoband:string}, logScale:boolean) {
    return `${gene.hugoGeneSymbol} ${logScale ? "(log10) " : ""}(Cytoband: ${gene.cytoband})`
}