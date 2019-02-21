import ListIndexedMap from 'shared/lib/ListIndexedMap';
import {MobxPromise} from 'mobxpromise/dist/src/MobxPromise';
import {ClinicalAttribute, PatientIdentifier, Sample, SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";
import {GroupComparisonTab} from "./GroupComparisonPage";
import {StudyViewFilter} from "../../shared/api/generated/CBioPortalAPIInternal";
import {AlterationEnrichmentWithQ} from "../resultsView/enrichments/EnrichmentsUtil";
import {SessionGroupData} from "../../shared/api/ComparisonGroupClient";

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export type ComparisonGroup = Omit<SessionGroupData, "studies"|"color"> & {
    color:string; // color mandatory here, bc we'll assign one if its missing
    uid:string; // unique in the session
    studies:{ id:string, samples: string[], patients:string[] }[]; // include patients, filter out nonexistent samples
    nonExistentSamples:SampleIdentifier[]; // samples specified in the group which no longer exist in our DB
};

export type OverlapFilteredComparisonGroup = ComparisonGroup & {
    hasOverlappingSamples:boolean; // whether the group has had samples filtered out because they overlapped in the selection
    hasOverlappingPatients:boolean; // whether the group has had patients filtered out because they overlapped in the selection
};

export type CopyNumberEnrichment = AlterationEnrichmentWithQ & { value:number };

export function getCombinations(groups: { uid: string, cases: string[] }[]) {
    let combinations: { groups: string[], cases: string[] }[] = [];

    let f = function (res: { groups: string[], cases: string[] }, groups: { uid: string, cases: string[] }[]) {
        for (let i = 0; i < groups.length; i++) {
            let currentSet = groups[i];
            let commonCases = res.groups.length === 0 ? currentSet.cases : _.intersection(res.cases, currentSet.cases)
            let newSet = {
                groups: [...res.groups, currentSet.uid],
                cases: commonCases
            }
            combinations.push(newSet);
            f(newSet, groups.slice(i + 1));
        }
    }
    f({ groups: [], cases: [] }, groups);
    return combinations;
}

export function getStackedBarData(groups:{ uid: string, cases:string[] }[], uidToGroup:{[uid:string]:ComparisonGroup}) {
    const overlappingCases = _.intersection(...groups.map(group=>group.cases));

    const ret = groups.map(group=>[{
        groupName: uidToGroup[group.uid].name,
        fill: uidToGroup[group.uid].color,
        cases: _.difference(group.cases, overlappingCases)
    }]);
    if (overlappingCases.length > 0) {
        ret.unshift([{
            cases: overlappingCases,
            fill: "#CCCCCC",
            groupName: 'Overlapping Cases'
        }]);
    }
    return ret;
}

export function getVennPlotData(combinationSets: { groups: string[], cases: string[] }[]) {
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

export function getOverlappingSamples(
    groups:ComparisonGroup[]
) {
    // samples that are in at least two selected groups
    const sampleUseCount = new ListIndexedMap<number>();
    for (const group of groups) {
        for (const study of group.studies) {
            const studyId = study.id;
            for (const sampleId of study.samples) {
                sampleUseCount.set(
                    (sampleUseCount.get(studyId, sampleId) || 0) + 1,
                    studyId, sampleId
                );
            }
        }
    }
    const overlapping = [];
    for (const entry of sampleUseCount.entries()) {
        if (entry.value > 1) {
            overlapping.push({ studyId: entry.key[0], sampleId: entry.key[1] });
        }
    }
    return overlapping;
}

export function getOverlappingPatients(
    groups:ComparisonGroup[]
) {
    // patients that are in at least two selected groups
    const patientUseCount = new ListIndexedMap<number>();
    for (const group of groups) {
        for (const study of group.studies) {
            const studyId = study.id;
            for (const patientId of study.patients) {
                patientUseCount.set(
                    (patientUseCount.get(studyId, patientId) || 0) + 1,
                    studyId, patientId
                );
            }
        }
    }
    const overlapping = [];
    for (const entry of patientUseCount.entries()) {
        if (entry.value > 1) {
            overlapping.push({ studyId: entry.key[0], patientId: entry.key[1] });
        }
    }
    return overlapping;
}

export function isGroupEmpty(
    group:ComparisonGroup
) {
    return !_.some(group.studies, study=>(study.samples.length > 0 || study.patients.length > 0));
}

export function getStudyIds(
    groups:Pick<SessionGroupData, "studies">[]
) {
    return _.uniq<string>(_.flattenDeep<string>(
        groups.map(group=>group.studies.map(study=>study.id))
    ));
}

export function getSampleIdentifiers(
    groups:Pick<SessionGroupData, "studies">[]
) {
    return _.uniqWith(
        _.flattenDeep<SampleIdentifier>(
            groups.map(group=>group.studies.map(study=>{
                const studyId = study.id;
                return study.samples.map(sampleId=>({ studyId, sampleId }));
            }))
        ),
        (id1, id2)=>((id1.sampleId === id2.sampleId) && (id1.studyId === id2.studyId))
    );
}

export function getNumSamples(
    group:Pick<SessionGroupData, "studies">
) {
    return _.sum(group.studies.map(study=>study.samples.length));
}

export function getOverlapFilteredGroups(
    groups:ComparisonGroup[],
    info:{
        overlappingSamplesSet:ListIndexedMap<boolean>,
        overlappingPatientsSet:ListIndexedMap<boolean>
    }
) {
    // filter out overlap
    const overlappingSamplesSet = info.overlappingSamplesSet;
    const overlappingPatientsSet = info.overlappingPatientsSet;
    return groups.map(group=>{
        let hasOverlappingSamples = false;
        let hasOverlappingPatients = false;
        const studies = [];
        for (const study of group.studies) {
            const studyId = study.id;
            studies.push({
                id: studyId,
                samples: study.samples.filter(sampleId=>{
                    if (overlappingSamplesSet.has(studyId, sampleId)) {
                        hasOverlappingSamples = true;
                        return false;
                    } else {
                        return true;
                    }
                }),
                patients: study.patients.filter(patientId=>{
                    if (overlappingPatientsSet.has(studyId, patientId)) {
                        hasOverlappingPatients = true;
                        return false;
                    } else {
                        return true;
                    }
                }),
            });
        }
        return Object.assign({}, group, {
            studies, hasOverlappingSamples, hasOverlappingPatients
        });
    });
}

export function ENRICHMENTS_NOT_2_GROUPS_MSG(tooMany:boolean) {
    return `We can only show enrichments when two groups are selected. Please ${tooMany ? "deselect" : "select"} groups in the 'Active Groups' section so that only two are selected.`;
}

export function ENRICHMENTS_TOO_MANY_STUDIES_MSG(enrichmentsType:string) {
    return `The selected comparison groups span more than one study, so we can't show ${enrichmentsType} enrichments. Please change your selection in the 'Active Groups' section so that all samples only come from one study.`;
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

export function getPieChartGroupFilters(
    baseFilters: StudyViewFilter,
    clinicalAttribute:ClinicalAttribute,
    clinicalAttributeValue:string
) {
    const clinicalDataType = clinicalAttribute.patientAttribute ? "PATIENT" : "SAMPLE";
    const newFilters = _.cloneDeep(baseFilters);

    newFilters.clinicalDataEqualityFilters = newFilters.clinicalDataEqualityFilters || [];
    const existingFilter = newFilters.clinicalDataEqualityFilters.find(f=>{
        return f.attributeId === clinicalAttribute.clinicalAttributeId &&
                f.clinicalDataType === clinicalDataType;
    });
    if (existingFilter) {
        existingFilter.values = _.uniq(existingFilter.values.concat([clinicalAttributeValue]));
    } else {
        newFilters.clinicalDataEqualityFilters.push({
            attributeId: clinicalAttribute.clinicalAttributeId,
            clinicalDataType,
            values:[clinicalAttributeValue]
        });
    }
    return newFilters;
}