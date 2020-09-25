import * as React from 'react';
import { observer } from 'mobx-react';
import { ClinicalDataEnrichmentWithQ } from 'pages/groupComparison/GroupComparisonUtils';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import { ClinicalDataEnrichmentTableColumnType } from 'pages/groupComparison/ClinicalDataEnrichmentsTable';
import autobind from 'autobind-decorator';
import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { filterNumericalColumn } from 'shared/components/lazyMobXTable/utils';

export interface ISurvivalPrefixTableProps {
    survivalPrefixes: SurvivalPrefixSummary[];
    getSelectedPrefix: () => string | undefined;
    setSelectedPrefix: (p: string) => void;
}

export type SurvivalPrefixSummary = {
    prefix: string;
    displayText: string;
    numPatients: number;
    pValue: number | null;
    qValue: number | null;
};

class SurvivalPrefixTableStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    SurvivalPrefixSummary
> {
    constructor(
        getData: () => SurvivalPrefixSummary[],
        getSelectedPrefix: () => string | undefined
    ) {
        super(getData);
        this.dataHighlighter = (d: SurvivalPrefixSummary) => {
            return d.prefix === getSelectedPrefix();
        };
    }
}

enum ColumnName {
    P_VALUE = 'p-Value',
}

const COLUMNS = [
    {
        name: 'Survival Type',
        render: (d: SurvivalPrefixSummary) => <span>{d.displayText}</span>,
        filter: (
            d: SurvivalPrefixSummary,
            f: string,
            filterStringUpper: string
        ) => d.displayText.toUpperCase().indexOf(filterStringUpper) > -1,
        sortBy: (d: SurvivalPrefixSummary) => d.displayText,
        download: (d: SurvivalPrefixSummary) => d.displayText,
    },
    {
        name: '# Patients With Data',
        render: (d: SurvivalPrefixSummary) => <span>{d.numPatients}</span>,
        sortBy: (d: SurvivalPrefixSummary) => d.numPatients,
        filter: filterNumericalColumn(
            (d: SurvivalPrefixSummary) => d.numPatients,
            '# Patients With Data'
        ),
        download: (d: SurvivalPrefixSummary) => d.numPatients.toString(),
    },
    {
        name: ColumnName.P_VALUE,
        render: (d: SurvivalPrefixSummary) => (
            <span>
                {d.pValue !== null
                    ? toConditionalPrecisionWithMinimum(d.pValue, 3, 0.01, -10)
                    : 'N/A'}
            </span>
        ),
        sortBy: (d: SurvivalPrefixSummary) => d.pValue,
        filter: filterNumericalColumn(
            (d: SurvivalPrefixSummary) => d.pValue,
            ColumnName.P_VALUE
        ),
        download: (d: SurvivalPrefixSummary) =>
            d.pValue !== null
                ? toConditionalPrecision(d.pValue, 3, 0.01)
                : 'N/A',
        tooltip: <span>Derived from Log Rank test.</span>,
    },
    {
        name: 'q-Value',
        render: (d: SurvivalPrefixSummary) => (
            <span>
                {d.qValue !== null
                    ? toConditionalPrecisionWithMinimum(d.qValue, 3, 0.01, -10)
                    : 'N/A'}
            </span>
        ),
        sortBy: (d: SurvivalPrefixSummary) => d.qValue,
        filter: filterNumericalColumn(
            (d: SurvivalPrefixSummary) => d.qValue,
            'q-Value'
        ),
        download: (d: SurvivalPrefixSummary) =>
            d.qValue !== null
                ? toConditionalPrecision(d.qValue, 3, 0.01)
                : 'N/A',
        tooltip: (
            <span>
                Derived from Benjamini-Hochberg FDR correction procedure.
            </span>
        ),
    },
];

@observer
export default class SurvivalPrefixTable extends React.Component<
    ISurvivalPrefixTableProps,
    {}
> {
    private dataStore: SurvivalPrefixTableStore;
    constructor(props: ISurvivalPrefixTableProps) {
        super(props);
        this.dataStore = new SurvivalPrefixTableStore(
            () => this.props.survivalPrefixes,
            this.props.getSelectedPrefix
        );
    }
    @autobind
    private onRowClick(d: SurvivalPrefixSummary) {
        this.props.setSelectedPrefix(d.prefix);
    }

    public render() {
        return (
            <LazyMobXTable
                columns={COLUMNS}
                showColumnVisibility={false}
                initialSortColumn={ColumnName.P_VALUE}
                initialSortDirection={'asc'}
                dataStore={this.dataStore}
                onRowClick={this.onRowClick}
                paginationProps={{ itemsPerPageOptions: [15] }}
                initialItemsPerPage={15}
                copyDownloadProps={{
                    showCopy: false,
                }}
            />
        );
    }
}
