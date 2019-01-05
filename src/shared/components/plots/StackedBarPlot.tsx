import * as React from "react";
import {Observer, observer} from "mobx-react";
import {IStringAxisData} from "../../../pages/resultsView/plots/PlotsTabUtils";
import {computed, observable} from "mobx";
import {bind} from "bind-decorator";
import CBIOPORTAL_VICTORY_THEME, {axisTickLabelStyles} from "../../theme/cBioPoralTheme";
import {getTextWidth} from "../../lib/wrapText";
import autobind from "autobind-decorator";
import _ from "lodash";
import {VictoryAxis, VictoryBar, VictoryChart, VictoryLabel, VictoryStack, VictoryLegend} from "victory";
import Timer = NodeJS.Timer;
import {tickFormatNumeral} from "./TickUtils";
import {makeUniqueColorGetter} from "./PlotUtils";
import {stringListToIndexSet} from "../../lib/StringUtils";
import ScatterPlotTooltip from "./ScatterPlotTooltip";

export interface IStackedBarPlotProps {
    svgId?:string;
    domainPadding?:number;
    horzData:IStringAxisData["data"];
    vertData:IStringAxisData["data"];
    categoryToColor?:{[cat:string]:string};
    barWidth:number;
    chartBase:number;
    horizontalBars?:boolean;
    horzCategoryOrder?:string[];
    vertCategoryOrder?:string[];
    axisLabelX?: string;
    axisLabelY?: string;
    legendLocationWidthThreshold?: number;
}

const RIGHT_GUTTER = 120; // room for legend
const NUM_AXIS_TICKS = 8;
const PLOT_DATA_PADDING_PIXELS = 100;
const CATEGORY_LABEL_HORZ_ANGLE = 50;
const DEFAULT_LEFT_PADDING = 25;
const DEFAULT_BOTTOM_PADDING = 10;
const LEGEND_ITEMS_PER_ROW = 4;
const BOTTOM_LEGEND_PADDING = 15;
const RIGHT_PADDING_FOR_LONG_LABELS = 50;
const COUNT_AXIS_LABEL = "# samples";

@observer
export default class StackedBarPlot extends React.Component<IStackedBarPlotProps, {}> {
    @observable.ref tooltipModel:any|null = null;
    @observable pointHovered:boolean = false;
    private mouseEvents:any = this.makeMouseEvents();

    @observable.ref private container:HTMLDivElement;

    @bind
    private containerRef(container:HTMLDivElement) {
        this.container = container;
    }

    @computed get getColor() {
        const uniqueColorGetter = makeUniqueColorGetter(_.values(this.props.categoryToColor));
        const categoryToColor:{[category:string]:string} = {};
        _.forEach(this.props.categoryToColor, (color, category)=>{
            categoryToColor[category.toLowerCase()] = color;
        });
        return function(category:string) {
            category = category.toLowerCase();
            if (!(category in categoryToColor)) {
                categoryToColor[category] = uniqueColorGetter();
            }
            return categoryToColor[category];
        };
    }

    private makeMouseEvents() {
        let disappearTimeout:Timer | null = null;
        const disappearDelayMs = 250;

        return [{
            target: "data",
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props: any) => {
                                this.tooltipModel = props;
                                this.pointHovered = true;

                                if (disappearTimeout !== null) {
                                    clearTimeout(disappearTimeout);
                                    disappearTimeout = null;
                                }

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
                                if (disappearTimeout !== null) {
                                    clearTimeout(disappearTimeout);
                                }

                                disappearTimeout = setTimeout(()=>{
                                    this.pointHovered = false;
                                }, disappearDelayMs);

                                return { active: false };
                            }
                        }
                    ];
                }
            }
        }];
    }

    @computed get chartWidth() {
        if (this.props.horizontalBars) {
            return this.props.chartBase;
        } else {
            return this.chartExtent;
        }
    }

    @computed get chartHeight() {
        if (this.props.horizontalBars) {
            return this.chartExtent;
        } else {
            return this.props.chartBase;
        }
    }

    @computed get sideLegendX() {
        return this.chartWidth - 20;
    }

    @computed get legendLocation() {
        if (this.props.legendLocationWidthThreshold !== undefined &&
            this.chartWidth > this.props.legendLocationWidthThreshold) {
            return "bottom";
        } else {
            return "right";
        }
    }

    @computed get bottomLegendHeight() {
        //height of legend in case its on bottom
        if (this.legendData.length === 0) {
            return 0;
        } else {
            const numRows = Math.ceil(this.legendData.length / LEGEND_ITEMS_PER_ROW);
            return 23.7*numRows;
        }
    }

    @computed get legendData() {
        return this.data.map(obj=>({
            name: obj.minorCategory,
            symbol:{
                type: "square",
                fill: this.getColor(obj.minorCategory),
                strokeOpacity: 0,
                size: 5
            }
        }));
    }

    private get legend() {
        if (this.legendData.length > 0) {
            return (
                <VictoryLegend
                    orientation={this.legendLocation === "right" ? "vertical" : "horizontal"}
                    itemsPerRow={this.legendLocation === "right" ? undefined : LEGEND_ITEMS_PER_ROW}
                    rowGutter={this.legendLocation === "right" ? undefined : -5}
                    data={this.legendData}
                    x={this.legendLocation === "right" ? this.sideLegendX : 0}
                    y={this.legendLocation === "right" ? 100 : this.svgHeight-this.bottomLegendHeight}
                />
            );
        } else {
            return null;
        }
    }

    @computed get data():{ minorCategory:string, counts:{majorCategory:string, count:number}[], total:number}[] {
        let majorCategoryData:IStringAxisData["data"];
        let minorCategoryData:IStringAxisData["data"];
        let majorCategoryOrder:string[] | undefined;
        let minorCategoryOrder:string[] | undefined;
        if (this.props.horizontalBars) {
            majorCategoryData = this.props.vertData;
            minorCategoryData = this.props.horzData;

            majorCategoryOrder = this.props.vertCategoryOrder;
            minorCategoryOrder = this.props.horzCategoryOrder;
        } else {
            majorCategoryData = this.props.horzData;
            minorCategoryData = this.props.vertData;

            majorCategoryOrder = this.props.horzCategoryOrder;
            minorCategoryOrder = this.props.vertCategoryOrder;
        }
        const sampleToMinorCategories:{[sampleKey:string]:string[]} = _.chain(minorCategoryData)
            .keyBy("uniqueSampleKey")
            .mapValues(d=>([] as any).concat(d.value))
            .value();

        const usedMajorCategories:any = {};
        const usedMinorCategories:any = {};
        const categoryToCounts:{[minor:string]:{[major:string]:number}} = {};
        for (const d of majorCategoryData) {
            const minorCategories = sampleToMinorCategories[d.uniqueSampleKey];
            if (!minorCategories) {
                continue;
            }
            const majorCategories = ([] as any).concat(d.value);
            for (const cat of minorCategories) {
                categoryToCounts[cat] = categoryToCounts[cat] || {};
                usedMinorCategories[cat] = true;
                for (const countCat of majorCategories) {
                    usedMajorCategories[countCat] = true;
                    categoryToCounts[cat][countCat] = categoryToCounts[cat][countCat] || 0;
                    categoryToCounts[cat][countCat] += 1;
                }
            }
        }
        // ensure entries for all used minor categories - we need 0 entries for those major/minor combos we didnt see
        _.forEach(usedMajorCategories, (z, major)=>{
            _.forEach(categoryToCounts, majorCounts=>{
                majorCounts[major] = majorCounts[major] || 0;
            });
        });

        /* uncomment this section to ensure entries for categories specified in props
        // first minor (this matters to make sure everythings covered, bc of the nesting order of categoryToCounts)
        if (minorCategoryOrder) {
            for (const cat of minorCategoryOrder) {
                categoryToCounts[cat] = categoryToCounts[cat] || {};
            }
        }
        // then major
        if (majorCategoryOrder) {
            for (const cat of majorCategoryOrder) {
                _.forEach(categoryToCounts, majorCounts=>{
                    majorCounts[cat] = majorCounts[cat] || 0;
                });
            }
        }*/

        // turn counts into data
        // sort if category order is specified
        const majorCategoryIndex = majorCategoryOrder ? stringListToIndexSet(majorCategoryOrder) : undefined;
        const minorCategoryIndex = minorCategoryOrder ? stringListToIndexSet(minorCategoryOrder) : undefined;
        let data = _.map(categoryToCounts, (countsMap:{[majorCategory:string]:number}, minorCategory:string)=>{
            let counts = _.map(countsMap, (count, majorCategory)=>({
                majorCategory, count
            }));
            if (majorCategoryIndex) {
                // sort
                counts = _.sortBy(counts, obj=>{
                    if (obj.majorCategory in majorCategoryIndex) {
                        return majorCategoryIndex[obj.majorCategory];
                    } else {
                        return Number.POSITIVE_INFINITY;
                    }
                });
            }
            const total = _.sumBy(counts, "count");
            return {
                minorCategory,
                counts, total
            };
        });
        if (minorCategoryIndex) {
            data = _.sortBy(data, obj=>{
                if (obj.minorCategory in minorCategoryIndex) {
                    return minorCategoryIndex[obj.minorCategory];
                } else {
                    return Number.POSITIVE_INFINITY;
                }
            });
        }
        return data;
    }

    @computed get maxMajorCount() {
        const majorCategoryCounts:{[major:string]:number} = {};
        for (const d of this.data) {
            for (const c of d.counts) {
                majorCategoryCounts[c.majorCategory] = majorCategoryCounts[c.majorCategory] || 0;
                majorCategoryCounts[c.majorCategory] += c.count;
            }
        }
        return _.chain(majorCategoryCounts).values().max().value() as number;
    }

    @computed get plotDomain() {
        // data domain is 0 to max num samples
        let x:number[], y:number[];
        const countDomain:number[] = [0, this.maxMajorCount];
        let categoryDomain:number[];
        if (this.data.length > 0) {
            categoryDomain = [this.categoryCoord(0), this.categoryCoord(Math.max(1, this.data[0].counts.length - 1))];
        } else {
            categoryDomain = [0,0];
        }
        if (this.props.horizontalBars) {
            x = countDomain;
            y = categoryDomain;
        } else {
            x = categoryDomain;
            y = countDomain;
        }
        return { x, y };
    }

    @computed get categoryAxisDomainPadding() {
        // padding needs to be at least half a box width plus a bit
        return Math.max(this.barWidth/2 + 30, this.domainPadding);
    }

    @computed get countAxisDomainPadding() {
        return this.domainPadding;
    }

    @computed get domainPadding() {
        if (this.props.domainPadding === undefined) {
            return PLOT_DATA_PADDING_PIXELS;
        } else {
            return this.props.domainPadding;
        }
    }

    @computed get countAxis():"x"|"y" {
        if (this.props.horizontalBars) {
            return "x";
        } else {
            return "y";
        }
    }

    @computed get categoryAxis():"x"|"y" {
        if (this.props.horizontalBars) {
            return "y";
        } else {
            return "x";
        }
    }

    @computed get chartDomainPadding() {
        return {
            [this.countAxis]:this.countAxisDomainPadding,
            [this.categoryAxis]:this.categoryAxisDomainPadding
        };
    }

    @computed get chartExtent() {
        const miscPadding = 100; // specifying chart width in victory doesnt translate directly to the actual graph size
        const numBars = this.data.length;
        return this.categoryCoord(numBars - 1) + 2*this.categoryAxisDomainPadding + miscPadding;
        //return 2*this.domainPadding + numBoxes*this.barWidth + (numBoxes-1)*this.barSeparation;
        //const ret = Math.max(computedExtent, this.props.chartBase);
        //return ret;
    }

    @computed get svgWidth() {
        return this.leftPadding + this.chartWidth + this.rightPadding;
    }

    @computed get svgHeight() {
        return this.topPadding + this.chartHeight + this.bottomPadding;
    }

    @computed get barSeparation() {
        return 0.5*this.barWidth;
    }

    @computed get barWidth() {
        return this.props.barWidth || 10;
    }

    @computed get labels() {
        if (this.data.length > 0) {
            return this.data[0].counts.map(x=>x.majorCategory);
        } else {
            return [];
        }
    }

    @bind
    private formatCategoryTick(t:number, index:number) {
        //return wrapTick(this.labels[index], MAXIMUM_CATEGORY_LABEL_SIZE);
        return this.labels[index];
    }

    @bind
    private formatNumericalTick(t:number, i:number, ticks:number[]) {
        return tickFormatNumeral(t, ticks);
    }

    @computed get horzAxis() {
        // several props below are undefined in horizontal mode, thats because in horizontal mode
        //  this axis is for numbers, not categories
        const label = [this.props.axisLabelX];
        if (this.props.horizontalBars) {
            label.unshift(COUNT_AXIS_LABEL);
        }
        return (
            <VictoryAxis
                orientation="bottom"
                offsetY={50}
                crossAxis={false}
                label={label}

                tickValues={this.props.horizontalBars ? undefined: this.categoryTickValues}
                tickCount={this.props.horizontalBars ? NUM_AXIS_TICKS: undefined }
                tickFormat={this.props.horizontalBars ? this.formatNumericalTick : this.formatCategoryTick}
                tickLabelComponent={<VictoryLabel angle={this.props.horizontalBars ? undefined : CATEGORY_LABEL_HORZ_ANGLE}
                                                  verticalAnchor={this.props.horizontalBars ? undefined : "start"}
                                                  textAnchor={this.props.horizontalBars ? undefined : "start"}
                />}
                axisLabelComponent={<VictoryLabel dy={this.props.horizontalBars ? 35 : this.biggestCategoryLabelSize + 24}/>}
            />
        );
    }

    @computed get vertAxis() {
        const label = [this.props.axisLabelY];
        if (!this.props.horizontalBars) {
            label.push(COUNT_AXIS_LABEL);
        }
        return (
            <VictoryAxis
                orientation="left"
                offsetX={50}
                crossAxis={false}
                label={label}
                dependentAxis={true}
                tickValues={this.props.horizontalBars ? this.categoryTickValues : undefined}
                tickCount={this.props.horizontalBars ? undefined : NUM_AXIS_TICKS}
                tickFormat={this.props.horizontalBars ? this.formatCategoryTick : this.formatNumericalTick}
                axisLabelComponent={<VictoryLabel dy={this.props.horizontalBars ? -1*this.biggestCategoryLabelSize - 24 : -40}/>}
            />
        );
    }

    @computed get leftPadding() {
        // more left padding if horizontal, to make room for labels
        if (this.props.horizontalBars) {
            return this.biggestCategoryLabelSize;
        } else {
            return DEFAULT_LEFT_PADDING;
        }
    }

    @computed get topPadding() {
        return 0;
    }

    @computed get rightPadding() {
        if (this.legendData.length > 0 && this.legendLocation === "right") {
            // make room for legend
            return Math.max(RIGHT_GUTTER, RIGHT_PADDING_FOR_LONG_LABELS);
        } else {
            return RIGHT_PADDING_FOR_LONG_LABELS;
        }
    }

    @computed get bottomPadding() {
        let paddingForLabels = DEFAULT_BOTTOM_PADDING;
        let paddingForLegend = 0;

        if (!this.props.horizontalBars) {
            // more padding if vertical, because category labels extend to bottom
            paddingForLabels = this.biggestCategoryLabelSize;
        }
        if (this.legendLocation === "bottom") {
            // more padding if legend location is "bottom", to make room for legend
            paddingForLegend = this.bottomLegendHeight + BOTTOM_LEGEND_PADDING;
        }

        return paddingForLabels + paddingForLegend;
    }

    @computed get biggestCategoryLabelSize() {
        const maxSize = Math.max(
            ...this.labels.map(x=>getTextWidth(x, axisTickLabelStyles.fontFamily, axisTickLabelStyles.fontSize+"px"))
        );
        if (this.props.horizontalBars) {
            // if horizontal mode, its label width
            return maxSize;
        } else {
            // if vertical mode, its label height when rotated
            return maxSize*Math.abs(Math.sin((Math.PI/180) * CATEGORY_LABEL_HORZ_ANGLE));
        }
    }
    
    private categoryCoord(index:number) {
        return index * (this.barWidth + this.barSeparation); // half box + separation + half box
    }

    @computed get categoryTickValues() {
        if (this.data.length > 0 ) {
            return this.data[0].counts.map((x, i)=>this.categoryCoord(i));
        } else {
            return [];
        }
    }

    private get bars() {
        // one bar element for each minor category
        let data = this.data;
        // for vertical bars, reverse order, to put first on top
        if (!this.props.horizontalBars) {
            data = _.reverse(data);
        }
        return data.map(({ minorCategory, counts })=>{
            const fill = this.getColor(minorCategory);
            return (
                <VictoryBar
                    horizontal={this.props.horizontalBars}
                    style={{ data: { fill } }}
                    data={ counts.map((obj, index)=>({ x:this.categoryCoord(index), y: obj.count, category:minorCategory, count:obj.count }))}
                    events={this.mouseEvents}
                />
            );
        });
    }

    private tooltip(datum:any) {
        return (
            <div>
                <strong>{datum.category}</strong>:&nbsp;{datum.count}&nbsp;sample{datum.count === 1 ? "" : "s"}
            </div>
        );
    }

    @autobind
    private getChart() {
        if (this.data.length > 0) {
            return (
                <div
                    ref={this.containerRef}
                    style={{width: this.svgWidth, height: this.svgHeight}}
                >
                    <svg
                        id={this.props.svgId || ""}
                        style={{
                            width: this.svgWidth,
                            height: this.svgHeight,
                            pointerEvents: "all"
                        }}
                        height={this.svgHeight}
                        width={this.svgWidth}
                        role="img"
                        viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                    >
                        <g
                            transform={`translate(${this.leftPadding}, ${this.topPadding})`}
                        >
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                width={this.chartWidth}
                                height={this.chartHeight}
                                standalone={false}
                                domainPadding={this.chartDomainPadding}
                                domain={this.plotDomain}
                                singleQuadrantDomainPadding={{
                                    [this.countAxis]:true,
                                    [this.categoryAxis]:false
                                }}
                            >
                                {this.legend}
                                {this.horzAxis}
                                {this.vertAxis}
                                <VictoryStack>
                                    {this.bars}
                                </VictoryStack>
                            </VictoryChart>
                        </g>
                    </svg>
                </div>
            );
        } else {
            return <span>No data to plot.</span>
        }
    }

    @autobind
    private getTooltip() {
        if (this.container && this.tooltipModel) {
            const countAxisOffset = (this.tooltipModel.y + this.tooltipModel.y0)/2;
            const categoryAxisOffset = this.tooltipModel.x;
            return (
                <ScatterPlotTooltip
                    placement={this.props.horizontalBars ? "bottom" : "right"}
                    container={this.container}
                    targetHovered={this.pointHovered}
                    targetCoords={{
                        x: (this.categoryAxis === "x" ? categoryAxisOffset : countAxisOffset) + this.leftPadding,
                        y: (this.categoryAxis === "y" ? categoryAxisOffset : countAxisOffset) + this.topPadding
                    }}
                    overlay={this.tooltip(this.tooltipModel.datum)}
                    arrowOffsetTop={20}
                />
            );
        } else {
            return <span></span>;
        }
    }


    render() {
        if (!this.data.length) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        }
        return (
            <div>
                <Observer>
                    {this.getChart}
                </Observer>
                <Observer>
                    {this.getTooltip}
                </Observer>
            </div>
        );
    }
}