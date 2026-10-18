import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { observable, toJS } from 'mobx';
import { MobxPromise } from 'cbioportal-frontend-commons';
import {
    StructuralVariantFilterQuery,
    GeneFilterQuery,
} from 'cbioportal-ts-api-client';
import { getInternalClient } from 'shared/api/cbioportalInternalClientInstance';
import { StudyViewPageStore } from './StudyViewPageStore';
import { StudySummaryTab } from './tabs/SummaryTab';
import UserSelections, { IUserSelectionsProps } from './UserSelections';
import { IPillTagProps } from 'shared/components/PillTag/PillTag';
import { ChartContainer, IChartContainerProps } from './charts/ChartContainer';
import { ChartTypeEnum } from './StudyViewConfig';
import {
    ChartMeta,
    ChartMetaDataTypeEnum,
    getSamplesByExcludingFiltersOnChart,
    getUniqueKeyFromMolecularProfileIds,
} from './StudyViewUtils';
import {
    StructuralVariantMultiSelectionTable,
    StructVarMultiSelectionTableProps,
    StructVarMultiSelectionTableRow,
    StructVarMultiSelectionTableColumnKey,
} from './table/StructuralVariantMultiSelectionTable';
import { FreqColumnTypeEnum, SelectionOperatorEnum } from './TableUtils';
import { StructuralVariantFilterQueryFromOql } from './StructVarUtils';

function completePromise<Value>(result: Value): MobxPromise<Value> {
    return {
        result,
        status: 'complete',
        peekStatus: 'complete',
        isComplete: true,
        isPending: false,
        isError: false,
        error: undefined,
    };
}

describe('Study View structural-variant pair selection lifecycle', () => {
    const profileIds = [
        'study_b_structural_variants',
        'study_a_structural_variants',
    ];
    const pairKey = getUniqueKeyFromMolecularProfileIds(
        profileIds,
        ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE
    );
    const geneSvKey = getUniqueKeyFromMolecularProfileIds(
        profileIds,
        ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE
    );
    const mutationKey = 'study_a_mutations';
    const cnaKey = 'study_a_gistic';
    const chartMeta: ChartMeta = {
        uniqueKey: pairKey,
        displayName: 'Structural Variants',
        description: '',
        dataType: ChartMetaDataTypeEnum.GENOMIC,
        patientAttribute: false,
        priority: 1,
        renderWhenDataChange: false,
    };
    const rowNames = [
        'ERG::TMPRSS2',
        'ERG::OTHER',
        'OTHER::TMPRSS2',
        'TMPRSS2::ERG',
    ];
    const rows = rowNames.map(uniqueKey => {
        const [label1, label2] = uniqueKey.split('::');
        return {
            uniqueKey,
            label1,
            label2,
            numberOfAlteredCases: 10,
            numberOfProfiledCases: 100,
            totalCount: 10,
            matchingGenePanelIds: [],
            gene1OncokbAnnotated: false,
            gene1IsOncokbOncogene: false,
            gene1IsOncokbTumorSuppressorGene: false,
            gene1IsCancerGene: false,
            gene2OncokbAnnotated: false,
            gene2IsOncokbOncogene: false,
            gene2IsOncokbTumorSuppressorGene: false,
            gene2IsCancerGene: false,
        } as StructVarMultiSelectionTableRow;
    });
    const wrappers: ReactWrapper[] = [];

    afterEach(() => {
        wrappers.splice(0).forEach(wrapper => wrapper.unmount());
        localStorage.clear();
        jest.restoreAllMocks();
    });

    function createStore() {
        const store = Object.assign(
            Object.create(StudyViewPageStore.prototype),
            {
                _structVarFilterSet: observable.map<
                    string,
                    StructuralVariantFilterQuery[][]
                >(),
                _geneFilterSet: observable.map<string, GeneFilterQuery[][]>(),
                _chartSampleIdentifiersFilterSet: observable.map(),
                chartsType: observable.map([
                    [pairKey, ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE],
                    [geneSvKey, ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE],
                    [mutationKey, ChartTypeEnum.MUTATED_GENES_TABLE],
                    [cnaKey, ChartTypeEnum.CNA_GENES_TABLE],
                ]),
                chartsDimension: observable.map([[pairKey, { w: 2, h: 2 }]]),
                _chartVisibility: observable.map([[pairKey, true]]),
                structuralVariantTableRowData: completePromise(rows),
                structuralVariantGeneTableRowData: completePromise([]),
                mutatedGeneTableRowData: completePromise([]),
                cnaGeneTableRowData: completePromise([]),
                queriedPhysicalStudyIds: completePromise([
                    'study_a',
                    'study_b',
                ]),
                queriedSampleIdentifiers: completePromise([]),
                selectedDriverTiersMap: completePromise({ tier1: true }),
                driverAnnotationSettings: {
                    includeDriver: false,
                    includeVUS: true,
                    includeUnknownOncogenicity: false,
                    includeUnknownTier: false,
                },
                includeGermlineMutations: false,
                includeSomaticMutations: true,
                includeUnknownStatusMutations: false,
                sharedCustomChartSet: {},
                submittedPillStore: {},
                hesitantPillStore: {},
                getChartTitle: (_chartType: ChartTypeEnum, title: string) =>
                    title,
                hesitateUpdate: false,
            }
        ) as StudyViewPageStore;
        const emptyFilters = [
            'genomicDataFilters',
            'mutationDataFilters',
            'namespaceDataFilters',
            'genericAssayDataFilters',
            'genericAssaySelectionFilters',
            'clinicalDataFilters',
            'customDataFilters',
            'genomicProfilesFilter',
            'caseListsFilter',
        ];
        const properties: PropertyDescriptorMap = Object.fromEntries(
            emptyFilters.map(key => [key, { value: [] }])
        );
        Object.assign(properties, {
            chartMetaSet: { value: { [pairKey]: chartMeta } },
            filters: { get: () => store.filtersProxy },
            oncokbCancerGeneFilterEnabled: { value: false },
            isO2glFilterAvailable: { value: false },
            o2glFilterGenes: { value: [] },
            o2glFilterMatchedOncotreeCodes: { value: [] },
            o2glGeneOncotreeCodeMap: { value: {} },
            oncotreeCodeColorMap: { value: {} },
            oncotreeCodeNameMap: { value: {} },
            isGlobalMutationFilterActive: { value: false },
            isGlobalAlterationFilterActive: { value: false },
            selectedStructuralVariants: { value: [] },
            selectedGenes: { value: [] },
            genePanelCache: { value: undefined },
        });
        Object.defineProperties(store, properties);
        store.addStructVarFilters = store.addStructVarFilters.bind(store);
        return store;
    }

    function chartProps(
        store: StudyViewPageStore,
        meta: ChartMeta = chartMeta
    ) {
        const summary = new StudySummaryTab({ store });
        return summary.renderAttributeChart(meta).props.children.props.children
            .props as IChartContainerProps;
    }

    function tableFor(container: ChartContainer) {
        const element = container.chart!() as React.ReactElement<
            StructVarMultiSelectionTableProps
        >;
        return new StructuralVariantMultiSelectionTable(
            element.props,
            undefined
        );
    }

    function refreshContainer(
        container: ChartContainer,
        store: StudyViewPageStore
    ) {
        Object.assign(container, { props: chartProps(store) });
        return tableFor(container);
    }

    function numberCell(
        table: StructuralVariantMultiSelectionTable,
        rowIndex: number = 0
    ) {
        const column = table.getDefaultColumnDefinition(
            StructVarMultiSelectionTableColumnKey.NUMBER,
            100,
            0,
            undefined
        );
        const wrapper = mount(
            column.render!(rows[rowIndex]) as React.ReactElement
        );
        wrappers.push(wrapper);
        return wrapper.find('input');
    }

    function submitPair(store: StudyViewPageStore, rowIndex: number = 0) {
        const container = new ChartContainer(chartProps(store));
        numberCell(tableFor(container), rowIndex).simulate('change');
        tableFor(container).afterSelectingRows();
        return { container, table: refreshContainer(container, store) };
    }

    function seedGeneFilters(store: StudyViewPageStore) {
        for (const key of [geneSvKey, mutationKey, cnaKey]) {
            store.addGeneFilters({ ...chartMeta, uniqueKey: key }, [['TP53']]);
        }
        return toJS(store.geneFilters);
    }

    function deleteFilterPill(
        store: StudyViewPageStore,
        query: StructuralVariantFilterQuery
    ) {
        const selections = new UserSelections({
            store,
            removeStructVarFilter: store.removeStructVarFilter.bind(store),
        } as IUserSelectionsProps);
        const renderer = (selections as unknown) as {
            groupedStructVarQueries: (
                queries: StructuralVariantFilterQuery[],
                meta: ChartMeta & { chartType: ChartTypeEnum }
            ) => React.ReactElement<IPillTagProps>[];
        };
        const pill = renderer.groupedStructVarQueries([query], {
            ...chartMeta,
            chartType: ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE,
        })[0];
        const wrapper = mount(pill);
        wrappers.push(wrapper);
        wrapper.find('[data-test="pill-tag-delete"]').simulate('click');
    }

    it('keeps the submitted row checkbox checked after temporary row selection clears', () => {
        const store = createStore();
        const { table } = submitPair(store);
        const checkbox = numberCell(table);
        expect((checkbox.getDOMNode() as HTMLInputElement).checked).toBe(true);
        expect((checkbox.getDOMNode() as HTMLInputElement).disabled).toBe(true);
        expect(table.props.selectedRowsKeys).toEqual([]);
        expect(table.preSelectedRowsKeys).toEqual(['ERG::TMPRSS2']);
        expect(store.structVarFilters).toHaveLength(1);
    });

    it('resets the pair selection through the actual SummaryTab reset callback', () => {
        const store = createStore();
        const geneFilters = seedGeneFilters(store);
        const { container } = submitPair(store);
        chartProps(store).onResetSelection(chartMeta, []);
        expect(store.structVarFilters).toEqual([]);
        expect(toJS(store.geneFilters)).toEqual(geneFilters);
        const checkbox = numberCell(refreshContainer(container, store));
        expect((checkbox.getDOMNode() as HTMLInputElement).checked).toBe(false);
        expect((checkbox.getDOMNode() as HTMLInputElement).disabled).toBe(
            false
        );
    });

    it('removes the pair filter when its chart is removed, preserving other chart filters', () => {
        const store = createStore();
        const geneFilters = seedGeneFilters(store);
        submitPair(store);
        chartProps(store).onDeleteChart(chartMeta);
        expect(store.structVarFilters).toEqual([]);
        expect(toJS(store.geneFilters)).toEqual(geneFilters);
    });

    it('serializes valid profile IDs and all SV option flags after a real row submission', async () => {
        const store = createStore();
        submitPair(store);
        const filters = JSON.parse(JSON.stringify(store.filtersProxy));
        expect(filters.structuralVariantFilters).toEqual([
            {
                molecularProfileIds: profileIds.slice().sort(),
                structVarQueries: [
                    [
                        {
                            gene1Query: { hugoSymbol: 'ERG' },
                            gene2Query: { hugoSymbol: 'TMPRSS2' },
                            includeDriver: false,
                            includeVUS: true,
                            includeUnknownOncogenicity: false,
                            includeUnknownTier: false,
                            tiersBooleanMap: { tier1: true },
                            includeGermline: false,
                            includeSomatic: true,
                            includeUnknownStatus: false,
                        },
                    ],
                ],
            },
        ]);
        const request = jest
            .spyOn(getInternalClient(), 'fetchFilteredSamplesUsingPOST')
            .mockResolvedValue([]);
        await getSamplesByExcludingFiltersOnChart(
            'other-chart',
            filters,
            {},
            [],
            ['study_a', 'study_b']
        );
        expect(
            request.mock.calls[0][0]!.studyViewFilter!.structuralVariantFilters
        ).toEqual(filters.structuralVariantFilters);
        expect(request.mock.calls[0][0]!.studyViewFilter!.studyIds).toEqual([
            'study_a',
            'study_b',
        ]);
    });

    it('restores a submitted URL filter under the same chart key with the same checked row', () => {
        const original = createStore();
        submitPair(original);
        const saved = JSON.parse(JSON.stringify(original.filtersProxy));
        const restored = createStore();
        restored.updateStoreByFilters(saved);
        expect(restored.getStructVarFiltersByUniqueKey(pairKey)).toEqual([
            ['ERG::TMPRSS2'],
        ]);
        expect(JSON.parse(JSON.stringify(restored.filtersProxy))).toEqual(
            saved
        );
        const checkbox = numberCell(
            tableFor(new ChartContainer(chartProps(restored)))
        );
        expect((checkbox.getDOMNode() as HTMLInputElement).checked).toBe(true);
    });

    it.each([SelectionOperatorEnum.UNION, SelectionOperatorEnum.INTERSECTION])(
        'preserves %s grouping and pair identity after submit and reload',
        operator => {
            localStorage.setItem(
                FreqColumnTypeEnum.STRUCTURAL_VARIANT_PAIR,
                operator
            );
            const store = createStore();
            const container = new ChartContainer(chartProps(store));
            numberCell(tableFor(container), 0).simulate('change');
            numberCell(tableFor(container), 3).simulate('change');
            const table = tableFor(container);
            if (table.selectionType !== operator)
                table.toggleSelectionOperator();
            table.afterSelectingRows();
            const expected =
                operator === SelectionOperatorEnum.UNION
                    ? [['ERG::TMPRSS2', 'TMPRSS2::ERG']]
                    : [['ERG::TMPRSS2'], ['TMPRSS2::ERG']];
            const restored = createStore();
            restored.updateStoreByFilters(
                JSON.parse(JSON.stringify(store.filtersProxy))
            );
            expect(restored.getStructVarFiltersByUniqueKey(pairKey)).toEqual(
                expected
            );
            expect(
                tableFor(new ChartContainer(chartProps(restored)))
                    .preSelectedRowsKeys
            ).toEqual(rowNames.filter(name => expected.flat().includes(name)));
        }
    );

    it('removes only the requested filter pill when other pairs share a partner', () => {
        const store = createStore();
        store.addStructVarFilters(chartMeta, [rowNames]);
        deleteFilterPill(
            store,
            store.structVarFilters[0].structVarQueries[0][0]
        );
        expect(store.getStructVarFiltersByUniqueKey(pairKey)).toEqual([
            rowNames.slice(1),
        ]);
        expect(store.structVarFilters[0].structVarQueries[0]).toHaveLength(3);
    });

    it.each([
        ['NO_GENE', '-::TMPRSS2'],
        ['ANY_GENE', '*::TMPRSS2'],
    ])(
        'keeps %s identities when adapting stored filters to row keys',
        (specialValue, expected) => {
            const store = createStore();
            const query = StructuralVariantFilterQueryFromOql('ERG::TMPRSS2');
            query.gene1Query = {
                specialValue,
            } as StructuralVariantFilterQuery['gene1Query'];
            store.updateStoreByFilters({
                structuralVariantFilters: [
                    {
                        molecularProfileIds: profileIds,
                        structVarQueries: [[query]],
                    },
                ],
            });
            expect(store.getStructVarFiltersByUniqueKey(pairKey)).toEqual([
                [expected],
            ]);
        }
    );

    it('does not treat an unresolved gene ID as a no-gene row', () => {
        const store = createStore();
        const query = StructuralVariantFilterQueryFromOql('ERG::TMPRSS2');
        query.gene1Query = {
            entrezId: 207,
        } as StructuralVariantFilterQuery['gene1Query'];
        store.updateStoreByFilters({
            structuralVariantFilters: [
                {
                    molecularProfileIds: profileIds,
                    structVarQueries: [[query]],
                },
            ],
        });
        expect(store.getStructVarFiltersByUniqueKey(pairKey)).toEqual([[]]);
        expect(
            store.structVarFilters[0].structVarQueries[0][0].gene1Query
        ).toEqual({ entrezId: 207 });
    });

    it.each([
        { specialValue: 'NO_GENE' },
        { specialValue: 'ANY_GENE' },
        { entrezId: 207 },
    ])(
        'deletes the targeted typed endpoint %j through its real filter pill',
        endpoint => {
            const store = createStore();
            const baseQuery = StructuralVariantFilterQueryFromOql(
                'ERG::TMPRSS2'
            );
            const target = ({
                ...baseQuery,
                gene1Query: endpoint,
            } as unknown) as StructuralVariantFilterQuery;
            const companions = ([
                { ...baseQuery, gene1Query: { hugoSymbol: 'OTHER' } },
                {
                    ...baseQuery,
                    gene1Query: {
                        specialValue:
                            endpoint.specialValue === 'NO_GENE'
                                ? 'ANY_GENE'
                                : 'NO_GENE',
                    },
                },
            ] as unknown) as StructuralVariantFilterQuery[];
            store.updateStoreByFilters({
                structuralVariantFilters: [
                    {
                        molecularProfileIds: profileIds,
                        structVarQueries: [[target, ...companions]],
                    },
                ],
            });
            deleteFilterPill(
                store,
                store.structVarFilters[0].structVarQueries[0][0]
            );
            expect(
                toJS(store.structVarFilters).map(
                    filter => filter.structVarQueries
                )
            ).toEqual([[companions]]);
        }
    );

    it.each([geneSvKey, mutationKey, cnaKey])(
        'keeps the existing gene-filter path for %s',
        key => {
            const store = createStore();
            store.addGeneFilters({ ...chartMeta, uniqueKey: key }, [['TP53']]);
            const props = chartProps(store, { ...chartMeta, uniqueKey: key });
            expect(props.filters).toEqual(store.getGeneFiltersByUniqueKey(key));
            props.onResetSelection({ ...chartMeta, uniqueKey: key }, []);
            expect(store.geneFilters).toEqual([]);
            expect(store.structVarFilters).toEqual([]);
        }
    );
});
