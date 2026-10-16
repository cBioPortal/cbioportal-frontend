import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ClinicalAttribute, Mutation } from 'cbioportal-ts-api-client';
import { MobxPromise } from 'cbioportal-frontend-commons';
import ResultsViewMutationMapper, {
    IResultsViewMutationMapperProps,
} from './ResultsViewMutationMapper';
import ResultsViewMutationTable, {
    IResultsViewMutationTableProps,
} from './ResultsViewMutationTable';
import {
    MutationTableComponent,
    MutationTableColumnType,
} from 'shared/components/mutationTable/MutationTable';
import {
    Column,
    LazyMobXTableStore,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import MutationMapperUserSelectionStore from 'shared/components/mutationMapper/MutationMapperUserSelectionStore';
import { IAddColumnsProps } from './AddColumns';
import { NamespaceColumnConfig } from 'shared/components/namespaceColumns/NamespaceColumnConfig';

jest.mock('3dmol', () => ({}));

const complete = <Result extends {}>(result: Result): MobxPromise<Result> => ({
    result,
    status: 'complete',
    peekStatus: 'complete',
    isComplete: true,
    isPending: false,
    isError: false,
    error: undefined,
});

const clinicalAttributes: ClinicalAttribute[] = ['AGE', 'SEX'].map(
    clinicalAttributeId => ({
        clinicalAttributeId,
        displayName: clinicalAttributeId,
        datatype: 'STRING',
        description: '',
        patientAttribute: true,
        priority: '1',
        studyId: 'study',
    })
);

const makeMapper = (
    promise: MobxPromise<ClinicalAttribute[]>,
    namespaceColumnConfig: NamespaceColumnConfig = {}
) =>
    new ResultsViewMutationMapper({
        store: {
            namespaceColumnConfig,
            mutationsTabClinicalAttributes: promise,
        },
    } as IResultsViewMutationMapperProps);

describe('Results mutation table clinical columns', () => {
    let table: ShallowWrapper<
        IResultsViewMutationTableProps,
        {},
        ResultsViewMutationTable
    >;

    afterEach(() => {
        table?.instance().destroy();
        table?.unmount();
    });

    it.each(['reset', 'icon style'])(
        'keeps all clinical columns when %s recomputes the column list',
        change => {
            const promise = complete(clinicalAttributes);
            const mapper = makeMapper(promise);
            const selection = new MutationMapperUserSelectionStore();
            selection.storeColumnVisibility({ AGE: true });
            const storeColumnVisibility = jest.fn(
                (visibility: { [columnId: string]: boolean } | undefined) => {
                    selection.storeColumnVisibility(visibility);
                    table.setProps({
                        columns: mapper.columns,
                        columnVisibility: selection.columnVisibility,
                    });
                }
            );

            table = shallow<ResultsViewMutationTable>(
                <ResultsViewMutationTable
                    data={[]}
                    columns={mapper.columns}
                    columnVisibility={selection.columnVisibility}
                    storeColumnVisibility={storeColumnVisibility}
                    columnVisibilityProps={{}}
                    isCanonicalTranscript={change === 'icon style'}
                    existsSomeMutationWithAscnProperty={{}}
                    usingPublicOncoKbInstance={false}
                    generateGenomeNexusHgvsgUrl={() => ''}
                    mutationsTabClinicalAttributes={promise}
                    clinicalAttributeIdToAvailableFrequency={complete({})}
                />
            );
            const tableProps = table.find(MutationTableComponent).props();
            const store = new LazyMobXTableStore<Mutation[]>(tableProps);
            store.updateColumnVisibility('AGE', true);
            const dropdown = tableProps.columnVisibilityProps!.customDropdown!({
                columnVisibility: store.colVisProp,
                resetColumnVisibility: store.resetColumnVisibility,
            }) as React.ReactElement<IAddColumnsProps>;

            if (change === 'reset') {
                dropdown.props.resetColumnVisibility!();
                expect(storeColumnVisibility).toHaveBeenCalledWith(undefined);
                expect(selection.columnVisibility).toBeUndefined();
                expect(store.columnVisibility.AGE).toBe(false);
            } else {
                table.setProps({
                    mergeOncoKbIcons: true,
                    columns: mapper.columns,
                });
                expect(selection.columnVisibility).toEqual({ AGE: true });
            }
            expect(
                table
                    .find(MutationTableComponent)
                    .props()
                    .columns.map(
                        (column: Column<Mutation[]>) => column.id || column.name
                    )
            ).toEqual(expect.arrayContaining(['AGE', 'SEX']));
            const columnNames = table
                .find(MutationTableComponent)
                .props()
                .columns.map((column: Column<Mutation[]>) => column.name);
            if (change === 'reset') {
                expect(columnNames).not.toContain(
                    MutationTableColumnType.ANNOTATION
                );
            } else {
                expect(columnNames).toContain(
                    MutationTableColumnType.ANNOTATION
                );
            }
        }
    );
});

describe('Results mutation mapper column source', () => {
    it.each([undefined, []])(
        'retains default and namespace columns when clinical attributes are %p',
        attributes => {
            const promise = {
                ...complete<ClinicalAttribute[]>([]),
                result: attributes,
            };
            const mapper = makeMapper(promise, { Custom: { score: 'number' } });

            expect(mapper.columns).toEqual([
                ...ResultsViewMutationTable.defaultProps.columns,
                'Custom Score',
            ]);
        }
    );

    it('preserves column order and includes duplicate clinical IDs only once', () => {
        const mapper = makeMapper(
            complete([
                ...clinicalAttributes,
                clinicalAttributes[0],
                {
                    ...clinicalAttributes[0],
                    clinicalAttributeId: MutationTableColumnType.GENE,
                },
            ]),
            { Custom: { score: 'number' } }
        );
        const columns = mapper.columns;

        expect(columns.slice(0, -3)).toEqual(
            ResultsViewMutationTable.defaultProps.columns
        );
        expect(columns.slice(-3)).toEqual(['Custom Score', 'AGE', 'SEX']);
        expect(columns.filter(column => column === 'AGE')).toHaveLength(1);
        expect(
            columns.filter(column => column === MutationTableColumnType.GENE)
        ).toHaveLength(1);
    });
});
