import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { ResourceData } from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';
import ResourceTable from './ResourceTable';

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

describe('ResourceTable legacy H&E filtering', () => {
    let savedTileServerUrl: unknown;

    beforeEach(() => {
        savedTileServerUrl = (getServerConfig() as any).msk_wsi_tile_server_url;
        (getServerConfig() as any).msk_wsi_tile_server_url =
            'https://slides.example.com';
    });

    afterEach(() => {
        (getServerConfig() as any).msk_wsi_tile_server_url = savedTileServerUrl;
    });

    it('omits legacy H&E rows while retaining other resources', () => {
        render(
            <ResourceTable
                resources={[
                    makeResource('MSK_HNE', 'H&E Slides'),
                    makeResource('OTHER', 'Pathology report'),
                ]}
                openResource={jest.fn()}
            />
        );

        expect(screen.queryByText('H&E Slides')).toBeNull();
        expect(screen.getAllByText('Pathology report').length).toBeGreaterThan(
            0
        );
    });
});
