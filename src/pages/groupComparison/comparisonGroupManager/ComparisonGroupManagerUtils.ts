import {
    Group,
    GroupData,
    SessionGroupData,
} from '../../../shared/api/ComparisonGroupClient';
import { StudyViewPageStore } from '../../studyView/StudyViewPageStore';
import { PatientIdentifier, SampleIdentifier } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import {
    getSampleIdentifiers,
    StudyViewComparisonGroup,
} from '../GroupComparisonUtils';

export function getSelectedGroups(
    allGroups: StudyViewComparisonGroup[],
    store: StudyViewPageStore
) {
    return allGroups.filter(group =>
        store.isComparisonGroupSelected(group.uid)
    );
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

export function addSamplesParameters(
    group: GroupData,
    sampleIdentifiers: SampleIdentifier[]
) {
    group = Object.assign({}, group);
    const prevSampleIdentifiers = getSampleIdentifiers([group]);
    const newSampleIdentifiers = _.uniqWith(
        prevSampleIdentifiers.concat(sampleIdentifiers),
        (a, b) => a.studyId === b.studyId && a.sampleId === b.sampleId
    );
    group.studies = getStudiesAttr(newSampleIdentifiers);
    return group;
}
