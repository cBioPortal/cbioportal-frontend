import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import { computed, observable, action } from 'mobx';
import { bind } from 'bind-decorator';
import CBIOPORTAL_VICTORY_THEME, {
    axisTickLabelStyles,
} from '../../theme/cBioPoralTheme';
import ifNotDefined from '../../lib/ifNotDefined';
import { BoxPlotModel, calculateBoxPlotModel } from '../../lib/boxPlotUtils';
import ScatterPlotTooltip from './ScatterPlotTooltip';
import Timer = NodeJS.Timer;
import {
    VictoryBoxPlot,
    VictoryChart,
    VictoryAxis,
    VictoryScatter,
    VictoryLegend,
    VictoryLabel,
} from 'victory';
import { IBaseScatterPlotData } from './ScatterPlot';
import {
    getDeterministicRandomNumber,
    separateScatterDataByAppearance,
} from './PlotUtils';
import { logicalAnd } from '../../lib/LogicUtils';
import { tickFormatNumeral, wrapTick } from './TickUtils';
import { makeScatterPlotSizeFunction } from './PlotUtils';
import {
    getTextWidth,
    truncateWithEllipsis,
} from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import { dataPointIsLimited } from 'shared/components/plots/PlotUtils';
import _ from 'lodash';
import {
    IAxisLogScaleParams,
    IBoxScatterPlotPoint,
} from 'pages/resultsView/plots/PlotsTabUtils';
import { Popover } from 'react-bootstrap';
import * as ReactDOM from 'react-dom';
import classnames from 'classnames';
import WindowStore from '../window/WindowStore';
import { textTruncationUtils } from 'cbioportal-frontend-commons';

export interface IBaseBoxScatterPlotPoint {
    value: number;
    jitter?: number; // between -1 and 1
}

export interface IBoxScatterPlotData<D extends IBaseBoxScatterPlotPoint> {
    label: string;
    data: D[];
}

export interface IBoxScatterPlotProps<D extends IBaseBoxScatterPlotPoint> {
    svgId?: string;
    title?: string;
    data: IBoxScatterPlotData<D>[];
    chartBase: number;
    startDataAxisAtZero?: boolean;
    domainPadding?: number; // see https://formidable.com/open-source/victory/docs/victory-chart/#domainpadding
    highlight?: (d: D) => boolean;
    size?:
        | number
        | ((d: D, active: boolean, isHighlighted?: boolean) => number);
    fill?: string | ((d: D) => string);
    stroke?: string | ((d: D) => string);
    fillOpacity?: number | ((d: D) => number);
    strokeOpacity?: number | ((d: D) => number);
    strokeWidth?: number | ((d: D) => number);
    zIndexSortBy?: ((d: D) => any)[]; // second argument to _.sortBy
    symbol?: string | ((d: D) => string); // see http://formidable.com/open-source/victory/docs/victory-scatter/#symbol for options
    scatterPlotTooltip?: (d: D) => JSX.Element;
    boxPlotTooltip?: (d: BoxModel) => JSX.Element;
    legendData?: { name: string | string[]; symbol: any }[]; // see http://formidable.com/open-source/victory/docs/victory-legend/#data
    logScale?: IAxisLogScaleParams | undefined; // log scale along the point data axis
    excludeLimitValuesFromBoxPlot?: boolean;
    axisLabelX?: string;
    axisLabelY?: string;
    horizontal?: boolean; // whether the box plot is horizontal
    useLogSpaceTicks?: boolean; // if log scale for an axis, then this prop determines whether the ticks are shown in post-log coordinate, or original data coordinate space
    boxWidth?: number;
    legendLocationWidthThreshold?: number; // chart width after which we start putting the legend at the bottom of the plot
    boxCalculationFilter?: (d: D) => boolean; // determines which points are used for calculating the box
    containerRef?: (svgContainer: SVGElement | null) => void;
    compressXAxis?: boolean;
}

type BoxModel = {
    min: number;
    max: number;
    median: number;
    q1: number;
    q3: number;
    x?: number;
    y?: number;
};

const RIGHT_GUTTER = 120; // room for legend
const NUM_AXIS_TICKS = 8;
const PLOT_DATA_PADDING_PIXELS = 100;
const CATEGORY_LABEL_HORZ_ANGLE = 50;
const DEFAULT_LEFT_PADDING = 25;
const DEFAULT_BOTTOM_PADDING = 10;
const LEGEND_ITEMS_PER_ROW = 4;
const BOTTOM_LEGEND_PADDING = 15;
const RIGHT_PADDING_FOR_LONG_LABELS = 50;
const HORIZONTAL_OFFSET = 8;
const VERTICAL_OFFSET = 17;
const UTILITIES_MENU_HEIGHT = 20;

const BOX_STYLES = {
    min: { stroke: '#999999' },
    max: { stroke: '#999999' },
    q1: { fill: '#eeeeee' },
    q3: { fill: '#eeeeee' },
    median: { stroke: '#999999', strokeWidth: 1 },
};

@observer
export default class BoxScatterPlot<
    D extends IBaseBoxScatterPlotPoint
> extends React.Component<IBoxScatterPlotProps<D>, {}> {
    @observable.ref private scatterPlotTooltipModel: any | null = null;
    @observable private pointHovered: boolean = false;
    private mouseEvents: any = this.makeMouseEvents();
    @observable.ref private container: HTMLDivElement;
    @observable.ref private boxPlotTooltipModel: any | null;
    @observable private mousePosition = { x: 0, y: 0 };

    @bind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
    }

    private makeMouseEvents() {
        let disappearTimeout: Timer | null = null;
        const disappearDelayMs = 250;

        return [
            {
                target: 'data',
                eventHandlers: {
                    onMouseOver: () => {
                        return [
                            {
                                target: 'data',
                                mutation: (props: any) => {
                                    this.scatterPlotTooltipModel = props;
                                    this.pointHovered = true;

                                    if (disappearTimeout !== null) {
                                        clearTimeout(disappearTimeout);
                                        disappearTimeout = null;
                                    }

                                    return { active: true };
                                },
                            },
                        ];
                    },
                    onMouseOut: () => {
                        return [
                            {
                                target: 'data',
                                mutation: () => {
                                    if (disappearTimeout !== null) {
                                        clearTimeout(disappearTimeout);
                                    }

                                    disappearTimeout = setTimeout(() => {
                                        this.pointHovered = false;
                                    }, disappearDelayMs);

                                    return { active: false };
                                },
                            },
                        ];
                    },
                },
            },
        ];
    }

    private get boxPlotEvents() {
        if (this.props.boxPlotTooltip) {
            const self = this;
            return [
                {
                    target: ['min', 'max', 'media', 'q1', 'q3'],
                    eventHandlers: {
                        onMouseEnter: () => {
                            return [
                                {
                                    mutation: (props: any) => {
                                        self.boxPlotTooltipModel = props;
                                    },
                                },
                            ];
                        },
                        onMouseLeave: () => {
                            return [
                                {
                                    mutation: () => {
                                        self.boxPlotTooltipModel = null;
                                    },
                                },
                            ];
                        },
                    },
                },
            ];
        }
        return [];
    }

    private get title() {
        if (this.props.title) {
            return (
                <VictoryLabel
                    style={{
                        fontWeight: 'bold',
                        fontFamily: axisTickLabelStyles.fontFamily,
                        textAnchor: 'middle',
                    }}
                    x={this.svgWidth / 2}
                    y="1.2em"
                    text={this.props.title}
                />
            );
        } else {
            return null;
        }
    }

    @computed get chartWidth() {
        if (this.props.horizontal) {
            return this.props.chartBase;
        } else {
            return this.chartExtent;
        }
    }

    @computed get chartHeight() {
        if (this.props.horizontal) {
            return this.chartExtent;
        } else {
            return this.props.chartBase;
        }
    }

    @computed get sideLegendX() {
        return this.chartWidth - 20;
    }

    @computed get legendLocation() {
        if (
            this.props.legendLocationWidthThreshold !== undefined &&
            this.chartWidth > this.props.legendLocationWidthThreshold
        ) {
            return 'bottom';
        } else {
            return 'right';
        }
    }

    @computed get bottomLegendHeight() {
        //height of legend in case its on bottom
        if (!this.props.legendData) {
            return 0;
        } else {
            const numRows = Math.ceil(
                this.props.legendData.length / LEGEND_ITEMS_PER_ROW
            );
            return 23.7 * numRows;
        }
    }

    private get legend() {
        if (this.props.legendData && this.props.legendData.length) {
            let legendData = this.props.legendData;
            if (this.legendLocation === 'bottom') {
                // if legend is at bottom then flatten labels
                legendData = legendData.map(x => {
                    let name = x.name;
                    if (Array.isArray(x.name)) {
                        name = (name as string[]).join(' '); // flatten labels by joining with space
                    }
                    return {
                        name,
                        symbol: x.symbol,
                    };
                });
            }
            return (
                <VictoryLegend
                    orientation={
                        this.legendLocation === 'right'
                            ? 'vertical'
                            : 'horizontal'
                    }
                    itemsPerRow={
                        this.legendLocation === 'right'
                            ? undefined
                            : LEGEND_ITEMS_PER_ROW
                    }
                    rowGutter={this.legendLocation === 'right' ? undefined : -5}
                    data={legendData}
                    x={this.legendLocation === 'right' ? this.sideLegendX : 0}
                    y={
                        this.legendLocation === 'right'
                            ? 100
                            : this.svgHeight - this.bottomLegendHeight
                    }
                />
            );
        } else {
            return null;
        }
    }

    @computed get plotDomain() {
        // data extremes
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;

        for (const d of this.props.data) {
            for (const d2 of d.data) {
                max = Math.max(d2.value, max);
                min = Math.min(d2.value, min);
            }
        }
        if (this.props.logScale) {
            min = this.props.logScale.fLogScale(min, 0);
            max = this.props.logScale.fLogScale(max, 0);
        }
        if (this.props.startDataAxisAtZero) {
            min = Math.min(0, min);
        }
        let x: number[], y: number[];
        const dataDomain = [min, max];
        const categoryDomain = [
            this.categoryCoord(0),
            this.categoryCoord(Math.max(1, this.props.data.length - 1)),
        ];
        if (this.props.horizontal) {
            x = dataDomain;
            y = categoryDomain;
        } else {
            x = categoryDomain;
            y = dataDomain;
        }
        return { x, y };
    }

    @computed get categoryAxisDomainPadding() {
        // padding needs to be at least half a box width plus a bit
        return Math.max(this.boxWidth / 2 + 30, this.domainPadding);
    }

    @computed get dataAxisDomainPadding() {
        return this.domainPadding;
    }

    @computed get domainPadding() {
        if (this.props.domainPadding === undefined) {
            return PLOT_DATA_PADDING_PIXELS;
        } else {
            return this.props.domainPadding;
        }
    }

    @computed get dataAxis(): 'x' | 'y' {
        if (this.props.horizontal) {
            return 'x';
        } else {
            return 'y';
        }
    }

    @computed get categoryAxis(): 'x' | 'y' {
        if (this.props.horizontal) {
            return 'y';
        } else {
            return 'x';
        }
    }

    @computed get chartDomainPadding() {
        return {
            [this.dataAxis]: this.dataAxisDomainPadding,
            [this.categoryAxis]: this.categoryAxisDomainPadding,
        };
    }

    @computed get chartExtent() {
        const miscPadding = 100; // specifying chart width in victory doesnt translate directly to the actual graph size
        const numBoxes = this.props.data.length;
        return (
            this.categoryCoord(numBoxes - 1) +
            2 * this.categoryAxisDomainPadding +
            miscPadding
        );
        //return 2*this.domainPadding + numBoxes*this.boxWidth + (numBoxes-1)*this.boxSeparation;
        //const ret = Math.max(computedExtent, this.props.chartBase);
        //return ret;
    }

    @computed get svgWidth() {
        return this.leftPadding + this.chartWidth + this.rightPadding;
    }

    @computed get svgHeight() {
        return this.topPadding + this.chartHeight + this.bottomPadding;
    }

    @computed get boxSeparation() {
        return 0.5 * this.boxWidth;
    }

    @computed get boxWidth() {
        return this.props.boxWidth || 10;
    }

    private jitter(d: D, randomNumber: number) {
        // randomNumber: between -1 and 1
        return 0.2 * this.boxWidth * randomNumber;
    }

    @bind
    private scatterPlotX(d: IBaseScatterPlotData & D) {
        if (this.props.logScale && this.props.horizontal) {
            return this.props.logScale.fLogScale(d.x, 0);
        } else {
            let jitter = 0;
            if (!this.props.horizontal) {
                let jitterRandomNumber = d.jitter;
                if (jitterRandomNumber === undefined) {
                    jitterRandomNumber = getDeterministicRandomNumber(d.y, [
                        -1,
                        1,
                    ]);
                }
                jitter = this.jitter(d, jitterRandomNumber);
            }
            return d.x + jitter;
        }
    }

    @bind
    private scatterPlotY(d: IBaseScatterPlotData & D) {
        if (this.props.logScale && !this.props.horizontal) {
            return this.props.logScale.fLogScale(d.y, 0);
        } else {
            let jitter = 0;
            if (this.props.horizontal) {
                let jitterRandomNumber = d.jitter;
                if (jitterRandomNumber === undefined) {
                    jitterRandomNumber = getDeterministicRandomNumber(d.x, [
                        -1,
                        1,
                    ]);
                }
                jitter = this.jitter(d, jitterRandomNumber);
            }
            return d.y + jitter;
        }
    }

    @computed get scatterPlotSize() {
        const highlight = this.props.highlight;
        const size = this.props.size;
        // need to regenerate this function whenever highlight changes in order to trigger immediate Victory rerender
        return makeScatterPlotSizeFunction(highlight, size);
    }

    @computed get labels() {
        return this.props.data.map(d => {
            if (!!this.props.compressXAxis) {
                return truncateWithEllipsis(
                    d.label,
                    50,
                    axisTickLabelStyles.fontFamily,
                    axisTickLabelStyles.fontSize + 'px'
                );
            }
            return d.label;
        });
    }

    @bind
    private formatCategoryTick(t: number, index: number) {
        //return wrapTick(this.labels[index], MAXIMUM_CATEGORY_LABEL_SIZE);
        return this.labels[index];
    }

    @bind
    private formatNumericalTick(t: number, i: number, ticks: number[]) {
        return tickFormatNumeral(
            t,
            ticks,
            this.props.logScale && !this.props.useLogSpaceTicks
                ? this.props.logScale.fInvLogScale
                : undefined
        );
    }

    @computed get horzAxis() {
        // several props below are undefined in horizontal mode, thats because in horizontal mode
        //  this axis is for numbers, not categories
        return (
            <VictoryAxis
                style={{
                    grid: { strokeOpacity: 1 },
                }}
                orientation="bottom"
                offsetY={50}
                crossAxis={false}
                label={this.props.axisLabelX}
                tickValues={
                    this.props.horizontal ? undefined : this.categoryTickValues
                }
                tickCount={this.props.horizontal ? NUM_AXIS_TICKS : undefined}
                tickFormat={
                    this.props.horizontal
                        ? this.formatNumericalTick
                        : this.formatCategoryTick
                }
                tickLabelComponent={
                    <VictoryLabel
                        angle={
                            !!this.props.compressXAxis || this.props.horizontal
                                ? undefined
                                : CATEGORY_LABEL_HORZ_ANGLE
                        }
                        verticalAnchor={
                            !!this.props.compressXAxis || this.props.horizontal
                                ? undefined
                                : 'start'
                        }
                        textAnchor={
                            !!this.props.compressXAxis || this.props.horizontal
                                ? undefined
                                : 'start'
                        }
                    />
                }
                axisLabelComponent={
                    <VictoryLabel
                        dy={
                            !!this.props.compressXAxis || this.props.horizontal
                                ? 35
                                : this.biggestCategoryLabelSize + 24
                        }
                    />
                }
            />
        );
    }

    @computed get yAxisLabel(): string[] {
        if (this.props.axisLabelY) {
            return textTruncationUtils(
                this.props.axisLabelY,
                this.chartHeight - UTILITIES_MENU_HEIGHT,
                axisTickLabelStyles.fontFamily,
                `${axisTickLabelStyles.fontSize}px`
            );
        }
        return [];
    }

    @computed get yAxisLabelVertOffset(): number {
        if (this.props.horizontal) {
            return -1 * this.biggestCategoryLabelSize - 24;
        } else if (this.yAxisLabel.length > 1) {
            return -30;
        }
        return -50;
    }

    @computed get vertAxis() {
        return (
            <VictoryAxis
                orientation="left"
                offsetX={50}
                crossAxis={false}
                label={this.yAxisLabel}
                dependentAxis={true}
                tickValues={
                    this.props.horizontal ? this.categoryTickValues : undefined
                }
                tickCount={this.props.horizontal ? undefined : NUM_AXIS_TICKS}
                tickFormat={
                    this.props.horizontal
                        ? this.formatCategoryTick
                        : this.formatNumericalTick
                }
                axisLabelComponent={
                    <VictoryLabel dy={this.yAxisLabelVertOffset} />
                }
            />
        );
    }

    @computed get scatterPlotData() {
        let dataAxis: 'x' | 'y' = this.props.horizontal ? 'x' : 'y';
        let categoryAxis: 'x' | 'y' = this.props.horizontal ? 'y' : 'x';
        const data: (D & { x: number; y: number })[] = [];
        for (let i = 0; i < this.props.data.length; i++) {
            const categoryCoord = this.categoryCoord(i);
            for (const d of this.props.data[i].data) {
                data.push(
                    Object.assign({}, d, {
                        [dataAxis]: d.value,
                        [categoryAxis]: categoryCoord,
                    } as { x: number; y: number } & IBaseBoxScatterPlotPoint)
                );
            }
        }
        return separateScatterDataByAppearance<D>(
            data,
            ifNotDefined(this.props.fill, '0x000000'),
            ifNotDefined(this.props.stroke, '0x000000'),
            ifNotDefined(this.props.strokeWidth, 0),
            ifNotDefined(this.props.strokeOpacity, 1),
            ifNotDefined(this.props.fillOpacity, 1),
            ifNotDefined(this.props.symbol, 'circle'),
            this.props.zIndexSortBy
        );
    }

    @computed get leftPadding() {
        // more left padding if horizontal, to make room for labels
        if (this.props.horizontal) {
            return this.biggestCategoryLabelSize;
        } else {
            return DEFAULT_LEFT_PADDING;
        }
    }

    @computed get topPadding() {
        return 0;
    }

    @computed get rightPadding() {
        if (
            this.props.legendData &&
            this.props.legendData.length > 0 &&
            this.legendLocation === 'right'
        ) {
            // make room for legend
            return Math.max(RIGHT_GUTTER, RIGHT_PADDING_FOR_LONG_LABELS);
        } else {
            return RIGHT_PADDING_FOR_LONG_LABELS;
        }
    }

    @computed get bottomPadding() {
        let paddingForLabels = DEFAULT_BOTTOM_PADDING;
        let paddingForLegend = 0;

        if (!this.props.horizontal) {
            // more padding if vertical, because category labels extend to bottom
            // more padding if axis is not compressed
            paddingForLabels = !!this.props.compressXAxis
                ? 20
                : this.biggestCategoryLabelSize;
        }
        if (this.legendLocation === 'bottom') {
            // more padding if legend location is "bottom", to make room for legend
            paddingForLegend = this.bottomLegendHeight + BOTTOM_LEGEND_PADDING;
        }

        return paddingForLabels + paddingForLegend;
    }

    @computed get biggestCategoryLabelSize() {
        const maxSize = Math.max(
            ...this.labels.map(x =>
                getTextWidth(
                    x,
                    axisTickLabelStyles.fontFamily,
                    axisTickLabelStyles.fontSize + 'px'
                )
            )
        );
        if (!!this.props.compressXAxis || this.props.horizontal) {
            // if horizontal mode or if axis is compressed( i.e, tick labels are horizontal), its label width
            return maxSize;
        } else {
            // if vertical mode, its label height when rotated
            return (
                maxSize *
                Math.abs(Math.sin((Math.PI / 180) * CATEGORY_LABEL_HORZ_ANGLE))
            );
        }
    }

    private categoryCoord(index: number) {
        return index * (this.boxWidth + this.boxSeparation); // half box + separation + half box
    }

    @computed get categoryTickValues() {
        return this.props.data.map((x, i) => this.categoryCoord(i));
    }

    @computed get boxPlotData(): BoxModel[] {
        const boxCalculationFilter = this.props.boxCalculationFilter;

        // when limit values are shown in the legend, exclude
        // these points from influencing the shape of the box plots
        let boxData = _.cloneDeep(this.props.data);
        if (this.props.excludeLimitValuesFromBoxPlot) {
            _.each(boxData, (o: IBoxScatterPlotData<D>) => {
                o.data = _.filter(
                    o.data,
                    (p: IBoxScatterPlotPoint) => !dataPointIsLimited(p)
                );
            });
        }

        return boxData
            .map(d =>
                calculateBoxPlotModel(
                    d.data.reduce(
                        (data, next) => {
                            if (
                                !boxCalculationFilter ||
                                (boxCalculationFilter &&
                                    boxCalculationFilter(next))
                            ) {
                                // filter out values in calculating boxes, if a filter is specified ^^
                                if (this.props.logScale) {
                                    data.push(
                                        this.props.logScale.fLogScale(
                                            next.value,
                                            0
                                        )
                                    );
                                } else {
                                    data.push(next.value);
                                }
                            }
                            return data;
                        },
                        [] as number[]
                    )
                )
            )
            .map((model, i) => {
                // create boxes, importantly we dont filter at this step because
                //  we need the indexes to be intact and correpond to the index in the input data,
                //  in order to properly determine the x/y coordinates
                const box: BoxModel = {
                    min: model.whiskerLower,
                    max: model.whiskerUpper,
                    median: model.median,
                    q1: model.q1,
                    q3: model.q3,
                };
                if (this.props.horizontal) {
                    box.y = this.categoryCoord(i);
                } else {
                    box.x = this.categoryCoord(i);
                }
                return box;
            })
            .filter(box => {
                // filter out not well-defined boxes
                return logicalAnd(
                    ['min', 'max', 'median', 'q1', 'q3'].map(key => {
                        return !isNaN((box as any)[key]);
                    })
                );
            });
    }

    @autobind
    @action
    private onMouseMove(e: React.MouseEvent<any>) {
        if (this.boxPlotTooltipModel !== null) {
            this.mousePosition.x = e.pageX;
            this.mousePosition.y = e.pageY;
        }
    }

    @autobind
    private getChart() {
        return (
            <div
                ref={this.containerRef}
                style={{ width: this.svgWidth, height: this.svgHeight }}
            >
                <svg
                    id={this.props.svgId || ''}
                    style={{
                        width: this.svgWidth,
                        height: this.svgHeight,
                        pointerEvents: 'all',
                    }}
                    height={this.svgHeight}
                    width={this.svgWidth}
                    role="img"
                    viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                    onMouseMove={this.onMouseMove}
                    ref={ref => {
                        if (this.props.containerRef) {
                            this.props.containerRef(ref);
                        }
                    }}
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
                                [this.dataAxis]: !!this.props
                                    .startDataAxisAtZero,
                                [this.categoryAxis]: false,
                            }}
                        >
                            {this.title}
                            {this.legend}
                            {this.horzAxis}
                            {this.vertAxis}
                            <VictoryBoxPlot
                                boxWidth={this.boxWidth}
                                style={BOX_STYLES}
                                data={this.boxPlotData}
                                horizontal={this.props.horizontal}
                                events={this.boxPlotEvents}
                            />
                            {this.scatterPlotData.map(dataWithAppearance => (
                                <VictoryScatter
                                    key={`${dataWithAppearance.fill},${dataWithAppearance.stroke},${dataWithAppearance.strokeWidth},${dataWithAppearance.strokeOpacity},${dataWithAppearance.fillOpacity},${dataWithAppearance.symbol}`}
                                    style={{
                                        data: {
                                            fill: dataWithAppearance.fill,
                                            stroke: dataWithAppearance.stroke,
                                            strokeWidth:
                                                dataWithAppearance.strokeWidth,
                                            strokeOpacity:
                                                dataWithAppearance.strokeOpacity,
                                            fillOpacity:
                                                dataWithAppearance.fillOpacity,
                                        },
                                    }}
                                    size={this.scatterPlotSize}
                                    symbol={dataWithAppearance.symbol}
                                    data={dataWithAppearance.data}
                                    events={this.mouseEvents}
                                    x={this.scatterPlotX}
                                    y={this.scatterPlotY}
                                />
                            ))}
                        </VictoryChart>
                    </g>
                </svg>
            </div>
        );
    }

    @autobind
    private getScatterPlotTooltip() {
        if (
            this.container &&
            this.scatterPlotTooltipModel &&
            this.props.scatterPlotTooltip
        ) {
            return (
                <ScatterPlotTooltip
                    placement={this.props.horizontal ? 'bottom' : 'right'}
                    container={this.container}
                    targetHovered={this.pointHovered}
                    targetCoords={{
                        x: this.scatterPlotTooltipModel.x + this.leftPadding,
                        y: this.scatterPlotTooltipModel.y + this.topPadding,
                    }}
                    overlay={this.props.scatterPlotTooltip(
                        this.scatterPlotTooltipModel.datum
                    )}
                />
            );
        } else {
            return <span></span>;
        }
    }

    @autobind
    private getBoxPlotTooltipComponent() {
        if (
            this.container &&
            this.boxPlotTooltipModel &&
            this.props.boxPlotTooltip
        ) {
            const maxWidth = 400;
            let tooltipPlacement =
                this.mousePosition.x > WindowStore.size.width - maxWidth
                    ? 'left'
                    : 'right';
            return (ReactDOM as any).createPortal(
                <Popover
                    arrowOffsetTop={VERTICAL_OFFSET}
                    className={classnames('cbioportal-frontend', 'cbioTooltip')}
                    positionLeft={
                        this.mousePosition.x +
                        (tooltipPlacement === 'left'
                            ? -HORIZONTAL_OFFSET
                            : HORIZONTAL_OFFSET)
                    }
                    positionTop={this.mousePosition.y - VERTICAL_OFFSET}
                    style={{
                        transform:
                            tooltipPlacement === 'left'
                                ? 'translate(-100%,0%)'
                                : undefined,
                        maxWidth,
                    }}
                    placement={tooltipPlacement}
                >
                    <div>
                        {this.props.boxPlotTooltip(
                            this.boxPlotTooltipModel.datum
                        )}
                    </div>
                </Popover>,
                document.body
            );
        } else {
            return null;
        }
    }

    render() {
        if (!this.props.data.length) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        }
        return (
            <div>
                <Observer>{this.getChart}</Observer>
                <Observer>{this.getScatterPlotTooltip}</Observer>
                <Observer>{this.getBoxPlotTooltipComponent}</Observer>
            </div>
        );
    }
}
