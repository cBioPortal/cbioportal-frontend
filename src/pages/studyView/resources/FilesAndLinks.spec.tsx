import { ResourceData } from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import { fetchFilesLinksData } from './FilesAndLinks';

function makeResource(resourceId: string, displayName: string): ResourceData {
    return {
        patientId: 'P-1',
        resourceId,
        resourceDefinition: {
            customMetaData: '',
            description: '',
            displayName,
            openByDefault: false,
            priority: '1',
            resourceId,
            resourceType: 'PATIENT',
            studyId: 'study',
        },
        sampleId: 'S-1',
        studyId: 'study',
        uniquePatientKey: 'P-1',
        uniqueSampleKey: 'S-1',
        url: `https://example.org/${resourceId}`,
    };
}

describe('FilesAndLinks WSI resource filtering', () => {
    let savedTileServerUrl: unknown;

    beforeEach(() => {
        savedTileServerUrl = (getServerConfig() as any).msk_wsi_tile_server_url;
        (getServerConfig() as any).msk_wsi_tile_server_url =
            'https://slides.example.com';
    });

    afterEach(() => {
        (getServerConfig() as any).msk_wsi_tile_server_url = savedTileServerUrl;
        jest.restoreAllMocks();
    });

    it('excludes legacy H&E resources from selected study data', async () => {
        jest.spyOn(
            internalClient,
            'getAllStudyResourceDataInStudyPatientSampleUsingGET'
        ).mockResolvedValue([
            makeResource('MSK_HNE', 'H&E Slides'),
            makeResource('OTHER', 'Pathology report'),
        ]);

        const result = await fetchFilesLinksData(
            {} as any,
            [{ studyId: 'study', patientId: 'P-1', sampleId: 'S-1' }],
            undefined,
            undefined,
            undefined,
            500
        );

        expect(result.totalItems).toBe(1);
        expect(result.data).toEqual([
            expect.objectContaining({
                resourceId: 'OTHER',
                typeOfResource: 'Pathology report',
            }),
        ]);
    });
});
