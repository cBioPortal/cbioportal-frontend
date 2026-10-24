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
])('$name significance columns', ({ table }) => {
    const element = React.Children.toArray(table.render().props.children).find(
        child => React.isValidElement(child) && child.props.columns
    ) as React.ReactElement<{ columns: Column<CoExpressionWithQ>[] }>;

    describe.each(['p-Value', 'q-Value'])('%s', columnName => {
        const column = element.props.columns.find(
            candidate => candidate.name === columnName
        )!;

        it.each([
            { value: 0, text: '0.00' },
            { value: 1e-12, text: '1.00e-12' },
            { value: 1e-10, text: '1.00e-10' },
            { value: 0.03, text: '0.0300' },
            { value: 0.3, text: '0.300' },
        ])(
            'preserves the precision and behavior of $value',
            ({ value, text }) => {
                const row = {
                    qValue: value,
                    pValue: value,
                    spearmansCorrelation: 0.7,
                } as CoExpressionWithQ;
                const markup = renderToStaticMarkup(<>{column.render!(row)}</>);

                expect(markup).toContain(text);
                expect(markup).not.toContain('&lt;');
                expect(markup.includes('<b>')).toBe(
                    columnName === 'q-Value' && value < 0.05
                );
                expect(column.sortBy!(row)).toEqual(
                    columnName === 'q-Value'
                        ? [value, value]
                        : [value, value > 0 ? 1 : 0]
                );
                expect(column.download!(row)).toBe(value.toString());
                expect(row).toEqual({
                    qValue: value,
                    pValue: value,
                    spearmansCorrelation: 0.7,
                });
            }
        );
    });

    it('retains correlation formatting', () => {
        const column = element.props.columns.find(
            candidate => candidate.name === "Spearman's Correlation"
        )!;
        const row = { spearmansCorrelation: 0 } as CoExpressionWithQ;
        const markup = renderToStaticMarkup(<>{column.render!(row)}</>);

        expect(markup).toContain('0.00');
        expect(markup).not.toContain('&lt;');
    });
});
