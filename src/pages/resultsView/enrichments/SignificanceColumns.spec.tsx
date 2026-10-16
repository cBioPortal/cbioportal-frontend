import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ExpressionEnrichmentsTable from './ExpressionEnrichmentsTable';
import GenericAssayEnrichmentsTable from './GenericAssayEnrichmentsTable';
import GenericAssayBinaryEnrichmentsTable from './GenericAssayBinaryEnrichmentsTable';
import GenericAssayCategoricalEnrichmentsTable from './GenericAssayCategoricalEnrichmentsTable';
import { GenericAssayEnrichmentsTableDataStore } from './GenericAssayEnrichmentsTableDataStore';
import { GenericAssayBinaryEnrichmentsTableDataStore } from './GenericAssayBinaryEnrichmentsTableDataStore';
import { GenericAssayCategoricalEnrichmentsTableDataStore } from './GenericAssayCategoricalEnrichmentsTableDataStore';
import CoExpressionTableGenes, {
    ICoExpressionTableGenesProps,
} from '../coExpression/CoExpressionTableGenes';
import CoExpressionTableGenesets, {
    ICoExpressionTableGenesetsProps,
} from '../coExpression/CoExpressionTableGenesets';
import { CoExpressionWithQ } from '../coExpression/CoExpressionTabUtils';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
import {
    ExpressionEnrichmentRow,
    GenericAssayEnrichmentRow,
    GenericAssayBinaryEnrichmentRow,
    GenericAssayCategoricalEnrichmentRow,
} from 'shared/model/EnrichmentRow';

type SignificanceRow = ExpressionEnrichmentRow &
    GenericAssayEnrichmentRow &
    GenericAssayBinaryEnrichmentRow &
    GenericAssayCategoricalEnrichmentRow;

const tableCases = [
    {
        name: 'expression',
        table: new ExpressionEnrichmentsTable({ data: [] }),
    },
    {
        name: 'continuous generic assay',
        table: new GenericAssayEnrichmentsTable({
            data: [],
            genericAssayType: 'TEST',
            dataStore: new GenericAssayEnrichmentsTableDataStore(
                () => [],
                () => undefined,
                () => {}
            ),
        }),
    },
    {
        name: 'binary generic assay',
        table: new GenericAssayBinaryEnrichmentsTable({
            data: [],
            genericAssayType: 'TEST',
            dataStore: new GenericAssayBinaryEnrichmentsTableDataStore(
                () => [],
                () => undefined,
                () => {}
            ),
        }),
    },
    {
        name: 'categorical generic assay',
        table: new GenericAssayCategoricalEnrichmentsTable({
            data: [],
            genericAssayType: 'TEST',
            dataStore: new GenericAssayCategoricalEnrichmentsTableDataStore(
                () => [],
                () => undefined,
                () => {}
            ),
        }),
    },
];

describe.each(tableCases)('$name significance columns', ({ table }) => {
    describe.each(['P_VALUE', 'Q_VALUE'])('%s', columnName => {
        const column = table.columns[columnName];
        const makeRow = (value: number) =>
            ({ pValue: value, qValue: value } as SignificanceRow);
        const renderValue = (value: number) =>
            renderToStaticMarkup(<>{column.render!(makeRow(value))}</>);

        it.each([0, 1e-12])(
            'displays %s using the existing lower bound',
            value => {
                expect(renderValue(value)).toContain('&lt; 10<sup>-10</sup>');
            }
        );

        it('displays the boundary value without a lower-bound inequality', () => {
            expect(renderValue(1e-10)).toContain('1.00e-10');
            expect(renderValue(1e-10)).not.toContain('&lt;');
        });

        it('preserves ordinary value formatting and q-value emphasis', () => {
            const markup = renderValue(0.03);
            expect(markup).toContain('0.0300');
            expect(markup.includes('<b>')).toBe(columnName === 'Q_VALUE');
            expect(renderValue(0.3)).not.toContain('<b>');
        });

        it('preserves numeric sorting, downloads and the source values', () => {
            const zeroRow = makeRow(0);
            const smallRow = makeRow(1e-12);

            expect(column.sortBy!(zeroRow)).toBe(0);
            expect(column.sortBy!(smallRow)).toBe(1e-12);
            expect(column.download!(zeroRow)).toBe('0.00');
            expect(column.download!(smallRow)).toBe('1.00e-12');
            renderToStaticMarkup(<>{column.render!(zeroRow)}</>);
            expect(zeroRow).toEqual({ pValue: 0, qValue: 0 });
        });
    });
});

describe.each([
    {
        name: 'coexpression genes',
        table: new CoExpressionTableGenes({} as ICoExpressionTableGenesProps),
    },
    {
        name: 'coexpression gene sets',
        table: new CoExpressionTableGenesets(
            {} as ICoExpressionTableGenesetsProps
        ),
    },
])('$name shared significance formatter', ({ table }) => {
    it('bounds q-values while retaining correlation values, sorting and downloads', () => {
        const element = React.Children.toArray(
            table.render().props.children
        ).find(
            child => React.isValidElement(child) && child.props.columns
        ) as React.ReactElement<{ columns: Column<CoExpressionWithQ>[] }>;
        const qValueColumn = element.props.columns.find(
            column => column.name === 'q-Value'
        )!;
        const correlationColumn = element.props.columns.find(
            column => column.name === "Spearman's Correlation"
        )!;
        const row = {
            qValue: 0,
            pValue: 0,
            spearmansCorrelation: 0,
        } as CoExpressionWithQ;

        expect(
            renderToStaticMarkup(<>{qValueColumn.render!(row)}</>)
        ).toContain('&lt; 10<sup>-10</sup>');
        expect(
            renderToStaticMarkup(<>{correlationColumn.render!(row)}</>)
        ).not.toContain('&lt;');
        expect(qValueColumn.sortBy!(row)).toEqual([0, 0]);
        expect(qValueColumn.download!(row)).toBe('0');
    });
});
