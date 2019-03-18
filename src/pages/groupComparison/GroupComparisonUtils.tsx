import {MobxPromise} from 'mobxpromise/dist/src/MobxPromise';
import {
    ClinicalAttribute,
    ClinicalData,
    PatientIdentifier,
    Sample,
    SampleIdentifier
} from "../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";
import {GroupComparisonTab} from "./GroupComparisonPage";
import {ClinicalDataIntervalFilterValue, ClinicalDataEnrichment, StudyViewFilter} from "../../shared/api/generated/CBioPortalAPIInternal";
import {AlterationEnrichmentWithQ} from "../resultsView/enrichments/EnrichmentsUtil";
import {GroupData, SessionGroupData} from "../../shared/api/ComparisonGroupClient";
import * as React from "react";
import ComplexKeyMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import ComplexKeySet from "../../shared/lib/complexKeyDataStructures/ComplexKeySet";
import ComplexKeyCounter from "../../shared/lib/complexKeyDataStructures/ComplexKeyCounter";

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export type ComparisonGroup = Omit<SessionGroupData, "studies"|"color"> & {
    color:string; // color mandatory here, bc we'll assign one if its missing
    uid:string; // unique in the session
    studies:{ id:string, samples: string[], patients:string[] }[]; // include patients, filter out nonexistent samples
    nonExistentSamples:SampleIdentifier[]; // samples specified in the group which no longer exist in our DB
};

export type StudyViewComparisonGroup = Omit<GroupData, "color"> & {
    uid:string; // unique in the session
    studies:{ id:string, samples: string[], patients:string[] }[]; // include patients, filter out nonexistent samples
    nonExistentSamples:SampleIdentifier[]; // samples specified in the group which no longer exist in our DB
};

export type OverlapFilteredComparisonGroup = ComparisonGroup & {
    hasOverlappingSamples:boolean; // whether the group has had samples filtered out because they overlapped in the selection
    hasOverlappingPatients:boolean; // whether the group has had patients filtered out because they overlapped in the selection
}
export type ClinicalDataEnrichmentWithQ = ClinicalDataEnrichment & { qValue:number };

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

export const OVERLAP_GROUP_COLOR = "#CCCCCC";

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
            fill: OVERLAP_GROUP_COLOR,
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
    sampleSet:ComplexKeyMap<Sample>
) {
    const patientSet:{[uniquePatientKey:string]:PatientIdentifier} = {};
    for (const sampleId of sampleIdentifiers) {
        const sample = sampleSet.get({studyId:sampleId.studyId, sampleId: sampleId.sampleId});
        if (sample && !(sample.uniquePatientKey in patientSet)) {
            patientSet[sample.uniquePatientKey] = { patientId: sample.patientId, studyId: sample.studyId};
        }
    }
    return _.values(patientSet);
}

export function getOverlappingSamples(
    groups:Pick<ComparisonGroup, "studies">[]
) {
    // samples that are in at least two selected groups
    const sampleUseCount = new ComplexKeyCounter();
    for (const group of groups) {
        for (const study of group.studies) {
            const studyId = study.id;
            for (const sampleId of study.samples) {
                sampleUseCount.increment({ studyId, sampleId });
            }
        }
    }
    const overlapping = [];
    for (const entry of sampleUseCount.entries()) {
        if (entry.value > 1) {
            overlapping.push(entry.key as SampleIdentifier);
        }
    }
    return overlapping;
}

export function getOverlappingPatients(
    groups:Pick<ComparisonGroup, "studies">[]
) {
    // patients that are in at least two selected groups
    const patientUseCount = new ComplexKeyCounter();
    for (const group of groups) {
        for (const study of group.studies) {
            const studyId = study.id;
            for (const patientId of study.patients) {
                patientUseCount.increment({ studyId, patientId });
            }
        }
    }
    const overlapping = [];
    for (const entry of patientUseCount.entries()) {
        if (entry.value > 1) {
            overlapping.push(entry.key as PatientIdentifier);
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

export function finalizeStudiesAttr(
    groupData:Pick<SessionGroupData, "studies">,
    sampleSet:ComplexKeyMap<Sample>
) {
    // (1) filter out, and keep track of nonexisting samples
    // (2) add `patients` object
    const nonExistentSamples = [];
    const studies = [];

    for (const study of groupData.studies) {
        const studyId = study.id;
        const samples = [];
        let patients = [];
        for (const sampleId of study.samples) {
            const sample = sampleSet.get({studyId, sampleId});
            if (!sample) {
                // filter out, and keep track of, nonexisting sample
                nonExistentSamples.push({ studyId, sampleId });
            } else {
                // add sample and corresponding patient
                samples.push(sampleId);
                patients.push(sample.patientId);
            }
        }
        patients = _.uniq(patients);
        if (samples.length > 0 || patients.length > 0) {
            studies.push({
                id: studyId,
                samples,
                patients
            });
        }
    }

    return {
        nonExistentSamples,
        studies
    };
}

export function getOverlapFilteredGroups(
    groups:ComparisonGroup[],
    info:{
        overlappingSamplesSet:ComplexKeySet,
        overlappingPatientsSet:ComplexKeySet
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
            const nonOverlappingSamples = study.samples.filter(sampleId=>{
                if (overlappingSamplesSet.has({studyId, sampleId})) {
                    hasOverlappingSamples = true;
                    return false;
                } else {
                    return true;
                }
            });
            const nonOverlappingPatients = study.patients.filter(patientId=>{
                if (overlappingPatientsSet.has({studyId, patientId})) {
                    hasOverlappingPatients = true;
                    return false;
                } else {
                    return true;
                }
            });
            if (nonOverlappingSamples.length > 0 || nonOverlappingPatients.length > 0) {
                studies.push({
                    id: studyId,
                    samples: nonOverlappingSamples,
                    patients: nonOverlappingPatients,
                });
            }
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

export const SURVIVAL_TOO_MANY_GROUPS_MSG =
    "We can't show survival for more than 10 groups. Please deselect groups in the 'Active Groups' section.";

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

export function getNumberAttributeGroupFilters(
    baseFilters: StudyViewFilter,
    clinicalAttribute:ClinicalAttribute,
    range:[number, number]
) {
    const clinicalDataType = clinicalAttribute.patientAttribute ? "PATIENT" : "SAMPLE";
    const newFilters = _.cloneDeep(baseFilters);

    newFilters.clinicalDataIntervalFilters = newFilters.clinicalDataIntervalFilters || [];
    const existingFilter = newFilters.clinicalDataIntervalFilters.find(f=>{
        return f.attributeId === clinicalAttribute.clinicalAttributeId &&
            f.clinicalDataType === clinicalDataType;
    });

    if (existingFilter) {
        existingFilter.values = _.uniqWith(
            existingFilter.values.concat([{
                start:range[0],
                end:range[1]
            } as ClinicalDataIntervalFilterValue]
        ), (a:ClinicalDataIntervalFilterValue, b:ClinicalDataIntervalFilterValue)=>{
            return (a.start === b.start && a.end === b.end);
        });
    } else {
        newFilters.clinicalDataIntervalFilters.push({
            attributeId: clinicalAttribute.clinicalAttributeId,
            clinicalDataType,
            values:[{start:range[0], end:range[1], value:""}]
        });
    }
    return newFilters;
}

export function getStringAttributeGroupFilters(
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

export function MissingSamplesMessage(
    props:{
        samples:SampleIdentifier[]
    }
) {
    return (
        <div style={{width:380}}>
            <div style={{marginBottom:7}}>The following samples cannot be found in our database. They might have been removed or changed since this group was created: </div>
            <div style={{maxHeight:200, overflowY:"scroll"}}>
                {props.samples.map(sample=><div>{`${sample.studyId}:${sample.sampleId}`}</div>)}
            </div>
        </div>
    );
}

export function sortDataIntoQuartiles<D>(
    groupedByValue:{[value:number]:D[]},
    inclusiveQuartileTops:[number, number, number] // assumed sorted ascending, and distinct
) {
    const quartileGroups:[D[], D[], D[], D[]] = [[],[],[],[]];
    _.forEach(groupedByValue, (dataWithValue:D[], value:string)=>{
        let q = 0;
        let v = parseFloat(value);
        while (v > inclusiveQuartileTops[q]) {
            q += 1;
            if (q > 2) {
                break;
            }
        }
        quartileGroups[q] = quartileGroups[q].concat(dataWithValue);
    });
    return quartileGroups;
}