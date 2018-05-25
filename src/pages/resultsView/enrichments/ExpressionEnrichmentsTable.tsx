import * as React from 'react';
import * as _ from "lodash";
import LazyMobXTable, { Column } from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { Badge, Checkbox } from 'react-bootstrap';
import { calculateExpressionTendency, formatValueWithStyle, formatLogOddsRatio, 
    formatLogOddsRatioWithStyle } from "./EnrichmentsUtil";
import { toConditionalPrecision, } from 'shared/lib/NumberUtils';
import styles from "./styles.module.scss";
import { ExpressionEnrichmentRow } from 'shared/model/ExpressionEnrichmentRow';

export interface IExpressionEnrichmentTableProps {
    columns?: ExpressionEnrichmentTableColumnType[];
    data: ExpressionEnrichmentRow[];
    initialSortColumn?: string;
    onCheckGene: (hugoGeneSymbol: string) => void;
    onGeneNameClick: (hugoGeneSymbol: string, entrezGeneId: number) => void;
}

export enum ExpressionEnrichmentTableColumnType {
    GENE,
    CYTOBAND,
    MEAN_IN_ALTERED,
    MEAN_IN_UNALTERED,
    STANDARD_DEVIATION_IN_ALTERED,
    STANDARD_DEVIATION_IN_UNALTERED,
    LOG_RATIO,
    P_VALUE,
    Q_VALUE,
    TENDENCY
}

type ExpressionEnrichmentTableColumn = Column<ExpressionEnrichmentRow> & { order?: number, shouldExclude?: () => boolean };

export class ExpressionEnrichmentTableComponent extends LazyMobXTable<ExpressionEnrichmentRow> {
}

@observer
export default class ExpressionEnrichmentTable extends React.Component<IExpressionEnrichmentTableProps, {}> {

    @observable protected _columns: { [columnEnum: number]: ExpressionEnrichmentTableColumn };

    constructor(props: IExpressionEnrichmentTableProps) {
        super(props);
        this._columns = this.generateColumns();
    }

    public static defaultProps = {
        columns: [
            ExpressionEnrichmentTableColumnType.GENE,
            ExpressionEnrichmentTableColumnType.CYTOBAND,
            ExpressionEnrichmentTableColumnType.MEAN_IN_ALTERED,
            ExpressionEnrichmentTableColumnType.MEAN_IN_UNALTERED,
            ExpressionEnrichmentTableColumnType.STANDARD_DEVIATION_IN_ALTERED,
            ExpressionEnrichmentTableColumnType.STANDARD_DEVIATION_IN_UNALTERED,
            ExpressionEnrichmentTableColumnType.LOG_RATIO,
            ExpressionEnrichmentTableColumnType.P_VALUE,
            ExpressionEnrichmentTableColumnType.Q_VALUE,
            ExpressionEnrichmentTableColumnType.TENDENCY
        ],
        initialSortColumn: "q-Value"
    };

    private checkboxChange(hugoGeneSymbol: string) {
        const row: ExpressionEnrichmentRow = _.find(this.props.data, {hugoGeneSymbol})!;
        row.checked = !row.checked;
        this._columns = this.generateColumns();
        this.props.onCheckGene(hugoGeneSymbol);
    }

    private geneNameClick(hugoGeneSymbol: string, entrezGeneId: number) {
        this.props.onGeneNameClick(hugoGeneSymbol, entrezGeneId);
    }

    protected generateColumns(): { [columnEnum: number]: ExpressionEnrichmentTableColumn } {
        const columns: { [columnEnum: number]: ExpressionEnrichmentTableColumn } = {};

        columns[ExpressionEnrichmentTableColumnType.GENE] = {
            name: "Gene",
            render: (d: ExpressionEnrichmentRow) => <div style={{ display: 'flex' }}><Checkbox checked={d.checked} 
                disabled={d.disabled} key={d.hugoGeneSymbol} className={styles.Checkbox} 
                onChange={() => this.checkboxChange(d.hugoGeneSymbol)} title={d.disabled ? "This is one of the query genes" : ""} />
                <span className={styles.GeneName} onClick={() => this.geneNameClick(d.hugoGeneSymbol, d.entrezGeneId)}>
                <b>{d.hugoGeneSymbol}</b></span></div>,
            tooltip: <span>Gene</span>,
            filter: (d: ExpressionEnrichmentRow, filterString: string, filterStringUpper: string) =>
                d.hugoGeneSymbol.toUpperCase().includes(filterStringUpper),
            sortBy: (d: ExpressionEnrichmentRow) => d.hugoGeneSymbol,
            download: (d: ExpressionEnrichmentRow) => d.hugoGeneSymbol
        };

        columns[ExpressionEnrichmentTableColumnType.CYTOBAND] = {
            name: "Cytoband",
            render: (d: ExpressionEnrichmentRow) => <span>{d.cytoband}</span>,
            tooltip: <span>Cytoband</span>,
            filter: (d: ExpressionEnrichmentRow, filterString: string, filterStringUpper: string) => {
                if (d.cytoband) {
                    return d.cytoband.toUpperCase().includes(filterStringUpper);
                }
                return false;
            },
            sortBy: (d: ExpressionEnrichmentRow) => d.cytoband,
            download: (d: ExpressionEnrichmentRow) => d.cytoband
        };

        columns[ExpressionEnrichmentTableColumnType.MEAN_IN_ALTERED] = {
            name: "Mean expression in altered group",
            render: (d: ExpressionEnrichmentRow) => <span>{d.meanExpressionInAlteredGroup.toFixed(2)}</span>,
            headerRender: (name: string) => <span style={{ display: 'inline-block', width: 70 }}>{name}</span>,
            tooltip: <span>Mean of expression values in altered group</span>,
            sortBy: (d: ExpressionEnrichmentRow) => d.meanExpressionInAlteredGroup,
            download: (d: ExpressionEnrichmentRow) => d.meanExpressionInAlteredGroup.toFixed(2)
        };

        columns[ExpressionEnrichmentTableColumnType.MEAN_IN_UNALTERED] = {
            name: "Mean expression in unaltered group",
            render: (d: ExpressionEnrichmentRow) => <span>{d.meanExpressionInUnalteredGroup.toFixed(2)}</span>,
            headerRender: (name: string) => <span style={{ display: 'inline-block', width: 70 }}>{name}</span>,
            tooltip: <span>Mean of expression values in unaltered group</span>,
            sortBy: (d: ExpressionEnrichmentRow) => d.meanExpressionInUnalteredGroup,
            download: (d: ExpressionEnrichmentRow) => d.meanExpressionInUnalteredGroup.toFixed(2)
        };

        columns[ExpressionEnrichmentTableColumnType.STANDARD_DEVIATION_IN_ALTERED] = {
            name: "Standard deviation in altered group",
            render: (d: ExpressionEnrichmentRow) => <span>{d.standardDeviationInAlteredGroup.toFixed(2)}</span>,
            headerRender: (name: string) => <span style={{ display: 'inline-block', width: 70 }}>{name}</span>,
            tooltip: <span>Standard Deviation in altered group</span>,
            sortBy: (d: ExpressionEnrichmentRow) => d.standardDeviationInAlteredGroup,
            download: (d: ExpressionEnrichmentRow) => d.standardDeviationInAlteredGroup.toFixed(2)
        };

        columns[ExpressionEnrichmentTableColumnType.STANDARD_DEVIATION_IN_UNALTERED] = {
            name: "Standard deviation in unaltered group",
            render: (d: ExpressionEnrichmentRow) => <span>{d.standardDeviationInUnalteredGroup.toFixed(2)}</span>,
            headerRender: (name: string) => <span style={{ display: 'inline-block', width: 70 }}>{name}</span>,
            tooltip: <span>Standard Deviation in unaltered group</span>,
            sortBy: (d: ExpressionEnrichmentRow) => d.standardDeviationInUnalteredGroup,
            download: (d: ExpressionEnrichmentRow) => d.standardDeviationInUnalteredGroup.toFixed(2)
        };

        columns[ExpressionEnrichmentTableColumnType.LOG_RATIO] = {
            name: "Log Ratio",
            render: (d: ExpressionEnrichmentRow) => <span>{formatLogOddsRatioWithStyle(Number(d.logRatio))}</span>,
            tooltip: <span>Log2 based ratio of (pct in altered / pct in unaltered)</span>,
            sortBy: (d: ExpressionEnrichmentRow) => Number(d.logRatio),
            download: (d: ExpressionEnrichmentRow) => formatLogOddsRatio(Number(d.logRatio))
        };

        columns[ExpressionEnrichmentTableColumnType.P_VALUE] = {
            name: "p-Value",
            render: (d: ExpressionEnrichmentRow) => <span>{toConditionalPrecision(d.pValue, 3, 0.01)}</span>,
            tooltip: <span>Derived from Fisher Exact Test</span>,
            sortBy: (d: ExpressionEnrichmentRow) => d.pValue,
            download: (d: ExpressionEnrichmentRow) => toConditionalPrecision(d.pValue, 3, 0.01)
        };

        columns[ExpressionEnrichmentTableColumnType.Q_VALUE] = {
            name: "q-Value",
            render: (d: ExpressionEnrichmentRow) => <span>{formatValueWithStyle(d.qValue)}</span>,
            tooltip: <span>Derived from Benjamini-Hochberg procedure</span>,
            sortBy: (d: ExpressionEnrichmentRow) => d.qValue,
            download: (d: ExpressionEnrichmentRow) => toConditionalPrecision(d.qValue, 3, 0.01)
        };

        columns[ExpressionEnrichmentTableColumnType.TENDENCY] = {
            name: "Tendency",
            render: (d: ExpressionEnrichmentRow) => <span>{calculateExpressionTendency(Number(d.logRatio))}&nbsp;&nbsp;&nbsp;
                {d.qValue < 0.05 ? <Badge style={{
                    backgroundColor: '#58ACFA', fontSize: 8, marginBottom: 2
                }}>Significant</Badge> : ""}</span>,
            tooltip: <span>Log ratio > 0 &nbsp;&nbsp;: Over-expressed in altered group<br />
                Log ratio &lt;= 0 : Under-expressed in altered group<br />
                q-Value &lt; 0.05 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Significant association</span>,
            filter: (d: ExpressionEnrichmentRow, filterString: string, filterStringUpper: string) =>
                calculateExpressionTendency(Number(d.logRatio)).toUpperCase().includes(filterStringUpper),
            sortBy: (d: ExpressionEnrichmentRow) => calculateExpressionTendency(Number(d.logRatio)),
            download: (d: ExpressionEnrichmentRow) => calculateExpressionTendency(Number(d.logRatio))
        };

        return columns;
    }

    public render() {
        const orderedColumns = _.sortBy(this._columns, (c: ExpressionEnrichmentTableColumn) => c.order);
        return (
            <ExpressionEnrichmentTableComponent initialItemsPerPage={20} paginationProps={{ itemsPerPageOptions: [20] }}
                columns={orderedColumns} data={this.props.data} initialSortColumn={this.props.initialSortColumn} />
        );
    }
}
