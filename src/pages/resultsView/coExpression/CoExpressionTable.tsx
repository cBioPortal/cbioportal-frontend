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

export interface ICoExpressionTableProps {
    referenceGene:{hugoGeneSymbol:string, cytoband:string};
    dataStore:CoExpressionDataStore;
    tableMode:TableMode;
    onSelectTableMode:(t:TableMode)=>void;
}

const SPEARMANS_CORRELATION_COLUMN_NAME = "Spearman's Correlation";

@observer
export default class CoExpressionTable extends React.Component<ICoExpressionTableProps, {}> {
    private get columns() {
        return [
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
            {
                name:"Pearson's Correlation",
                render:(d:CoExpression)=>{
                    return (
                        <span
                            style={{
                                color:correlationColor(d.pearsonsCorrelation),
                                textAlign:"right",
                                float:"right"
                            }}
                        >{d.pearsonsCorrelation.toFixed(2)}</span>
                    );
                },
                download:(d:CoExpression)=>d.pearsonsCorrelation+"",
                sortBy:(d:CoExpression)=>correlationSortBy(d.pearsonsCorrelation),
                align: "right" as "right"
            },
            {
                name:SPEARMANS_CORRELATION_COLUMN_NAME,
                render:(d:CoExpression)=>{
                    return (
                        <span
                            style={{
                                color:correlationColor(d.spearmansCorrelation),
                                textAlign:"right",
                                float:"right"
                            }}
                        >{d.spearmansCorrelation.toFixed(2)}</span>
                    );
                },
                download:(d:CoExpression)=>d.spearmansCorrelation+"",
                sortBy:(d:CoExpression)=>correlationSortBy(d.spearmansCorrelation),
                align: "right" as "right"
            }];
    }

    @bind
    private onRowClick(d:CoExpression) {
        this.props.dataStore.setHighlighted(d);
    }

    @bind
    private onSelectTableMode(d:any) {
        this.props.onSelectTableMode(d.value);
    }

    private get tableModeOptions() {
        return [
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
    }

    private get paginationProps() {
        return {
            itemsPerPageOptions: [25]
        }
    }

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
                    initialSortColumn={SPEARMANS_CORRELATION_COLUMN_NAME}
                    initialSortDirection="desc"
                    columns={this.columns}
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