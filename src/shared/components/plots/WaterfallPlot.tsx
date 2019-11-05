import _ from 'lodash';
import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import bind from 'bind-decorator';
import { computed, observable } from 'mobx';
import CBIOPORTAL_VICTORY_THEME from '../../theme/cBioPoralTheme';
import Timer = NodeJS.Timer;
import {
    VictoryChart,
    VictoryAxis,
    VictoryBar,
    VictoryScatter,
    VictoryLegend,
    VictoryLabel,
} from 'victory';
import { makeScatterPlotSizeFunction as makePlotSizeFunction } from './PlotUtils';
import WaterfallPlotTooltip from './WaterfallPlotTooltip';
import { tickFormatNumeral } from './TickUtils';
import {
    IAxisLogScaleParams,
    waterfallSearchIndicatorAppearance,
    limitValueAppearance,
    IValue1D,
} from 'pages/resultsView/plots/PlotsTabUtils';
import { textTruncationUtils } from 'cbioportal-frontend-commons';

// TODO make distinction between public and internal interface for waterfall plot data
export interface IBaseWaterfallPlotData extends IValue1D {
    order?: number | undefined;
    offset?: number;
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeOpacity?: number;
    strokeWidth?: number;
    symbol?: string;
    labelx?: number;
    labely?: number;
    limitValueLabelVisibility?: boolean;
    searchindicatorx?: number;
    searchindicatory?: number;
}

export interface IWaterfallPlotProps<D extends IBaseWaterfallPlotData> {
    svgId?: string;
    title?: string;
    data: D[];
    chartWidth: number;
    chartHeight: number;
    highlight?: (d: D) => boolean;
    size?:
        | number
        | ((d: D, active: boolean, isHighlighted?: boolean) => number);
    fill?: string | ((d: D) => string);
    stroke?: string | ((d: D) => string);
    fillOpacity?: number | ((d: D) => number);
    strokeOpacity?: number | ((d: D) => number);
    strokeWidth?: number | ((d: D) => number);
    symbol?: string | ((d: D) => string);
    labelVisibility?: boolean | ((d: D) => boolean);
    zIndexSortBy?: ((d: D) => any)[]; // second argument to _.sortBy
    tooltip?: (d: D) => JSX.Element;
    horizontal: boolean;
    legendData?: { name: string | string[]; symbol: any }[]; // see http://formidable.com/open-source/victory/docs/victory-legend/#data
    legendLocationWidthThreshold?: number;
    log?: IAxisLogScaleParams | undefined;
    useLogSpaceTicks?: boolean; // if log scale for an axis, then this prop determines whether the ticks are shown in post-log coordinate, or original data coordinate space
    axisLabel?: string;
    fontFamily?: string;
    sortOrder: string | undefined;
    pivotThreshold?: number;
    legendTitle?: string;
}

const DEFAULT_FONT_FAMILY = 'Verdana,Arial,sans-serif';
export const LEGEND_Y = 30;
const RIGHT_PADDING = 120; // room for correlation info and legend
const NUM_AXIS_TICKS = 8;
const LEFT_PADDING = 25;
const LEGEND_ITEMS_PER_ROW = 4;
const LABEL_OFFSET_FRACTION = 0.02;
const SEARCH_LABEL_SIZE_MULTIPLIER = 1.5;
const TOOLTIP_OFFSET_Y = 28.5;
const TOOLTIP_OFFSET_X = -5;
const CHART_OFFSET_Y = 30;
const limitValueAppearanceSupplement = {
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 1,
    strokeOpacity: 1,
    size: 3,
};

@observer
export default class WaterfallPlot<
    D extends IBaseWaterfallPlotData
> extends React.Component<IWaterfallPlotProps<D>, {}> {
    @observable.ref tooltipModel: any | null = null;
    @observable pointHovered: boolean = false;

    private mouseEvents: any = this.makeMouseEvents();

    @observable.ref private container: HTMLDivElement;

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
                                    // swap x and y label pos when in horizontal mode
                                    if (
                                        this.props.horizontal &&
                                        !props.datum.searchLabel
                                    ) {
                                        const x = props.x;
                                        // to position the tooltip more correctly
                                        props.x = props.y + TOOLTIP_OFFSET_X;
                                        props.y = x + TOOLTIP_OFFSET_Y;
                                    } else if (!this.props.horizontal) {
                                        // to position the tooltip more correctly
                                        props.x += TOOLTIP_OFFSET_X;
                                    }

                                    this.tooltipModel = props;
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

    @computed get fontFamily() {
        return this.props.fontFamily || DEFAULT_FONT_FAMILY;
    }

    @computed get title() {
        if (this.props.title) {
            const text = textTruncationUtils(
                this.props.title,
                this.props.chartWidth,
                this.fontFamily,
                '13px'
            );
            return (
                <VictoryLabel
                    style={{
                        fontWeight: 'bold',
                        fontFamily: this.fontFamily,
                        textAnchor: 'middle',
                    }}
                    x={this.svgWidth / 2}
                    y="1.2em"
                    text={text}
                />
            );
        } else {
            return null;
        }
    }

    @computed get axisLabel() {
        if (this.props.axisLabel) {
            const maxDimension = this.props.horizontal
                ? this.props.chartWidth
                : this.props.chartHeight;
            return textTruncationUtils(
                this.props.axisLabel,
                maxDimension,
                this.fontFamily,
                '13px'
            );
        }
        return '';
    }

    @computed get legendX() {
        return this.props.chartWidth - 20;
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
                    x={this.legendLocation === 'right' ? this.legendX : 50}
                    y={
                        this.legendLocation === 'right'
                            ? 100
                            : this.svgHeight - this.bottomLegendHeight + 3
                    }
                    title={this.props.legendTitle}
                    titleOrientation={
                        this.legendLocation === 'right' ? 'top' : 'left'
                    }
                    style={{
                        title: {
                            fontSize: 15,
                            fontWeight: 'bold',
                        },
                    }}
                    titleComponent={
                        <VictoryLabel
                            dx={this.legendLocation === 'right' ? 0 : -10}
                        />
                    }
                />
            );
        } else {
            return null;
        }
    }

    @computed get plotDomain(): { value: number[]; order: number[] } {
        // data extremes
        let max =
            _(this.waterfallPlotData)
                .map('value')
                .max() || 0;
        let min =
            _(this.waterfallPlotData)
                .map('value')
                .min() || 0;

        return {
            value: [min!, max!],
            order: [1, this.waterfallPlotData.length], // return range defined by the number of samples for the x-axis
        };
    }

    @computed get plotDomainX() {
        if (this.props.horizontal) {
            return this.plotDomain.value;
        }
        return this.plotDomain.order;
    }

    @computed get plotDomainY() {
        if (this.props.horizontal) {
            return this.plotDomain.order;
        }
        return this.plotDomain.value;
    }

    @computed get svgWidth() {
        return LEFT_PADDING + this.props.chartWidth + RIGHT_PADDING;
    }

    @computed get svgHeight() {
        if (this.props.horizontal) {
            return this.props.chartHeight + this.bottomLegendHeight;
        }
        return this.props.chartHeight;
    }

    @computed get legendLocation() {
        if (
            this.props.legendLocationWidthThreshold !== undefined &&
            this.props.chartWidth > this.props.legendLocationWidthThreshold
        ) {
            return 'bottom';
        } else {
            return 'right';
        }
    }

    @bind
    private datumAccessorY(d: IBaseWaterfallPlotData) {
        return d.value;
    }

    @bind
    private datumAccessorBaseLine(d: IBaseWaterfallPlotData) {
        return d.offset;
    }

    @bind
    private datumAccessorX(d: IBaseWaterfallPlotData) {
        return d.order;
    }

    @bind
    private datumAccessorLabelY(d: IBaseWaterfallPlotData) {
        return d.labely;
    }

    @bind
    private datumAccessorLabelX(d: IBaseWaterfallPlotData) {
        return d.labelx;
    }

    @bind
    private datumAccessorSearchIndicatorY(d: IBaseWaterfallPlotData) {
        return d.searchindicatory;
    }

    @bind
    private datumAccessorSearchIndicatorX(d: IBaseWaterfallPlotData) {
        return d.searchindicatorx;
    }

    @computed get size() {
        const highlight = this.props.highlight;
        const size = this.props.size;
        // need to regenerate this function whenever highlight changes in order to trigger immediate Victory rerender
        return makePlotSizeFunction(highlight, size);
    }

    private tickFormat(
        t: number,
        ticks: number[],
        logScaleFunc: IAxisLogScaleParams | undefined
    ) {
        if (logScaleFunc && !this.props.useLogSpaceTicks) {
            t = logScaleFunc.fInvLogScale(t);
            ticks = ticks.map(x => logScaleFunc.fInvLogScale(x));
        }
        return tickFormatNumeral(t, ticks);
    }

    @bind
    private tickFormatX(t: number, i: number, ticks: number[]) {
        if (this.props.horizontal) {
            return this.tickFormat(t, ticks, this.props.log);
        }
        return undefined;
    }

    @bind
    private tickFormatY(t: number, i: number, ticks: number[]) {
        if (this.props.horizontal) {
            return undefined;
        }
        return this.tickFormat(t, ticks, this.props.log);
    }

    @computed get waterfallPlotData() {
        const logTransFormFunc = this.props.log;

        let dataPoints = _.cloneDeep(this.props.data);

        // sort datapoints according to value
        // default sort order for sortBy is ascending (a.k.a 'ASC') order
        dataPoints = _.sortBy(dataPoints, (d: D) => d.value);
        if (
            (this.props.horizontal && this.props.sortOrder === 'ASC') ||
            (!this.props.horizontal && this.props.sortOrder === 'DESC')
        ) {
            dataPoints = _.reverse(dataPoints);
        }
        // assign a x value (equivalent to position in array)
        _.each(
            dataPoints,
            (d: IBaseWaterfallPlotData, index: number) => (d.order = index + 1)
        );
        const offset = this.props.pivotThreshold || 0;

        // for log transformation one should handle negative numbers
        // this is done by transposing all data so that negative numbers no
        // longer occur. Als include the pivotThreshold.
        const values = _.map(dataPoints, 'value').concat([offset]);
        const minValue = _.min(values) || 0;
        const logOffset = minValue < 0 ? Math.abs(minValue) + 0.0001 : 0;

        // add offset to data points and log-transform when applicable
        _.each(dataPoints, (d: IBaseWaterfallPlotData) => {
            d.offset = logTransFormFunc
                ? logTransFormFunc.fLogScale(offset, logOffset)
                : offset;
            d.value = logTransFormFunc
                ? logTransFormFunc.fLogScale(d.value, logOffset)
                : d.value;
        });

        return dataPoints;
    }

    @computed get styledWaterfallPlotData() {
        const dataPoints = _.cloneDeep(this.waterfallPlotData);

        // add style information to each point
        _.each(dataPoints, (d: IBaseWaterfallPlotData) => {
            d.fill = this.resolveStyleOptionType<string>(d, this.props.fill);
            d.fillOpacity = this.resolveStyleOptionType<number>(
                d,
                this.props.fillOpacity
            );
            d.stroke = this.resolveStyleOptionType<string>(
                d,
                this.props.stroke
            );
            d.strokeOpacity = this.resolveStyleOptionType<number>(
                d,
                this.props.strokeOpacity
            );
            d.strokeWidth = this.resolveStyleOptionType<number>(
                d,
                this.props.strokeWidth
            );
            d.symbol = this.resolveStyleOptionType<string>(
                d,
                this.props.symbol
            );
        });

        return dataPoints;
    }

    resolveStyleOptionType<T>(
        datum: IBaseWaterfallPlotData,
        styleOption: any
    ): T {
        if (typeof styleOption === 'function') {
            return styleOption(datum);
        }
        return styleOption;
    }

    @computed get limitLabels() {
        // filter out data points that are limitted
        // these will get a symbol above the resp. bar
        const dataPoints = _.filter(this.waterfallPlotData, d =>
            this.resolveStyleOptionType<boolean>(d, this.props.labelVisibility)
        );

        const limitLabels = _.cloneDeep(dataPoints);

        const range = this.props.horizontal
            ? this.plotDomainX
            : this.plotDomainY;
        const min_value = range[0];
        const max_value = range[1];
        const pivotThreshold = this.props.pivotThreshold || 0;
        const offset: number = (max_value - min_value) * LABEL_OFFSET_FRACTION; // determine magnitude of offset for symbols

        // add offset information for possible labels above the bars
        _.each(limitLabels, (d: IBaseWaterfallPlotData) => {
            const offsetLocal = d.value! >= pivotThreshold ? offset : -offset; // determine direction of offset for symbols (above or below)
            const labelPos = d.value! + offsetLocal;

            if (this.props.horizontal) {
                d.labelx = labelPos;
                d.labely = d.order;
            } else {
                // ! this.props.horizontal
                d.labelx = d.order;
                d.labely = labelPos;
            }
        });

        return limitLabels;
    }

    @computed get searchLabels() {
        if (!this.props.highlight) {
            return [];
        }

        const dataPoints = _.filter(this.waterfallPlotData, (d: any) =>
            this.props.highlight!(d)
        );

        const searchLabels = _.cloneDeep(dataPoints);
        // add marker field to search label
        _.each(searchLabels, o => (o.searchLabel = true));

        const range = this.props.horizontal
            ? this.plotDomainX
            : this.plotDomainY;
        const min_value = range[0];
        const max_value = range[1];

        // determine magnitude of offset for symbols
        const offset: number = (max_value - min_value) * LABEL_OFFSET_FRACTION;

        // add offset information for search labels to datapoints
        _.each(searchLabels, (d: IBaseWaterfallPlotData) => {
            // determine direction of offset for symbols (above or below line y=0)
            const localOffset = d.value! <= d.offset! ? offset : -offset;
            const labelPos = d.offset! + localOffset;

            // d.symbol = waterfallSearchIndicatorAppearance.symbol; // adding this property as victory chart `symbol`-prop directly did not work

            if (this.props.horizontal) {
                d.searchindicatorx = labelPos;
                d.searchindicatory = d.order;
            } else {
                // ! this.props.horizontal
                d.searchindicatorx = d.order;
                d.searchindicatory = labelPos;
            }
        });

        return searchLabels;
    }

    @computed get plotPaddingInPixels() {
        if (this.props.horizontal) {
            return { y: 30, x: 3 };
        }
        return { y: 3, x: 30 };
    }

    @bind
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
                >
                    <g>{this.title}</g>
                    <g
                        transform={`translate(${LEFT_PADDING},${
                            this.props.horizontal ? CHART_OFFSET_Y : 0
                        })`}
                    >
                        <VictoryChart
                            theme={CBIOPORTAL_VICTORY_THEME}
                            width={this.props.chartWidth}
                            height={this.props.chartHeight}
                            standalone={false}
                            domainPadding={this.plotPaddingInPixels}
                            singleQuadrantDomainPadding={this.props.horizontal}
                        >
                            {this.legend}
                            {this.props.horizontal && (
                                <VictoryAxis
                                    domain={this.plotDomainX}
                                    orientation="top"
                                    crossAxis={false}
                                    tickCount={NUM_AXIS_TICKS}
                                    tickFormat={this.tickFormatX}
                                    axisLabelComponent={
                                        <VictoryLabel dy={-20} />
                                    }
                                    label={this.axisLabel}
                                />
                            )}
                            {this.props.horizontal && (
                                <VictoryAxis
                                    orientation="left"
                                    dependentAxis={true}
                                    tickFormat={() => ''}
                                    style={{
                                        axis: { stroke: 'none' },
                                        ticks: { stroke: 'none' },
                                        tickLabels: { stroke: 'none' },
                                    }}
                                />
                            )}
                            {!this.props.horizontal && (
                                <VictoryAxis
                                    domain={this.plotDomainY}
                                    offsetX={50}
                                    orientation="left"
                                    crossAxis={false}
                                    tickCount={NUM_AXIS_TICKS}
                                    tickFormat={this.tickFormatY}
                                    dependentAxis={true}
                                    axisLabelComponent={
                                        <VictoryLabel dy={-35} />
                                    }
                                    label={this.axisLabel}
                                />
                            )}
                            <VictoryBar
                                // barRatio={1} // removes spaces between bars
                                style={{
                                    data: {
                                        fill: (d: D) => d.fill,
                                        stroke: (d: D) => d.stroke,
                                        strokeWidth: (d: D) => d.strokeWidth,
                                        strokeOpacity: (d: D) =>
                                            d.strokeOpacity,
                                        fillOpacity: (d: D) => d.fillOpacity,
                                    },
                                }}
                                horizontal={this.props.horizontal}
                                data={this.styledWaterfallPlotData}
                                size={this.size}
                                events={this.mouseEvents}
                                x={this.datumAccessorX} // for x-axis reference accessor function
                                y={this.datumAccessorY} // for y-axis reference accessor function
                                y0={this.datumAccessorBaseLine} // for baseline reference accessor function
                            />
                            <VictoryScatter
                                style={{
                                    data: {
                                        fill:
                                            limitValueAppearanceSupplement.fill,
                                        stroke:
                                            limitValueAppearanceSupplement.stroke,
                                        strokeWidth:
                                            limitValueAppearanceSupplement.strokeWidth,
                                        strokeOpacity:
                                            limitValueAppearanceSupplement.strokeOpacity,
                                    },
                                }}
                                symbol={limitValueAppearance.symbol}
                                size={limitValueAppearanceSupplement.size}
                                data={this.limitLabels}
                                x={this.datumAccessorLabelX}
                                y={this.datumAccessorLabelY}
                            />
                            <VictoryScatter
                                style={{
                                    data: {
                                        fill:
                                            waterfallSearchIndicatorAppearance.fill,
                                        stroke:
                                            waterfallSearchIndicatorAppearance.stroke,
                                        strokeWidth:
                                            waterfallSearchIndicatorAppearance.strokeWidth *
                                            SEARCH_LABEL_SIZE_MULTIPLIER,
                                        strokeOpacity:
                                            waterfallSearchIndicatorAppearance.strokeOpacity,
                                    },
                                }}
                                symbol={
                                    waterfallSearchIndicatorAppearance.symbol
                                }
                                size={
                                    waterfallSearchIndicatorAppearance.size *
                                    SEARCH_LABEL_SIZE_MULTIPLIER
                                }
                                data={this.searchLabels}
                                events={this.mouseEvents}
                                x={this.datumAccessorSearchIndicatorX}
                                y={this.datumAccessorSearchIndicatorY}
                            />
                        </VictoryChart>
                    </g>
                </svg>
            </div>
        );
    }

    render() {
        if (!this.props.data.length) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        }
        return (
            <div>
                <Observer>{this.getChart}</Observer>
                {this.container && this.tooltipModel && this.props.tooltip && (
                    <WaterfallPlotTooltip
                        container={this.container}
                        targetHovered={this.pointHovered}
                        targetCoords={{
                            x: this.tooltipModel.x + LEFT_PADDING,
                            y: this.tooltipModel.y,
                        }}
                        overlay={this.props.tooltip(this.tooltipModel.datum)}
                    />
                )}
            </div>
        );
    }
}
