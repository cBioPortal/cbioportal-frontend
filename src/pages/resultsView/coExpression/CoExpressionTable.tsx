import * as React from "react";
import {CoExpression} from "../../../shared/api/generated/CBioPortalAPIInternal";
import {correlationColor, correlationSortBy} from "./CoExpressionTableUtils";
import LazyMobXTable from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import {ILazyMobXTableApplicationDataStore} from "../../../shared/lib/ILazyMobXTableApplicationDataStore";
import {CoExpressionDataStore, TableMode} from "./CoExpressionViz";
import Select from "react-select";
import {observer} from "mobx-react";
import {observable} from "mobx"
import {tableSearchInformation} from "./CoExpressionTabUtils";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";
import InfoIcon from "../../../shared/components/InfoIcon";
import {bind} from "bind-decorator";
import { cytobandFilter } from "pages/resultsView/ResultsViewTableUtils";
import {PotentialViewType} from "../plots/PlotsTab";
import {PLOT_SIDELENGTH} from "../plots/PlotsTabUtils";
import { toConditionalPrecision } from "shared/lib/NumberUtils";
import { formatSignificanceValueWithStyle } from "shared/lib/FormatUtils";

export interface ICoExpressionTableProps {
    referenceGene:{hugoGeneSymbol:string, cytoband:string};
    dataStore:CoExpressionDataStore;
    tableMode:TableMode;
    onSelectTableMode:(t:TableMode)=>void;
}

const SPEARMANS_CORRELATION_COLUMN_NAME = "Spearman's Correlation";
const P_VALUE_COLUMN_NAME = "p-Value";
const Q_VALUE_COLUMN_NAME = "q-Value";

const COLUMNS = [
    {
        name: "Correlated Gene",
        render: (d:CoExpression)=>(<span style={{fontWeight:"bold"}}>{d.hugoGeneSymbol}</span>),
        filter:(d:CoExpression, f:string, filterStringUpper:string)=>(d.hugoGeneSymbol.indexOf(filterStringUpper) > -1),
        download:(d:CoExpression)=>d.hugoGeneSymbol,
        sortBy:(d:CoExpression)=>d.hugoGeneSymbol,
        width:"30%"
    },
    {
        name:"Cytoband",
        render:(d:CoExpression)=>(<span>{d.cytoband}</span>),
        filter:cytobandFilter,
        download:(d:CoExpression)=>d.cytoband,
        sortBy:(d:CoExpression)=>d.cytoband,
        width:"30%"
    },
    makeNumberColumn(SPEARMANS_CORRELATION_COLUMN_NAME, "spearmansCorrelation", true, false),
    makeNumberColumn(P_VALUE_COLUMN_NAME, "pValue", false, false),
    Object.assign(makeNumberColumn(Q_VALUE_COLUMN_NAME, "qValue", false, true), {sortBy:(d:CoExpression) => [d.qValue, d.pValue]}),
];

function makeNumberColumn(name:string, key:keyof CoExpression, colorByValue:boolean, formatSignificance: boolean) {
    return {
        name:name,
        render:(d:CoExpression)=>{
            return (
                <span
                    style={{
                        color:(colorByValue ? correlationColor(d[key] as number) : "#000000"),
                        textAlign:"right",
                        float:"right",
                        whiteSpace:"nowrap"
                    }}
                >{formatSignificance? formatSignificanceValueWithStyle(d[key] as number) : toConditionalPrecision((d[key] as number), 3, 0.01)}</span>
            );
        },
        download:(d:CoExpression)=>(d[key] as number).toString()+"",
        sortBy:(d:CoExpression)=>correlationSortBy(d[key] as number),
        align: "right" as "right"
    };
}

@observer
export default class CoExpressionTable extends React.Component<ICoExpressionTableProps, {}> {

    @bind
    private onRowClick(d:CoExpression) {
        this.props.dataStore.setHighlighted(d);
    }

    @bind
    private onSelectTableMode(d:any) {
        this.props.onSelectTableMode(d.value);
    }

    private tableModeOptions = [
        {
            label: "Show Any Correlation",
            value: TableMode.SHOW_ALL
        },
        {
            label: "Show Only Positively Correlated",
            value: TableMode.SHOW_POSITIVE
        },
        {
            label: "Show Only Negatively Correlated",
            value: TableMode.SHOW_NEGATIVE
        }
    ];

    private paginationProps = {
        itemsPerPageOptions: [25]
    };

    render() {
        return (
            <div>
                <div
                    style={{float:"left", display:"flex", flexDirection:"row"}}
                >
                    <div style={{width:180}}>
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
                        style={{marginLeft:21, marginTop:"0.7em"}}
                        tooltip={<div style={{maxWidth:200}}>{tableSearchInformation}</div>}
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
                        showCopy: false
                    }}
                />
            </div>
        );
    }
}
