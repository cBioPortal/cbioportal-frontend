/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import WSIViewer from './WSIViewer';
import { action as mobxAction } from 'mobx';

jest.mock('./wsiOpenSeadragonLoader', () => ({
    loadOpenSeadragon: jest.fn(),
}));

describe('WSIViewer clinical rows', () => {
    const clinicalRows = [
        { label: 'Cancer Type', value: 'Melanoma', sampleId: 'S-1' },
        { label: 'Cancer Type', value: 'Glioma', sampleId: 'S-2' },
        { label: 'Number of Samples', value: '2' },
    ];

    function makeClinicalInstance(rows?: typeof clinicalRows) {
        return new (WSIViewer as any)({
            tileServerUrl: 'https://tiles.example.com',
            patientId: 'P-1',
            height: 500,
            clinicalRows: rows,
        });
    }

    it('hides the section without clinical rows', () => {
        expect(makeClinicalInstance().selectedClinicalRows).toBeUndefined();
    });

    it("shows patient rows plus the selected sample's rows", () => {
        const inst = makeClinicalInstance(clinicalRows);
        expect(inst.selectedClinicalRows).toEqual([
            { label: 'Number of Samples', value: '2' },
        ]);

        mobxAction(() => {
            inst.viewerState.selectedSample = { sample_id: 'S-2' };
        })();
        expect(inst.selectedClinicalRows.map((r: any) => r.value)).toEqual([
            'Glioma',
            '2',
        ]);
    });
});
