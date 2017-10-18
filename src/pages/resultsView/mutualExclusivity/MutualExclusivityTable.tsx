import * as React from 'react';
import * as _ from "lodash";
import LazyMobXTable, {Column} from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import {MutualExclusivity} from "../../../shared/model/MutualExclusivity";
import {observer} from "mobx-react";
import {observable} from "mobx";
import {Badge} from 'react-bootstrap';

export interface IMutualExclusivityTableProps {
    columns?: MutualExclusivityTableColumnType[];
    data: MutualExclusivity[];
    initialSortColumn?:string;
}

export enum MutualExclusivityTableColumnType {
    GENE_A,
    GENE_B,
    P_VALUE,
    LOG_ODDS_RATIO,
    ASSOCIATION
}

type MutualExclusivityTableColumn = Column<MutualExclusivity>&{order?:number, shouldExclude?:()=>boolean};

export class MutualExclusivityTableComponent extends LazyMobXTable<MutualExclusivity> {
}

export function formatPValue(pValue: number): string {
    return pValue < 0.001 ? "<0.001" : pValue.toFixed(3);
}

export function formatPValueWithStyle(pValue: number): JSX.Element {

    let formattedPValue = <span>{formatPValue(pValue)}</span>;
    if (pValue < 0.05) {
        formattedPValue = <b>{formattedPValue}</b>;
    }
    return formattedPValue;
}

export function formatLogOddsRatio(logOddsRatio: number): string {

    if (logOddsRatio < -3) {
        return "<-3";
    } else if (logOddsRatio > 3) {
        return ">3";
    }
    return logOddsRatio.toFixed(3);
}

@observer
export default class MutualExclusivityTable extends React.Component<IMutualExclusivityTableProps, {}> {

    @observable protected _columns:{[columnEnum:number]:MutualExclusivityTableColumn};

    constructor(props:IMutualExclusivityTableProps)
    {
        super(props);
        this._columns = {};
        this.generateColumns();
    }

    public static defaultProps = {
        columns: [
            MutualExclusivityTableColumnType.GENE_A,
            MutualExclusivityTableColumnType.GENE_B,
            MutualExclusivityTableColumnType.P_VALUE,
            MutualExclusivityTableColumnType.LOG_ODDS_RATIO,
            MutualExclusivityTableColumnType.ASSOCIATION
        ],
        initialSortColumn: "p-Value"
    };

    protected generateColumns() {
        this._columns = {};

        this._columns[MutualExclusivityTableColumnType.GENE_A] = {
            name: "Gene A",
            render: (d:MutualExclusivity)=><span><b>{d.geneA}</b></span>,
            tooltip: <span>Gene A</span>,
            filter: (d:MutualExclusivity, filterString:string, filterStringUpper:string) =>
                d.geneA.toUpperCase().includes(filterStringUpper),
            sortBy:(d:MutualExclusivity)=>d.geneA,
            download:(d:MutualExclusivity)=>d.geneA
        };

        this._columns[MutualExclusivityTableColumnType.GENE_B] = {
            name: "Gene B",
            render: (d:MutualExclusivity)=><span><b>{d.geneB}</b></span>,
            tooltip: <span>Gene B</span>,
            filter: (d:MutualExclusivity, filterString:string, filterStringUpper:string) =>
                d.geneB.toUpperCase().includes(filterStringUpper),
            sortBy:(d:MutualExclusivity)=>d.geneB,
            download:(d:MutualExclusivity)=>d.geneB
        };

        this._columns[MutualExclusivityTableColumnType.P_VALUE] = {
            name: "p-Value",
            render: (d:MutualExclusivity)=> formatPValueWithStyle(d.pValue),
            tooltip: <span>Derived from Fisher Exact Test</span>,
            sortBy:(d:MutualExclusivity)=>d.pValue,
            download:(d:MutualExclusivity)=>formatPValue(d.pValue)
        };

        this._columns[MutualExclusivityTableColumnType.LOG_ODDS_RATIO] = {
            name: "Log Odds Ratio",
            render: (d:MutualExclusivity)=><span>{formatLogOddsRatio(d.logOddsRatio)}</span>,
            tooltip: <span style={{display:'inline-block', maxWidth:300}}>Quantifies how strongly the presence or
                absence of alterations in gene A are associated with the presence or absence of alterations in gene B in
                the selected tumors.</span>,
            sortBy:(d:MutualExclusivity)=>d.logOddsRatio,
            download:(d:MutualExclusivity)=>formatLogOddsRatio(d.logOddsRatio)
        };

        this._columns[MutualExclusivityTableColumnType.ASSOCIATION] = {
            name: "Association",
            render: (d:MutualExclusivity)=><span>{d.association}&nbsp;&nbsp;&nbsp;{d.pValue < 0.05 ?
                <Badge style={{backgroundColor: '#58ACFA'}}>Significant</Badge> : "" }</span>,
            tooltip: <span>Log odds ratio > 0 &nbsp;&nbsp;: Tendency towards co-occurrence<br/>
                Log odds ratio &lt;= 0 : Tendency towards mutual exclusivity<br/>
                p-Value &lt; 0.05 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Significant association</span>,
            filter: (d:MutualExclusivity, filterString:string, filterStringUpper:string) =>
                d.association.toUpperCase().includes(filterStringUpper),
            sortBy:(d:MutualExclusivity)=>d.association,
            download:(d:MutualExclusivity)=>d.association
        };
    }

    public render()
    {
        const orderedColumns = _.sortBy(this._columns, (c:MutualExclusivityTableColumn)=>c.order);
        return (
            <MutualExclusivityTableComponent columns={orderedColumns} data={this.props.data}
                                             initialSortColumn={this.props.initialSortColumn}/>
        );
    }
}
