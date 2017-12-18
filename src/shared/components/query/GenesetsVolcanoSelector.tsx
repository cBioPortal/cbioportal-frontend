import * as _ from 'lodash';
import * as React from 'react';
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import * as styles_any from './styles/styles.module.scss';
import {action, ObservableMap, expr, toJS, computed, observable, autorun} from "mobx";
import {observer, Observer} from "mobx-react";
import LazyMobXTable from "shared/components/lazyMobXTable/LazyMobXTable";
import {Geneset} from "../../api/generated/CBioPortalAPIInternal";
import {IColumnFormatterData} from "../enhancedReactTable/IColumnFormatter";
import {IColumnDefMap} from "../enhancedReactTable/IEnhancedReactTableProps";
import {Td} from 'reactable';
import {toPrecision} from "../../lib/FormatUtils";
import { getHierarchyData } from "shared/lib/StoreUtils";
import ReactSelect from "react-select";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import { VictoryChart, VictoryScatter, VictoryTheme, VictorySelectionContainer,
    VictoryAxis, VictoryLabel, VictoryLine } from 'victory';
import {QueryStoreComponent} from "./QueryStore";

const styles = styles_any as {
    GenesetsVolcanoSelectorWindow: string,
    selectButton: string,
    selectionColumnHeader: string,
    selectionColumnCell: string,
};

class GenesetsVolcanoTable extends LazyMobXTable<Geneset> {}

export interface GenesetsVolcanoSelectorProps
{
    initialSelection: string[];
    data: Geneset[]|undefined;
    plotData: {x: number, y: number, fill: string}[]|undefined;
    maxY: number|undefined;
    onSelect: (map_genesets_selected:ObservableMap<boolean>) => void;
}

@observer
export default class GenesetsVolcanoSelector extends QueryStoreComponent<GenesetsVolcanoSelectorProps, {plotData:{x: number, y: number, fill: string}[]}>
{
    readonly percentileOptions = [{label: '50%', value: '50'}, {label: '75%', value: '75'}, {label: '100%', value: '100'}];
    constructor(props:GenesetsVolcanoSelectorProps)
    {
        super(props);
        this.percentileChange = this.percentileChange.bind(this);
        this.updateSelectionFromPlot = this.updateSelectionFromPlot.bind(this);
    }
    
    percentileChange(val: {label: string, value: string} | null)
    {
        this.store.volcanoPlotSelectedPercentile = val || {label: '75%', value: '75'};
    }
    
    @action updateSelectionFromPlot(points: any, bounds: any) {
        const selectedPoints = points && points[0].data ? points[0].data : [];
        this.store.volcanoPlotTableData.result!.map(({representativeScore, representativePvalue, name}) => {
            const xValue = representativeScore;
            const yValue = -(Math.log(representativePvalue)/Math.log(10));
            for (const selectedPoint of selectedPoints) {
                if (selectedPoint.x === xValue && selectedPoint.y === yValue) {
                    this.store.map_genesets_selected_volcano.set(name, true);
                }
            }
        });
    }
    
    render()
    {
        return (
                <div className={styles.GenesetsVolcanoSelectorWindow} style={ {height:"400px"} }>
                <div style={{float: "left"}} className="form-inline">
                <label htmlFor="PercentileScoreCalculation">Percentile for score calculation:</label>
                <span style={{display: "inline-block", verticalAlign: "middle", marginLeft: "1em"}}>
                <ReactSelect
                    addLabelText="Percentile for score calculation"
                    style={{width:160, borderRadius: "2px"}}
                    clearable={false}
                    name="PercentileScoreCalculation"
                    value={this.store.volcanoPlotSelectedPercentile}
                    options={this.percentileOptions}
                    onChange={this.percentileChange}
                />
                </span>
                    <LoadingIndicator isLoading={!(this.props.plotData && this.props.maxY
                        && this.store.volcanoPlotTableData.isComplete && this.props.data)} />
                {  (this.store.volcanoPlotGraphData) && (this.store.maxYVolcanoPlot)
                    && (this.props.plotData) && (this.props.maxY)
                    && (this.store.volcanoPlotTableData.isComplete) && (this.props.data) && (
                <VictoryChart
                    theme={VictoryTheme.material}
                    width={510}
                    containerComponent={
                        <VictorySelectionContainer
                            onSelection={this.updateSelectionFromPlot}
                            selectionStyle={{
                                fill: "tomato", fillOpacity: 0.5,
                                stroke: "tomato", strokeWidth: 2
                              }}
                            />
                        }
                >
                <VictoryAxis crossAxis
                    domain={[-1, 1.25]}
                    tickValues={[-1, -0.5, 0, 0.5, 1]}
                    style={{axisLabel: {padding: 35}}}
                    label={"GSVA score"}
                    theme={VictoryTheme.material}
                    offsetY={50}
                    standalone={false}
                />
                <VictoryAxis dependentAxis crossAxis
                    domain={[0, this.props.maxY]}
                    style={{axisLabel: {padding: 35}, stroke: "none"}}
                    label={"-log10 p-value"}
                    theme={VictoryTheme.material}
                    offsetX={50}
                    standalone={false}
                />
                <VictoryLabel
                    text="significance ↑"
                    datum={{ x:1, y: 1.3}}
                    textAnchor="start"
                />
                <VictoryLine
                    style={{
                      data: { stroke: "black", strokeDasharray:5 },
                      parent: { border: "dotted 1px #f00"}
                    }}
                    data={[
                      { x: -1.2, y: 1.3 },
                      { x: 1, y: 1.3 }
                    ]}
                />
                <VictoryLine
                    style={{
                      data: { stroke: "rgb(144, 164, 174)" },
                      parent: { border: "1px dashed solid"}
                    }}
                    data={[
                      { x: 0, y: 0 },
                      { x: 0, y: this.props.maxY }
                    ]}
                />
                  <VictoryScatter
                      style={{data: {fillOpacity: 0.3}}}
                      size={3}
                      data={this.props.plotData}
                  />
                </VictoryChart>
                      )
                  }
                </div>
                <div style={{float: "right", maxHeight: "356.5px", overflowY: "scroll", width: "650px"}}>
                <LoadingIndicator isLoading={!(this.store.volcanoPlotTableData.isComplete && this.props.data)} />
                {  (this.store.volcanoPlotTableData.isComplete) && (this.props.data) && (
                <GenesetsVolcanoTable
                    data={this.props.data}
                    columns={
                        [
                            {
                                name: 'Gene Sets',
                                render: (data: Geneset) => <span>{data.name}</span>,
                                sortBy: (data: Geneset) => data.name,
                                filter: (data: Geneset, filterString: string, filterStringUpper: string) => {
                                   return data.name.toUpperCase().indexOf(filterStringUpper) > -1;
                                }
                            },
                            {
                                name: 'GSVA Score',
                                render: (data: Geneset) => <span>{data.representativeScore.toFixed(2)}</span>,
                                sortBy: (data: Geneset) => data.representativeScore
                            },
                            {
                                name: 'P Value',
                                render: (data: Geneset) => <span>{toPrecision(data.representativePvalue, 2, 0.1)}</span>,
                                sortBy: (data: Geneset) => data.representativePvalue
                            },
                            {
                                name: 'Selected',
                                render: (data:Geneset) => 
                                     (
                                            <LabeledCheckbox
                                                checked={!!this.store.map_genesets_selected_volcano.get(data.name)}
                                                onChange={event => (this.store.map_genesets_selected_volcano.set(data.name, event.target.checked)) }
                                            />
                                     )
                            }
                        ]
                    }
                    initialSortColumn="P Value"
                    initialSortDirection={'asc'}
                    showPagination={true}
                    initialItemsPerPage={10}
                    showColumnVisibility={false}
                    showFilter={true}
                    showCopyDownload={false}
                /> )
                }
                </div>
                <div style={{clear: "both"}}>
                {  (this.store.volcanoPlotTableData.isComplete) && (this.props.data) && (
                       <button style={{marginTop:-20}} 
                className="btn btn-primary btn-sm pull-right"
                onClick={() => this.props.onSelect(this.store.map_genesets_selected_volcano)}
                >
                    Add selection to the query
                </button>) }
                {  (this.store.volcanoPlotTableData.isComplete) && (this.props.data) && (
                        <button style={{marginTop:-20, marginRight:15}} 
                    className="btn btn-primary btn-sm pull-right"
                    onClick={() => (this.store.map_genesets_selected_volcano.replace(this.props.initialSelection.map(geneset => [geneset, true])))}
                    >
                        Clear selection
                    </button>
                        )}
                </div>
                </div>
        );
    }
}
