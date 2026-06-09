import { ResourceData } from 'cbioportal-ts-api-client';
import {
    buildResourceTableTabs,
    buildResourceTableRows,
    parseResourceDefinitionMetadata,
} from './ResourceTableUtils';

function makeResourceData(overrides: Partial<ResourceData> = {}): ResourceData {
    return {
        patientId: 'PATIENT_A',
        sampleId: 'SAMPLE_A',
        resourceId: 'resource_a',
        studyId: 'study_a',
        uniquePatientKey: 'patient-key',
        uniqueSampleKey: 'sample-key',
        url: 'https://example.org/files/a.pdf',
        resourceDefinition: {
            customMetaData: '',
            description: 'Resource description',
            displayName: 'Whole Slide',
            openByDefault: false,
            priority: '1',
            resourceId: 'resource_a',
            resourceType: 'SAMPLE',
            studyId: 'study_a',
        },
        ...overrides,
    };
}

describe('ResourceTableUtils', () => {
    it('parses resource definition metadata safely', () => {
        expect(
            parseResourceDefinitionMetadata(
                '{"assay":"IHC","markers":["CD3","CD8"],"details":{"panel":"immune"}}'
            )
        ).toEqual({
            assay: 'IHC',
            markers: 'CD3, CD8',
            details: '{"panel":"immune"}',
        });

        expect(parseResourceDefinitionMetadata('not-json')).toEqual({});
    });

    it('builds rows with derived metadata and fallbacks', () => {
        const rows = buildResourceTableRows(
            [
                makeResourceData({
                    patientId: '',
                    sampleId: '',
                    url: 'https://data.cbioportal.org/viewer/report.html',
                    resourceDefinition: {
                        customMetaData: '{"scanner":"Aperio"}',
                        description: 'Resource description',
                        displayName: 'Whole Slide',
                        openByDefault: false,
                        priority: '1',
                        resourceId: 'resource_a',
                        resourceType: 'SAMPLE',
                        studyId: 'study_a',
                    },
                }),
            ],
            'PATIENT_FALLBACK'
        );

        expect(rows[0]).toMatchObject({
            patientId: 'PATIENT_FALLBACK',
            sampleId: 'Sample-level',
            resourceType: 'Whole Slide',
        });
        expect(rows[0].metadata).toMatchObject({
            scanner: 'Aperio',
            host: 'data.cbioportal.org',
            file_type: 'html',
            resource_scope: 'SAMPLE',
        });
    });

    it('builds tabs by resource id and prefers the most common display label', () => {
        const rows = buildResourceTableRows([
            makeResourceData({
                resourceId: 'resource_a',
                resourceDefinition: {
                    ...makeResourceData().resourceDefinition,
                    resourceId: 'resource_a',
                    displayName: 'Whole Slide',
                },
            }),
            makeResourceData({
                sampleId: 'SAMPLE_B',
                uniqueSampleKey: 'sample-key-b',
                resourceId: 'resource_a',
                resourceDefinition: {
                    ...makeResourceData().resourceDefinition,
                    resourceId: 'resource_a',
                    displayName: 'Whole Slide',
                },
            }),
            makeResourceData({
                patientId: 'PATIENT_B',
                sampleId: 'SAMPLE_C',
                uniquePatientKey: 'patient-key-b',
                uniqueSampleKey: 'sample-key-c',
                resourceId: 'resource_a',
                resourceDefinition: {
                    ...makeResourceData().resourceDefinition,
                    resourceId: 'resource_a',
                    displayName: 'Pathology Image',
                },
            }),
            makeResourceData({
                patientId: 'PATIENT_C',
                sampleId: 'SAMPLE_D',
                uniquePatientKey: 'patient-key-c',
                uniqueSampleKey: 'sample-key-d',
                resourceId: 'resource_b',
                resourceDefinition: {
                    ...makeResourceData().resourceDefinition,
                    resourceId: 'resource_b',
                    displayName: 'MRI',
                },
            }),
        ]);

        expect(buildResourceTableTabs(rows)).toEqual([
            {
                id: 'resource_b',
                label: 'MRI',
                totalCount: 1,
                patientCount: 1,
                sampleCount: 1,
            },
            {
                id: 'resource_a',
                label: 'Whole Slide',
                totalCount: 3,
                patientCount: 2,
                sampleCount: 3,
            },
        ]);
    });

});
