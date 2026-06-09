import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ResourceData } from 'cbioportal-ts-api-client';
import ResourceDataTable from './ResourceDataTable';

function getByExactTextContent(text: string) {
    return screen.getByText((_content, element) => element?.textContent === text);
}

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
            customMetaData: '{"assay":"IHC","site":"Lung"}',
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

function makeSameTabResources() {
    return [
        makeResourceData(),
        makeResourceData({
            sampleId: 'SAMPLE_B',
            uniqueSampleKey: 'sample-key-b',
            url: 'https://example.org/files/b.pdf',
            resourceDefinition: {
                ...makeResourceData().resourceDefinition,
                customMetaData: '{"assay":"IHC","site":"Colon"}',
            },
        }),
    ];
}

function makeMetadataFilterResources() {
    return [
        makeResourceData(),
        makeResourceData({
            sampleId: 'SAMPLE_B',
            uniqueSampleKey: 'sample-key-b',
            url: 'https://example.org/files/b.pdf',
            resourceDefinition: {
                ...makeResourceData().resourceDefinition,
                customMetaData: '{"assay":"FISH","site":"Colon"}',
            },
        }),
    ];
}

function makeTabbedResources() {
    return [
        makeResourceData({
            patientId: 'PATIENT_A',
            sampleId: 'SAMPLE_1',
            uniqueSampleKey: 'sample-key-1',
            resourceId: 'resource_a',
            resourceDefinition: {
                ...makeResourceData().resourceDefinition,
                customMetaData: '{"site":"Lung","assay":"IHC"}',
                displayName: 'Whole Slide',
                resourceId: 'resource_a',
            },
        }),
        makeResourceData({
            patientId: 'PATIENT_A',
            sampleId: 'SAMPLE_2',
            uniqueSampleKey: 'sample-key-2',
            resourceId: 'resource_a',
            url: 'https://example.org/files/b.pdf',
            resourceDefinition: {
                ...makeResourceData().resourceDefinition,
                customMetaData: '{"site":"Lung","assay":"IHC"}',
                displayName: 'Whole Slide',
                resourceId: 'resource_a',
            },
        }),
        makeResourceData({
            patientId: 'PATIENT_B',
            sampleId: 'SAMPLE_3',
            uniquePatientKey: 'patient-key-b',
            uniqueSampleKey: 'sample-key-3',
            resourceId: 'resource_b',
            url: 'https://example.org/files/c.pdf',
            resourceDefinition: {
                ...makeResourceData().resourceDefinition,
                customMetaData: '{"scanner":"Scanner A"}',
                displayName: 'Radiology',
                resourceId: 'resource_b',
            },
        }),
    ];
}

describe('ResourceDataTable', () => {
    it('hides metadata columns by default and uses the mutation-style column selector', () => {
        render(<ResourceDataTable resources={[makeResourceData()]} />);

        expect(screen.queryByText('IHC')).toBeNull();
        expect(screen.getByText('Add columns')).toBeTruthy();
        expect(screen.queryByText('Add filters')).toBeNull();
    });

    it('adds metadata columns from the built-in column selector', () => {
        render(<ResourceDataTable resources={[makeResourceData()]} />);

        fireEvent.click(screen.getByText('Add columns'));
        const assayCheckbox = screen
            .getByText('assay')
            .closest('label') as HTMLElement;
        fireEvent.click(within(assayCheckbox).getByRole('checkbox'));

        expect(screen.getAllByText('assay').length).toBeGreaterThan(0);
        expect(screen.getAllByText('IHC').length).toBeGreaterThan(0);
    });

    it('adds header filters for dynamically added metadata columns', () => {
        const { container } = render(
            <ResourceDataTable resources={makeMetadataFilterResources()} />
        );

        fireEvent.click(screen.getByText('Add columns'));
        const assayCheckbox = screen
            .getByText('assay')
            .closest('label') as HTMLElement;
        fireEvent.click(within(assayCheckbox).getByRole('checkbox'));

        const filterTrigger = container.querySelector(
            '[data-test="resource-column-filter-metadata:assay"] .fa-filter'
        ) as HTMLElement;
        fireEvent.click(filterTrigger.parentElement as HTMLElement);

        const fishCheckbox = container.querySelector(
            'input[data-id="FISH"]'
        ) as HTMLInputElement;
        fireEvent.click(fishCheckbox);

        const tableBody = container.querySelector('tbody') as HTMLElement;
        expect(within(tableBody).queryByText('FISH')).toBeNull();
        expect(within(tableBody).getByText('IHC')).toBeTruthy();
    });

    it('filters visible columns from mutation-style header filter popovers', () => {
        const { container } = render(
            <ResourceDataTable resources={makeSameTabResources()} />
        );

        const filterTrigger = container.querySelector(
            '[data-test="resource-column-filter-sampleId"] .fa-filter'
        ) as HTMLElement;
        fireEvent.click(filterTrigger.parentElement as HTMLElement);

        const sampleBCheckbox = container.querySelector(
            'input[data-id="SAMPLE_B"]'
        ) as HTMLInputElement;
        fireEvent.click(sampleBCheckbox);

        const tableBody = container.querySelector('tbody') as HTMLElement;
        expect(within(tableBody).queryByText('SAMPLE_B')).toBeNull();
        expect(getByExactTextContent('1 patients / 1 samples')).toBeTruthy();
    });

    it('uses unique filter menu ids across multiple mounted tables', () => {
        const { container } = render(
            <div>
                <ResourceDataTable resources={makeSameTabResources()} />
                <ResourceDataTable resources={makeSameTabResources()} />
            </div>
        );

        const sampleFilterMenus = Array.from(
            container.querySelectorAll('[id$="-sampleId"]')
        ).map(element => element.getAttribute('id'));

        expect(sampleFilterMenus).toHaveLength(2);
        expect(new Set(sampleFilterMenus).size).toBe(2);
    });

    it('shows resource tabs and resets the table search when switching tabs', () => {
        render(<ResourceDataTable resources={makeTabbedResources()} />);

        expect(
            screen.getByRole('tab', { name: /Whole Slide/i })
        ).toBeTruthy();
        expect(screen.getByRole('tab', { name: /Radiology/i })).toBeTruthy();

        fireEvent.click(screen.getByRole('tab', { name: /Whole Slide/i }));

        expect(getByExactTextContent('1 patients / 2 samples')).toBeTruthy();
        expect(screen.getAllByText('Patient resources').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Sample resources').length).toBeGreaterThan(0);

        const searchInput = screen.getByPlaceholderText(
            'Search patient ID, sample ID, resource, or metadata...'
        ) as HTMLInputElement;
        fireEvent.change(searchInput, {
            target: { value: 'SAMPLE_1' },
        });
        expect(searchInput.value).toBe('SAMPLE_1');

        fireEvent.click(screen.getByRole('tab', { name: /Radiology/i }));

        expect(getByExactTextContent('1 patients / 1 samples')).toBeTruthy();
        expect(
            (
                screen.getByPlaceholderText(
                    'Search patient ID, sample ID, resource, or metadata...'
                ) as HTMLInputElement
            ).value
        ).toBe('');
        const tableBody = document.querySelector('tbody') as HTMLElement;
        expect(within(tableBody).queryByText('PATIENT_A')).toBeNull();
        expect(within(tableBody).getByText('PATIENT_B')).toBeTruthy();
    });

    it('hides the sample columns for patient-level resources', () => {
        render(
            <ResourceDataTable
                resources={[
                    makeResourceData({
                        sampleId: '',
                        uniqueSampleKey: '',
                        resourceDefinition: {
                            ...makeResourceData().resourceDefinition,
                            resourceType: 'PATIENT',
                        },
                    }),
                ]}
            />
        );

        expect(screen.queryByText('Sample ID')).toBeNull();
        expect(screen.queryByText('Sample resources')).toBeNull();
    });
});
