import * as React from 'react';
import * as _ from "lodash";
import LazyMobXTable, { Column } from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import { observer } from "mobx-react";
import { computed } from "mobx";
import { Checkbox } from 'react-bootstrap';
import { formatSignificanceValueWithStyle } from "shared/lib/FormatUtils";
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import styles from "./styles.module.scss";
import { cytobandFilter } from 'pages/resultsView/ResultsViewTableUtils';
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import { CNA_COLOR_AMP, CNA_COLOR_HOMDEL } from 'shared/lib/Colors';

export interface IAlterationEnrichmentTableProps {
    visibleOrderedColumnNames?: string[];
    customColumns?:{[id:string]:AlterationEnrichmentTableColumn}
    data: AlterationEnrichmentRow[];
    initialSortColumn?: string;
    dataStore: EnrichmentsTableDataStore;
    onCheckGene?: (hugoGeneSymbol: string) => void;
    onGeneNameClick?: (hugoGeneSymbol: string) => void;
    checkedGenes?:string[];
}

export enum AlterationEnrichmentTableColumnType {
    GENE="GENE",
    CYTOBAND="CYTOBAND",
    ALTERATION="ALTERATION",
    P_VALUE="P_VALUE",
    Q_VALUE="Q_VALUE",
    LOG_RATIO="Log Ratio",
    TENDENCY="Tendency",
    ENRICHED="Enriched in",
    MOST_ENRICHED="Most enriched in"
}

const cnaToAlteration:{[cna:number]:string} = {
    "2": "Amp",
    "-2": "DeepDel"
};

export type AlterationEnrichmentTableColumn = Column<AlterationEnrichmentRow> & { order?: number };

@observer
export default class AlterationEnrichmentTable extends React.Component<IAlterationEnrichmentTableProps, {}> {

    public static defaultProps = {
        columns: [
            AlterationEnrichmentTableColumnType.GENE,
            AlterationEnrichmentTableColumnType.CYTOBAND,
            AlterationEnrichmentTableColumnType.P_VALUE,
            AlterationEnrichmentTableColumnType.Q_VALUE,
        ],
        initialSortColumn: "q-Value"
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

    @computed get columns():{ [columnEnum: string]: AlterationEnrichmentTableColumn } {
        const columns: { [columnEnum: string]: AlterationEnrichmentTableColumn } = this.props.customColumns || {};

        columns[AlterationEnrichmentTableColumnType.GENE] = {
            name: "Gene",
            render: (d: AlterationEnrichmentRow) => <div style={{ display: 'flex' }}>
                {this.props.onCheckGene && this.props.checkedGenes && (
                    <Checkbox checked={this.props.checkedGenes.includes(d.hugoGeneSymbol)}
                              disabled={d.disabled}
                              key={d.hugoGeneSymbol}
                              className={styles.Checkbox}
                              onChange={() => {
                                  this.checkboxChange(d.hugoGeneSymbol);
                              }}
                              onClick={(e)=>{
                                  e.stopPropagation();
                              }}
                              title={d.disabled ? "This is one of the query genes" : ""}
                    />
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
            render: (d: AlterationEnrichmentRow) => <span style={{ color: d.value! === 2 ? CNA_COLOR_AMP : CNA_COLOR_HOMDEL }}>{cnaToAlteration[d.value!]}</span>,
            tooltip: <span>Copy number alteration</span>,
            filter: (d: AlterationEnrichmentRow, filterString: string, filterStringUpper: string) =>
                cnaToAlteration[d.value!].toUpperCase().includes(filterStringUpper),
            sortBy: (d: AlterationEnrichmentRow) => cnaToAlteration[d.value!],
            download: (d: AlterationEnrichmentRow) => cnaToAlteration[d.value!]
        };

        columns[AlterationEnrichmentTableColumnType.P_VALUE] = {
            name: "p-Value",
            render: (d: AlterationEnrichmentRow) => <span style={{whiteSpace: 'nowrap'}}>{d.pValue ? toConditionalPrecision(d.pValue, 3, 0.01) : '-'}</span>,
            tooltip: <span>Derived from one-sided Fisher Exact Test</span>,
            sortBy: (d: AlterationEnrichmentRow) => Number(d.pValue),
            download: (d: AlterationEnrichmentRow) => d.pValue ? toConditionalPrecision(d.pValue, 3, 0.01) : '-'
        };

        columns[AlterationEnrichmentTableColumnType.Q_VALUE] = {
            name: "q-Value",
            render: (d: AlterationEnrichmentRow) => <span style={{whiteSpace: 'nowrap'}}>{d.qValue ? formatSignificanceValueWithStyle(d.qValue) : '-'}</span>,
            tooltip: <span>Derived from Benjamini-Hochberg procedure</span>,
            sortBy: (d: AlterationEnrichmentRow) => Number(d.qValue),
            download: (d: AlterationEnrichmentRow) => d.qValue ? toConditionalPrecision(d.qValue, 3, 0.01) : '-'
        };

        return columns;
    }

    public render() {
        const orderedColumns = _.sortBy(
            this.props.visibleOrderedColumnNames!.map(column=>this.columns[column]),
            (c: AlterationEnrichmentTableColumn) => c.order
        );
        return (
            <LazyMobXTable initialItemsPerPage={20} paginationProps={{ itemsPerPageOptions: [20] }}
                columns={orderedColumns} data={this.props.data} initialSortColumn={this.props.initialSortColumn} 
                onRowClick={this.props.onGeneNameClick ? this.onRowClick : undefined} dataStore={this.props.dataStore}/>
        );
    }
}
