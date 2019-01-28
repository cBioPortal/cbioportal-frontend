import { IStringAxisData } from './../../../pages/resultsView/plots/PlotsTabUtils';
import _ from "lodash";
import { IStackedBarPlotData } from './StackedBarPlot';

export function makePlotData(
    horzData:IStringAxisData["data"],
    vertData:IStringAxisData["data"],
    horizontalBars:boolean
) {
    let majorCategoryData:IStringAxisData["data"];
        let minorCategoryData:IStringAxisData["data"];
        if (horizontalBars) {
            majorCategoryData = vertData;
            minorCategoryData = horzData;
        } else {
            majorCategoryData = horzData;
            minorCategoryData = vertData;
        }
        const sampleToMinorCategories:{[sampleKey:string]:string[]} = _.chain(minorCategoryData)
            .keyBy("uniqueSampleKey")
            .mapValues(d=>([] as any).concat(d.value))
            .value();

        const usedMajorCategories:any = {};
        const usedMinorCategories:any = {};
        const categoryToCounts:{[minor:string]:{[major:string]:number}} = {};
        for (const d of majorCategoryData) {
            const minorCategories = sampleToMinorCategories[d.uniqueSampleKey];
            if (!minorCategories) {
                continue;
            }
            const majorCategories = ([] as any).concat(d.value);
            for (const cat of minorCategories) {
                categoryToCounts[cat] = categoryToCounts[cat] || {};
                usedMinorCategories[cat] = true;
                for (const countCat of majorCategories) {
                    usedMajorCategories[countCat] = true;
                    categoryToCounts[cat][countCat] = categoryToCounts[cat][countCat] || 0;
                    categoryToCounts[cat][countCat] += 1;
                }
            }
        }
        // ensure entries for all used minor categories - we need 0 entries for those major/minor combos we didnt see
        _.forEach(usedMajorCategories, (z, major)=>{
            _.forEach(categoryToCounts, majorCounts=>{
                majorCounts[major] = majorCounts[major] || 0;
            });
        });

        // turn counts into data
        let data = _.map(categoryToCounts, (countsMap:{[majorCategory:string]:number}, minorCategory:string)=>{
            let counts = _.map(countsMap, (count, majorCategory)=>({
                majorCategory, count
            }));
            return {
                minorCategory,
                counts
            };
        });
        return data;
}

export function sortDataByCategory<D>(
    data:D[],
    getCategory:(d:D)=>string,
    categoryOrder:{[cat:string]:number} | undefined
) {
    return _.sortBy(data, d=>{
        const category = getCategory(d);
        if (categoryOrder) {
            if (category in categoryOrder) {
                return categoryOrder[category];
            } else {
                return Number.POSITIVE_INFINITY;
            }
        } else {
            return category;
        }
    })
}

export function makeBarSpecs(
    data: IStackedBarPlotData[],
    minorCategoryOrder:{[cat:string]:number} | undefined,
    majorCategoryOrder:{[cat:string]:number} | undefined,
    getColor:(minorCategory:string)=>string,
    categoryCoord:(categoryIndex:number)=>number,
    horizontalBars:boolean
):{
    fill: string,
    data:{ x:number, y: number, majorCategory: string, minorCategory:string, count:number}[] // one data per major category, in correct order - either specified, or alphabetical
}[] // one bar spec per minor category, in correct order - either specified, or alphabetical 
{
    data = sortDataByCategory(data, d=>d.minorCategory, minorCategoryOrder);
    // for vertical bars, reverse order, to put first on top
    if (!horizontalBars) {
        data = _.reverse(data);
    }
    return data.map(({ minorCategory, counts })=>{
        const fill = getColor(minorCategory);
        const sortedCounts = sortDataByCategory(counts, d=>d.majorCategory, majorCategoryOrder);
        return {
            fill,
            data: sortedCounts.map((obj, index)=>({ x:categoryCoord(index), y: obj.count, majorCategory: obj.majorCategory, minorCategory:minorCategory, count:obj.count }))
        };
    });
}