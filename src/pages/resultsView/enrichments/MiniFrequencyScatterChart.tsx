import * as React from "react";
import {observer} from "mobx-react";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {VictoryAxis, VictoryChart, VictoryLabel, VictoryScatter, VictorySelectionContainer, VictoryLine} from "victory";
import CBIOPORTAL_VICTORY_THEME, {axisLabelStyles} from "../../../shared/theme/cBioPoralTheme";
import DownloadControls from "../../../shared/components/downloadControls/DownloadControls";
import {Popover} from "react-bootstrap";
import {formatLogOddsRatio} from "../../../shared/lib/FormatUtils";
import {toConditionalPrecision} from "../../../shared/lib/NumberUtils";

export interface IMiniFrequencyScatterChartData {
    x:number;
    y:number;
    pValue:number;
    qValue:number;
    hugoGeneSymbol:string;
    logRatio:number;
}

export interface IMiniFrequencyScatterChartProps {
    data: IMiniFrequencyScatterChartData[]; // x means percent in x group, y means percent in y group
    xGroupName:string;
    yGroupName:string;
    onGeneNameClick: (hugoGeneSymbol: string, entrezGeneId: number) => void;
    onSelection: (hugoGeneSymbols: string[]) => void;
    onSelectionCleared: () => void;
}

const MAX_DOT_SIZE = 10;

@observer
export default class MiniFrequencyScatterChart extends React.Component<IMiniFrequencyScatterChartProps, {}> {

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

    @computed get xLabel() {
        return `Alteration Frequency in ${this.props.xGroupName} (%)`;
    }

    @computed get yLabel() {
        return `Alteration Frequency in ${this.props.yGroupName} (%)`;
    }

    /*@computed get size() {
        const leastSignificantQ = 0.2;
        const leastSignificantSize = 1;
        const mostSignificantSize = 5;
        const mostSignificantQ = 0.01;

        // coefficients derived to fit f(x) = ae^bx so that f(least significant Q) = least significant size, f(most significant Q) = most significant size
        const a = leastSignificantSize;
        const b = (Math.log(mostSignificantSize) - Math.log(leastSignificantSize)) / (mostSignificantQ - leastSignificantQ);

        return (d:IMiniFrequencyScatterChartData)=>{
            // first clamp the input
            let q = d.qValue;
            if (q > leastSignificantQ) {
                q = leastSignificantQ;
            } else if (q < mostSignificantQ) {
                q = mostSignificantQ;
            }

            return a * Math.exp(b * (q - leastSignificantQ));
        };
    }*/

    @computed get splitData() {
        const significant = [];
        const insignificant = [];
        for (const d of this.props.data) {
            if (d.qValue < 0.05) {
                significant.push(d);
            } else {
                insignificant.push(d);
            }
        }
        return { significant, insignificant };
    }

    @computed get plotDomainMax() {
        let maxX = 0;
        let maxY = 0;
        for (const d of this.props.data) {
            maxX = Math.max(maxX, d.x);
            maxY = Math.max(maxY, d.y);
        }
        return Math.max(maxX, maxY);
    }

    private get containerComponent() {
        return (
            <VictorySelectionContainer
                containerRef={this.svgRef}
                onSelection={(points: any, bounds: any, props: any) => {
                    return this.handleSelection(points, bounds, props);
                }}
                responsive={false}
                onSelectionCleared={(props:any) => this.handleSelectionCleared(props)}
            />
        );
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
                    <VictoryChart containerComponent={this.containerComponent} theme={CBIOPORTAL_VICTORY_THEME}
                                  domainPadding={20} height={350} width={350} padding={{ top: 40, bottom: 60, left: 60, right: 40 }}>
                        <VictoryAxis tickValues={[0,25,50,75]} domain={[0,this.plotDomainMax]}
                                     label={this.xLabel}
                                     style={{
                                        tickLabels: { padding: 5 }, axisLabel: { padding: 20 },
                                        ticks: { size: 0 }
                                     }}
                        />
                        <VictoryAxis tickValues={[0,25,50,75]} domain={[0,this.plotDomainMax]}
                                     dependentAxis={true}
                                     label={this.yLabel}
                                     style={{
                                         tickLabels: { padding: 5 }, axisLabel: { padding: 20 },
                                         ticks: { size: 0 }
                                     }}
                        />
                        <VictoryLine
                            style={{
                                data: {
                                    stroke: "#cccccc", strokeWidth: 1, strokeDasharray:"10,5"
                                }
                            }}
                            data={[{x:0, y:0},{x:this.plotDomainMax, y:this.plotDomainMax}]}
                        />
                        <VictoryScatter
                            style={{
                                data: {
                                    fill: (d:any, active: any) => (active ? "#FE9929" : "#D3D3D3"),
                                    fillOpacity: 0.4
                                }
                            }}
                            data={this.splitData.insignificant}
                            symbol="circle"
                            size={3}
                            events={events}
                        />
                        <VictoryScatter
                            style={{
                                data: {
                                    fill: (d:any, active: any) => (active ? "#FE9929" : "#58ACFA"),
                                    fillOpacity: 0.6
                                }
                            }}
                            data={this.splitData.significant}
                            symbol="circle"
                            size={3}
                            events={events}
                        />
                    </VictoryChart>
                    <DownloadControls
                        getSvg={() => this.svgContainer}
                        filename="enrichments-frequency-scatter"
                        dontFade={true}
                        collapse={true}
                        style={{position:"absolute", top:10, right:10, zIndex:0}}
                    />
                </div>
                {this.tooltipModel &&
                    <Popover className={"cbioTooltip"} positionLeft={this.tooltipModel.x + 15}
                             positionTop={this.tooltipModel.y - 44}>
                        Gene: {this.tooltipModel.datum.hugoGeneSymbol}<br/>
                        Log Ratio: {formatLogOddsRatio(this.tooltipModel.datum.logRatio)}<br/>
                        Alteration Frequency in {this.props.xGroupName}: {this.tooltipModel.datum.x.toFixed()}%<br/>
                        Alteration Frequency in {this.props.yGroupName}: {this.tooltipModel.datum.y.toFixed()}%<br/>
                        p-Value: {toConditionalPrecision(this.tooltipModel.datum.pValue, 3, 0.01)}<br/>
                        q-Value: {toConditionalPrecision(this.tooltipModel.datum.qValue, 3, 0.01)}
                    </Popover>
                }
            </div>
        );
    }
}