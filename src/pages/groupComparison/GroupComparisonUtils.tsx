import {MobxPromise} from 'mobxpromise/dist/src/MobxPromise';
import {
    ClinicalAttribute,
    ClinicalData,
    PatientIdentifier,
    Sample,
    SampleIdentifier
} from "../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";
import {
    ClinicalDataIntervalFilterValue,
    ClinicalDataEnrichment,
    StudyViewFilter,
    CopyNumberGeneFilterElement
} from "../../shared/api/generated/CBioPortalAPIInternal";
import {AlterationEnrichmentWithQ} from "../resultsView/enrichments/EnrichmentsUtil";
import {GroupData, SessionGroupData} from "../../shared/api/ComparisonGroupClient";
import * as React from "react";
import ComplexKeyMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import ComplexKeySet from "../../shared/lib/complexKeyDataStructures/ComplexKeySet";
import ComplexKeyCounter from "../../shared/lib/complexKeyDataStructures/ComplexKeyCounter";
import {GeneIdentifier} from "../studyView/StudyViewPageStore";
import ComplexKeyGroupsMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyGroupsMap";

export enum GroupComparisonTab {
    OVERLAP = "overlap",
    MUTATIONS = "mutations",
    CNA = "cna",
    MRNA = "mrna",
    PROTEIN = "protein",
    SURVIVAL = "survival",
    CLINICAL = "clinical"
}

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export type ComparisonGroup = Omit<SessionGroupData, "studies"|"color"> & {
    color:string; // color mandatory here, bc we'll assign one if its missing
    uid:string; // unique in the session
    studies:{ id:string, samples: string[], patients:string[] }[]; // include patients, filter out nonexistent samples
    nonExistentSamples:SampleIdentifier[]; // samples specified in the group which no longer exist in our DB
    savedInSession:boolean;
};

export type StudyViewComparisonGroup = Omit<GroupData, "studies"|"color"> & {
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
    const counts = new ComplexKeyCounter();
    for (const group of groups) {
        for (const caseId of group.cases) {
            counts.increment({ caseId });
        }
    }
    const overlappingCases =
        counts.entries()
            .filter(e=>(e.value > 1))
            .map(e=>e.key.caseId as string);

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
            const pluralSamples = (samplesArr.length !== 1);
            const pluralPatients = (patientsArr.length !== 1);
            text = `(${samplesArr.length}${asteriskForSamples ? "*" : ""} sample${pluralSamples ? "s" : ""}/${patientsArr.length}${asteriskForPatients ? "*" : ""} patient${pluralPatients ? "s" : ""})`;
        }
    }
    return text;
}

export function caseCounts(
    numSamples:number,
    numPatients:number
) {
    if (numSamples === numPatients) {
        const plural = (numSamples !== 1);
        return `${numSamples} sample${plural ? "s" : ""}/patient${plural ? "s" : ""}`;
    } else {
        const pluralSamples = (numSamples !== 1);
        const pluralPatients = (numPatients !== 1);
        return `${numSamples} sample${pluralSamples ? "s" : ""}/${numPatients} patient${pluralPatients ? "s" : ""}`;
    }
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

export function getNumPatients(
    group:Pick<StudyViewComparisonGroup, "studies">
) {
    return _.sum(group.studies.map(study=>study.patients.length));
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

export const DUPLICATE_GROUP_NAME_MSG = "Another group already has this name.";

export const OVERLAP_NOT_ENOUGH_GROUPS_MSG =
    "We can't show overlap for 1 group. Please select more groups from the 'Active Groups' section above.";

export const CLINICAL_TAB_NOT_ENOUGH_GROUPS_MSG =
    "We can't show clinical plots for 1 group. Please select more groups from the 'Active Groups' section above.";

export const CLINICAL_TAB_OVERLAPPING_SAMPLES_MSG =
    "We can only show clinical plots when groups have overlapping samples. Please exclude them by changing dropdown option to 'Exclude overlapping samples and patients'";

export const EXCLUDE_OVERLAPPING_SAMPLES_AND_PATIENTS_MSG = 
    "We exclude overlapping samples and patients by default to display this tab";

export function getDefaultGroupName(
    filters:StudyViewFilter,
    entrezGeneIdToGene:{[entrez:number]:GeneIdentifier}
) {
    const equalityFilters = _.sortBy( // sort clinical data equality filters into a canonical order - lets just do alphabetical by attribute id
        filters.clinicalDataEqualityFilters || [],
        filter=>filter.attributeId
    ).map(filter=>filter.values.join("+")); // get each attributes selected values, joined by +

    const mutatedGenes =
        _.flattenDeep<number>((filters.mutatedGenes || []).map(filter=>filter.entrezGeneIds))
            .map(entrezGeneId=>`${entrezGeneIdToGene[entrezGeneId].hugoGeneSymbol} mutant`);

    const cnaGenes =
        _.flattenDeep<CopyNumberGeneFilterElement>((filters.cnaGenes || []).map(filter=>filter.alterations))
            .map(filterElt=>{
                return `${entrezGeneIdToGene[filterElt.entrezGeneId].hugoGeneSymbol} ${filterElt.alteration === 2 ? "amp" : "del"}`;
            });

    const withData:string[] = [];
    if (filters.withMutationData) {
        withData.push("with mutation data");
    }
    if (filters.withCNAData) {
        withData.push("with CNA data");
    }


    const allFilters = mutatedGenes.concat(cnaGenes).concat(equalityFilters).concat(withData);
    
    return allFilters.join(", "); // comma separate each attributes values
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
        // if theres an existing filter object for this clinical attribute, then we need to
        //    add this range to that filter
        existingFilter.values = _.uniqWith(
            existingFilter.values.concat([{
                start:range[0],
                end:range[1]
            } as ClinicalDataIntervalFilterValue]
        ), (a:ClinicalDataIntervalFilterValue, b:ClinicalDataIntervalFilterValue)=>{
            return (a.start === b.start && a.end === b.end);
        });
    } else {
        // if no existing filter object, add one
        newFilters.clinicalDataIntervalFilters.push({
            attributeId: clinicalAttribute.clinicalAttributeId,
            clinicalDataType,
            values:[{start:range[0], end:range[1]} as ClinicalDataIntervalFilterValue]
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

export function intersectSamples(
    groupData1:SessionGroupData["studies"],
    groupData2:SessionGroupData["studies"]
) {
    const studies1 = _.keyBy(groupData1, elt=>elt.id);
    const studies2 = _.keyBy(groupData2, elt=>elt.id);
    const intersection = _.mapValues(studies1, (elt, studyId)=>({
        id: elt.id,
        samples: _.intersection(
            elt.samples,
            studyId in studies2 ? studies2[studyId].samples : []
        )
    }));
    return _.values(intersection).filter(elt=>elt.samples.length > 0);
}

export function excludeSamples(
    excludeFrom:SessionGroupData["studies"],
    exclude:SessionGroupData["studies"]
) {
    const studiesToExcludeFrom = _.keyBy(excludeFrom, elt=>elt.id);
    const studiesToExclude = _.keyBy(exclude, elt=>elt.id);
    const exclusion = _.mapValues(studiesToExcludeFrom, (elt, studyId)=>({
        id: elt.id,
        samples: studyId in studiesToExclude ?
            _.difference(elt.samples, studiesToExclude[studyId].samples) :
            elt.samples
    }));
    return _.values(exclusion).filter(elt=>elt.samples.length > 0);
}

export function unionSamples(
    groupData1:SessionGroupData["studies"],
    groupData2:SessionGroupData["studies"]
):SessionGroupData["studies"] {
    const studies1 = _.keyBy(groupData1, elt=>elt.id);
    const studies2 = _.keyBy(groupData2, elt=>elt.id);
    const studyIds = _.union(_.keys(studies1), _.keys(studies2));
    return studyIds.map(studyId=>{
        const elt1 = studies1[studyId];
        const elt2 = studies2[studyId];
        if (elt1 && elt2) {
            return {
                id: studyId,
                samples: _.union(elt1.samples, elt2.samples)
            };
        } else if (elt1) {
            return elt1;
        } else {
            return elt2;
        }
    });
}

export function intersectPatients(
    groupData1:{id:string, patients:string[]}[],
    groupData2:{id:string, patients:string[]}[]
) {
    const studies1 = _.keyBy(groupData1, elt=>elt.id);
    const studies2 = _.keyBy(groupData2, elt=>elt.id);
    const intersection = _.mapValues(studies1, (elt, studyId)=>({
        id: elt.id,
        patients: _.intersection(
            elt.patients,
            studyId in studies2 ? studies2[studyId].patients : []
        )
    }));
    return _.values(intersection).filter(elt=>elt.patients.length > 0);
}

export function excludePatients(
    excludeFrom:{id:string, patients:string[]}[],
    exclude:{id:string, patients:string[]}[]
) {
    const studiesToExcludeFrom = _.keyBy(excludeFrom, elt=>elt.id);
    const studiesToExclude = _.keyBy(exclude, elt=>elt.id);
    const exclusion = _.mapValues(studiesToExcludeFrom, (elt, studyId)=>({
        id: elt.id,
        patients: studyId in studiesToExclude ?
            _.difference(elt.patients, studiesToExclude[studyId].patients) :
            elt.patients
    }));
    return _.values(exclusion).filter(elt=>elt.patients.length > 0);
}

export function unionPatients(
    groupData1:{id:string, patients:string[]}[],
    groupData2:{id:string, patients:string[]}[]
) {
    const studies1 = _.keyBy(groupData1, elt=>elt.id);
    const studies2 = _.keyBy(groupData2, elt=>elt.id);
    const studyIds = _.union(_.keys(studies1), _.keys(studies2));
    return studyIds.map(studyId=>{
        const elt1 = studies1[studyId];
        const elt2 = studies2[studyId];
        if (elt1 && elt2) {
            return {
                id: studyId,
                patients: _.union(elt1.patients, elt2.patients)
            };
        } else if (elt1) {
            return elt1;
        } else {
            return elt2;
        }
    });
}

export function convertPatientsStudiesAttrToSamples(
    data:{id:string, patients:string[]}[],
    patientToSamples:ComplexKeyGroupsMap<Sample>
) {
    return data.map(elt=>({
        id: elt.id,
        samples: _.flatten(
            elt.patients.map(patientId=>{
                return (patientToSamples.get({ patientId, studyId: elt.id}) || [])
                    .map(s=>s.sampleId);
            })
        )
    }));
}