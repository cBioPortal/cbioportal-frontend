import { assert } from 'chai';
import { colorByFor, isCellExplorerResource } from './cellExplorerUtils';

describe('cellExplorerUtils', () => {
    it('recognizes Cell Explorer resources by their id', () => {
        assert.isTrue(isCellExplorerResource({ resourceId: 'CELL_EXPLORER' }));
        assert.isFalse(isCellExplorerResource({ resourceId: 'HE' }));
    });

    describe('colorByFor', () => {
        it('colors by a category', () => {
            assert.deepEqual(
                colorByFor({ color_by_category: 'author_cell_type' }),
                { type: 'category', value: 'author_cell_type' }
            );
        });

        it('colors by a gene', () => {
            assert.deepEqual(colorByFor({ color_by_gene: 'EPCAM' }), {
                type: 'gene',
                value: 'EPCAM',
            });
        });

        it('prefers the category when both are given', () => {
            assert.equal(
                colorByFor({
                    color_by_category: 'author_cell_type',
                    color_by_gene: 'EPCAM',
                })!.type,
                'category'
            );
        });

        it('leaves the coloring to the viewer otherwise', () => {
            assert.isUndefined(colorByFor({}));
        });
    });
});
