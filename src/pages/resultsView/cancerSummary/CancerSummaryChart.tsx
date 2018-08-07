import * as React from "react";
import * as _ from 'lodash';
import { VictoryChart, VictoryTheme, VictoryLegend, VictoryContainer, VictoryAxis, VictoryLabel, VictoryStack, VictoryBar } from 'victory';
import {IAlterationCountMap, IAlterationData, ICancerSummaryChartData} from "./CancerSummaryContent";
import {observable} from "mobx";
import {observer} from "mobx-react";
import {CSSProperties} from "react";
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import autobind from "autobind-decorator";
import DownloadControls from "../../../shared/components/downloadControls/DownloadControls";

interface CancerSummaryChartProps {
    colors: Record<keyof IAlterationCountMap, string>;
    alterationTypes: Record<keyof IAlterationCountMap, string>;
    data:any;
    countsByGroup:{[groupName:string]:IAlterationData};
    xLabels:string[];
    representedAlterations:{ [alterationType:string]:boolean };
    isPercentage:boolean;
    hideGenomicAlterations?:boolean;
};

function percentageRounder(num:number){
    return _.round(num * 100, 2)
}

//TODO: refactor to use generic tooltip model
interface ITooltipModel {
    x:number,
    y:number,
    alterationData:IAlterationData,
    groupName:string
}

export const HORIZONTAL_SCROLLING_THRESHOLD = 37;

export function mergeAlterationDataAcrossAlterationTypes(alterationData:ICancerSummaryChartData["data"]){

    // first get the group types
    const groupTypes = alterationData[0].map((item)=>item.x);

    // now we want to sum up the alteration rate/count across alteration types for this group
    const merged = alterationData.reduce((memo, alterationTypeGroups)=>{
        alterationTypeGroups.forEach((item)=>{
            memo[item.x] = memo[item.x] || 0;
            memo[item.x] += item.y;
        });
        return memo;
    }, {} as { [groupKey:string]:number });

    // we want an array of one
    return groupTypes.map((groupType)=>{
        return { x:groupType, y:merged[groupType], alterationType:'whatever' };
    });

}


@observer
export class CancerSummaryChart extends React.Component<CancerSummaryChartProps,{}> {

    private hideTooltipTimeout:any;
    @observable.ref private tooltipModel: ITooltipModel | null;
    public svgContainer = HTMLElement;
    private scrollPane: HTMLDivElement;

    constructor(){
        super();
        this.tickFormat = this.tickFormat.bind(this);
    }

    @autobind
    private getSvg() {
        // can't see to find type that has children collection
        return (this.svgContainer as any).children[0];
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
        return (legendItems.join("").length * 6) + (legendItems.length * 40);
    }

    private get legendX(){
        return 20;
    }

    private get leftPadding(){
        return 80;
    }

    private get bottomPadding(){
        return this.longestXLabelLength! * 7 + 40;
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
           const capitalizedLetters = label.match(/[A-Z]/g) || [];
           const undercaseLetters = label.match(/[a-z]/g) || [];
           const spaces = label.match(/\s/g) || [];
           return (capitalizedLetters.length * 2) + (undercaseLetters.length * 1) + (spaces.length * 2);
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
                                if (props.datum.xKey in self.props.countsByGroup) {
                                    self.tooltipModel = {
                                        x:props.x + 20 - this.scrollPane.scrollLeft,
                                        y:props.y - 18,
                                        groupName:props.datum.x,
                                        alterationData:self.props.countsByGroup[props.datum.xKey]
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
                                self.hideTooltip();
                            }
                        }
                    ];
                }
            }
        }];
    }

    buildTooltip(tooltipModel: ITooltipModel){

        return (
            <div className="popover cbioTooltip right"
                 onMouseLeave={()=>this.hideTooltip()}
                 style={{top:tooltipModel.y, left:tooltipModel!.x}}
            >
                <div className="arrow" style={{top:30}}></div>
                <div className="popover-content">
                    <strong>Summary for {tooltipModel.groupName}</strong>
                    <p>Gene altered in {percentageRounder(tooltipModel.alterationData.alteredSampleCount/tooltipModel.alterationData.sampleTotal)}% of {tooltipModel.alterationData.sampleTotal} cases</p>
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
                                    const alterationCount = (tooltipModel!.alterationData.alterationTypeCounts as any)[key];
                                    memo.push((
                                        <tr>
                                            <td>{name}</td>
                                            <td>
                                                {percentageRounder((tooltipModel!.alterationData.alterationTypeCounts as any)[key]/tooltipModel!.alterationData.sampleTotal)}%
                                                ({alterationCount} {(alterationCount === 1) ? 'case' : 'cases'})
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

        // if we're not showing result broken down the alterations then we need to merge
        // data across alterations (and hide legend down below)
        const alterationData = (this.props.hideGenomicAlterations) ?
            [mergeAlterationDataAcrossAlterationTypes(this.props.data)] : this.props.data

        return (
            <div data-test="cancerTypeSummaryChart">
                <div style={this.overflowStyle} className="borderedChart">
                    <div ref={(el:HTMLDivElement)=>this.scrollPane=el} style={{overflowX:'auto', overflowY:'hidden'}}>
                    {
                        (this.tooltipModel) && (this.buildTooltip(this.tooltipModel))
                    }
                    <VictoryChart width={this.width} height={this.height} theme={CBIOPORTAL_VICTORY_THEME}
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
                            {alterationData.map((data: any, i:number) => {
                                return <VictoryBar style={{data:{ width:this.barWidth }}} events={this.userEvents} data={data} key={i}/>;
                            })}
                        </VictoryStack>
                        {
                            // we're not showing alterations, so we don't need legend
                            (!this.props.hideGenomicAlterations) && (
                                <VictoryLegend x={10} y={this.height - 30}
                                    orientation="horizontal"
                                    data={this.legendData}
                            />)
                        }
                    </VictoryChart>
                    </div>
                    <DownloadControls
                        getSvg={this.getSvg}
                        filename="cancer_types_summary"
                        dontFade={true}
                        collapse={true}
                        style={{position:"absolute", top:10, right:10}}
                    />
                </div>
            </div>
        );
    }
}

