import { assert } from 'chai';
import {
    CellExplorerDataset,
    datasetPageUrl,
    datasetsForPage,
    parseCellExplorerUrl,
} from './cellExplorerUtils';

const ORIGIN = 'https://cell-explorer.cbioportal.org';

const DATASETS: CellExplorerDataset[] = [
    {
        slug: 'spectrum',
        name: 'MSK SPECTRUM TME 2022',
        url: 'https://example.org/spectrum.zarr',
        collection: { slug: 'msk-spectrum', name: 'MSK SPECTRUM' },
    },
    {
        slug: 'crc-metastasis-tumor',
        name: 'CRC Metastasis Tumor',
        url: 'https://example.org/tumor.zarr',
        collection: { slug: 'crc-metastasis', name: 'CRC Metastasis' },
    },
    {
        slug: 'crc-metastasis-epithelial',
        name: 'CRC Metastasis Epithelial',
        url: 'https://example.org/epithelial.zarr',
        collection: { slug: 'crc-metastasis', name: 'CRC Metastasis' },
    },
];

describe('cellExplorerUtils', () => {
    describe('parseCellExplorerUrl', () => {
        it('reads a dataset page', () => {
            assert.deepEqual(
                parseCellExplorerUrl(`${ORIGIN}/view?dataset=spectrum`),
                { origin: ORIGIN, dataset: 'spectrum' }
            );
        });

        it('reads a collection page', () => {
            assert.deepEqual(
                parseCellExplorerUrl(`${ORIGIN}/collections/crc-metastasis`),
                { origin: ORIGIN, collection: 'crc-metastasis' }
            );
        });

        it('reads a page on another Cell Explorer instance', () => {
            assert.deepEqual(
                parseCellExplorerUrl(
                    'http://localhost:8000/view?dataset=spectrum'
                ),
                { origin: 'http://localhost:8000', dataset: 'spectrum' }
            );
        });

        it('ignores other pages', () => {
            assert.isUndefined(parseCellExplorerUrl(`${ORIGIN}/`));
            assert.isUndefined(parseCellExplorerUrl(`${ORIGIN}/view`));
            assert.isUndefined(parseCellExplorerUrl('not a url'));
        });
    });

    describe('datasetsForPage', () => {
        it('finds the one dataset of a dataset page', () => {
            assert.deepEqual(
                datasetsForPage(
                    { origin: ORIGIN, dataset: 'spectrum' },
                    DATASETS
                ).map(d => d.slug),
                ['spectrum']
            );
        });

        it('finds every dataset of a collection page, in order', () => {
            assert.deepEqual(
                datasetsForPage(
                    { origin: ORIGIN, collection: 'crc-metastasis' },
                    DATASETS
                ).map(d => d.slug),
                ['crc-metastasis-tumor', 'crc-metastasis-epithelial']
            );
        });
    });

    it('links to a dataset page', () => {
        assert.equal(
            datasetPageUrl(
                { origin: ORIGIN, collection: 'crc-metastasis' },
                DATASETS[1]
            ),
            `${ORIGIN}/view?dataset=crc-metastasis-tumor`
        );
    });
});
