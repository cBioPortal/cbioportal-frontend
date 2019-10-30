import * as React from "react";
import * as _ from 'lodash';
import { VictoryChart, VictoryLegend, VictoryScatter, VictoryAxis, VictoryLabel, VictoryStack, VictoryBar } from 'victory';
import {IAlterationCountMap, IAlterationData, ICancerSummaryChartData} from "./CancerSummaryContent";
import {observable, computed, action} from "mobx";
import {observer, Observer} from "mobx-react";
import {CSSProperties} from "react";
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import autobind from "autobind-decorator";
import DownloadControls from "../../../public-lib/components/downloadControls/DownloadControls";
import {adjustedLongestLabelLength} from "../../../shared/lib/VictoryChartUtils";
import classnames from "classnames";
import * as ReactDOM from "react-dom";
import WindowStore from "shared/components/window/WindowStore";
import { Popover } from "react-bootstrap";
import {pluralize} from "../../../public-lib/lib/StringUtils";
import { HORIZONTAL_OFFSET, VERTICAL_OFFSET } from "pages/studyView/charts/barChart/BarChartToolTip";
import { sleepUntil } from "shared/lib/TimeUtils";
import { If, Then, Else } from "react-if";
import { QueryParameter } from "shared/lib/ExtendedRouterStore";
import { PagePath } from "shared/enums/PagePaths";
import URL, {QueryParams} from 'url';
import { CANCER_SUMMARY_ALL_GENES } from "./CancerSummaryContainer";

interface CancerSummaryChartProps {
    colors: Record<keyof IAlterationCountMap, string>;
    alterationTypes: Record<keyof IAlterationCountMap, string>;
    data: {
        x: string,
        y: number,
        alterationType: string
    }[][];
    alterationTypeDataCounts: {
        x: string,
        y: string,
        profiledCount: number,
        notProfiledCount: number
    }[];
    countsByGroup:{[groupName:string]:IAlterationData};
    xLabels:string[];
    representedAlterations:{ [alterationType:string]:boolean };
    isPercentage:boolean;
    showLinks:boolean;
    hideGenomicAlterations?:boolean;
    gene: string;
};

export function percentageRounder(num:number){
    return _.round(num * 100, 2)
}

//TODO: refactor to use generic tooltip model
interface ITooltipModel {
    x:number,
    y:number,
    alterationData:IAlterationData,
    groupName:string,
    studyId:string,
}

export const HORIZONTAL_SCROLLING_THRESHOLD = 37;
const PLOT_DATA_PADDING_PIXELS = 20;

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

    @observable.ref private barPlotTooltipModel: ITooltipModel | null;
    @observable.ref private scatterPlotTooltipModel: any | null;

    @observable private barToolTipCounter = 0;
    @observable private isBarPlotTooltipHovered = false;
    @observable private shouldUpdatePosition = false; // Prevents chasing tooltip

    private svg: SVGElement;
    @observable mousePosition = { x:0, y:0 };

    constructor(props:CancerSummaryChartProps){
        super(props);
    }

    @autobind
    @action
    private tooltipMouseEnter(): void {
        this.isBarPlotTooltipHovered = true;
    }
    
    @autobind
    @action
    private tooltipMouseLeave(): void {       
        this.isBarPlotTooltipHovered = false;
        this.barPlotTooltipModel = null;
    }

    @computed get scatterPlotTooltipComponent() {
        if (!this.scatterPlotTooltipModel) {
            return null;
        } else {
            const profiledCount = this.scatterPlotTooltipModel.datum.profiledCount as number
            let tooltopMessage = "Not profiled";
            if(profiledCount > 0) {
                tooltopMessage = `${profiledCount} ${pluralize("sample", profiledCount)}  profiled`
            }
            const maxWidth = 400;
            let tooltipPlacement = (this.mousePosition.x > WindowStore.size.width-maxWidth ? "left" : "right");
            return (ReactDOM as any).createPortal(
                <Popover
                    arrowOffsetTop={VERTICAL_OFFSET}
                    className={classnames("cbioportal-frontend", "cbioTooltip")}
                    positionLeft={this.mousePosition.x+(tooltipPlacement === "left" ? - HORIZONTAL_OFFSET : HORIZONTAL_OFFSET)}
                    positionTop={this.mousePosition.y-VERTICAL_OFFSET}
                    style={{
                        transform: (tooltipPlacement === "left" ? "translate(-100%,0%)" : undefined),
                        maxWidth
                    }}
                    placement={tooltipPlacement}
                >
                    <div style={{ whiteSpace:"normal" }}>
                        {tooltopMessage}
                    </div>
                </Popover>,
                document.body
            );
        }
    }

    @computed get barPlotTooltipComponent() {
        if (!this.barPlotTooltipModel) {
            return null;
        } else {
            const tooltipModel = this.barPlotTooltipModel
            const maxWidth = 400;
            let tooltipPlacement = (this.mousePosition.x > WindowStore.size.width - maxWidth ? "left" : "right");

            return (ReactDOM as any).createPortal(
                <Popover
                    onMouseLeave={this.tooltipMouseLeave}
                    onMouseEnter={this.tooltipMouseEnter}
                    arrowOffsetTop={VERTICAL_OFFSET}
                    className={classnames("cbioportal-frontend", "cbioTooltip")}
                    positionLeft={this.mousePosition.x + (tooltipPlacement === "left" ? -HORIZONTAL_OFFSET : HORIZONTAL_OFFSET)}
                    positionTop={this.mousePosition.y - VERTICAL_OFFSET}
                    style={{
                        transform: (tooltipPlacement === "left" ? "translate(-100%,0%)" : undefined),
                        maxWidth
                    }}
                    placement={tooltipPlacement}
                >
                    <div>
                        <If condition={this.props.showLinks}>
                            <Then>
                                <strong>
                                    <a
                                        href={this.formatStudyLink(tooltipModel.studyId)}
                                        target="_blank"
                                    >
                                        {tooltipModel.groupName}
                                        &nbsp;
                                        <i
                                            className="fa fa-external-link"
                                            style={{fontWeight: "bold"}}
                                        />
                                    </a>
                                </strong>
                            </Then>
                            <Else>
                                <strong>Summary for {tooltipModel.groupName}</strong>
                            </Else>
                        </If>
                        <p>Gene altered in {percentageRounder(tooltipModel.alterationData.alteredSampleCount / tooltipModel.alterationData.profiledSampleTotal)}% of {tooltipModel.alterationData.profiledSampleTotal} cases</p>
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Alteration</th>
                                    <th>Frequency</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    _.reduce(this.props.alterationTypes, (memo, name: string, key: string) => {
                                        if (key in tooltipModel!.alterationData.alterationTypeCounts && (tooltipModel!.alterationData.alterationTypeCounts as any)[key] > 0) {
                                            const alterationCount = (tooltipModel!.alterationData.alterationTypeCounts as any)[key];
                                            memo.push((
                                                <tr>
                                                    <td>{name}</td>
                                                    <td>
                                                        {percentageRounder((tooltipModel!.alterationData.alterationTypeCounts as any)[key] / tooltipModel!.alterationData.profiledSampleTotal)}%
                                                ({alterationCount} {pluralize("case", alterationCount)})
                                            </td>
                                                </tr>
                                            ))
                                        }
                                        return memo;
                                    }, [] as JSX.Element[]).reverse()
                                }
                            </tbody>
                        </table>
                        <If condition={this.props.showLinks}>
                            <div
                                className="btn btn-primary btn-xs"
                                onClick={() => {this.queryStudy(tooltipModel.studyId)}}
                            >
                                Query this study
                                {this.props.gene == CANCER_SUMMARY_ALL_GENES ? "" : ` for ${this.props.gene}`}
                            </div>
                        </If>
                    </div>
                </Popover>,
                document.body
            );
        }
    }

    /**
     * Open a new tab with the same url, then change that url via update route
     * so that it is just for the one study.
     */
    private async queryStudy(studyId: string) {
        const studyWindow = window.open(window.location.href) as any

        if (studyWindow === null) {
            return;
        }

        await sleepUntil(()=>{
            return studyWindow.closed ||
                (studyWindow.globalStores && studyWindow.globalStores.appStore.appReady);
        });
        
        if (!studyWindow.closed) {
            const params: any = {[QueryParameter.CANCER_STUDY_LIST]: studyId};
            if (this.props.gene != CANCER_SUMMARY_ALL_GENES) {
                params[QueryParameter.GENE_LIST] = this.props.gene;
            }
            studyWindow.routingStore.updateRoute(params)
        }
    }

    private formatStudyLink(studyId: string): string {
        return URL.format({
            pathname: "/" + PagePath.Study,
            query: {id: studyId}
        });
    }

    @autobind
    @action
    private onMouseMove(e:React.MouseEvent<any>) {
        if (this.shouldUpdatePosition) {
            this.mousePosition.x = e.pageX;
            this.mousePosition.y = e.pageY;
        }
    }

    private get svgWidth(){
        return this.chartWidth + this.rightPadding + this.leftPadding;
    }

    private get chartWidth(){
        return (this.props.xLabels.length * (this.barWidth()+this.barSeparation())) + 100;
    }

    private get svgHeight(){
        return this.barChartHeight() + this.scatterChartHeight + this.bottomPadding - 100;
    }

    private get rightPadding(){
        return Math.max(200, this.legendWidth - this.chartWidth + 20);
    }

    private get legendWidth(){
        const legendItems = this.legendData.map((item)=>item.name);
        return (legendItems.join("").length * 6) + (legendItems.length * 40);
    }

    private get leftPadding(){
        return 50;
    }

    private get bottomPadding(){
        return adjustedLongestLabelLength(this.props.xLabels) * 5 + 40;
    }

    private barWidth() {
        return 20;
    }

    private barSeparation() {
        return 8;
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

    @autobind
    private tickFormat(){
        return (this.props.isPercentage) ? (tick:string) => `${tick}%` : (tick:string)=>tick;
    }
    /*
     * returns events configuration for Victory chart
     */
    private get barPlotEvents(){
        const self = this;
        return [{
            target: "data",
            eventHandlers: {
                onMouseEnter: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props:any) => {
                                self.shouldUpdatePosition = true;                                
                                if (props.datum.xKey in self.props.countsByGroup) {                                    
                                    self.barPlotTooltipModel = {
                                        ...props,
                                        groupName:props.datum.x,
                                        alterationData:self.props.countsByGroup[props.datum.xKey],
                                        studyId: props.datum.xKey,
                                    };
                                    self.barToolTipCounter++;
                                } else {
                                    self.barPlotTooltipModel = null;
                                }
                            }
                        }
                    ];
                },
                onMouseLeave: () => {
                    return [
                        {
                            target: "data",
                            mutation: () => {
                                // Freeze tool tip position and give user a moment to mouse over it
                                self.shouldUpdatePosition = false;
                                
                                setTimeout(() => {
                                    // If they don't, get rid of it
                                    if (!self.isBarPlotTooltipHovered && self.barToolTipCounter === 1) {
                                        self.barPlotTooltipModel = null;
                                    }
                                    self.barToolTipCounter--;
                                }, 100);                            }
                        }
                    ];
                }
            }
        }];
    }

    private get scatterPlotMouseEvents() {
        const self = this;
        return [{
            target: "data",
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props: any) => {
                                if (props.datum) {
                                    self.scatterPlotTooltipModel = props;
                                }
                            }
                        }
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: "data",
                            mutation: () => {
                                self.scatterPlotTooltipModel = null;
                            }
                        }
                    ];
                }
            }
        }];
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

    private domainPadding() {
        return PLOT_DATA_PADDING_PIXELS;
    }

    private categoryAxisDomainPadding() {
        return this.domainPadding();
    }

    private countAxisDomainPadding() {
        return this.domainPadding();
    }

    private chartDomainPadding() {
        return {
            y: this.countAxisDomainPadding(),
            x: this.categoryAxisDomainPadding()
        };
    }

    private barChartHeight() {
        return 400;
    }

    @computed get scatterChartHeight() {
        let miscPadding = 100; // specifying chart width in victory doesnt translate directly to the actual graph size
        const profiledDataTypesLength = _.uniqBy(this.scatterData, datum => datum.y).length;
        if (profiledDataTypesLength > 0) {
            return profiledDataTypesLength * (this.barWidth() + this.barSeparation()) + miscPadding;
        } else {
            return miscPadding;
        }
    }

    @computed get scatterPlotTopPadding() {
        // subtract 100 to plot scatter plot close to bar plot
        return this.barChartHeight() - 100;
    }

    @computed get scatterData() {
        return _.map(this.props.alterationTypeDataCounts, datum => {
            return {
                ...datum,
                symbol: datum.profiledCount > 0 ? "plus" : "minus"
            }
        });
    }

    @computed get barPlots() {
         // if we're not showing result broken down the alterations then we need to merge
        // data across alterations (and hide legend down below)
        const alterationData =  (this.props.hideGenomicAlterations) ?
        [mergeAlterationDataAcrossAlterationTypes(this.props.data)] : this.props.data

        return alterationData.map((data: any, i: number) => {
            return <VictoryBar style={{ data: { width: this.barWidth } }} events={this.barPlotEvents} data={data} key={i} />;
        })
    }

    @autobind private getChart() {
        return (
            <div style={this.overflowStyle} className="borderedChart">
                <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                    <svg
                        style={{
                            width: this.svgWidth,
                            height: this.svgHeight,
                            pointerEvents: "all"
                        }}
                        height={this.svgHeight}
                        width={this.svgWidth}
                        role="img"
                        viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                        ref={(ref: any) => this.svg = ref}
                        onMouseMove={this.onMouseMove}
                    >
                        <g transform={`translate(${this.leftPadding}, 0)`} >
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                width={this.chartWidth}
                                height={this.barChartHeight()}
                                standalone={false}
                                domainPadding={this.chartDomainPadding()}
                                singleQuadrantDomainPadding={{
                                    y: true,
                                    x: false
                                }}
                            >
                                <VictoryAxis dependentAxis
                                    axisLabelComponent={<VictoryLabel dy={-50} />}
                                    label={this.yAxisLabel}
                                    tickFormat={this.tickFormat}
                                    offsetX={50}
                                    orientation="left"
                                />

                                <VictoryAxis
                                    tickValues={this.props.xLabels}
                                    style={{
                                        ticks: { size: 0, strokeWidth: 0 },
                                        tickLabels: { fontSize: 0 },
                                        grid: { stroke: 0 },
                                    }}
                                />

                                <VictoryStack
                                    colorScale={this.colorArray}
                                >
                                    {this.barPlots}
                                </VictoryStack>
                                {
                                    // we're not showing alterations, so we don't need legend
                                    (!this.props.hideGenomicAlterations) && (
                                        <VictoryLegend x={10} y={this.svgHeight - 30}
                                            orientation="horizontal"
                                            data={this.legendData}
                                        />)
                                }
                            </VictoryChart>
                        </g>

                        <g transform={`translate(${this.leftPadding}, ${this.scatterPlotTopPadding})`} >
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                width={this.chartWidth}
                                height={this.scatterChartHeight}
                                standalone={false}
                                domainPadding={this.chartDomainPadding()}
                                singleQuadrantDomainPadding={{
                                    y: true,
                                    x: false
                                }}
                            >
                                <VictoryAxis
                                    orientation="bottom"
                                    crossAxis={false}
                                    tickValues={this.props.xLabels}
                                    style={{
                                        axis: { strokeWidth: 0 },
                                        ticks: { size: 0, strokeWidth: 0 },
                                        grid: {
                                            stroke: 0
                                        }
                                    }}
                                    tickLabelComponent={
                                        <VictoryLabel
                                            angle={50}
                                            verticalAnchor="start"
                                            textAnchor="start"
                                        />
                                    }
                                />

                                <VictoryAxis
                                    orientation="left"
                                    dependentAxis
                                    crossAxis={false}
                                    style={{
                                        axis: { strokeWidth: 0 },
                                        ticks: { size: 0, strokeWidth: 0 },
                                        grid: {
                                            stroke: 0
                                        }
                                    }}
                                />

                                <VictoryScatter
                                    size={this.barWidth() / 5}
                                    style={{
                                        data: {
                                            fill: "black",
                                            cursor: (d: any) => d.cursor
                                        }
                                    }}
                                    data={this.scatterData}
                                    events={this.scatterPlotMouseEvents}
                                />
                            </VictoryChart>
                        </g>
                    </svg>

                </div>
                <DownloadControls
                    getSvg={() => this.svg}
                    filename="cancer_types_summary"
                    dontFade={true}
                    type='button'
                    style={{ position: "absolute", top: 10, right: 10 }}
                />
            </div>)

    }

    render() {
        return (
            <div data-test="cancerTypeSummaryChart">
                <Observer>
                    {this.getChart}
                </Observer>
                {this.scatterPlotTooltipComponent}
                {this.barPlotTooltipComponent}
            </div>
        );
    }
}

