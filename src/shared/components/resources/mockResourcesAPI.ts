import { Omit } from '../../lib/TypeScriptUtils';
import { getPatientViewUrl } from '../../api/urls';
import {
    ResourceData,
    ResourceDefinition,
    Sample,
} from 'cbioportal-ts-api-client';

export function getResourceDefinitionsForStudy(params: {
    studyId: string;
}): Promise<ResourceDefinition[]> {
    // this mocks GET /studies/{studyId}/resource-definitions
    return Promise.resolve([
        Object.assign(
            { studyId: params.studyId },
            resourceDefinitions.STUDY_SPONSORS
        ),
        Object.assign(
            { studyId: params.studyId },
            resourceDefinitions.PATIENT_NOTES
        ),
        Object.assign(
            { studyId: params.studyId },
            resourceDefinitions.SAMPLE_NOTES
        ),
        Object.assign(
            { studyId: params.studyId },
            resourceDefinitions.PATIENT_VIEW
        ),
        Object.assign({ studyId: params.studyId }, resourceDefinitions.TEST),
    ]);
}

export function getResourceDefinition(params: {
    studyId: string;
    resourceId: keyof typeof resourceDefinitions;
}): Promise<ResourceDefinition> {
    // this mocks GET /studies/{studyId}/resource-definitions/{resourceId}
    return Promise.resolve(
        Object.assign(
            { studyId: params.studyId },
            resourceDefinitions[params.resourceId]
        )
    );
}

function getSampleUrl(resourceId: any, index: number) {
    switch (resourceId) {
        case 'TISSUE_IMAGE':
            return [
                'https://www.azerscientific.com/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/e/s/escs-111.jpg',
                'https://penntoday.upenn.edu/sites/default/files/2019-10/tissue-compression-teaser.jpg',
                'http://medcell.med.yale.edu/systems_cell_biology/connective_tissue_lab/images/loose_connective_tissue.jpg',
            ][index];
        case 'SAMPLE_NOTES':
            return 'https://www.google.com/robots.txt';
        default:
            return 'https://www.google.com/robots.txt';
    }
}

function getPatientUrl(resourceId: any, studyId: string, patientId: string) {
    switch (resourceId) {
        case 'PATIENT_NOTES':
            return 'https://services.google.com/fh/files/misc/google_drive_vpat.pdf';
        case 'PATIENT_VIEW':
            return getPatientViewUrl(studyId, patientId);
        default:
            return '';
    }
}

function getStudyUrl(resourceId: any) {
    return 'https://www.google.com/robots.txt';
}

export function getSampleResourceData(
    params: { sampleId: string; studyId: string; resourceId: string },
    sample: Sample
): Promise<ResourceData[]> {
    // this mocks GET /studies/{studyId}/samples/{sampleId}/resource-data
    if (params.resourceId in resourceDefinitions) {
        const d: Omit<ResourceData, 'url'> = {
            sampleId: params.sampleId,
            studyId: params.studyId,
            patientId: sample.patientId,
            resourceId: params.resourceId,
            resourceDefinition: Object.assign(
                { studyId: params.studyId },
                resourceDefinitions[
                    params.resourceId as keyof typeof resourceDefinitions
                ]
            ),
            uniquePatientKey: '',
            uniqueSampleKey: '',
        };
        let numResources = 1;
        switch (params.resourceId) {
            case 'TISSUE_IMAGE':
                numResources = 3;
                break;
            case 'SAMPLE_NOTES':
                numResources = 1;
                break;
        }
        const ret = [];
        for (let i = 0; i < numResources; i++) {
            ret.push(
                Object.assign({}, d, {
                    url: getSampleUrl(params.resourceId, i),
                })
            );
        }
        return Promise.resolve(ret);
    } else {
        return Promise.resolve([]);
    }
}

export function getPatientResourceData(params: {
    patientId: string;
    studyId: string;
    resourceId: string;
}): Promise<ResourceData[]> {
    // this mocks GET /studies/{studyId}/patients/{patientId}/resource-data
    if (params.resourceId in resourceDefinitions) {
        const d: ResourceData = {
            studyId: params.studyId,
            patientId: params.patientId,
            resourceId: params.resourceId,
            resourceDefinition: Object.assign(
                { studyId: params.studyId },
                resourceDefinitions[
                    params.resourceId as keyof typeof resourceDefinitions
                ]
            ),
            url: getPatientUrl(
                params.resourceId,
                params.studyId,
                params.patientId
            ),
            uniquePatientKey: '',
            uniqueSampleKey: '',
            sampleId: '',
        };
        return Promise.resolve([d]);
    } else {
        return Promise.resolve([]);
    }
}

export function getStudyResourceData(params: {
    studyId: string;
    resourceId: string;
}) {
    // this mocks GET /studies/{studyId}/resource-data
    if (params.resourceId in resourceDefinitions) {
        const d: ResourceData = {
            studyId: params.studyId,
            resourceId: params.resourceId,
            resourceDefinition: Object.assign(
                { studyId: params.studyId },
                resourceDefinitions[
                    params.resourceId as keyof typeof resourceDefinitions
                ]
            ),
            url: getStudyUrl(params.resourceId),
            uniquePatientKey: '',
            uniqueSampleKey: '',
            sampleId: '',
            patientId: '',
        };
        return Promise.resolve([d]);
    } else {
        return Promise.resolve([]);
    }
}

// mock data

const resourceDefinitions = {
    STUDY_SPONSORS: {
        resourceId: 'STUDY_SPONSORS',
        displayName: 'Study Sponsors',
        description: 'Sponsors of the study',
        resourceType: 'STUDY' as any,
        openByDefault: false,
        priority: '3',
    },
    PATIENT_NOTES: {
        resourceId: 'PATIENT_NOTES',
        displayName: 'Patient Notes',
        description: 'Miscellaneous notes about the patient',
        resourceType: 'PATIENT' as any,
        openByDefault: false,
        priority: '2',
    },
    SAMPLE_NOTES: {
        resourceId: 'SAMPLE_NOTES',
        displayName: 'Sample Notes',
        description: 'Miscellaneous notes about the sample',
        resourceType: 'SAMPLE' as any,
        openByDefault: false,
        priority: '3',
    },
    TEST: {
        resourceId: 'TEST',
        displayName: 'Test Resource',
        description: 'Miscellaneous notes about the sample',
        resourceType: 'SAMPLE' as any,
        openByDefault: false,
        priority: '3',
    },
    PATIENT_VIEW: {
        resourceId: 'PATIENT_VIEW',
        displayName: 'Other Portal Patient View',
        description: 'Link to the patient view for this patient',
        resourceType: 'PATIENT' as any,
        openByDefault: true,
        priority: '3',
    },
};
