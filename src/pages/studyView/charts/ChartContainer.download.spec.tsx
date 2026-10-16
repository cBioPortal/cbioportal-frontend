import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { ChartContainer, IChartContainerProps } from './ChartContainer';
import { ChartTypeEnum } from '../StudyViewConfig';
import {
    getGenesCNADownloadData,
    getMutatedGenesDownloadData,
    getMutationTypesDownloadData,
    getStructuralVariantGenesDownloadData,
    getVariantAnnotationTypesDownloadData,
} from '../StudyViewUtils';
import {
    MultiSelectionTable,
    MultiSelectionTableColumnKey,
    MultiSelectionTableProps,
    MultiSelectionTableRow,
} from '../table/MultiSelectionTable';
import FixedHeaderTable, {
    IFixedHeaderTableProps,
} from '../table/FixedHeaderTable';
import { LazyMobXTableStore } from 'shared/components/lazyMobXTable/LazyMobXTable';

type TableElement<Props, Component> = React.ReactElement<Props> & {
    ref: React.RefCallback<Component> | null;
};

type DownloadableChart = {
    getDownloadData: (dataType?: 'summary' | 'full') => Promise<string | null>;
};

const tableWrappers: ShallowWrapper<
    MultiSelectionTableProps,
    {},
    MultiSelectionTable
>[] = [];

afterEach(() => {
    tableWrappers.splice(0).forEach(wrapper => wrapper.unmount());
});

const makeRow = (
    label: string,
    numberOfAlteredCases: number,
    numberOfProfiledCases = 100
): MultiSelectionTableRow => ({
    label,
    uniqueKey: label,
    numberOfAlteredCases,
    numberOfProfiledCases,
    totalCount: numberOfAlteredCases,
    qValue: 0.01,
    matchingGenePanelIds: [],
    oncokbAnnotated: false,
    isCancerGene: false,
    isOncokbOncogene: false,
    isOncokbTumorSuppressorGene: false,
});

const makePromise = (
    rows: MultiSelectionTableRow[]
): MobxPromise<MultiSelectionTableRow[]> => ({
    result: rows,
    status: 'complete',
    peekStatus: 'complete',
    isComplete: true,
    isPending: false,
    isError: false,
    error: undefined,
});

const makeChart = (
    rows: MultiSelectionTableRow[],
    filters: string[][] = [],
    overrides: Partial<IChartContainerProps> = {}
) => {
    const promise = makePromise(rows);
    const chart = new ChartContainer({
        chartType: ChartTypeEnum.MUTATED_GENES_TABLE,
        chartMeta: { uniqueKey: 'mutated-genes' },
        dimension: { w: 2, h: 2 },
        store: { isGlobalMutationFilterActive: false },
        promise,
        filters,
        cancerGeneFilterEnabled: false,
        getData: (_dataType, downloadRows) =>
            getMutatedGenesDownloadData(promise, false, downloadRows),
        ...overrides,
    } as IChartContainerProps);

    return chart;
};

const connectTable = (chart: ChartContainer) => {
    const tableElement = chart.chart!() as TableElement<
        MultiSelectionTableProps,
        MultiSelectionTable
    >;
    const wrapper = shallow<MultiSelectionTable>(tableElement);
    tableWrappers.push(wrapper);
    const table = wrapper.instance();
    tableElement.ref?.(table);
    const fixedTableElement = React.Children.toArray(
        wrapper.getElement().props.children
    )[0] as TableElement<
        IFixedHeaderTableProps<MultiSelectionTableRow>,
        FixedHeaderTable<MultiSelectionTableRow>
    >;
    const fixedTable = new FixedHeaderTable(fixedTableElement.props);
    fixedTableElement.ref?.(fixedTable);

    return { table, fixedTable };
};

const downloadGenes = async (chart: ChartContainer) => {
    const data = await ((chart as unknown) as DownloadableChart).getDownloadData();
    return data!
        .split('\n')
        .slice(1)
        .map(row => row.split('\t')[0]);
};

describe('Study Summary mutated genes table download', () => {
    const rows = [
        makeRow('BRCA1', 20),
        makeRow('TP53', 15, 20),
        makeRow('APC', 30),
    ];

    it('exports the default descending frequency order instead of API order', async () => {
        const chart = makeChart(rows);
        connectTable(chart);

        expect(await downloadGenes(chart)).toEqual(['TP53', 'APC', 'BRCA1']);
        expect(rows.map(row => row.label)).toEqual(['BRCA1', 'TP53', 'APC']);
    });

    it('follows ascending and descending sorts chosen in the table', async () => {
        const chart = makeChart(rows);
        const { fixedTable } = connectTable(chart);

        fixedTable.sort({ sortBy: MultiSelectionTableColumnKey.GENE });
        expect(await downloadGenes(chart)).toEqual(['APC', 'BRCA1', 'TP53']);

        fixedTable.sort({ sortBy: MultiSelectionTableColumnKey.GENE });
        expect(await downloadGenes(chart)).toEqual(['TP53', 'BRCA1', 'APC']);

        fixedTable.sort({ sortBy: MultiSelectionTableColumnKey.FREQ });
        expect(await downloadGenes(chart)).toEqual(['TP53', 'APC', 'BRCA1']);
    });

    it('includes applied selections once, pinned in their displayed order', async () => {
        const chart = makeChart(rows, [['BRCA1'], ['APC']]);
        const { fixedTable } = connectTable(chart);

        expect(await downloadGenes(chart)).toEqual(['BRCA1', 'APC', 'TP53']);

        fixedTable.sort({ sortBy: MultiSelectionTableColumnKey.GENE });
        expect(await downloadGenes(chart)).toEqual(['BRCA1', 'APC', 'TP53']);
    });

    it('keeps all rows beyond the viewport and search results in the export', async () => {
        const manyRows = Array.from({ length: 75 }, (_, index) =>
            makeRow(`GENE_${index}`, index + 1)
        );
        const chart = makeChart(manyRows);
        const { fixedTable } = connectTable(chart);
        const { _store: store } = (fixedTable as unknown) as {
            _store: LazyMobXTableStore<MultiSelectionTableRow>;
        };
        store.setFilterString('GENE_74');
        store.dataStore.itemsPerPage = 1;
        store.dataStore.page = 0;

        expect(store.dataStore.sortedFilteredData).toHaveLength(1);
        expect(store.dataStore.visibleData).toHaveLength(1);
        expect(await downloadGenes(chart)).toEqual(
            manyRows
                .slice()
                .reverse()
                .map(row => row.label)
        );
    });

    it('uses the existing source-data fallback when the table ref is absent', async () => {
        const chart = makeChart(rows);

        expect(await downloadGenes(chart)).toEqual(['BRCA1', 'TP53', 'APC']);
    });

    it('retains genes hidden by the cancer-gene display filter in the export', async () => {
        const cancerRows = rows.map(row => ({
            ...row,
            isCancerGene: row.label === 'TP53',
        }));
        const chart = makeChart(cancerRows, [], {
            cancerGeneFilterEnabled: true,
            filterByCancerGenes: true,
        });
        const { table } = connectTable(chart);

        expect(table.tableData.map(row => row.label)).toEqual(['TP53']);
        expect(await downloadGenes(chart)).toEqual(['TP53', 'APC', 'BRCA1']);
    });

    it('uses the source-data fallback before the inner table ref is available', async () => {
        const chart = makeChart(rows);
        const tableElement = chart.chart!() as TableElement<
            MultiSelectionTableProps,
            MultiSelectionTable
        >;
        tableElement.ref?.(new MultiSelectionTable(tableElement.props, {}));

        expect(await downloadGenes(chart)).toEqual(['BRCA1', 'TP53', 'APC']);
    });

    it('preserves full-data requests handled by the existing callback', async () => {
        const getData = jest.fn((dataType?: 'summary' | 'full') =>
            dataType === 'full' ? 'Sample ID\tGene\nSAMPLE_1\tTP53' : ''
        );
        const chart = makeChart(rows, [], { getData });
        connectTable(chart);

        expect(
            await ((chart as unknown) as DownloadableChart).getDownloadData(
                'full'
            )
        ).toBe('Sample ID\tGene\nSAMPLE_1\tTP53');
        expect(getData.mock.calls[0][0]).toBe('full');
    });
});

describe('Study Summary table download serializers', () => {
    const serializers: {
        name: string;
        format: (
            promise: MobxPromise<MultiSelectionTableRow[]>,
            rows?: MultiSelectionTableRow[]
        ) => string | Promise<string>;
    }[] = [
        {
            name: 'mutated genes',
            format: (promise, rows) =>
                getMutatedGenesDownloadData(promise, false, rows),
        },
        {
            name: 'CNA genes',
            format: (promise, rows) =>
                getGenesCNADownloadData(promise, false, rows),
        },
        {
            name: 'structural variant genes',
            format: (promise, rows) =>
                getStructuralVariantGenesDownloadData(promise, false, rows),
        },
        {
            name: 'mutation types',
            format: getMutationTypesDownloadData,
        },
        {
            name: 'variant annotation types',
            format: getVariantAnnotationTypesDownloadData,
        },
    ];

    it.each(serializers)(
        '$name honors supplied order and falls back to the original source',
        async ({ format }) => {
            const rows = [makeRow('BRCA1', 10), makeRow('TP53', 50)];
            const promise = makePromise(rows);
            const suppliedOrder = [rows[1], rows[0]];
            const orderedData = await format(promise, suppliedOrder);
            const fallbackData = await format(promise);

            expect(
                orderedData
                    .split('\n')
                    .slice(1)
                    .map(row => row.split('\t')[0])
            ).toEqual(['TP53', 'BRCA1']);
            expect(
                fallbackData
                    .split('\n')
                    .slice(1)
                    .map(row => row.split('\t')[0])
            ).toEqual(['BRCA1', 'TP53']);
            expect(orderedData.split('\n')[0]).toBe(
                fallbackData.split('\n')[0]
            );
        }
    );
});
