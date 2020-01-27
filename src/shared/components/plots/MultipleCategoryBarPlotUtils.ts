import { IStringAxisData } from '../../../pages/resultsView/plots/PlotsTabUtils';
import _ from 'lodash';
import { IMultipleCategoryBarPlotData } from './MultipleCategoryBarPlot';

export function makePlotData(
    horzData: IStringAxisData['data'],
    vertData: IStringAxisData['data'],
    horizontalBars: boolean
) {
    let majorCategoryData: IStringAxisData['data'];
    let minorCategoryData: IStringAxisData['data'];
    if (horizontalBars) {
        majorCategoryData = vertData;
        minorCategoryData = horzData;
    } else {
        majorCategoryData = horzData;
        minorCategoryData = vertData;
    }
    const sampleToMinorCategories: { [sampleKey: string]: string[] } = _.chain(
        minorCategoryData
    )
        .keyBy('uniqueSampleKey')
        .mapValues(d => ([] as any).concat(d.value))
        .value();

    const usedMajorCategories: any = {};
    const categoryToCounts: {
        [minor: string]: { [major: string]: number };
    } = {};
    for (const d of majorCategoryData) {
        const minorCategories = sampleToMinorCategories[d.uniqueSampleKey];
        if (!minorCategories) {
            continue;
        }
        const majorCategories = ([] as any).concat(d.value);
        for (const cat of minorCategories) {
            categoryToCounts[cat] = categoryToCounts[cat] || {};
            for (const countCat of majorCategories) {
                usedMajorCategories[countCat] = true;
                categoryToCounts[cat][countCat] =
                    categoryToCounts[cat][countCat] || 0;
                categoryToCounts[cat][countCat] += 1;
            }
        }
    }

    const majorCategoryTotalCounts: { [id: string]: number } = {};
    // ensure entries for all used minor categories - we need 0 entries for those major/minor combos we didnt see
    _.forEach(usedMajorCategories, (z, major) => {
        let totalCount = 0;
        _.forEach(categoryToCounts, majorCounts => {
            majorCounts[major] = majorCounts[major] || 0;
            totalCount += majorCounts[major];
        });
        majorCategoryTotalCounts[major] = totalCount;
    });

    // turn counts into data
    let data = _.map(
        categoryToCounts,
        (
            countsMap: { [majorCategory: string]: number },
            minorCategory: string
        ) => {
            let counts = _.map(countsMap, (count, majorCategory) => {
                const percentage =
                    (count / majorCategoryTotalCounts[majorCategory]) * 100;
                return {
                    majorCategory,
                    count,
                    percentage: parseFloat(percentage.toFixed(2)),
                };
            });
            return {
                minorCategory,
                counts,
            };
        }
    );
    return data;
}

export function sortDataByCategory<D>(
    data: D[],
    getCategory: (d: D) => string,
    categoryOrder: { [cat: string]: number } | undefined
) {
    return _.sortBy(data, d => {
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
    });
}

export function makeBarSpecs(
    data: IMultipleCategoryBarPlotData[],
    minorCategoryOrder: { [cat: string]: number } | undefined,
    majorCategoryOrder: { [cat: string]: number } | undefined,
    getColor: (minorCategory: string) => string,
    categoryCoord: (categoryIndex: number) => number,
    horizontalBars: boolean,
    stacked: boolean,
    percentage: boolean
): {
    fill: string;
    data: {
        x: number;
        y: number;
        majorCategory: string;
        minorCategory: string;
        count: number;
        percentage: number;
    }[]; // one data per major category, in correct order - either specified, or alphabetical
}[] {
    // one bar spec per minor category, in correct order - either specified, or alphabetical
    data = sortDataByCategory(data, d => d.minorCategory, minorCategoryOrder);
    // reverse the order of stacked or horizontal bars
    if ((!horizontalBars && stacked) || (horizontalBars && !stacked)) {
        data = _.reverse(data);
    }
    return data.map(({ minorCategory, counts }) => {
        const fill = getColor(minorCategory);
        const sortedCounts = sortDataByCategory(
            counts,
            d => d.majorCategory,
            majorCategoryOrder
        );
        return {
            fill,
            data: sortedCounts.map((obj, index) => ({
                x: categoryCoord(index),
                y: percentage ? obj.percentage : obj.count,
                majorCategory: obj.majorCategory,
                minorCategory: minorCategory,
                count: obj.count,
                percentage: obj.percentage,
            })),
        };
    });
}
