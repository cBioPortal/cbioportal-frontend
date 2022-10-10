import { getServerConfig } from 'config/config';
import {
    PatientIdentifier,
    Sample,
    SampleIdentifier,
} from 'cbioportal-ts-api-client/dist';
import _ from 'lodash';
import {
    ComparisonGroup,
    getOverlappingPatients,
    getOverlappingSamples,
} from './GroupComparisonUtils';

const NA_VALUES_DELIMITER = '|';

export function getComparisonCategoricalNaValue(): string[] {
    const rawString = getServerConfig().comparison_categorical_na_values;
    const naValues = rawString.split(NA_VALUES_DELIMITER);
    return naValues;
}

export function getOverlappingPatientsMap(
    overlappingPatients: PatientIdentifier[]
): { [studyId: string]: Set<string> } {
    const overlappingPatientsMap: { [studyId: string]: Set<string> } = {};
    _.groupBy(overlappingPatients, p => {
        if (!(p.studyId in overlappingPatientsMap)) {
            overlappingPatients;
            overlappingPatientsMap[p.studyId] = new Set<string>();
        }
        overlappingPatientsMap[p.studyId].add(p.patientId);
    });
    return overlappingPatientsMap;
}

export function getOverlappingSamplesMap(
    overlappingSamples: SampleIdentifier[]
): { [studyId: string]: Set<string> } {
    const overlappingSamplesMap: { [studyId: string]: Set<string> } = {};
    _.groupBy(overlappingSamples, s => {
        if (!(s.studyId in overlappingSamplesMap)) {
            overlappingSamplesMap[s.studyId] = new Set<string>();
        }
        overlappingSamplesMap[s.studyId].add(s.sampleId);
    });
    return overlappingSamplesMap;
}

export function filterSampleList(
    allSamples: Sample[],
    groups: ComparisonGroup[]
): Sample[] {
    const overlappingPatientsMap = getOverlappingPatientsMap(
        getOverlappingPatients(groups)
    );
    const overlappingSamplesMap = getOverlappingSamplesMap(
        getOverlappingSamples(groups)
    );
    return allSamples.filter(
        sample =>
            !overlappingPatientsMap[sample.studyId]?.has(sample.patientId) &&
            !overlappingSamplesMap[sample.studyId]?.has(sample.sampleId)
    );
}
