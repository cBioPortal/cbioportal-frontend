/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { act, render } from '@testing-library/react';
import { ClinicalAttribute, ClinicalData } from 'cbioportal-ts-api-client';
import {
    buildWsiClinicalRows,
    clearWsiClinicalRowsCache,
    buildWsiPatientClinicalRows,
    selectWsiClinicalAttributes,
    selectWsiMoreClinicalAttributes,
    useWsiClinicalRows,
    WsiPatientClinicalData,
} from './wsiClinicalRows';

const mockClient = {
    getAllClinicalAttributesInStudyUsingGET: jest.fn(),
    getAllClinicalDataOfPatientInStudyUsingGET: jest.fn(),
    getAllSamplesOfPatientInStudyUsingGET: jest.fn(),
    fetchClinicalDataUsingPOST: jest.fn(),
};

jest.mock('shared/api/cbioportalClientInstance', () => ({
    getClient: () => mockClient,
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
function renderClinicalRows(
    initialPatientId: string,
    initialClinicalData?: WsiPatientClinicalData | null
) {
    const result: { current?: ReturnType<typeof useWsiClinicalRows> } = {};
    function Probe({
        patientId,
        clinicalData,
    }: {
        patientId: string;
        clinicalData?: WsiPatientClinicalData | null;
    }) {
        result.current = useWsiClinicalRows('study', patientId, clinicalData);
        return null;
    }
    const view = render(
        <Probe
            patientId={initialPatientId}
            clinicalData={initialClinicalData}
        />
    );
    return {
        result,
        rerender: (
            patientId: string,
            clinicalData:
                | WsiPatientClinicalData
                | null
                | undefined = initialClinicalData
        ) =>
            view.rerender(
                <Probe patientId={patientId} clinicalData={clinicalData} />
            ),
        unmount: view.unmount,
    };
}

// Sample data with a value for every listed attribute.
function sampleValues(...ids: string[]): ClinicalData[] {
    return ids.map(id => datum(id, 'value', 'S-1'));
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
            [],
            sampleValues(
                'TUMOR_PURITY',
                'PRIMARY_SITE',
                'HIDDEN',
                'SAMPLE_TYPE',
                'CANCER_TYPE'
            )
        );
        expect(selected.map(a => a.clinicalAttributeId)).toEqual([
            'CANCER_TYPE',
            'SAMPLE_TYPE',
            'TUMOR_PURITY',
        ]);
    });

    it('leaves out attributes without a value for the patient', () => {
        const selected = selectWsiClinicalAttributes(
            [
                attribute('TMB', 1),
                attribute('MISSING', 1),
                attribute('NOT_AVAILABLE', 1),
                attribute('OS_STATUS', 1, true),
                attribute('AGE', 1, true),
            ],
            [datum('OS_STATUS', '0:LIVING')],
            [
                datum('TMB', '4.2', 'S-2'),
                datum('NOT_AVAILABLE', 'Not Available', 'S-1'),
                // A sample value does not stand in for a patient attribute.
                datum('AGE', '60', 'S-1'),
            ]
        );
        expect(selected.map(a => a.clinicalAttributeId)).toEqual([
            'OS_STATUS',
            'TMB',
        ]);
    });

    it('leaves out sequencing QC, administrative, slide-availability and consent attributes', () => {
        const selected = selectWsiClinicalAttributes(
            [
                attribute('CANCER_TYPE', 3000),
                attribute('GENE_PANEL', 1),
                attribute('INSTITUTE', 1),
                attribute('SAMPLE_COVERAGE', 1),
                attribute('SOMATIC_STATUS', 1),
                attribute('PATH_SLIDE_EXISTS', 1),
                attribute('MSK_SLIDE_ID', 1),
                attribute('PARTC_CONSENTED_12_245', 1, true),
                attribute('SAMPLE_COUNT', 1, true),
            ],
            [
                datum('PARTC_CONSENTED_12_245', 'YES'),
                datum('SAMPLE_COUNT', '1'),
            ],
            sampleValues(
                'CANCER_TYPE',
                'GENE_PANEL',
                'INSTITUTE',
                'SAMPLE_COVERAGE',
                'SOMATIC_STATUS',
                'PATH_SLIDE_EXISTS',
                'MSK_SLIDE_ID'
            )
        );
        expect(selected.map(a => a.clinicalAttributeId)).toEqual([
            'CANCER_TYPE',
            'SAMPLE_COUNT',
        ]);
    });

    it('caps the populated attributes at the study view chart count', () => {
        const selected = selectWsiClinicalAttributes(
            [
                attribute('A', 4),
                attribute('EMPTY', 3),
                attribute('B', 2),
                attribute('C', 1),
            ],
            [],
            sampleValues('A', 'B', 'C'),
            2
        );
        expect(selected.map(a => a.clinicalAttributeId)).toEqual(['A', 'B']);
    });
});

describe('selectWsiMoreClinicalAttributes', () => {
    it('keeps the populated attributes past the cap and those not shown by default', () => {
        const more = selectWsiMoreClinicalAttributes(
            [
                attribute('A', 4),
                attribute('B', 2),
                attribute('C', 1),
                attribute('ZETA', 0),
                attribute('ALPHA', 0),
                attribute('HIDDEN', -1),
                attribute('EMPTY', 0),
                attribute('GENE_PANEL', 0),
                attribute('PARTA_CONSENTED_12_245', 0, true),
            ],
            [datum('PARTA_CONSENTED_12_245', 'YES')],
            sampleValues(
                'A',
                'B',
                'C',
                'ZETA',
                'ALPHA',
                'HIDDEN',
                'GENE_PANEL'
            ),
            2
        );
        expect(more.map(a => a.clinicalAttributeId)).toEqual([
            'C',
            'ALPHA',
            'ZETA',
        ]);
    });
});

describe('buildWsiPatientClinicalRows', () => {
    it('appends the other populated attributes as more rows', () => {
        const rows = buildWsiPatientClinicalRows({
            attributes: [
                attribute('CANCER_TYPE', 3000, false, 'Cancer Type'),
                attribute('PRIMARY_SITE', 0, false, 'Primary Site'),
            ],
            patientData: [],
            sampleData: [
                datum('PRIMARY_SITE', 'Skin', 'S-1'),
                datum('CANCER_TYPE', 'Melanoma', 'S-1'),
            ],
        });
        expect(rows).toEqual([
            { label: 'Cancer Type', value: 'Melanoma', sampleId: 'S-1' },
            {
                label: 'Primary Site',
                value: 'Skin',
                sampleId: 'S-1',
                more: true,
            },
        ]);
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
        mockClient.getAllClinicalAttributesInStudyUsingGET.mockResolvedValue([
            attribute('CANCER_TYPE', 3000, false, 'Cancer Type'),
            attribute('SPARSE', 1),
            attribute('PRIMARY_SITE', 0),
        ]);
        mockClient.getAllClinicalDataOfPatientInStudyUsingGET.mockResolvedValue(
            []
        );
        mockClient.getAllSamplesOfPatientInStudyUsingGET.mockResolvedValue([
            { sampleId: 'S-1' },
        ]);
        mockClient.fetchClinicalDataUsingPOST.mockResolvedValue([
            datum('CANCER_TYPE', 'Melanoma', 'S-1'),
            datum('PRIMARY_SITE', 'Skin', 'S-1'),
        ]);
    });

    it('loads the populated attributes for the patient once', async () => {
        const { result, rerender } = renderClinicalRows('P-1');
        expect(result.current).toBeUndefined();
        await act(async () => {});

        expect(result.current).toEqual([
            { label: 'Cancer Type', value: 'Melanoma', sampleId: 'S-1' },
            {
                label: 'PRIMARY_SITE',
                value: 'Skin',
                sampleId: 'S-1',
                more: true,
            },
        ]);
        expect(mockClient.fetchClinicalDataUsingPOST).toHaveBeenCalledWith({
            clinicalDataType: 'SAMPLE',
            clinicalDataMultiStudyFilter: {
                identifiers: [{ studyId: 'study', entityId: 'S-1' }],
            },
        });

        rerender('P-1');
        expect(
            mockClient.getAllClinicalDataOfPatientInStudyUsingGET
        ).toHaveBeenCalledTimes(1);
    });

    it('shows a sparse default attribute the patient has a value for', async () => {
        mockClient.fetchClinicalDataUsingPOST.mockResolvedValue([
            datum('CANCER_TYPE', 'Melanoma', 'S-1'),
            datum('SPARSE', 'yes', 'S-1'),
        ]);
        const { result } = renderClinicalRows('P-1');
        await act(async () => {});

        expect(
            result.current!.filter(row => !row.more).map(row => row.label)
        ).toEqual(['Cancer Type', 'SPARSE']);
    });

    it('builds the rows from the page data without fetching', async () => {
        const clinicalData: WsiPatientClinicalData = {
            attributes: [
                attribute('CANCER_TYPE', 3000, false, 'Cancer Type'),
                attribute('OS_STATUS', 1, true, 'Overall Survival Status'),
            ],
            patientData: [datum('OS_STATUS', '0:LIVING')],
            sampleData: [datum('CANCER_TYPE', 'Melanoma', 'S-1')],
        };
        const { result, rerender } = renderClinicalRows('P-1', null);
        expect(result.current).toBeUndefined();

        rerender('P-1', clinicalData);
        await act(async () => {});

        expect(result.current).toEqual([
            { label: 'Cancer Type', value: 'Melanoma', sampleId: 'S-1' },
            { label: 'Overall Survival Status', value: 'LIVING' },
        ]);
        Object.values(mockClient).forEach(fn =>
            expect(fn).not.toHaveBeenCalled()
        );
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
        expect(second.result.current!.map(row => row.label)).toEqual([
            'Cancer Type',
            'PRIMARY_SITE',
        ]);
        consoleError.mockRestore();
    });
});
