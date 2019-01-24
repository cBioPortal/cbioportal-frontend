import { SampleIdentifier } from "../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";

export type SampleGroup = {
    id: string,
    name?: string,
    sampleIdentifiers: SampleIdentifier[],
    color?: string;
    legendText?: string;
};

export const TEMP_localStorageGroupsKey = "__tmp__groupComparisonGroups";

export function getCombinations(groups: { name: string, cases: string[] }[]) {
    let combinations: { groups: string[], cases: string[] }[] = [];

    let f = function (res: { groups: string[], cases: string[] }, groups: { name: string, cases: string[] }[]) {
        for (let i = 0; i < groups.length; i++) {
            let currentSet = groups[i];
            let commonCases = res.cases.length === 0 ? currentSet.cases : _.intersection(res.cases, currentSet.cases)
            let newSet = {
                groups: [...res.groups, currentSet.name],
                cases: commonCases
            }
            combinations.push(newSet);
            f(newSet, groups.slice(i + 1));
        }
    }
    f({ groups: [], cases: [] }, groups);
    return combinations;
}

export function getStackedBarData(combinationSets: { groups: string[], cases: string[] }[], categoryToColor: { [cat: string]: string }) {
    const overlappingCases = _.uniq(_.reduce(combinationSets, (acc, next) => {
        if (next.groups.length > 1) {
            acc = acc.concat(next.cases)
        }
        return acc;
    }, [] as string[]))

    let groupedSet = _.reduce(combinationSets, (acc, next) => {
        if (next.groups.length === 1) {
            let cases = _.difference(next.cases, overlappingCases)
            acc[next.groups[0]] = {
                x: '',
                y: cases.length,
                cases: cases,
                fill: categoryToColor[next.groups[0]],
                groupName: next.groups[0]
            }
        }
        return acc;
    }, {} as { [id: string]: { x: string, y: number, cases: string[], fill: string, groupName: string } })

    let groups = _.values(groupedSet).sort((a, b) => a.y - b.y).map(group => [group])

    if (overlappingCases.length > 0) {
        return [[{
            x: '',
            y: overlappingCases.length,
            cases: overlappingCases,
            fill: "#CCCCCC",
            groupName: 'Overlapping Cases'
        }], ...groups]
    }
    return groups
}

export function getVennPlotData(combinationSets: { groups: string[], cases: string[] }[]) {
    let maxCount = _.max(combinationSets.map(set => set.cases.length))!;
    return combinationSets.map(set => {
        return {
            count: set.cases.length,
            //this is to make sure all the circle groups are of same size
            size: set.groups.length === 1 ? maxCount : set.cases.length,
            label: `${set.cases.length}`,
            sets: set.groups
        }
    }).sort((a, b) => b.count - a.count);
}