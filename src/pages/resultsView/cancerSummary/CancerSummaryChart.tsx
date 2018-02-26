import * as React from "react";
import * as _ from 'lodash';
import { VictoryChart, VictoryTheme, VictoryLegend, VictoryContainer, VictoryAxis, VictoryLabel, VictoryStack, VictoryBar } from 'victory';
import {Popover} from 'react-bootstrap';
import {IAlterationCountMap, IAlterationData} from "./CancerSummaryContent";
import {observable} from "mobx";
import {observer} from "mobx-react";
import Timer = NodeJS.Timer;
import {testIt} from "../../../shared/lib/writeTest";
import {CSSProperties} from "react";

interface CancerSummaryChartProps {
    colors: Record<keyof IAlterationCountMap, string>;
    alterationTypes: Record<keyof IAlterationCountMap, string>;
    data:any;
    countsByGroup:{[groupName:string]:IAlterationData};
    xLabels:string[];
    representedAlterations:{ [alterationType:string]:boolean };
    isPercentage:boolean;
};

function percentageRounder(num:number){
    return _.round(num * 100, 2)
}

interface ITooltipModel {
    x:number,
    y:number,
    alterationData:IAlterationData,
    groupName:string
}

export const HORIZONTAL_SCROLLING_THRESHOLD = 37;

@observer
export class CancerSummaryChart extends React.Component<CancerSummaryChartProps,{}> {

    private hideTooltipTimeout:any;
    @observable.ref private tooltipModel: ITooltipModel | null;
    public svgContainer = HTMLElement;

    constructor(){
        super();
        this.tickFormat = this.tickFormat.bind(this);
    }

    private get width(){
        return this.bodyWidth + this.rightPadding + this.leftPadding;
    }

    private get bodyWidth(){
        return (this.props.xLabels.length * (this.barWidth+8));
    }

    private get rightPadding(){
        if (this.bodyWidth > this.legendWidth) {
            return 20;
        } else {
            return this.legendWidth - this.bodyWidth + 20;
        }
    }

    private get height(){
        return 300 + this.bottomPadding;
    }

    private get legendWidth(){
        const legendItems = this.legendData.map((item)=>item.name);
        return (legendItems.join("").length * 4) + (legendItems.length * 40);
    }

    private get legendX(){
        return 20;
    }

    private get leftPadding(){
        return 80;
    }

    private get bottomPadding(){
        return this.longestXLabelLength! * 6;
    }

    private get topPadding(){
        return 20;
    }

    private get barWidth() {
        return 20
    }

    private get colorArray():string[] {
        return _.map(this.props.alterationTypes, (val:string, key:string)=>{
            return (this.props.colors as any)[key];
        });
    }

    get legendData(){
        const legendData = _.reduce(this.props.alterationTypes,(memo, alterationName, alterationType)=>{
            if (alterationType in this.props.representedAlterations) {
                memo.push({
                    name:alterationName,
                    symbol: { fill: (this.props.colors as any)[alterationType] }
                })
            }
            return memo;
        }, [] as { name:string, symbol: { fill:string } }[])
        return legendData.reverse();
    }

    private get yAxisLabel(){
        return (this.props.isPercentage) ? "Alteration Frequency" : "Absolute Counts";
    }

    private get longestXLabelLength(){

        const adjustedForCaps = this.props.xLabels.map((label)=>{
           const capitalizedLetters = label.match(/[A-Z]/g);
           return label.length + ((capitalizedLetters) ? (capitalizedLetters.length * 3) : 0 );
        });

        return _.max(adjustedForCaps);

    }

    private tickFormat(){
        return (this.props.isPercentage) ? (tick:string) => `${tick}%` : (tick:string)=>tick;
    }

    private hideTooltip(){
        this.tooltipModel = null;
    }

    /*
     * returns events configuration for Victory chart
     */
    private get userEvents(){
        const self = this;
        return [{
            target: "data",
            eventHandlers: {
                onMouseEnter: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props:any) => {
                                console.log(props.x, props.y);
                                if (self.hideTooltipTimeout) {
                                    clearTimeout(self.hideTooltipTimeout);
                                }
                                if (props.datum.x in self.props.countsByGroup) {
                                    self.tooltipModel = {
                                        x:props.x,
                                        y:props.y,
                                        groupName:props.datum.x,
                                        alterationData:self.props.countsByGroup[props.datum.x]
                                    };
                                } else {
                                    self.hideTooltip();
                                }
                            }
                        }
                    ];
                },
                onMouseLeave: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props:any) => {
                                self.hideTooltipTimeout = setTimeout(()=>{
                                    self.hideTooltip();
                                },200);
                            }
                        }
                    ];
                }
            }
        }];
    }

    buildTooltip(tooltipModel: ITooltipModel){

        return (
            <div className="popover right"
                 onMouseLeave={()=>this.hideTooltip()}
                 onMouseEnter={()=>clearTimeout(this.hideTooltipTimeout)}
                 style={{display:'block', position:'absolute', top:tooltipModel.y, maxWidth:'auto', left:tooltipModel!.x}}
            >
                <div className="arrow"></div>
                <div className="popover-content">
                    <strong>Summary for {tooltipModel.groupName}</strong>
                    <p>Gene altered in {percentageRounder(tooltipModel.alterationData.alteredSampleCount/tooltipModel.alterationData.sampleTotal)}% of cases</p>
                    <table className="table table-striped">
                        <thead>
                        <tr>
                            <th>Alteration</th>
                            <th>Frequency</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            _.reduce(this.props.alterationTypes,(memo, name:string, key:string)=>{
                                if (key in tooltipModel!.alterationData.alterationTypeCounts && (tooltipModel!.alterationData.alterationTypeCounts as any)[key] > 0) {
                                    memo.push((
                                        <tr>
                                            <td>{name}</td>
                                            <td>
                                                {percentageRounder((tooltipModel!.alterationData.alterationTypeCounts as any)[key]/tooltipModel!.alterationData.sampleTotal)}%
                                                ({(tooltipModel!.alterationData.alterationTypeCounts as any)[key]} cases)
                                            </td>
                                        </tr>
                                    ))
                                }
                                return memo;
                            },[] as JSX.Element[]).reverse()
                        }
                        </tbody>
                    </table>
                </div>
            </div>

        )

    }

    /*
     * if we have more than threshold of bars (groups) we need to do horizontal scrolling
     */
    get overflowStyle():CSSProperties {
        return {
            position:'relative',
            display:'inline-block',
            width: (this.props.xLabels.length > HORIZONTAL_SCROLLING_THRESHOLD) ? '100%' : 'auto'
        };
    }

    render() {
        return (
            <div data-test="cancerTypeSummaryChart">
                <div style={this.overflowStyle} className="borderedChart">
                    <div style={{overflowX:'auto', overflowY:'hidden'}}>
                    {
                        (this.tooltipModel) && (this.buildTooltip(this.tooltipModel))
                    }
                    <VictoryChart width={this.width} height={this.height} theme={VictoryTheme.material}
                                  padding={{bottom:this.bottomPadding, top:this.topPadding, left:this.leftPadding, right:this.rightPadding }} domainPadding={{x: 20, y: 20}}
                                  containerComponent={<VictoryContainer containerRef={(ref: any) => this.svgContainer = ref} responsive={false}/>}
                    >
                        <VictoryAxis dependentAxis
                                     axisLabelComponent={<VictoryLabel dy={-50} />}
                                     label={this.yAxisLabel}
                                     tickFormat={this.tickFormat}
                        />
                        <VictoryAxis
                            tickFormat={this.props.xLabels}
                            tickLabelComponent={
                                <VictoryLabel
                                    angle={-85}
                                    verticalAnchor="middle"
                                    textAnchor="end"
                                />
                            }

                        />
                        <VictoryStack
                            colorScale={this.colorArray}
                        >
                            {this.props.data.map((data: any, i:number) => {
                                return <VictoryBar style={{data:{ width:this.barWidth }}} events={this.userEvents} data={data} key={i}/>;
                            })}
                        </VictoryStack>
                        <VictoryLegend x={10} y={this.height - 30}
                                       orientation="horizontal"
                                       data={this.legendData}
                        />

                    </VictoryChart>
                    </div>
                </div>
            </div>
        );
    }
}

