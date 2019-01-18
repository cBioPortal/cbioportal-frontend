import {SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";

export type SampleGroup = {
    id:string,
    name?:string,
    sampleIdentifiers:SampleIdentifier[],
    color?: string;
    legendText?: string;
};

export const TEMP_localStorageGroupsKey = "__tmp__groupComparisonGroups";

export function getCombinations(sets: { name: string, cases: string[] }[]) {
    let combinations: { sets: string[], cases: string[] }[] = [];

    let f = function (res: { sets: string[], cases: string[] }, sets: { name: string, cases: string[] }[]) {
        for (let i = 0; i < sets.length; i++) {
            let currentSet = sets[i];
            let commonCases = res.cases.length === 0 ? currentSet.cases : _.intersection(res.cases, currentSet.cases)
            let newSet = {
                sets: [...res.sets, currentSet.name],
                cases: commonCases
            }
            combinations.push(newSet);
            f(newSet, sets.slice(i + 1));
        }
    }
    f({ sets: [], cases: [] }, sets);
    return combinations;
}