import { assert } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import { lazyMobXTableSort } from 'shared/components/lazyMobXTable/LazyMobXTable';
import { mutationSortTieBreaker } from './MutationTable';

describe('mutationSortTieBreaker', () => {
    const mutation = (gene: string, pos: number, sampleId: string) => [
        initMutation({
            gene: { hugoGeneSymbol: gene },
            proteinPosStart: pos,
            proteinChange: `X${pos}Y`,
            sampleId,
        }),
    ];

    it('orders tied mutations the same way whatever their input order', () => {
        const rows = [
            mutation('TP53', 175, 'S1'),
            mutation('PIK3CA', 1047, 'S2'),
            mutation('PIK3CA', 545, 'S3'),
            mutation('PIK3CA', 545, 'S1'),
        ];
        const order = (input: typeof rows) =>
            lazyMobXTableSort(
                input,
                () => 0,
                false,
                mutationSortTieBreaker
            ).map(
                d =>
                    `${d[0].gene.hugoGeneSymbol} ${d[0].proteinPosStart} ${d[0].sampleId}`
            );
        const expected = [
            'PIK3CA 545 S1',
            'PIK3CA 545 S3',
            'PIK3CA 1047 S2',
            'TP53 175 S1',
        ];
        assert.deepEqual(order(rows), expected);
        assert.deepEqual(order([...rows].reverse()), expected);
    });
});
