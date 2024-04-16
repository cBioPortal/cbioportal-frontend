import { IStringAxisData } from './PlotsTabUtils';
import _ from 'lodash';
import { IMultipleCategoryBarPlotData } from '../../../pages/groupComparison/MultipleCategoryBarPlot';
import { marginLeft } from 'pages/patientView/trialMatch/style/trialMatch.module.scss';

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
interface TotalSumItem {
    majorCategory: string;
    sum: number;
    minorCategory: { name: string; count: number; percentage: number }[];
}

// Export TotalSumItem for accessibility from other modules if needed
export { TotalSumItem };
export function sortDataByCategory<D>(
    data: D[],
    getCategory: (d: D) => string,
    categoryOrder: { [cat: string]: number } | undefined
) {
    // console.log( TotalSumItem[],"totalSumArray inside sortDataByCategory");
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
    percentage: boolean,
    sortOption: string
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
    console.log(data, 'iscalled2');
    data.forEach(item => {
        item.counts.sort((a, b) =>
            a.majorCategory.localeCompare(b.majorCategory)
        );
    });
    console.log(data, 'iscalled211');

    // interface TotalSumItem {
    //     majorCategory: string;
    //     sum: number;
    //     minorCategory: { name: string; count: number ,percentage:number}[];
    // }

    const totalSumArray: TotalSumItem[] = [];
    data.forEach(item => {
        item.counts.forEach(countItem => {
            const existingItem = totalSumArray.find(
                sumItem => sumItem.majorCategory === countItem.majorCategory
            );
            if (existingItem) {
                existingItem.sum += countItem.count;
                existingItem.minorCategory.push({
                    name: item.minorCategory,
                    count: countItem.count,
                    percentage: countItem.percentage,
                });
            } else {
                totalSumArray.push({
                    majorCategory: countItem.majorCategory,
                    sum: countItem.count,
                    minorCategory: [
                        {
                            name: item.minorCategory,
                            count: countItem.count,
                            percentage: countItem.percentage,
                        },
                    ],
                });
            }
        });
    });

    console.log(totalSumArray, 'totalssu');
    totalSumArray.sort((a, b) => b.sum - a.sum);
    const minorCategoryArrays: {
        [key: string]: {
            majorCategory: string;
            count: number;
            percentage: number;
        }[];
    } = {};
    data.forEach(item => {
        // Extract the minorCategory from the current item
        const minorCategory = item.minorCategory;

        // Check if the minorCategory already exists in minorCategoryArrays
        if (!minorCategoryArrays[minorCategory]) {
            // If it doesn't exist, create a new array for it
            minorCategoryArrays[minorCategory] = [];
        }

        // Find corresponding items in totalSumArray and add them to the array
        totalSumArray.forEach(totalItem => {
            totalItem.minorCategory.forEach(minorItem => {
                if (minorItem.name === minorCategory) {
                    minorCategoryArrays[minorCategory].push({
                        majorCategory: totalItem.majorCategory,
                        count: minorItem.count,
                        percentage: minorItem.percentage,
                    });
                }
            });
        });
    });
    console.log(minorCategoryArrays, 'minorCategoryarrayss');
    return data.map(({ minorCategory, counts }) => {
        const fill = getColor(minorCategory);
        const sortedCounts = sortDataByCategory(
            counts,
            d => d.majorCategory,
            majorCategoryOrder
        );
        console.log(counts, majorCategoryOrder, 'kkk');
        console.log(sortedCounts, 'sror');
        // sortedCounts.sort((a, b) => b.count - a.count);

        console.log(sortedCounts, 'sorteddsc');
        // console.log(minorCategory,"sorteddsc");
        const finals = minorCategoryArrays[minorCategory];
        // console.log(minorCategoryArrays["Male"],"HEREISSS")

        // console.log(sortedCounts,"sror")
        let ans;
        if (sortOption == 'sortByAlphabet') {
            ans = sortedCounts;
        } else {
            ans = finals;
        }
        console.log(sortOption, 'sortOptions');
        const finalans = {
            fill,
            data: ans.map((obj, index) => ({
                x: categoryCoord(index),
                y: percentage ? obj.percentage : obj.count,
                majorCategory: obj.majorCategory,
                minorCategory: minorCategory,
                count: obj.count,
                percentage: obj.percentage,
            })),
        };
        console.log(finalans, 'iscalled3');

        return finalans;
    });
}
