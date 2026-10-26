import { assert } from 'chai';
import {
    getDerivedGenericAssayEntity,
    getDerivedGenericAssayEntitySources,
    getDominantCategory,
    makeDerivedGenericAssayData,
    makeDerivedGenericAssayMetas,
} from './GenericAssayDerivedEntityUtils';
import {
    GenericAssayTypeConstants,
    isDerivedGenericAssayEntityId,
} from './GenericAssayConfig';

const ISIG = GenericAssayTypeConstants.ISIG_PROBABILITY;

describe('GenericAssayDerivedEntityUtils', () => {
    describe('getDominantCategory', () => {
        it('returns the highest-valued category', () => {
            assert.equal(
                getDominantCategory({ A: 0.2, B: 0.5, C: 0.3 }, [
                    'A',
                    'B',
                    'C',
                ]),
                'B'
            );
        });

        it('picks the first category on a tie', () => {
            assert.equal(
                getDominantCategory({ A: 0.5, B: 0.5 }, ['A', 'B']),
                'A'
            );
        });

        it('skips missing values', () => {
            assert.equal(
                getDominantCategory({ A: NaN, B: 0.1 }, ['A', 'B', 'C']),
                'B'
            );
        });

        it('returns undefined without values', () => {
            assert.isUndefined(getDominantCategory({}, ['A', 'B']));
        });
    });

    it('makes entity metadata for the configured derived entities', () => {
        const metas = makeDerivedGenericAssayMetas(ISIG);
        assert.deepEqual(
            metas.map(m => m.stableId),
            ['DERIVED_ISIG_DOMINANT']
        );
        assert.isTrue(isDerivedGenericAssayEntityId(metas[0].stableId));
        assert.deepEqual(makeDerivedGenericAssayMetas('UNCONFIGURED_TYPE'), []);
    });

    it('computes the dominant category label per sample', () => {
        const entity = getDerivedGenericAssayEntity(
            ISIG,
            'DERIVED_ISIG_DOMINANT'
        )!;
        assert.deepEqual(getDerivedGenericAssayEntitySources(ISIG), [
            'ISIG_PROB_D',
            'ISIG_PROB_F',
            'ISIG_PROB_IE',
            'ISIG_PROB_IE_F',
        ]);
        const datum = (
            uniqueSampleKey: string,
            stableId: string,
            value: string
        ) => ({ uniqueSampleKey, stableId, value });
        assert.deepEqual(
            makeDerivedGenericAssayData(entity, ISIG, [
                datum('S1', 'ISIG_PROB_D', '0.1'),
                datum('S1', 'ISIG_PROB_IE', '0.7'),
                datum('S1', 'ISIG_PROB_F', '0.2'),
                datum('S2', 'ISIG_PROB_F', '0.6'),
                datum('S2', 'ISIG_PROB_IE_F', '0.4'),
                datum('S3', 'ISIG_PROB_D', 'NA'),
            ]),
            [
                { uniqueSampleKey: 'S1', value: 'Immune Enriched (IE)' },
                { uniqueSampleKey: 'S2', value: 'Fibrotic (F)' },
            ]
        );
    });
});
