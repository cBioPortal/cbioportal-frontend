import { assert } from 'chai';
import {
    GenericAssayFrequencyTableColumnKey,
    getGenericAssayFrequencyTableCategorySortValue,
    getGenericAssayFrequencyTableDefaultSortBy,
} from './GenericAssayFrequencyTable';
import { GenericAssayTypeConstants } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import { GenericAssayFrequencyTableRow } from 'pages/studyView/StudyViewUtils';

describe('GenericAssayFrequencyTable', () => {
    const makeRow = (
        category: string,
        count: number,
        entityLabel = 'Entity A'
    ): GenericAssayFrequencyTableRow => ({
        uniqueKey: `${entityLabel}::${category}::profile_type`,
        entityStableId: entityLabel,
        entityLabel,
        profileType: 'profile_type',
        category,
        count,
        totalCount: 10,
    });

    describe('default sorting', () => {
        it('uses curated category sorting for arm-level CNA', () => {
            assert.equal(
                getGenericAssayFrequencyTableDefaultSortBy(
                    true,
                    GenericAssayTypeConstants.ARMLEVEL_CNA
                ),
                GenericAssayFrequencyTableColumnKey.CATEGORY
            );
        });

        it('uses curated category sorting for LOH_HLA', () => {
            assert.equal(
                getGenericAssayFrequencyTableDefaultSortBy(
                    true,
                    GenericAssayTypeConstants.LOH_HLA
                ),
                GenericAssayFrequencyTableColumnKey.CATEGORY
            );
        });

        it('keeps frequency sorting for non-curated types', () => {
            assert.equal(
                getGenericAssayFrequencyTableDefaultSortBy(
                    true,
                    GenericAssayTypeConstants.MUTATIONAL_SIGNATURE
                ),
                GenericAssayFrequencyTableColumnKey.FREQ
            );
        });
    });

    describe('curated category sort values', () => {
        it('sorts altered arm-level CNA categories by frequency before unchanged', () => {
            const loss = getGenericAssayFrequencyTableCategorySortValue(
                makeRow('Loss', 2),
                GenericAssayTypeConstants.ARMLEVEL_CNA
            );
            const gain = getGenericAssayFrequencyTableCategorySortValue(
                makeRow('Gain', 3),
                GenericAssayTypeConstants.ARMLEVEL_CNA
            );
            const unchanged = getGenericAssayFrequencyTableCategorySortValue(
                makeRow('Unchanged', 9),
                GenericAssayTypeConstants.ARMLEVEL_CNA
            );

            assert.equal(loss, '00::000000000008::ENTITY A::loss');
            assert.equal(gain, '00::000000000007::ENTITY A::gain');
            assert.equal(
                unchanged,
                '01::000000000001::ENTITY A::unchanged'
            );
            assert.isTrue(gain < loss);
            assert.isTrue(loss < unchanged);
        });

        it('keeps higher-frequency rows first within the same curated category bucket', () => {
            const lowerFrequencyLoss =
                getGenericAssayFrequencyTableCategorySortValue(
                    makeRow('Loss', 2, 'Entity B'),
                    GenericAssayTypeConstants.LOH_HLA
                );
            const higherFrequencyLoss =
                getGenericAssayFrequencyTableCategorySortValue(
                    makeRow('loss', 6, 'Entity A'),
                    GenericAssayTypeConstants.LOH_HLA
                );

            assert.match(lowerFrequencyLoss, /^00::/);
            assert.match(higherFrequencyLoss, /^00::/);
            assert.isTrue(higherFrequencyLoss < lowerFrequencyLoss);
        });

        it('falls back to alphabetical category sorting for non-curated types', () => {
            assert.equal(
                getGenericAssayFrequencyTableCategorySortValue(
                    makeRow('Subtype B', 3),
                    GenericAssayTypeConstants.MUTATIONAL_SIGNATURE
                ),
                'Subtype B'
            );
        });
    });
});
