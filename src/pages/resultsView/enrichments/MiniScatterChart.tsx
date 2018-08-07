import * as React from 'react';
import { observer } from "mobx-react";
import { VictoryChart, VictorySelectionContainer, VictoryAxis, VictoryLabel, VictoryScatter } from 'victory';
import { observable, action } from 'mobx';
import { Popover } from 'react-bootstrap';
import CBIOPORTAL_VICTORY_THEME, {axisLabelStyles} from "../../../shared/theme/cBioPoralTheme";
import { formatLogOddsRatio } from "./EnrichmentsUtil";
import { toConditionalPrecision, } from 'shared/lib/NumberUtils';
import DownloadControls from 'shared/components/downloadControls/DownloadControls';
import autobind from 'autobind-decorator';

export interface IMiniScatterChartProps {
    data: any[];
    xAxisLeftLabel: string;
    xAxisRightLabel: string;
    xAxisDomain: number;
    xAxisTickValues: number[]|null;
    onGeneNameClick: (hugoGeneSymbol: string, entrezGeneId: number) => void;
    onSelection: (hugoGeneSymbols: string[]) => void;
    onSelectionCleared: () => void;
}

@observer
export default class MiniScatterChart extends React.Component<IMiniScatterChartProps, {}> {

    @observable tooltipModel: any;
    @observable private svgContainer: any;
    
    @autobind
    @action private svgRef(svgContainer:SVGElement|null) {
        this.svgContainer = (svgContainer && svgContainer.children) ? svgContainer.children[0] : null;
    }

    private handleSelection(points: any, bounds: any, props: any) {
        this.props.onSelection(points[0].data.map((d:any) => d.hugoGeneSymbol));
    }

    private handleSelectionCleared(props: any) {
        if (this.tooltipModel) {
            this.props.onGeneNameClick(this.tooltipModel.datum.hugoGeneSymbol, this.tooltipModel.datum.entrezGeneId);
        }
        this.props.onSelectionCleared();
    }

    public render() {

        const events = [{
            target: "data",
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props: any) => {
                                this.tooltipModel = props;
                                return {
                                    datum: Object.assign({}, props.datum, {hovered: true})
                                };
                            }
                        }
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props: any) => {
                                this.tooltipModel = null;
                                return {
                                    datum: Object.assign({}, props.datum, {hovered: false})
                                };
                            }
                        }
                    ];
                }
            }
        }];

        return (
            <div className="posRelative">
                <div className="borderedChart inlineBlock" style={{position:"relative"}}>
                    <VictoryChart containerComponent={<VictorySelectionContainer containerRef={this.svgRef}
                        onSelection={(points: any, bounds: any, props: any) => this.handleSelection(points, bounds, props)} responsive={false}
                        onSelectionCleared={(props:any) => this.handleSelectionCleared(props)}/>} theme={CBIOPORTAL_VICTORY_THEME}
                        domainPadding={{ y: [0, 20] }} height={350} width={350} padding={{ top: 40, bottom: 60, left: 60, right: 40 }}>
                        <VictoryAxis tickValues={this.props.xAxisTickValues} domain={[-this.props.xAxisDomain, this.props.xAxisDomain]} 
                            label="Log Ratio" tickFormat={(t: any) => t >= 1000 || t <= -1000 ? `${t/1000}k` : t} style={{
                                tickLabels: { padding: 20 }, axisLabel: { padding: 40 },
                                ticks: { size: 0 }
                            }} />
                        <VictoryAxis label="-log10 p-Value" dependentAxis={true} tickCount={4}
                            style={{
                                tickLabels: { padding: 135 },
                                axisLabel: { padding: 165 },
                                ticks: { size: 0 }
                            }} />
                        <VictoryLabel style={axisLabelStyles} text={"← " + this.props.xAxisLeftLabel} x={60} y={300}/>
                        <VictoryLabel style={axisLabelStyles} text={this.props.xAxisRightLabel + " →"} x={200} y={300}/>
                        <VictoryLabel style={axisLabelStyles} text="Significance →" x={320} y={210} angle={-90}/>
                        <VictoryScatter style={{ data: { fill: (d:any, active: any) => active ? "#FE9929" : 
                            d.qValue < 0.05 ? "#58ACFA" : "#D3D3D3", fillOpacity: 0.4 } }} 
                            data={this.props.data} symbol="circle" size={(d: any) => d.hovered ? 10 : 3} events={events} />
                    </VictoryChart>
                    <DownloadControls
                        getSvg={() => this.svgContainer}
                        filename="enrichments-volcano"
                        dontFade={true}
                        collapse={true}
                        style={{position:"absolute", top:10, right:10}}
                    />
                </div>
                {this.tooltipModel &&
                    <Popover className={"cbioTooltip"} positionLeft={this.tooltipModel.x + 15}
                        positionTop={this.tooltipModel.y - 33}>
                        Gene: {this.tooltipModel.datum.hugoGeneSymbol}<br/>
                        Log Ratio: {formatLogOddsRatio(this.tooltipModel.datum.logRatio)}<br/>
                        p-Value: {toConditionalPrecision(this.tooltipModel.datum.y, 3, 0.01)}<br/>
                        q-Value: {toConditionalPrecision(this.tooltipModel.datum.qValue, 3, 0.01)}
                    </Popover>
                }
            </div>
        );
    }
}
