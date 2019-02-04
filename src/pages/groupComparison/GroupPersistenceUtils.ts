import {SampleGroup, TEMP_localStorageGroupsKey} from "./GroupComparisonUtils";
import {SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";
import hashString from "../../shared/lib/hashString";
import {observable} from "mobx";
import _ from "lodash";
import ListIndexedMap from "../../shared/lib/ListIndexedMap";

// TODO: use web service

// keep and update a local observable copy so that users can react to changes
const observableGroupsCopy = observable.shallowBox<SampleGroup[]>([]);

// hold onto recently deleted groups for "undo" purpose
let recentlyDeletedGroups:SampleGroup[] = [];

function updateObservableGroupsCopy() {
    // update local observable version for users to react to
    observableGroupsCopy.set(JSON.parse(localStorage.getItem(TEMP_localStorageGroupsKey) || "[]"));
}

// initial update
updateObservableGroupsCopy();

function updateLocalStorageGroups(groups?:SampleGroup[]) {
    if (!groups) {
        groups = observableGroupsCopy.get();
    }
    localStorage.setItem(TEMP_localStorageGroupsKey, JSON.stringify(groups));
}

export function getLocalStorageGroups() {
    return observableGroupsCopy.get().slice();
}

export type SampleGroupWithoutId = Pick<SampleGroup, Exclude<keyof SampleGroup, "id">>;

export function addGroupToLocalStorage(
    newGroup:SampleGroupWithoutId
) {
    const groups:SampleGroup[] = getLocalStorageGroups();
    groups.push(Object.assign({id:createGroupId(newGroup)}, newGroup));
    updateLocalStorageGroups(groups);
    updateObservableGroupsCopy();
}

export function deleteGroups(
    groupIds:string[]
) {
    const idsToDelete = _.keyBy(groupIds);
    const groups = getLocalStorageGroups();
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
):SampleGroup|undefined {
    const allGroups = getLocalStorageGroups();
    return allGroups.find(group=>(group.id === groupId));
}

function createGroupId(
    group:SampleGroupWithoutId
) {
    return hashString(`${group.name}:${JSON.stringify(group.sampleIdentifiers)}:${Math.random()}`).toString();
}