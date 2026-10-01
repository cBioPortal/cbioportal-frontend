/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { act, render } from '@testing-library/react';
import { ClinicalAttribute, ClinicalData } from 'cbioportal-ts-api-client';
import {
    buildWsiClinicalRows,
    clearWsiClinicalRowsCache,
    selectWsiClinicalAttributes,
    useWsiClinicalRows,
} from './wsiClinicalRows';

const mockClient = {
    getAllClinicalAttributesInStudyUsingGET: jest.fn(),
    getStudyUsingGET: jest.fn(),
    getAllClinicalDataOfPatientInStudyUsingGET: jest.fn(),
    getAllSamplesOfPatientInStudyUsingGET: jest.fn(),
    fetchClinicalDataUsingPOST: jest.fn(),
};
const mockInternalClient = {
    getClinicalAttributeCountsUsingPOST: jest.fn(),
};

jest.mock('shared/api/cbioportalClientInstance', () => ({
    getClient: () => mockClient,
}));

jest.mock('shared/api/cbioportalInternalClientInstance', () => ({
    getInternalClient: () => mockInternalClient,
}));

jest.mock('config/config', () => ({
    getServerConfig: () => ({ studyview_clinical_attribute_chart_count: 20 }),
    ServerConfigHelpers: {},
}));

function attribute(
    clinicalAttributeId: string,
    priority: number,
    patientAttribute = false,
    displayName = clinicalAttributeId,
    description = displayName
): ClinicalAttribute {
    return ({
        clinicalAttributeId,
        priority: String(priority),
        patientAttribute,
        displayName,
        description,
        datatype: 'STRING',
        studyId: 'study',
    } as unknown) as ClinicalAttribute;
}

function datum(
    clinicalAttributeId: string,
    value: string,
    sampleId?: string
): ClinicalData {
    return ({
        clinicalAttributeId,
        value,
        patientId: 'P-1',
        sampleId,
        studyId: 'study',
    } as unknown) as ClinicalData;
}

// @testing-library/react 12 has no renderHook.
function renderClinicalRows(initialPatientId: string) {
    const result: { current?: ReturnType<typeof useWsiClinicalRows> } = {};
    function Probe({ patientId }: { patientId: string }) {
        result.current = useWsiClinicalRows('study', patientId);
        return null;
    }
    const view = render(<Probe patientId={initialPatientId} />);
    return {
        result,
        rerender: (patientId: string) =>
            view.rerender(<Probe patientId={patientId} />),
        unmount: view.unmount,
    };
}

describe('selectWsiClinicalAttributes', () => {
    it('keeps default attributes (priority above 0), highest priority first', () => {
        const selected = selectWsiClinicalAttributes(
            [
                attribute('TUMOR_PURITY', 1),
                attribute('PRIMARY_SITE', 0),
                attribute('HIDDEN', -1),
                attribute('SAMPLE_TYPE', 990),
                // Priority 1 is the default; the frontend config raises it.
                attribute('CANCER_TYPE', 1),
            ],
            undefined,
            undefined
        );
        expect(selected.map(a => a.clinicalAttributeId)).toEqual([
            'CANCER_TYPE',
            'SAMPLE_TYPE',
            'TUMOR_PURITY',
        ]);
    });

    it('leaves out attributes populated for under half of the samples', () => {
        const selected = selectWsiClinicalAttributes(
            [
                attribute('TMB', 1),
                attribute('SPARSE', 1),
                attribute('UNCOUNTED', 1),
            ],
            [
                { clinicalAttributeId: 'TMB', count: 98 },
                { clinicalAttributeId: 'SPARSE', count: 30 },
            ],
            100
        );
        expect(selected.map(a => a.clinicalAttributeId)).toEqual(['TMB']);
    });

    it('leaves out sequencing QC, administrative and consent attributes', () => {
        const selected = selectWsiClinicalAttributes(
            [
                attribute('CANCER_TYPE', 3000),
                attribute('GENE_PANEL', 1),
                attribute('INSTITUTE', 1),
                attribute('SAMPLE_COVERAGE', 1),
                attribute('SOMATIC_STATUS', 1),
                attribute('PARTC_CONSENTED_12_245', 1, true),
                attribute('SAMPLE_COUNT', 1, true),
            ],
            undefined,
            undefined
        );
        expect(selected.map(a => a.clinicalAttributeId)).toEqual([
            'CANCER_TYPE',
            'SAMPLE_COUNT',
        ]);
    });

    it('caps the attributes at the study view chart count', () => {
        const selected = selectWsiClinicalAttributes(
            [attribute('A', 3), attribute('B', 2), attribute('C', 1)],
            undefined,
            undefined,
            2
        );
        expect(selected.map(a => a.clinicalAttributeId)).toEqual(['A', 'B']);
    });
});

describe('buildWsiClinicalRows', () => {
    it('builds patient rows and per-sample rows in attribute order', () => {
        const rows = buildWsiClinicalRows(
            [
                attribute('CANCER_TYPE', 3000, false, 'Cancer Type'),
                attribute(
                    'SAMPLE_COUNT',
                    820,
                    true,
                    'Number of Samples',
                    'Number of Samples Per Patient'
                ),
                attribute('TUMOR_PURITY', 1, false, 'Tumor Purity'),
            ],
            [datum('SAMPLE_COUNT', '2'), datum('UNSELECTED', 'x')],
            [
                datum('CANCER_TYPE', 'Melanoma', 'S-1'),
                datum('CANCER_TYPE', 'Melanoma', 'S-2'),
                datum('TUMOR_PURITY', '40', 'S-2'),
            ]
        );
        expect(rows).toEqual([
            { label: 'Cancer Type', value: 'Melanoma', sampleId: 'S-1' },
            { label: 'Cancer Type', value: 'Melanoma', sampleId: 'S-2' },
            {
                label: 'Number of Samples',
                value: '2',
                labelTip: 'Number of Samples Per Patient',
            },
            { label: 'Tumor Purity', value: '40', sampleId: 'S-2' },
        ]);
    });

    it('drops null-like values', () => {
        const rows = buildWsiClinicalRows(
            [attribute('MSI_TYPE', 1), attribute('OS_STATUS', 1, true)],
            [datum('OS_STATUS', '1:DECEASED')],
            [datum('MSI_TYPE', 'Not Available', 'S-1')]
        );
        expect(rows).toEqual([{ label: 'OS_STATUS', value: 'DECEASED' }]);
    });
});

describe('useWsiClinicalRows', () => {
    beforeEach(() => {
        clearWsiClinicalRowsCache();
        Object.values(mockClient).forEach(fn => fn.mockReset());
        mockInternalClient.getClinicalAttributeCountsUsingPOST.mockReset();
        mockClient.getAllClinicalAttributesInStudyUsingGET.mockResolvedValue([
            attribute('CANCER_TYPE', 3000, false, 'Cancer Type'),
            attribute('SPARSE', 1),
            attribute('PRIMARY_SITE', 0),
        ]);
        mockClient.getStudyUsingGET.mockResolvedValue({ allSampleCount: 10 });
        mockInternalClient.getClinicalAttributeCountsUsingPOST.mockResolvedValue(
            [
                { clinicalAttributeId: 'CANCER_TYPE', count: 10 },
                { clinicalAttributeId: 'SPARSE', count: 1 },
            ]
        );
        mockClient.getAllClinicalDataOfPatientInStudyUsingGET.mockResolvedValue(
            []
        );
        mockClient.getAllSamplesOfPatientInStudyUsingGET.mockResolvedValue([
            { sampleId: 'S-1' },
        ]);
        mockClient.fetchClinicalDataUsingPOST.mockResolvedValue([
            datum('CANCER_TYPE', 'Melanoma', 'S-1'),
        ]);
    });

    it('loads the default, populated attributes for the patient once', async () => {
        const { result, rerender } = renderClinicalRows('P-1');
        expect(result.current).toBeUndefined();
        await act(async () => {});

        expect(result.current).toEqual([
            { label: 'Cancer Type', value: 'Melanoma', sampleId: 'S-1' },
        ]);
        expect(
            mockInternalClient.getClinicalAttributeCountsUsingPOST
        ).toHaveBeenCalledWith({
            clinicalAttributeCountFilter: { sampleListId: 'study_all' },
        });
        expect(mockClient.fetchClinicalDataUsingPOST).toHaveBeenCalledWith({
            clinicalDataType: 'SAMPLE',
            clinicalDataMultiStudyFilter: {
                attributeIds: ['CANCER_TYPE'],
                identifiers: [{ studyId: 'study', entityId: 'S-1' }],
            },
        });

        rerender('P-1');
        expect(
            mockClient.getAllClinicalDataOfPatientInStudyUsingGET
        ).toHaveBeenCalledTimes(1);
    });

    it('keeps every default attribute when counts are unavailable', async () => {
        mockInternalClient.getClinicalAttributeCountsUsingPOST.mockRejectedValue(
            new Error('no sample list')
        );
        mockClient.fetchClinicalDataUsingPOST.mockResolvedValue([
            datum('CANCER_TYPE', 'Melanoma', 'S-1'),
            datum('SPARSE', 'yes', 'S-1'),
        ]);
        const { result } = renderClinicalRows('P-1');
        await act(async () => {});

        expect(result.current!.map(row => row.label)).toEqual([
            'Cancer Type',
            'SPARSE',
        ]);
    });

    it('does not show the previous patient while the next one loads', async () => {
        const { result, rerender } = renderClinicalRows('P-1');
        await act(async () => {});

        mockClient.getAllClinicalDataOfPatientInStudyUsingGET.mockReturnValueOnce(
            new Promise(() => {})
        );
        rerender('P-2');
        expect(result.current).toBeUndefined();
    });

    it('stays hidden and retries later after a failed request', async () => {
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        mockClient.getAllClinicalDataOfPatientInStudyUsingGET.mockRejectedValueOnce(
            new Error('boom')
        );
        const first = renderClinicalRows('P-1');
        await act(async () => {});
        expect(first.result.current).toBeUndefined();
        first.unmount();

        const second = renderClinicalRows('P-1');
        await act(async () => {});
        expect(second.result.current).toEqual([
            { label: 'Cancer Type', value: 'Melanoma', sampleId: 'S-1' },
        ]);
        consoleError.mockRestore();
    });
});
