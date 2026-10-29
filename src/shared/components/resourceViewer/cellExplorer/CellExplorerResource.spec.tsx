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

jest.mock('shared/components/loadingIndicator/LoadingIndicator', () => {
    const React = require('react');
    return function MockLoadingIndicator() {
        return <div data-testid="loading-indicator" />;
    };
});

import * as React from 'react';
import { assert } from 'chai';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CellExplorerResource from './CellExplorerResource';
import { CellExplorerDataset } from './cellExplorerUtils';

const ORIGIN = 'https://cell-explorer.cbioportal.org';

const DATASETS: CellExplorerDataset[] = [
    {
        slug: 'spectrum',
        name: 'MSK SPECTRUM',
        url: 'https://example.org/spectrum.zarr',
        default_view: { colorBy: 'category', category: 'author_cell_type' },
        collection: { slug: 'msk-spectrum', name: 'MSK SPECTRUM' },
    },
    {
        slug: 'crc-tumor',
        name: 'CRC Tumor',
        url: 'https://example.org/tumor.zarr',
        collection: { slug: 'crc-metastasis', name: 'CRC Metastasis' },
    },
    {
        slug: 'crc-epithelial',
        name: 'CRC Epithelial',
        url: 'https://example.org/epithelial.zarr',
        collection: { slug: 'crc-metastasis', name: 'CRC Metastasis' },
    },
];

function mockFetch(response: Promise<any>) {
    (global as any).fetch = jest.fn(() => response);
}

function renderResource(page: any) {
    return render(
        <CellExplorerResource
            page={page}
            height={800}
            fallback={() => <div data-testid="fallback" />}
        />
    );
}

describe('CellExplorerResource', () => {
    beforeEach(() => {
        viewerProps.length = 0;
        mockFetch(
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ datasets: DATASETS }),
            })
        );
    });

    it('shows a dataset page with its default view and no picker', async () => {
        renderResource({ origin: ORIGIN, dataset: 'spectrum' });

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

    it('picks between the datasets of a collection', async () => {
        renderResource({ origin: ORIGIN, collection: 'crc-metastasis' });

        const viewer = await screen.findByTestId('cell-explorer');
        assert.equal(
            viewer.getAttribute('data-url'),
            'https://example.org/tumor.zarr'
        );

        const select = document.querySelector(
            '[data-test=CellExplorerDatasetSelect]'
        ) as HTMLSelectElement;
        assert.deepEqual(
            Array.from(select.options).map(o => o.textContent),
            ['CRC Tumor', 'CRC Epithelial']
        );

        fireEvent.change(select, { target: { value: 'crc-epithelial' } });
        await waitFor(() =>
            assert.equal(
                screen.getByTestId('cell-explorer').getAttribute('data-url'),
                'https://example.org/epithelial.zarr'
            )
        );
        assert.equal(
            screen.getByText(/Open in Cell Explorer/).getAttribute('href'),
            `${ORIGIN}/view?dataset=crc-epithelial`
        );
    });

    it('falls back when the dataset list cannot be read', async () => {
        mockFetch(Promise.reject(new TypeError('Failed to fetch')));
        renderResource({ origin: ORIGIN, dataset: 'spectrum' });

        await screen.findByTestId('fallback');
        assert.isNull(screen.queryByTestId('cell-explorer'));
    });

    it('falls back when no dataset matches the page', async () => {
        renderResource({ origin: ORIGIN, collection: 'unknown' });

        await screen.findByTestId('fallback');
    });
});
