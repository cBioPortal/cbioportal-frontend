import ListIndexedMap from 'shared/lib/ListIndexedMap';
import { MobxPromise } from 'mobxpromise/dist/src/MobxPromise';
import {SampleIdentifier, Sample, PatientIdentifier} from "../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";
import {ResultsViewTab} from "../resultsView/ResultsViewPageHelpers";
import {GroupComparisonTab} from "./GroupComparisonPage";
import {StudyViewFilter} from "../../shared/api/generated/CBioPortalAPIInternal";

export type ComparisonSampleGroup = {
    // mandatory:
    id:string, // unique identifier
    sampleIdentifiers:SampleIdentifier[], // samples in the group
    name:string, // display name

    // optional:
    color?: string; // color for charts
    legendText?: string; // display text (defaults to name) to put in a legend
};

export type ComparisonGroup = ComparisonSampleGroup & {
    patientIdentifiers:PatientIdentifier[];
    hasOverlappingSamples?:boolean; // whether the group has had samples filtered out because they overlapped in the selection
    hasOverlappingPatients?:boolean; // whether the group has had patients filtered out because they overlapped in the selection
};

export const TEMP_localStorageGroupsKey = "__tmp__groupComparisonGroups";

export function getCombinations(groups: { name: string, cases: string[] }[]) {
    let combinations: { groups: string[], cases: string[] }[] = [];

    let f = function (res: { groups: string[], cases: string[] }, groups: { name: string, cases: string[] }[]) {
        for (let i = 0; i < groups.length; i++) {
            let currentSet = groups[i];
            let commonCases = res.groups.length === 0 ? currentSet.cases : _.intersection(res.cases, currentSet.cases)
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
                cases,
                //assign default color when not found
                fill: categoryToColor[next.groups[0]] ? categoryToColor[next.groups[0]] : "#CCCCCC",
                groupName: next.groups[0]
            }
        }
        return acc;
    }, {} as { [id: string]: { cases: string[], fill: string, groupName: string } })

    let groups = _.values(groupedSet).sort((a, b) => a.cases.length - b.cases.length).map(group => [group])

    if (overlappingCases.length > 0) {
        return [[{
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
            size:set.cases.length,
            label: `${set.cases.length}`,
            sets: set.groups
        }
    }).sort((a, b) => b.count - a.count);
}

export function caseCountsInParens(
    samples:MobxPromise<any[]>|any[],
    patients:MobxPromise<any[]>|any[],
    asteriskForSamples:boolean = false,
    asteriskForPatients:boolean = false
) {
    let text = "";
    if ((Array.isArray(samples) || samples.isComplete) && (Array.isArray(patients) || patients.isComplete)) {
        const samplesArr = Array.isArray(samples) ? samples : samples.result!;
        const patientsArr = Array.isArray(patients) ? patients : patients.result!;
        if (samplesArr.length === patientsArr.length) {
            text = `(${samplesArr.length}${asteriskForSamples || asteriskForPatients ? "*" : ""})`;
        } else {
            text = `(${samplesArr.length}${asteriskForSamples ? "*" : ""} s/${patientsArr.length}${asteriskForPatients ? "*" : ""} p)`;
        }
    }
    return text;
}

export function getPatientIdentifiers(
    sampleIdentifiers:SampleIdentifier[],
    sampleSet:ListIndexedMap<Sample>
) {
    const patientSet:{[uniquePatientKey:string]:PatientIdentifier} = {};
    for (const sampleId of sampleIdentifiers) {
        const sample = sampleSet.get(sampleId.studyId, sampleId.sampleId);
        if (sample && !(sample.uniquePatientKey in patientSet)) {
            patientSet[sample.uniquePatientKey] = { patientId: sample.patientId, studyId: sample.studyId};
        }
    }
    return _.values(patientSet);
}

export const ENRICHMENTS_NOT_2_GROUPS_MSG = "We can only show enrichments when two groups are selected. Please select/deselect groups in the 'Active Groups' section so that only two are selected.";
export function ENRICHMENTS_TOO_MANY_STUDIES_MSG(enrichmentsType:string) {
    return `Selected comparison groups span more than one study, so we can't show ${enrichmentsType} enrichments. Please deselect groups from the top of the page, or try a different set of groups.`;
}

export function getDefaultGroupName(filters:StudyViewFilter) {
    return _.sortBy( // sort clinical data equality filters into a canonical order - lets just do alphabetical by attribute id
        filters.clinicalDataEqualityFilters,
        filter=>filter.attributeId
    ).map(filter=>filter.values.join("+")) // get each attributes selected values, joined by +
    .join(", "); // comma separate each attributes values
}

export function getTabId(pathname:string) {
    const match = pathname.match(/comparison\/([^\/]+)/);
    if (match) {
        return match[1] as GroupComparisonTab;
    } else {
        return undefined;
    }
}