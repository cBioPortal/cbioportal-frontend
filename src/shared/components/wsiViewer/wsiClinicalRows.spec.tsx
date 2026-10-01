/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { act, render } from '@testing-library/react';
import { ClinicalData } from 'cbioportal-ts-api-client';
import {
    buildWsiClinicalRows,
    clearWsiClinicalRowsCache,
    useWsiClinicalRows,
} from './wsiClinicalRows';

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

const mockGetClinicalData = jest.fn();

jest.mock('shared/api/cbioportalClientInstance', () => ({
    getClient: () => ({
        getAllClinicalDataOfPatientInStudyUsingGET: (params: unknown) =>
            mockGetClinicalData(params),
    }),
}));

jest.mock('config/config', () => ({
    getServerConfig: () => ({}),
    ServerConfigHelpers: {},
}));

function clinical(
    clinicalAttributeId: string,
    value: string,
    displayName?: string
): ClinicalData {
    return ({
        clinicalAttributeId,
        value,
        patientId: 'P-1',
        studyId: 'study',
        ...(displayName ? { clinicalAttribute: { displayName } } : {}),
    } as unknown) as ClinicalData;
}

describe('buildWsiClinicalRows', () => {
    it('returns curated rows in display order', () => {
        const rows = buildWsiClinicalRows([
            clinical('OS_MONTHS', '12.7'),
            clinical('SEX', 'Female'),
            clinical('AGE', '61.9', 'Diagnosis Age'),
            clinical('UNRELATED', 'x'),
        ]);
        expect(rows).toEqual([
            { label: 'Age', value: '61', labelTip: 'Diagnosis Age' },
            { label: 'Sex', value: 'Female' },
            { label: 'OS (months)', value: '12' },
        ]);
    });

    it('uses fallback attribute IDs', () => {
        const rows = buildWsiClinicalRows([
            clinical('GENDER', 'Male'),
            clinical('AJCC_PATHOLOGIC_TUMOR_STAGE', 'Stage II'),
            clinical('STAGE_HIGHEST_RECORDED', '4'),
        ]);
        expect(rows.map(r => [r.label, r.value])).toEqual([
            ['Sex', 'Male'],
            ['Stage', '4'],
        ]);
    });

    it('drops null-like values and strips OS_STATUS prefixes', () => {
        const rows = buildWsiClinicalRows([
            clinical('RACE', 'Not Available'),
            clinical('SEX', 'unknown'),
            clinical('STAGE', 'NA'),
            clinical('OS_STATUS', '1:DECEASED'),
        ]);
        expect(rows).toEqual([{ label: 'OS status', value: 'DECEASED' }]);
    });

    it('returns no rows for no data', () => {
        expect(buildWsiClinicalRows([])).toEqual([]);
    });
});

describe('useWsiClinicalRows', () => {
    beforeEach(() => {
        clearWsiClinicalRowsCache();
        mockGetClinicalData.mockReset();
    });

    it('fetches the patient clinical data once per patient', async () => {
        mockGetClinicalData.mockResolvedValue([clinical('SEX', 'Female')]);

        const { result, rerender } = renderClinicalRows('P-1');
        expect(result.current).toBeUndefined();
        await act(async () => {});
        expect(result.current).toEqual([{ label: 'Sex', value: 'Female' }]);

        rerender('P-1');
        expect(mockGetClinicalData).toHaveBeenCalledTimes(1);
        expect(mockGetClinicalData).toHaveBeenCalledWith({
            projection: 'DETAILED',
            studyId: 'study',
            patientId: 'P-1',
        });
    });

    it('does not show the previous patient while the next one loads', async () => {
        mockGetClinicalData.mockResolvedValueOnce([clinical('SEX', 'Female')]);
        const { result, rerender } = renderClinicalRows('P-1');
        await act(async () => {});

        mockGetClinicalData.mockReturnValueOnce(new Promise(() => {}));
        rerender('P-2');
        expect(result.current).toBeUndefined();
    });

    it('stays hidden and retries later after a failed request', async () => {
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        mockGetClinicalData.mockRejectedValueOnce(new Error('boom'));
        const first = renderClinicalRows('P-1');
        await act(async () => {});
        expect(first.result.current).toBeUndefined();
        first.unmount();

        mockGetClinicalData.mockResolvedValueOnce([clinical('SEX', 'Male')]);
        const second = renderClinicalRows('P-1');
        await act(async () => {});
        expect(second.result.current).toEqual([
            { label: 'Sex', value: 'Male' },
        ]);
        consoleError.mockRestore();
    });
});
