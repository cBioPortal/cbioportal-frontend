import {ComparisonSampleGroup} from "./GroupComparisonUtils";
import {ClinicalAttribute, SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";
import hashString from "../../shared/lib/hashString";
import {observable} from "mobx";
import _ from "lodash";
import ListIndexedMap from "../../shared/lib/ListIndexedMap";
import {StudyViewFilter} from "../../shared/api/generated/CBioPortalAPIInternal";

// TODO: use web service

/// TYPES
export type SampleGroupWithoutId = Pick<ComparisonSampleGroup, Exclude<keyof ComparisonSampleGroup, "id">>;
export type FromChartSpec = {
    clinicalAttribute:ClinicalAttribute, values:string[], filters:StudyViewFilter,
    created:number
};

/// VARIABLES
const LSGroupsKey = "__tmp__groupComparisonGroups";
const LSChartKey = "__tmp__fromChart_specs";

// keep and update a local observable copy so that users can react to changes
const observableGroupsCopy = observable.shallowBox<ComparisonSampleGroup[]>([]);

// hold onto recently deleted groups for "undo" purpose
let recentlyDeletedGroups:ComparisonSampleGroup[] = [];


/// FUNCTIONS
function updateObservableGroupsCopy() {
    // update local observable version for users to react to
    observableGroupsCopy.set(JSON.parse(localStorage.getItem(LSGroupsKey) || "[]"));
}

function updateLocalStorageGroups(groups?:ComparisonSampleGroup[]) {
    if (!groups) {
        groups = observableGroupsCopy.get();
    }
    localStorage.setItem(LSGroupsKey, JSON.stringify(groups));
}

export function getLSChartGroupsSpec(key:string):FromChartSpec | null {
    const lsData = localStorage.getItem(LSChartKey);
    if (lsData) {
        const groups = JSON.parse(lsData);
        if (key in groups) {
            return groups[key];
        } else {
            return null;
        }
    } else {
        return null;
    }
}

export function getLSGroups() {
    return observableGroupsCopy.get().slice();
}

export function addGroupToLocalStorage(
    newGroup:SampleGroupWithoutId
) {
    const groups:ComparisonSampleGroup[] = getLSGroups();
    groups.push(Object.assign({id:createGroupId(newGroup)}, newGroup));
    updateLocalStorageGroups(groups);
    updateObservableGroupsCopy();
}

export function addChartGroupsSpec(
    clinicalAttribute:ClinicalAttribute,
    values:string[],
    filters:StudyViewFilter
) {
    const lsData = localStorage.getItem(LSChartKey);
    let groups:{[key:string]:FromChartSpec};
    if (lsData) {
        groups = JSON.parse(lsData);
    } else {
        groups = {};
    }
    const key = hashString(JSON.stringify({ clinicalAttribute, values, filters})).toString();
    groups[key] = {
        clinicalAttribute, values, filters, created:Date.now()
    };
    localStorage.setItem(LSChartKey, JSON.stringify(groups));
    return key
}

export function deleteGroups(
    groupIds:string[]
) {
    const idsToDelete = _.keyBy(groupIds);
    const groups = getLSGroups();
    const filteredGroups = groups.filter(group=>!(group.id in idsToDelete));
    recentlyDeletedGroups = groups.filter(group=>(group.id in idsToDelete));
    updateLocalStorageGroups(filteredGroups);
    updateObservableGroupsCopy();
}

export function restoreRecentlyDeletedGroups() {
    while (recentlyDeletedGroups.length > 0) {
        addGroupToLocalStorage(recentlyDeletedGroups.shift()!);
    }
}

export function addSamplesToGroup(
    groupId:string,
    newSamples:SampleIdentifier[]
) {
    const group = getGroupById(groupId);
    if (group) {
        const existingSampleIdentifiers = ListIndexedMap.from(group.sampleIdentifiers, id=>[id.studyId, id.sampleId]);
        for (const id of newSamples) {
            if (!existingSampleIdentifiers.has(id.studyId, id.sampleId)) {
                group.sampleIdentifiers.push(id);
                existingSampleIdentifiers.set(id, id.studyId, id.sampleId);
            }
        }
        updateLocalStorageGroups();
        updateObservableGroupsCopy();
        return true;
    } else {
        return false;
    }
}

function getGroupById(
    groupId:string
):ComparisonSampleGroup|undefined {
    const allGroups = getLSGroups();
    return allGroups.find(group=>(group.id === groupId));
}

function createGroupId(
    group:SampleGroupWithoutId
) {
    return hashString(`${group.name}:${JSON.stringify(group.sampleIdentifiers)}:${Math.random()}`).toString();
}

function deleteExpiredGroups() {
    const lsData = localStorage.getItem(LSChartKey);
    if (lsData) {
        const groups = JSON.parse(lsData);
        // delete groups that are more than one week old
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate()-7);
        const weekAgoTime = weekAgo.getTime();

        _.forEach(groups, (group, key)=>{
            if ((group as FromChartSpec).created < weekAgoTime) {
                delete groups[key];
            }
        });
        localStorage.setItem(LSChartKey, JSON.stringify(groups));
    }
}

/// ACTIONS TAKEN ON LOAD
// initial update
updateObservableGroupsCopy();

deleteExpiredGroups();