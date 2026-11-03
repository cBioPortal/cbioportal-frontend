import { StudyViewPageStore } from '../../studyView/StudyViewPageStore';
import { PatientIdentifier, SampleIdentifier } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import Fuse from 'fuse.js';
import { StudyViewComparisonGroup } from '../GroupComparisonUtils';
import { SessionGroupData } from 'shared/api/session-service/sessionServiceModels';

export function getSelectedGroups(
    allGroups: StudyViewComparisonGroup[],
    store: StudyViewPageStore
) {
    const groups = allGroups.filter(group =>
        store.isComparisonGroupSelected(group.uid)
    );
    groups.forEach(group => (group.color = store.userGroupColors[group.uid]));
    return groups;
}

export function filterGroupsByName<T extends { name: string }>(
    groups: T[],
    nameFilter: string
): T[] {
    const sortedGroups = _.sortBy(groups, group => group.name.toLowerCase());
    const pattern = nameFilter.trim().toLowerCase();
    if (pattern.length === 0) {
        return sortedGroups;
    }
    // groups containing the filter text take priority, so a precise query
    // only shows (and "select all" only selects) the groups it names
    const substringMatches = sortedGroups.filter(group =>
        group.name.toLowerCase().includes(pattern)
    );
    if (substringMatches.length > 0) {
        return substringMatches;
    }
    // otherwise fall back to fuzzy matching to tolerate typos, best match first
    const fuse = new Fuse(sortedGroups, {
        keys: ['name'],
        threshold: 0.3,
        ignoreLocation: true,
    });
    return fuse.search(pattern).map(result => result.item);
}

export function getStudiesAttr(
    sampleIdentifiers: SampleIdentifier[]
): { id: string; samples: string[] }[];

export function getStudiesAttr(
    sampleIdentifiers: SampleIdentifier[],
    patientIdentifiers: PatientIdentifier[]
): { id: string; samples: string[]; patients: string[] }[];

export function getStudiesAttr(
    sampleIdentifiers: SampleIdentifier[],
    patientIdentifiers?: PatientIdentifier[]
) {
    const samples = _.groupBy(sampleIdentifiers, id => id.studyId);
    let patients = patientIdentifiers
        ? _.groupBy(patientIdentifiers, id => id.studyId)
        : {};
    const studies = _.uniq(Object.keys(samples).concat(Object.keys(patients)));
    return studies.map(studyId => {
        const ret: { id: string; samples: string[]; patients?: string[] } = {
            id: studyId,
            samples: _.uniq((samples[studyId] || []).map(id => id.sampleId)),
        };
        if (patientIdentifiers) {
            ret.patients = _.uniq(
                (patients[studyId] || []).map(id => id.patientId)
            );
        }
        return ret;
    });
}

export function getGroupParameters(
    name: string,
    selectedSamples: SampleIdentifier[],
    origin: string[],
    color?: string
): SessionGroupData {
    return {
        name,
        description: '',
        studies: getStudiesAttr(selectedSamples),
        origin,
        color,
    };
}
