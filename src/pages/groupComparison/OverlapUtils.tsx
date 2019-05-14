import * as React from "react";
import * as d3 from "d3";
import _ from "lodash";
import {SessionGroupData} from "../../shared/api/ComparisonGroupClient";
import {
    ComparisonGroup, convertPatientsStudiesAttrToSamples, excludePatients,
    excludeSamples,
    intersectPatients,
    intersectSamples, unionPatients,
    unionSamples
} from "./GroupComparisonUtils";
import ComplexKeyGroupsMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyGroupsMap";
import {Sample} from "../../shared/api/generated/CBioPortalAPI";
import {stringListToSet} from "../../shared/lib/StringUtils";

export function getExcludedIndexes(combination:number[], numGroupsTotal:number) {
    // get all indexes not in the given combination

    const excl = [];
    for (let i=0; i<numGroupsTotal; i++) {
        if (!combination.includes(i)) {
            excl.push(i);
        }
    }
    return excl;
}

export function joinNames(names:string[], conj:string) {
    switch (names.length) {
        case 0:
            return <span></span>;
        case 1:
            return <strong>{names[0]}</strong>;
        case 2:
            return <span><strong>{names[0]}</strong> {conj} <strong>{names[1]}</strong></span>;
        default:
            const beforeConj = names.slice(0, names.length-1);
            return <span>{beforeConj.map(name=>[<strong>{name}</strong>,", "])}{conj} <strong>{names[names.length-1]}</strong></span>;
    }
}

export function blendColors(colors:string[]) {
    // helper function for venn diagram drawing. In order to highlight set complements,
    //  we draw things from the bottom up - the visual exclusion simulates the complement,
    //  even though we don't explicitly draw the set complements in SVG. In order to make
    //  this work, no element can have less than 1 opacity - it would show that the entire
    //  set, not just the complement, is being highlighted and ruin the effect. Therefore...

    // TL;DR: We use this function to blend colors between groups, for the intersection regions.

    if(colors.length == 1){
        return colors[0]; 
    }
    // blend between the first two, 
    // then iteratively blend the next one with the previously blended color
    return _.reduce(colors.slice(2), (blendedColor, nextColor) => {
        return d3.interpolateLab(blendedColor, nextColor)(0.5);
    }, d3.interpolateLab(colors[0], colors[1])(0.5));
}

export function getTextColor(
    backgroundColor:string,
    inverse:boolean=false
) {
    const colors = ["black", "white"];
    let colorIndex = 1;
    if (d3.hsl(backgroundColor).l > 0.179) {
        // if luminance is high, use black text
        // https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
        colorIndex = 0;
    }
    if (inverse) {
        colorIndex += 1;
    }
    return colors[colorIndex % 2];
}

export function getStudiesAttrForSampleOverlapGroup(
    availableGroups:(Pick<ComparisonGroup, "uid">&Pick<SessionGroupData,"studies">)[],
    includedRegions:string[][], // uid[][],
    allGroupsInVenn:string[] // uid[]
) {
    // compute set operations to find contents
    const groups = _.keyBy(availableGroups, g=>g.uid);
    let studiesAttr:SessionGroupData["studies"] = [];
    for (const region of includedRegions) {
        let regionStudiesAttr:SessionGroupData["studies"] = groups[region[0]].studies;
        // intersect
        for (let i=1; i<region.length; i++) {
            regionStudiesAttr = intersectSamples(regionStudiesAttr, groups[region[i]].studies);
        }
        // exclude
        for (const uid of allGroupsInVenn) {
            if (!region.includes(uid)) {
                regionStudiesAttr = excludeSamples(regionStudiesAttr, groups[uid].studies);
            }
        }
        studiesAttr = unionSamples(studiesAttr, regionStudiesAttr);
    }
    return studiesAttr;
}

export function getStudiesAttrForPatientOverlapGroup(
    availableGroups:(Pick<ComparisonGroup, "uid">&{ studies: {id:string, patients:string[]}[]})[],
    includedRegions:string[][], // uid[][]
    allGroupsInVenn:string[], // uid[]
    patientToSamplesSet:ComplexKeyGroupsMap<Pick<Sample, "sampleId">>
) {
    // compute set operations to find contents
    const groups = _.keyBy(availableGroups, g=>g.uid);
    let studiesAttr:{ id:string, patients:string[]}[] = [];
    for (const region of includedRegions) {
        let regionStudiesAttr:{ id:string, patients:string[]}[] = groups[region[0]].studies;
        // intersect
        for (let i=1; i<region.length; i++) {
            regionStudiesAttr = intersectPatients(regionStudiesAttr, groups[region[i]].studies);
        }
        // exclude
        for (const uid of allGroupsInVenn) {
            if (!region.includes(uid)) {
                regionStudiesAttr = excludePatients(regionStudiesAttr, groups[uid].studies);
            }
        }
        studiesAttr = unionPatients(studiesAttr, regionStudiesAttr);
    }
    return convertPatientsStudiesAttrToSamples(studiesAttr, patientToSamplesSet);
}

type GroupMembershipKey = {[groupUid:string]:boolean};

export function getAllCombinationsOfKey(groupMembershipKey:GroupMembershipKey):GroupMembershipKey[] {
    const groups = Object.keys(groupMembershipKey);
    if (groups.length === 1) {
        return [groupMembershipKey];
    } else {
        const group = groups.pop()!;
        const newKey = stringListToSet(groups);
        const subcombinations = getAllCombinationsOfKey(newKey);
        return [{[group]:true} as GroupMembershipKey] // we include this in the recursion in order to avoid having to have empty set in the result
            .concat(subcombinations)
            .concat(subcombinations.map(c=>Object.assign({ [group]:true }, c)));
    }
}

export function getCombinations(groups: { uid: string, cases: string[] }[]) {
    const groupToCases = groups.reduce((map, group)=>{
        map[group.uid] = _.keyBy(group.cases);
        return map;
    }, {} as {[uid:string]:{[caseKey:string]:any}});

    const allCases = _.uniq(_.flatten(groups.map(group=>group.cases)));

    const intersectionMap = new ComplexKeyGroupsMap<string>();

    for (const caseKey of allCases) {
        const groupMembershipKey:GroupMembershipKey = {};
        for (const group of groups) {
            if (caseKey in groupToCases[group.uid]) {
                groupMembershipKey[group.uid] = true;
            }
        }
        for (const key of getAllCombinationsOfKey(groupMembershipKey)) {
            intersectionMap.add(key, caseKey);
        }
    }

    return intersectionMap.entries().map(entry=>{
        return {
            groups: Object.keys(entry.key),
            cases: entry.value
        };
    });
}