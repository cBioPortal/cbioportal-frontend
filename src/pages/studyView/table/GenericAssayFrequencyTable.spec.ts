import { assert } from 'chai';
import {
    GenericAssayFrequencyTableColumnKey,
    getGenericAssayFrequencyTableDefaultHiddenCategorySet,
    getGenericAssayFrequencyTableCategorySortValue,
    getGenericAssayFrequencyTableDefaultSortBy,
} from './GenericAssayFrequencyTable';
import GenericAssayFrequencyTable from './GenericAssayFrequencyTable';
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
        it('uses frequency sorting for arm-level CNA when default hidden categories are active', () => {
            assert.equal(
                getGenericAssayFrequencyTableDefaultSortBy(
                    true,
                    GenericAssayTypeConstants.ARMLEVEL_CNA
                ),
                GenericAssayFrequencyTableColumnKey.FREQ
            );
        });

        it('uses frequency sorting for LOH_HLA when default hidden categories are active', () => {
            assert.equal(
                getGenericAssayFrequencyTableDefaultSortBy(
                    true,
                    GenericAssayTypeConstants.LOH_HLA
                ),
                GenericAssayFrequencyTableColumnKey.FREQ
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

    describe('default hidden categories', () => {
        it('configures unchanged and unknown as hidden by default for curated arm-level types', () => {
            assert.deepEqual(
                getGenericAssayFrequencyTableDefaultHiddenCategorySet(
                    GenericAssayTypeConstants.ARMLEVEL_CNA
                ),
                {
                    unchanged: true,
                    unknown: true,
                }
            );
            assert.deepEqual(
                getGenericAssayFrequencyTableDefaultHiddenCategorySet(
                    GenericAssayTypeConstants.LOH_HLA
                ),
                {
                    unchanged: true,
                    unknown: true,
                }
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

    describe('component filtering behavior', () => {
        it('keeps applied hidden rows pinned while hiding them from the selectable table and download rows include visible UI rows', () => {
            const rows = [
                makeRow('Loss', 7, 'Entity A'),
                makeRow('Unchanged', 9, 'Entity B'),
                makeRow('Unknown', 3, 'Entity C'),
            ];
            const component = new GenericAssayFrequencyTable({
                promise: {
                    result: rows,
                    isComplete: true,
                } as any,
                width: 600,
                height: 300,
                genericAssayType: GenericAssayTypeConstants.ARMLEVEL_CNA,
                filters: [['Entity B::Unchanged::profile_type']],
                selectedRowsKeys: [],
                onChangeSelectedRows: () => {},
                onSubmitSelection: () => {},
                showCategoryColumn: true,
                setOperationsButtonText: 'Apply',
            });

            assert.deepEqual(
                component.preSelectedRows.map(row => row.uniqueKey),
                ['Entity B::Unchanged::profile_type']
            );
            assert.deepEqual(
                component.selectableTableData.map(row => row.uniqueKey),
                ['Entity A::Loss::profile_type']
            );
            assert.deepEqual(
                component.downloadRows.map(row => row.uniqueKey),
                [
                    'Entity B::Unchanged::profile_type',
                    'Entity A::Loss::profile_type',
                ]
            );
        });

        it('drops staged selections that become hidden when the category filter is enabled', () => {
            let selectedRowsKeys = [
                'Entity A::Loss::profile_type',
                'Entity B::Unchanged::profile_type',
            ];
            const component = new GenericAssayFrequencyTable({
                promise: {
                    result: [
                        makeRow('Loss', 7, 'Entity A'),
                        makeRow('Unchanged', 9, 'Entity B'),
                    ],
                    isComplete: true,
                } as any,
                width: 600,
                height: 300,
                genericAssayType: GenericAssayTypeConstants.ARMLEVEL_CNA,
                filters: [],
                selectedRowsKeys,
                onChangeSelectedRows: nextSelectedRowsKeys => {
                    selectedRowsKeys = nextSelectedRowsKeys;
                    (component.props as any).selectedRowsKeys = nextSelectedRowsKeys;
                },
                onSubmitSelection: () => {},
                showCategoryColumn: true,
                setOperationsButtonText: 'Apply',
            });

            component.toggleDefaultCategoryFilter({
                stopPropagation: () => {},
            } as any);
            component.toggleDefaultCategoryFilter({
                stopPropagation: () => {},
            } as any);

            assert.deepEqual(selectedRowsKeys, ['Entity A::Loss::profile_type']);
        });
    });
});
