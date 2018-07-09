import * as React from 'react';
import * as _ from "lodash";
import LazyMobXTable, { Column } from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { Badge, Checkbox } from 'react-bootstrap';
import {
    calculateAlterationTendency, formatLogOddsRatio, formatPercentage, formatValueWithStyle
} from "./EnrichmentsUtil";
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import styles from "./styles.module.scss";
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import { cytobandFilter } from 'pages/resultsView/ResultsViewTableUtils';
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';

export interface IAlterationEnrichmentTableProps {
    columns?: AlterationEnrichmentTableColumnType[];
    data: AlterationEnrichmentRow[];
    initialSortColumn?: string;
    alterationType: string;
    dataStore: EnrichmentsTableDataStore;
    onCheckGene: (hugoGeneSymbol: string) => void;
    onGeneNameClick: (hugoGeneSymbol: string) => void;
}

export enum AlterationEnrichmentTableColumnType {
    GENE,
    CYTOBAND,
    PERCENTAGE_IN_ALTERED,
    PERCENTAGE_IN_UNALTERED,
    LOG_RATIO,
    P_VALUE,
    Q_VALUE,
    TENDENCY
}

type AlterationEnrichmentTableColumn = Column<AlterationEnrichmentRow> & { order?: number, shouldExclude?: () => boolean };

export class AlterationEnrichmentTableComponent extends LazyMobXTable<AlterationEnrichmentRow> {
}

@observer
export default class AlterationEnrichmentTable extends React.Component<IAlterationEnrichmentTableProps, {}> {

    @observable protected _columns: { [columnEnum: number]: AlterationEnrichmentTableColumn };

    constructor(props: IAlterationEnrichmentTableProps) {
        super(props);
        this._columns = this.generateColumns();
    }

    public static defaultProps = {
        columns: [
            AlterationEnrichmentTableColumnType.GENE,
            AlterationEnrichmentTableColumnType.CYTOBAND,
            AlterationEnrichmentTableColumnType.PERCENTAGE_IN_ALTERED,
            AlterationEnrichmentTableColumnType.PERCENTAGE_IN_UNALTERED,
            AlterationEnrichmentTableColumnType.LOG_RATIO,
            AlterationEnrichmentTableColumnType.P_VALUE,
            AlterationEnrichmentTableColumnType.Q_VALUE,
            AlterationEnrichmentTableColumnType.TENDENCY
        ],
        initialSortColumn: "q-Value"
    };

    private checkboxChange(hugoGeneSymbol: string) {
        const row: AlterationEnrichmentRow = _.find(this.props.data, {hugoGeneSymbol})!;
        row.checked = !row.checked;
        this._columns = this.generateColumns();
        this.props.onCheckGene(hugoGeneSymbol);
    }

    @autobind
    private onRowClick(d: AlterationEnrichmentRow) {
        this.props.onGeneNameClick(d.hugoGeneSymbol);
        this.props.dataStore.setHighlighted(d);
    }

    protected generateColumns():{ [columnEnum: number]: AlterationEnrichmentTableColumn } {
        const columns: { [columnEnum: number]: AlterationEnrichmentTableColumn } = {};

        columns[AlterationEnrichmentTableColumnType.GENE] = {
            name: "Gene",
            render: (d: AlterationEnrichmentRow) => <div style={{ display: 'flex' }}><Checkbox checked={d.checked} 
                disabled={d.disabled} key={d.hugoGeneSymbol} className={styles.Checkbox} 
                onChange={() => this.checkboxChange(d.hugoGeneSymbol)} title={d.disabled ? "This is one of the query genes" : ""} />
                <span className={styles.GeneName}><b>{d.hugoGeneSymbol}</b></span></div>,
            tooltip: <span>Gene</span>,
            filter: (d: AlterationEnrichmentRow, filterString: string, filterStringUpper: string) =>
                d.hugoGeneSymbol.toUpperCase().includes(filterStringUpper),
            sortBy: (d: AlterationEnrichmentRow) => d.hugoGeneSymbol,
            download: (d: AlterationEnrichmentRow) => d.hugoGeneSymbol
        };

        columns[AlterationEnrichmentTableColumnType.CYTOBAND] = {
            name: "Cytoband",
            render: (d: AlterationEnrichmentRow) => <span>{d.cytoband}</span>,
            tooltip: <span>Cytoband</span>,
            filter: cytobandFilter,
            sortBy: (d: AlterationEnrichmentRow) => d.cytoband,
            download: (d: AlterationEnrichmentRow) => d.cytoband
        };

        columns[AlterationEnrichmentTableColumnType.PERCENTAGE_IN_ALTERED] = {
            name: "Samples with alteration in altered group",
            render: (d: AlterationEnrichmentRow) => <span>{formatPercentage(d.alteredCount, d.alteredPercentage)}</span>,
            headerRender: (name: string) => <span style={{ display: 'inline-block', width: 100 }}>{name}</span>,
            tooltip: <span>Number (percentage) of samples that have alterations in the query gene(s) that also 
                have {this.props.alterationType} in the listed gene.</span>,
            sortBy: (d: AlterationEnrichmentRow) => d.alteredCount,
            download: (d: AlterationEnrichmentRow) => formatPercentage(d.alteredCount, d.alteredPercentage)
        };

        columns[AlterationEnrichmentTableColumnType.PERCENTAGE_IN_UNALTERED] = {
            name: "Samples with alteration in unaltered group",
            render: (d: AlterationEnrichmentRow) => <span>{formatPercentage(d.unalteredCount, d.unalteredPercentage)}</span>,
            headerRender: (name: string) => <span style={{ display: 'inline-block', width: 100 }}>{name}</span>,
            tooltip: <span>Number (percentage) of samples that do not have alterations in the query gene(s) that 
                have {this.props.alterationType} in the listed gene.</span>,
            sortBy: (d: AlterationEnrichmentRow) => d.unalteredCount,
            download: (d: AlterationEnrichmentRow) => formatPercentage(d.unalteredCount, d.unalteredPercentage)
        };

        columns[AlterationEnrichmentTableColumnType.LOG_RATIO] = {
            name: "Log Ratio",
            render: (d: AlterationEnrichmentRow) => <span>{formatLogOddsRatio(d.logRatio)}</span>,
            tooltip: <span>Log2 based ratio of (pct in altered / pct in unaltered)</span>,
            sortBy: (d: AlterationEnrichmentRow) => Number(d.logRatio),
            download: (d: AlterationEnrichmentRow) => formatLogOddsRatio(d.logRatio)
        };

        columns[AlterationEnrichmentTableColumnType.P_VALUE] = {
            name: "p-Value",
            render: (d: AlterationEnrichmentRow) => <span style={{whiteSpace: 'nowrap'}}>{toConditionalPrecision(d.pValue, 3, 0.01)}</span>,
            tooltip: <span>Derived from Fisher's exact test</span>,
            sortBy: (d: AlterationEnrichmentRow) => d.pValue,
            download: (d: AlterationEnrichmentRow) => toConditionalPrecision(d.pValue, 3, 0.01)
        };

        columns[AlterationEnrichmentTableColumnType.Q_VALUE] = {
            name: "q-Value",
            render: (d: AlterationEnrichmentRow) => <span style={{whiteSpace: 'nowrap'}}>{formatValueWithStyle(d.qValue)}</span>,
            tooltip: <span>Derived from Benjamini-Hochberg procedure</span>,
            sortBy: (d: AlterationEnrichmentRow) => d.qValue,
            download: (d: AlterationEnrichmentRow) => toConditionalPrecision(d.qValue, 3, 0.01)
        };

        columns[AlterationEnrichmentTableColumnType.TENDENCY] = {
            name: "Tendency",
            render: (d: AlterationEnrichmentRow) => <div className={styles.Tendency}>{calculateAlterationTendency(Number(d.logRatio))}
                {d.qValue < 0.05 ? <Badge style={{
                    backgroundColor: '#58ACFA', fontSize: 8, marginBottom: 2
                }}>Significant</Badge> : ""}</div>,
            tooltip: 
                <table>
                    <tr>
                        <td>Log ratio > 0</td>
                        <td>: Enriched in altered group</td>
                    </tr>
                    <tr>
                        <td>Log ratio &lt;= 0</td>
                        <td>: Enriched in unaltered group</td>
                    </tr>
                    <tr>
                        <td>q-Value &lt; 0.05</td>
                        <td>: Significant association</td>
                    </tr>
                </table>,
            filter: (d: AlterationEnrichmentRow, filterString: string, filterStringUpper: string) =>
                calculateAlterationTendency(Number(d.logRatio)).toUpperCase().includes(filterStringUpper),
            sortBy: (d: AlterationEnrichmentRow) => calculateAlterationTendency(Number(d.logRatio)),
            download: (d: AlterationEnrichmentRow) => calculateAlterationTendency(Number(d.logRatio))
        };

        return columns;
    }

    public render() {
        const orderedColumns = _.sortBy(this._columns, (c: AlterationEnrichmentTableColumn) => c.order);
        return (
            <AlterationEnrichmentTableComponent initialItemsPerPage={20} paginationProps={{ itemsPerPageOptions: [20] }}
                columns={orderedColumns} data={this.props.data} initialSortColumn={this.props.initialSortColumn} 
                onRowClick={this.onRowClick} dataStore={this.props.dataStore}/>
        );
    }
}
