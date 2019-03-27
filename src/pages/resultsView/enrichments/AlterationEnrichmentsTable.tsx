import * as React from 'react';
import * as _ from "lodash";
import LazyMobXTable, { Column } from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import { observer } from "mobx-react";
import {computed, observable} from "mobx";
import { Badge, Checkbox } from 'react-bootstrap';
import {
    calculateAlterationTendency, calculateExpressionTendency, calculateGenericTendency, formatPercentage
} from "./EnrichmentsUtil";
import { formatLogOddsRatio, formatSignificanceValueWithStyle } from "shared/lib/FormatUtils";
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import styles from "./styles.module.scss";
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import { cytobandFilter } from 'pages/resultsView/ResultsViewTableUtils';
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';
import classNames from "classnames";

export interface IAlterationEnrichmentTableProps {
    columns?: AlterationEnrichmentTableColumnType[];
    group1Name:string;
    group2Name:string;
    group1Description:string;
    group2Description:string;
    data: AlterationEnrichmentRow[];
    initialSortColumn?: string;
    alterationType: string;
    dataStore: EnrichmentsTableDataStore;
    onCheckGene?: (hugoGeneSymbol: string) => void;
    onGeneNameClick?: (hugoGeneSymbol: string) => void;
    mutexTendency?:boolean;
}

export enum AlterationEnrichmentTableColumnType {
    GENE,
    CYTOBAND,
    ALTERATION,
    PERCENTAGE_IN_GROUP1,
    PERCENTAGE_IN_GROUP2,
    LOG_RATIO,
    P_VALUE,
    Q_VALUE,
    TENDENCY
}

const cnaToAlteration:{[cna:number]:string} = {
    "2": "Amplification",
    "-2": "Deep Deletion"
};

type AlterationEnrichmentTableColumn = Column<AlterationEnrichmentRow> & { order?: number, shouldExclude?: () => boolean };

export class AlterationEnrichmentTableComponent extends LazyMobXTable<AlterationEnrichmentRow> {
}

@observer
export default class AlterationEnrichmentTable extends React.Component<IAlterationEnrichmentTableProps, {}> {

    public static defaultProps = {
        columns: [
            AlterationEnrichmentTableColumnType.GENE,
            AlterationEnrichmentTableColumnType.CYTOBAND,
            AlterationEnrichmentTableColumnType.PERCENTAGE_IN_GROUP1,
            AlterationEnrichmentTableColumnType.PERCENTAGE_IN_GROUP2,
            AlterationEnrichmentTableColumnType.LOG_RATIO,
            AlterationEnrichmentTableColumnType.P_VALUE,
            AlterationEnrichmentTableColumnType.Q_VALUE,
            AlterationEnrichmentTableColumnType.TENDENCY
        ],
        initialSortColumn: "q-Value",
        mutexTendency:true
    };

    private checkboxChange(hugoGeneSymbol: string) {
        const row: AlterationEnrichmentRow = _.find(this.props.data, {hugoGeneSymbol})!;
        row.checked = !row.checked;
        this.props.onCheckGene!(hugoGeneSymbol);
    }

    @autobind
    private onRowClick(d: AlterationEnrichmentRow) {
        this.props.onGeneNameClick!(d.hugoGeneSymbol);
        this.props.dataStore.setHighlighted(d);
    }

    @computed get columns():{ [columnEnum: number]: AlterationEnrichmentTableColumn } {
        const columns: { [columnEnum: number]: AlterationEnrichmentTableColumn } = {};

        columns[AlterationEnrichmentTableColumnType.GENE] = {
            name: "Gene",
            render: (d: AlterationEnrichmentRow) => <div style={{ display: 'flex' }}>
                {this.props.onCheckGene && (<Checkbox checked={d.checked}
                    disabled={d.disabled} key={d.hugoGeneSymbol} className={styles.Checkbox}
                    onChange={() => this.checkboxChange(d.hugoGeneSymbol)} title={d.disabled ? "This is one of the query genes" : ""} />
                )}
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

        columns[AlterationEnrichmentTableColumnType.ALTERATION] = {
            name: "Alteration",
            render: (d: AlterationEnrichmentRow) => <span>{cnaToAlteration[d.value!]}</span>,
            tooltip: <span>Copy number alteration</span>,
            filter: (d: AlterationEnrichmentRow, filterString: string, filterStringUpper: string) =>
                cnaToAlteration[d.value!].toUpperCase().includes(filterStringUpper),
            sortBy: (d: AlterationEnrichmentRow) => cnaToAlteration[d.value!],
            download: (d: AlterationEnrichmentRow) => cnaToAlteration[d.value!]
        };

        columns[AlterationEnrichmentTableColumnType.PERCENTAGE_IN_GROUP1] = {
            name: `In ${this.props.group1Name}`,
            render: (d: AlterationEnrichmentRow) => <span>{formatPercentage(d.alteredCount, d.alteredPercentage)}</span>,
            tooltip: <span>Number (percentage) of samples {this.props.group1Description}</span>,
            sortBy: (d: AlterationEnrichmentRow) => d.alteredCount,
            download: (d: AlterationEnrichmentRow) => formatPercentage(d.alteredCount, d.alteredPercentage)
        };

        columns[AlterationEnrichmentTableColumnType.PERCENTAGE_IN_GROUP2] = {
            name: `In ${this.props.group2Name}`,
            render: (d: AlterationEnrichmentRow) => <span>{formatPercentage(d.unalteredCount, d.unalteredPercentage)}</span>,
            tooltip: <span>Number (percentage) of samples {this.props.group2Description}</span>,
            sortBy: (d: AlterationEnrichmentRow) => d.unalteredCount,
            download: (d: AlterationEnrichmentRow) => formatPercentage(d.unalteredCount, d.unalteredPercentage)
        };

        columns[AlterationEnrichmentTableColumnType.LOG_RATIO] = {
            name: "Log Ratio",
            render: (d: AlterationEnrichmentRow) => <span>{formatLogOddsRatio(d.logRatio)}</span>,
            tooltip: <span>Log2 based ratio of (pct in {this.props.group1Name}/ pct in {this.props.group2Name})</span>,
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
            render: (d: AlterationEnrichmentRow) => <span style={{whiteSpace: 'nowrap'}}>{formatSignificanceValueWithStyle(d.qValue)}</span>,
            tooltip: <span>Derived from Benjamini-Hochberg procedure</span>,
            sortBy: (d: AlterationEnrichmentRow) => d.qValue,
            download: (d: AlterationEnrichmentRow) => toConditionalPrecision(d.qValue, 3, 0.01)
        };

        columns[AlterationEnrichmentTableColumnType.TENDENCY] = {
            name: this.props.mutexTendency ? "Tendency" : "Enriched in",
            render: (d: AlterationEnrichmentRow) => <div className={classNames(styles.Tendency, {[styles.Significant]:(d.qValue < 0.05)})}>
                {this.props.mutexTendency ? calculateAlterationTendency(Number(d.logRatio)) : calculateGenericTendency(Number(d.logRatio), this.props.group1Name, this.props.group2Name)}
                </div>,
            tooltip: 
                <table>
                    <tr>
                        <td>Log ratio > 0</td>
                        <td>: Enriched in {this.props.group1Name}</td>
                    </tr>
                    <tr>
                        <td>Log ratio &lt;= 0</td>
                        <td>: Enriched in {this.props.group2Name}</td>
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
        const orderedColumns = _.sortBy(
            this.props.columns!.map(column=>this.columns[column]),
            (c: AlterationEnrichmentTableColumn) => c.order
        );
        return (
            <AlterationEnrichmentTableComponent initialItemsPerPage={20} paginationProps={{ itemsPerPageOptions: [20] }}
                columns={orderedColumns} data={this.props.data} initialSortColumn={this.props.initialSortColumn} 
                onRowClick={this.props.onGeneNameClick ? this.onRowClick : undefined} dataStore={this.props.dataStore}/>
        );
    }
}
