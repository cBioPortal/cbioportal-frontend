import * as React from 'react';
import { Geneset } from '../../../shared/api/generated/CBioPortalAPIInternal';
import { Gene } from '../../../shared/api/generated/CBioPortalAPI';
import { correlationColor, correlationSortBy } from './CoExpressionTableUtils';
import LazyMobXTable from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { CoExpressionDataStore, TableMode } from './CoExpressionViz';
import Select from 'react-select1';
import { observer } from 'mobx-react';
import { CoExpressionWithQ, tableSearchInformation } from './CoExpressionTabUtils';
import InfoIcon from '../../../shared/components/InfoIcon';
import { bind } from 'bind-decorator';
import { cytobandFilter } from 'pages/resultsView/ResultsViewTableUtils';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { formatSignificanceValueWithStyle } from 'shared/lib/FormatUtils';

export interface ICoExpressionTableGenesProps {
    referenceGeneticEntity: Gene | Geneset;
    dataStore: CoExpressionDataStore;
    tableMode: TableMode;
    onSelectTableMode: (t: TableMode) => void;
}

const SPEARMANS_CORRELATION_COLUMN_NAME = "Spearman's Correlation";
const P_VALUE_COLUMN_NAME = 'p-Value';
const Q_VALUE_COLUMN_NAME = 'q-Value';

const COLUMNS = [
    {
        name: 'Correlated Gene',
        render: (d: CoExpressionWithQ) => (
            <span style={{ fontWeight: 'bold' }}>{d.geneticEntityName}</span>
        ),
        filter: (d: CoExpressionWithQ, f: string, filterStringUpper: string) =>
            d.geneticEntityName.indexOf(filterStringUpper) > -1,
        download: (d: CoExpressionWithQ) => d.geneticEntityName,
        sortBy: (d: CoExpressionWithQ) => d.geneticEntityName,
        width: '30%',
    },
    {
        name: 'Cytoband',
        render: (d: CoExpressionWithQ) => <span>{d.cytoband}</span>,
        filter: cytobandFilter,
        download: (d: CoExpressionWithQ) => d.cytoband,
        sortBy: (d: CoExpressionWithQ) => d.cytoband,
        width: '30%',
    },
    makeNumberColumn(SPEARMANS_CORRELATION_COLUMN_NAME, 'spearmansCorrelation', true, false),
    Object.assign(makeNumberColumn(P_VALUE_COLUMN_NAME, 'pValue', false, false), {
        tooltip: <span>Derived from 2-sided t-test.</span>,
    }),
    Object.assign(makeNumberColumn(Q_VALUE_COLUMN_NAME, 'qValue', false, true), {
        sortBy: (d: CoExpressionWithQ) => [d.qValue, d.pValue],
        tooltip: <span>Derived from Benjamini-Hochberg FDR correction procedure.</span>,
    }),
];

function makeNumberColumn(
    name: string,
    key: keyof CoExpressionWithQ,
    colorByValue: boolean,
    formatSignificance: boolean
) {
    return {
        name: name,
        render: (d: CoExpressionWithQ) => {
            return (
                <span
                    style={{
                        color: colorByValue ? correlationColor(d[key] as number) : '#000000',
                        textAlign: 'right',
                        float: 'right',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {formatSignificance
                        ? formatSignificanceValueWithStyle(d[key] as number)
                        : toConditionalPrecision(d[key] as number, 3, 0.01)}
                </span>
            );
        },
        download: (d: CoExpressionWithQ) => (d[key] as number).toString() + '',
        sortBy: (d: CoExpressionWithQ) => correlationSortBy(d[key] as number),
        align: 'right' as 'right',
    };
}

@observer
export default class CoExpressionTableGenes extends React.Component<
    ICoExpressionTableGenesProps,
    {}
> {
    @bind
    private onRowClick(d: CoExpressionWithQ) {
        this.props.dataStore.setHighlighted(d);
    }

    @bind
    private onSelectTableMode(d: any) {
        this.props.onSelectTableMode(d.value);
    }

    private tableModeOptions = [
        {
            label: 'Show Any Correlation',
            value: TableMode.SHOW_ALL,
        },
        {
            label: 'Show Only Positively Correlated',
            value: TableMode.SHOW_POSITIVE,
        },
        {
            label: 'Show Only Negatively Correlated',
            value: TableMode.SHOW_NEGATIVE,
        },
    ];

    private paginationProps = {
        itemsPerPageOptions: [25],
    };

    render() {
        return (
            <div>
                <div
                    style={{
                        float: 'left',
                        display: 'flex',
                        flexDirection: 'row',
                    }}
                >
                    <div style={{ width: 180 }}>
                        <Select
                            value={this.props.tableMode}
                            onChange={this.onSelectTableMode}
                            options={this.tableModeOptions}
                            searchable={false}
                            clearable={false}
                            className="coexpression-select-table-mode"
                        />
                    </div>
                    <InfoIcon
                        style={{ marginLeft: 21, marginTop: '0.7em' }}
                        tooltip={<div style={{ maxWidth: 200 }}>{tableSearchInformation}</div>}
                        tooltipPlacement="left"
                    />
                </div>
                <LazyMobXTable
                    initialSortColumn={Q_VALUE_COLUMN_NAME}
                    initialSortDirection="asc"
                    columns={COLUMNS}
                    showColumnVisibility={false}
                    dataStore={this.props.dataStore}
                    onRowClick={this.onRowClick}
                    filterPlaceholder="Enter gene or cytoband.."
                    paginationProps={this.paginationProps}
                    initialItemsPerPage={25}
                    copyDownloadProps={{
                        showCopy: false,
                    }}
                />
            </div>
        );
    }
}
