import {IStringAxisData} from "../../../pages/resultsView/plots/PlotsTabUtils";
export function getUniqueSampleKeyToCategories(
    horzData: IStringAxisData["data"],
    vertData: IStringAxisData["data"]
) {
    const ret:{[sampleKey:string]:{ horz?:string, vert?:string }} = {};
    for (const d of horzData) {
        ret[d.uniqueSampleKey] = ret[d.uniqueSampleKey] || {};
        ret[d.uniqueSampleKey].horz = d.value;
    }
    for (const d of vertData) {
        ret[d.uniqueSampleKey] = ret[d.uniqueSampleKey] || {};
        ret[d.uniqueSampleKey].vert = d.value;
    }
    return ret;
}