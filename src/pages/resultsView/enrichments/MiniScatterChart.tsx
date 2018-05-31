import * as React from 'react';
import { observer } from "mobx-react";
import { VictoryChart, VictorySelectionContainer, VictoryTheme, VictoryAxis, VictoryLabel, VictoryScatter, VictoryLine } from 'victory';
import { observable } from 'mobx';
import { Popover } from 'react-bootstrap';
import styles from "./styles.module.scss";
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";

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
                                return { active: true };
                            }
                        }
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: "data",
                            mutation: () => {
                                this.tooltipModel = null;
                                return { active: false };
                            }
                        }
                    ];
                }
            }
        }];

        return (
            <div className="posRelative">
                <div className="borderedChart" style={{ marginRight: 8, marginTop: 8 }}>
                    <VictoryChart containerComponent={<VictorySelectionContainer responsive={false}
                        onSelection={(points: any, bounds: any, props: any) => this.handleSelection(points, bounds, props)} 
                        onSelectionCleared={(props:any) => this.handleSelectionCleared(props)}/>} theme={CBIOPORTAL_VICTORY_THEME}
                        domainPadding={{ y: [0, 20] }} height={350} width={350} padding={{ top: 40, bottom: 60, left: 60, right: 40 }}>
                        <VictoryAxis tickValues={this.props.xAxisTickValues} domain={[-this.props.xAxisDomain, this.props.xAxisDomain]} 
                            label="log Ratio" style={{
                                tickLabels: { padding: 20, fill: "black" }, axisLabel: { padding: 40, fill: "black", fontSize: 16 },
                                axis: { stroke: "black", strokeWidth: 1 }, grid: { stroke: "#eeeeee", strokeDasharray: "none" }, ticks: { size: 0 }
                            }} />
                        <VictoryAxis label="-log10 q-Value" dependentAxis={true} tickCount={4}
                            style={{
                                tickLabels: { padding: 135, fill: "black" }, axisLabel: { padding: 165, fill: "black", fontSize: 16 },
                                axis: { stroke: "black", strokeWidth: 1 }, grid: { stroke: "#eeeeee", strokeDasharray: "none" }, ticks: { size: 0 }
                            }} />
                        <VictoryLabel text={"← " + this.props.xAxisLeftLabel} x={60} y={300} 
                            style={{ fill: "blue", fontSize: 12, fontFamily: "Arial, Helvetica" }} />
                        <VictoryLabel text={this.props.xAxisRightLabel + " →"} x={200} y={300} 
                            style={{ fill: "red", fontSize: 12, fontFamily: "Arial, Helvetica" }} />
                        <VictoryLabel text="significance →" x={320} y={210} angle={-90} 
                            style={{ fontSize: 16, fontFamily: "Arial, Helvetica" }} />
                        <VictoryScatter style={{ data: { fill: "#58ACFA", fillOpacity: 0.4 } }} data={this.props.data} symbol="circle"
                            size={(datum: any, active: any) => active ? 10 : 3} events={events} />
                        <VictoryLine data={[{x: -this.props.xAxisDomain, y: -Math.log10(0.05)}, {x:this.props.xAxisDomain, y: -Math.log10(0.05)}]} 
                            style={{ data: {strokeWidth: 1, strokeDasharray: "3,3"}}}/>
                    </VictoryChart>
                </div>
                {this.tooltipModel &&
                    <Popover className={styles.ScatterTooltip} positionLeft={this.tooltipModel.x + 15} 
                        positionTop={this.tooltipModel.y - 3}>
                        {this.tooltipModel.datum.hugoGeneSymbol}
                    </Popover>
                }
            </div>
        );
    }
}
