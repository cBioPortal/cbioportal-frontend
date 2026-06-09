import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { FilesAndLinks } from './FilesAndLinks';

function getByExactTextContent(text: string) {
    return screen.getByText((_content, element) => element?.textContent === text);
}

function makeResource(resourceId: string, displayName: string) {
    return {
        patientId: 'PATIENT_A',
        sampleId: 'SAMPLE_A',
        resourceId,
        studyId: 'study_a',
        uniquePatientKey: 'patient-key',
        uniqueSampleKey: 'sample-key',
        url: 'https://example.org/files/a.pdf',
        resourceDefinition: {
            customMetaData: '',
            description: 'Resource description',
            displayName,
            openByDefault: false,
            priority: '1',
            resourceId,
            resourceType: 'SAMPLE',
            studyId: 'study_a',
        },
    };
}

describe('FilesAndLinks', () => {
    it('uses the selected resource id config even when multiple resource types exist', () => {
        const store = {
            resourceTableData: {
                isPending: false,
                result: [
                    makeResource('MSK_HNE', 'H&E'),
                    makeResource('pathology', 'Pathology'),
                ],
            },
            resourceDefinitions: {
                result: [
                    makeResource('MSK_HNE', 'H&E').resourceDefinition,
                    makeResource('pathology', 'Pathology').resourceDefinition,
                ],
            },
        };

        render(
            <FilesAndLinks
                store={store as any}
                selectedResourceId="MSK_HNE"
            />
        );

        expect(
            screen.getByRole('columnheader', { name: /^View$/i })
        ).toBeTruthy();
        expect(
            screen.queryByRole('columnheader', { name: /^Resource Type$/i })
        ).toBeNull();
        expect(screen.queryByText('Open in new window')).toBeNull();
        expect(screen.getByRole('link', { name: /H&E/i }).getAttribute('target')).toBe(
            '_blank'
        );
        expect(getByExactTextContent('1 patients / 1 samples')).toBeTruthy();
    });
});
