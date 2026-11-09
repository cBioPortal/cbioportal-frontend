const viewerProps: any[] = [];

jest.mock('@cbioportal-cell-explorer/component', () => {
    const React = require('react');
    return {
        CellExplorer: function MockCellExplorer(props: any) {
            viewerProps.push(props);
            return <div data-testid="cell-explorer" data-url={props.url} />;
        },
    };
});

const getAllClinicalDataInStudyUsingGET = jest.fn();

jest.mock('shared/api/cbioportalClientInstance', () => ({
    getClient: () => ({ getAllClinicalDataInStudyUsingGET }),
}));

jest.mock('shared/components/loadingIndicator/LoadingIndicator', () => {
    const React = require('react');
    return function MockLoadingIndicator() {
        return <div data-testid="loading-indicator" />;
    };
});

import * as React from 'react';
import { assert } from 'chai';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IResourceTableRow } from 'shared/lib/ResourceTableUtils';
import CellExplorerResource from './CellExplorerResource';

const ORIGIN = 'https://cell-explorer.cbioportal.org';

function row(
    slug: string,
    name: string,
    metadata: Record<string, string>
): IResourceTableRow {
    return {
        key: slug,
        studyId: 'study',
        patientId: 'Study-wide',
        sampleId: 'Study-wide',
        resourceType: 'STUDY',
        resourceScope: 'STUDY',
        resourceId: 'CELL_EXPLORER',
        description: name,
        url: `${ORIGIN}/view?dataset=${slug}`,
        metadata,
    };
}

const SPECTRUM = row('spectrum', 'MSK SPECTRUM', {
    zarr_url: 'https://example.org/spectrum.zarr',
    color_by_category: 'author_cell_type',
});
const TUMOR = row('crc-tumor', 'CRC Tumor', {
    zarr_url: 'https://example.org/tumor.zarr',
});
const EPITHELIAL = row('crc-epithelial', 'CRC Epithelial', {
    zarr_url: 'https://example.org/epithelial.zarr',
});

const SELECTION = [
    { studyId: 'study', sampleId: 'P1-T1', patientId: 'P1' },
    { studyId: 'study', sampleId: 'P2-T1', patientId: 'P2' },
];

function renderResource(
    rows: IResourceTableRow[],
    index = 0,
    onIndexChange = jest.fn(),
    selection?: typeof SELECTION
) {
    const utils = render(
        <CellExplorerResource
            rows={rows}
            index={index}
            onIndexChange={onIndexChange}
            height={800}
            selection={selection}
        />
    );
    return { ...utils, onIndexChange };
}

describe('CellExplorerResource', () => {
    beforeEach(() => {
        viewerProps.length = 0;
        getAllClinicalDataInStudyUsingGET.mockReset();
    });

    const lastFilterConfig = () =>
        viewerProps[viewerProps.length - 1].filterConfig;

    it('opens the zarr store in its metadata with its coloring and no picker', async () => {
        renderResource([SPECTRUM]);

        const viewer = await screen.findByTestId('cell-explorer');
        assert.equal(
            viewer.getAttribute('data-url'),
            'https://example.org/spectrum.zarr'
        );
        assert.deepEqual(viewerProps[viewerProps.length - 1].filterConfig, {
            colorBy: { type: 'category', value: 'author_cell_type' },
        });
        assert.isNull(
            document.querySelector('[data-test=CellExplorerDatasetSelect]')
        );
        assert.equal(
            screen.getByText(/Open in Cell Explorer/).getAttribute('href'),
            `${ORIGIN}/view?dataset=spectrum`
        );
    });

    it('picks between the datasets by their display names', async () => {
        const { onIndexChange, rerender } = renderResource(
            [TUMOR, EPITHELIAL],
            0
        );

        await screen.findByTestId('cell-explorer');
        const select = document.querySelector(
            '[data-test=CellExplorerDatasetSelect]'
        ) as HTMLSelectElement;
        assert.deepEqual(
            Array.from(select.options).map(o => o.textContent),
            ['CRC Tumor', 'CRC Epithelial']
        );

        fireEvent.change(select, { target: { value: '1' } });
        assert.deepEqual(onIndexChange.mock.calls, [[1]]);

        rerender(
            <CellExplorerResource
                rows={[TUMOR, EPITHELIAL]}
                index={1}
                onIndexChange={onIndexChange}
                height={800}
            />
        );
        assert.equal(
            screen.getByTestId('cell-explorer').getAttribute('data-url'),
            'https://example.org/epithelial.zarr'
        );
        assert.isUndefined(viewerProps[viewerProps.length - 1].filterConfig);
        assert.equal(
            screen.getByText(/Open in Cell Explorer/).getAttribute('href'),
            `${ORIGIN}/view?dataset=crc-epithelial`
        );
    });

    it('shows an error with the link for a row without a zarr store', async () => {
        renderResource([row('x', 'X', {})]);

        const error = document.querySelector(
            '[data-test=CellExplorerError]'
        ) as HTMLElement;
        assert.include(error.textContent || '', 'no zarr_url');
        assert.equal(
            error.querySelector('a')!.getAttribute('href'),
            `${ORIGIN}/view?dataset=x`
        );
        assert.isNull(screen.queryByTestId('cell-explorer'));
        assert.isNull(document.querySelector('iframe'));
    });

    it("highlights the selected patients' cells by their IDs", async () => {
        renderResource(
            [
                row('d', 'D', {
                    zarr_url: 'https://example.org/d.zarr',
                    zarr_id_column: 'donor_id',
                    cbioportal_patient_id_attribute: 'PATIENT_ID',
                }),
            ],
            0,
            jest.fn(),
            SELECTION
        );

        await screen.findByTestId('cell-explorer');
        await waitFor(() =>
            assert.deepEqual(lastFilterConfig(), {
                obsColumn: 'donor_id',
                ids: ['P1', 'P2'],
            })
        );
        assert.equal(
            screen.getByText(/Highlighting/).textContent,
            'Highlighting cells of 2 selected patients'
        );
        assert.equal(getAllClinicalDataInStudyUsingGET.mock.calls.length, 0);
    });

    it('translates the selected samples through a sample attribute', async () => {
        getAllClinicalDataInStudyUsingGET.mockResolvedValue([
            { sampleId: 'P1-T1', patientId: 'P1', value: 'KG1P' },
            { sampleId: 'P3-T1', patientId: 'P3', value: 'KG3P' },
        ]);
        renderResource(
            [
                row('s', 'S', {
                    zarr_url: 'https://example.org/s.zarr',
                    zarr_id_column: 'Sample ID',
                    cbioportal_sample_id_attribute: 'H5AD_SAMPLE_ID',
                }),
            ],
            0,
            jest.fn(),
            SELECTION
        );

        await screen.findByTestId('cell-explorer');
        await waitFor(() =>
            assert.deepEqual(lastFilterConfig(), {
                obsColumn: 'Sample ID',
                ids: ['KG1P'],
            })
        );
        assert.deepEqual(getAllClinicalDataInStudyUsingGET.mock.calls[0][0], {
            studyId: 'study',
            attributeId: 'H5AD_SAMPLE_ID',
            clinicalDataType: 'SAMPLE',
        });
    });

    it('clears the highlight without a selection', async () => {
        renderResource([
            row('d', 'D', {
                zarr_url: 'https://example.org/d.zarr',
                zarr_id_column: 'donor_id',
                cbioportal_patient_id_attribute: 'PATIENT_ID',
            }),
        ]);

        await screen.findByTestId('cell-explorer');
        assert.deepEqual(lastFilterConfig(), {
            obsColumn: 'donor_id',
            ids: [],
        });
        assert.isNull(
            document.querySelector('[data-test=CellExplorerSelectionNote]')
        );
    });

    it('says when none of the selection is in the dataset', async () => {
        renderResource(
            [
                row('d', 'D', {
                    zarr_url: 'https://example.org/d.zarr',
                    zarr_id_column: 'donor_id',
                    cbioportal_patient_id_attribute: 'PATIENT_ID',
                }),
            ],
            0,
            jest.fn(),
            [{ studyId: 'other', sampleId: 'X-T1', patientId: 'X' }]
        );

        await screen.findByTestId('cell-explorer');
        assert.equal(
            document.querySelector('[data-test=CellExplorerSelectionNote]')!
                .textContent,
            'None of the selected patients are in this dataset'
        );
    });
});
